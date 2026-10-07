// What is already taken on one day: the clinic calendar's busy blocks plus
// the times held by Stripe checkouts still being paid. Shared by
// functions/api/availability.js (to list free times) and
// functions/api/checkout.js (to check the chosen time is still free).
//
// A hold is an open Stripe Checkout session: checkout.js puts the chosen time
// in its metadata and makes it expire after about 30 minutes, so the open
// sessions are the holds and nothing else needs storing. A paid session stops
// being open, and by then the webhook has written the booking to the calendar.

import { STRIPE_API_BASE } from './functionsShared.js';
import { appointmentInterval, dayWindow, freeStartTimes, parseTime, withoutInterval } from './bookingSlots.js';
import { busyBlocks, eventIdFor, getEvent } from './googleCalendar.js';

// More open checkouts than this inside 30 minutes is not a real situation
// for one clinic, so the first page of results is all there is.
const OPEN_SESSION_LIMIT = 100;

// Each browser tab sends a random holder key with its checkout, so a customer
// who goes to Stripe, comes back and tries again is not blocked by their own
// unpaid session.
export const HOLDER_KEY_PATTERN = /^[A-Za-z0-9-]{8,64}$/;

async function heldBlocks(env, date, holderKey) {
  const response = await fetch(`${STRIPE_API_BASE}/checkout/sessions?status=open&limit=${OPEN_SESSION_LIMIT}`, {
    headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}` }
  });
  const data = await response.json();
  if (!response.ok) throw new Error(`Stripe open sessions request failed: ${data.error?.message || response.status}`);
  return (data.data || [])
    .map((session) => session.metadata || {})
    .filter((metadata) => metadata.appointment_date === date && parseTime(metadata.appointment_time) !== null)
    .filter((metadata) => !holderKey || metadata.holder_key !== holderKey)
    .map((metadata) => appointmentInterval(date, metadata.appointment_time, Number(metadata.appointment_minutes) || 0));
}

// Throws if the calendar cannot be read: without it no time can be offered
// honestly. A failure to read the holds is only logged, because the worst
// case then is two customers paying for one time, which the webhook's
// re-check catches and flags to the clinic.
export async function takenBlocksForDay(env, date, holderKey) {
  const window = dayWindow(date);
  const [calendarBlocks, holds] = await Promise.all([
    busyBlocks(env, window.startMs, window.endMs),
    heldBlocks(env, date, holderKey).catch((err) => {
      console.error('Booking holds could not be read:', err.message);
      return [];
    })
  ]);
  return [...calendarBlocks, ...holds];
}

// Where a paid booking could move to on one day: the same rules and the same
// calendar and holds as a new booking, except that the booking's own event
// counts as free. Its interval is read from the calendar, not from Stripe,
// because Olu may already have dragged it. Returns { times, eventFound };
// with eventFound false there is no event to move. Throws if the calendar
// cannot be read.
export async function freeTimesForMove(env, sessionId, appointment, date) {
  const ownEvent = await getEvent(env, await eventIdFor(sessionId));
  if (!ownEvent) return { times: [], eventFound: false };
  const taken = withoutInterval(await takenBlocksForDay(env, date, null), ownEvent);
  const times = freeStartTimes({ date, durationMinutes: appointment.minutes, busy: taken, nowMs: Date.now() });
  return { times, eventFound: true };
}
