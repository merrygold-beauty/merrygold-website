// Cloudflare Pages Function: POST /api/booking-move  { session, date, time }
//
// Staff only (dashboard password). Moves a paid booking to a new free time:
// checks the time is still free, moves the calendar event, records the new
// time on the Stripe payment (src/lib/bookingRecord.js explains why there),
// then emails the customer. The calendar is the booking itself, so if it
// cannot be moved nothing else changes; the record and the email are best
// effort and the answer says if either failed.

import { jsonResponse } from '../../src/lib/functionsShared.js';
import { appointmentInterval, isBookableDate } from '../../src/lib/bookingSlots.js';
import { freeTimesForMove } from '../../src/lib/bookingAvailability.js';
import { eventIdFor, moveEvent } from '../../src/lib/googleCalendar.js';
import { bookingMetadata, paymentIntentId, recordOnPayment, shapeOrder, withRecorded } from '../../src/lib/bookingRecord.js';
import { dashboardRequestRefusal, emailNotice, loadBookingToManage } from '../../src/lib/manageBooking.js';
import { buildMoveNotice } from '../../src/lib/enquiryEmail.js';

export async function onRequestPost(context) {
  const { request, env } = context;

  const refusal = dashboardRequestRefusal(request, env);
  if (refusal) return refusal;

  const body = await request.json().catch(() => ({}));
  const { date, time } = body;
  if (!isBookableDate(date, Date.now())) return jsonResponse({ error: 'Please choose a date in the next 90 days.' }, 400);

  const booking = await loadBookingToManage(env, body.session);
  if (booking.response) return booking.response;
  const { session, appointment } = booking;
  if (date === appointment.date && time === appointment.time) return jsonResponse({ error: 'That is already the booked time.' }, 400);

  const eventId = await eventIdFor(session.id);
  try {
    const { times, eventFound } = await freeTimesForMove(env, session.id, appointment, date);
    if (!eventFound) {
      return jsonResponse({ error: 'This booking is not in the calendar any more, so it cannot be moved here. Move it in Google Calendar instead.' }, 409);
    }
    if (!times.includes(time)) return jsonResponse({ error: 'That time is not free. Please choose another.' }, 409);
    await moveEvent(env, eventId, appointmentInterval(date, time, appointment.minutes));
  } catch (err) {
    console.error('Booking move failed in the calendar:', session.id, err.message);
    return jsonResponse({ error: 'The calendar could not be changed, so the booking was not moved. Please try again.' }, 502);
  }

  const record = {
    appointment_date: date,
    appointment_time: time,
    moved_from: `${appointment.date} ${appointment.time}`,
    moved_at: new Date().toISOString()
  };
  let recordUpdated = true;
  try {
    await recordOnPayment(env, session, record);
  } catch (err) {
    recordUpdated = false;
    console.error('Booking moved but not recorded on the payment:', session.id, err.message);
  }

  const notice = buildMoveNotice({
    customerName: bookingMetadata(session).customer_name,
    treatment: appointment.treatment,
    appointmentDate: date,
    appointmentTime: time,
    previousDate: appointment.date,
    previousTime: appointment.time,
    reference: paymentIntentId(session)
  });
  const customerEmailed = await emailNotice(env, session, notice);

  return jsonResponse({ order: shapeOrder(withRecorded(session, record)), recordUpdated, customerEmailed });
}
