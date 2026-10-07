// Cloudflare Pages Function: POST /api/booking-cancel  { session, refund }
//
// Staff only (dashboard password). Cancels a paid booking, in this order:
// 1. the refund, when refund is true (money first: if Stripe refuses it,
//    nothing else changes and the booking stays as it was);
// 2. the calendar event, so the time is free to book again;
// 3. the record on the Stripe payment (src/lib/bookingRecord.js);
// 4. the customer's email.
// Steps 2 to 4 are best effort once the refund is done, and the answer says
// which of them failed so the clinic can finish by hand.

import { jsonResponse } from '../../src/lib/functionsShared.js';
import { stripeRequest } from '../../src/lib/stripeRequest.js';
import { deleteEvent, eventIdFor } from '../../src/lib/googleCalendar.js';
import { bookingMetadata, paymentIntentId, recordOnPayment, shapeOrder, withRecorded } from '../../src/lib/bookingRecord.js';
import { dashboardRequestRefusal, emailNotice, loadBookingToManage } from '../../src/lib/manageBooking.js';
import { buildCancellationNotice } from '../../src/lib/enquiryEmail.js';

// Refunds the whole payment. The idempotency key is tied to the booking, so
// a double click or a retry can never refund it twice; a payment refunded
// earlier (in the Stripe dashboard, say) also counts as done.
async function refundInFull(env, session) {
  const result = await stripeRequest(env, '/refunds', {
    method: 'POST',
    params: { payment_intent: paymentIntentId(session) },
    idempotencyKey: `booking-cancel-refund-${session.id}`
  });
  if (result.ok || result.data.error?.code === 'charge_already_refunded') return;
  throw new Error(result.data.error?.message || `Stripe answered ${result.status}`);
}

export async function onRequestPost(context) {
  const { request, env } = context;

  const refusal = dashboardRequestRefusal(request, env);
  if (refusal) return refusal;

  const body = await request.json().catch(() => ({}));
  if (typeof body.refund !== 'boolean') return jsonResponse({ error: 'Choose whether to refund the payment.' }, 400);

  const booking = await loadBookingToManage(env, body.session);
  if (booking.response) return booking.response;
  const { session, appointment } = booking;

  if (body.refund) {
    try {
      await refundInFull(env, session);
    } catch (err) {
      console.error('Booking cancel stopped, refund refused:', session.id, err.message);
      return jsonResponse({ error: 'Stripe did not refund this payment, so the booking was not cancelled. Please try again, or refund it in Stripe.' }, 502);
    }
  }

  let calendarFreed = true;
  try {
    await deleteEvent(env, await eventIdFor(session.id));
  } catch (err) {
    calendarFreed = false;
    console.error('Booking cancelled but the calendar event was not removed:', session.id, err.message);
  }

  const record = { booking_status: 'cancelled', cancelled_at: new Date().toISOString(), refund: body.refund ? 'full' : 'none' };
  let recordUpdated = true;
  try {
    await recordOnPayment(env, session, record);
  } catch (err) {
    recordUpdated = false;
    console.error('Booking cancelled but not recorded on the payment:', session.id, err.message);
  }

  const notice = buildCancellationNotice({
    customerName: bookingMetadata(session).customer_name,
    treatment: appointment.treatment,
    appointmentDate: appointment.date,
    appointmentTime: appointment.time,
    refunded: body.refund,
    amountPence: session.amount_total,
    reference: paymentIntentId(session)
  });
  const customerEmailed = await emailNotice(env, session, notice);

  return jsonResponse({ order: shapeOrder(withRecorded(session, record)), calendarFreed, recordUpdated, customerEmailed });
}
