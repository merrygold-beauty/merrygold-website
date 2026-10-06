// Cloudflare Pages Function: GET /api/availability?treatment=<id>&date=YYYY-MM-DD&holder=<key>
//
// The free start times for one treatment on one day, worked out from the
// clinic's Google Calendar and the times held by unpaid checkouts (see
// src/lib/bookingAvailability.js). Answers with the start times only, never
// the busy blocks: those are other customers' bookings.

import { jsonResponse, unavailableResponse } from '../../src/lib/functionsShared.js';
import { rateLimitResponse } from '../../src/lib/rateLimit.js';
import { bookableTreatment } from '../../src/lib/catalogueById.js';
import { isBookableDate, freeStartTimes } from '../../src/lib/bookingSlots.js';
import { isCalendarConfigured } from '../../src/lib/googleCalendar.js';
import { HOLDER_KEY_PATTERN, takenBlocksForDay } from '../../src/lib/bookingAvailability.js';

export async function onRequestGet(context) {
  const { request, env } = context;

  if (!isCalendarConfigured(env) || !env.STRIPE_SECRET_KEY) return unavailableResponse();

  // Looser than checkout's limit: a customer clicks through several days.
  const limited = rateLimitResponse(request, { name: 'availability', limit: 60, windowSeconds: 600 });
  if (limited) return limited;

  const params = new URL(request.url).searchParams;
  const treatment = bookableTreatment(params.get('treatment'));
  if (!treatment) return jsonResponse({ error: 'That treatment cannot be booked online.' }, 400);

  const date = params.get('date');
  const nowMs = Date.now();
  if (!isBookableDate(date, nowMs)) return jsonResponse({ error: 'Please choose a date in the next 90 days.' }, 400);

  const holder = params.get('holder');
  const holderKey = HOLDER_KEY_PATTERN.test(holder || '') ? holder : null;

  let taken;
  try {
    taken = await takenBlocksForDay(env, date, holderKey);
  } catch (err) {
    console.error('Availability could not read the calendar:', err.message);
    return jsonResponse({ error: 'Free times could not be loaded. Please try again, or call us to book.' }, 502);
  }

  const times = freeStartTimes({ date, durationMinutes: treatment.minutes, busy: taken, nowMs });
  return jsonResponse({ times }, 200, { 'Cache-Control': 'no-store' });
}
