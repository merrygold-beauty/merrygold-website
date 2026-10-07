// Cloudflare Pages Function: GET /api/booking-times?session=<checkout session id>&date=YYYY-MM-DD
//
// Staff only (dashboard password). The free start times a paid booking could
// move to on one day, counting its own current slot as free. Used by the
// Move dialog on the orders page; booking-move.js checks the chosen time again.

import { jsonResponse, unavailableResponse } from '../../src/lib/functionsShared.js';
import { isBookableDate } from '../../src/lib/bookingSlots.js';
import { freeTimesForMove } from '../../src/lib/bookingAvailability.js';
import { isCalendarConfigured } from '../../src/lib/googleCalendar.js';
import { dashboardRequestRefusal, loadOrderToManage } from '../../src/lib/manageOrder.js';

export async function onRequestGet(context) {
  const { request, env } = context;

  const refusal = dashboardRequestRefusal(request, env);
  if (refusal) return refusal;
  if (!isCalendarConfigured(env)) return unavailableResponse();

  const params = new URL(request.url).searchParams;
  const date = params.get('date');
  if (!isBookableDate(date, Date.now())) return jsonResponse({ error: 'Please choose a date in the next 90 days.' }, 400);

  const booking = await loadOrderToManage(env, params.get('session'));
  if (booking.response) return booking.response;
  if (!booking.appointment) return jsonResponse({ error: 'This order has no appointment time to move.' }, 409);

  let result;
  try {
    result = await freeTimesForMove(env, booking.session.id, booking.appointment, date);
  } catch (err) {
    console.error('Booking times could not read the calendar:', err.message);
    return jsonResponse({ error: 'The calendar could not be read. Please try again.' }, 502);
  }
  if (!result.eventFound) {
    return jsonResponse({ error: 'This booking is not in the calendar any more, so it cannot be moved here. Move it in Google Calendar instead.' }, 409);
  }
  return jsonResponse({ times: result.times }, 200, { 'Cache-Control': 'no-store' });
}
