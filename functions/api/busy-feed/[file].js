// Cloudflare Pages Function: GET /api/busy-feed/<BUSY_FEED_KEY>.ics
//
// The clinic's busy times for Treatwell (see src/lib/busyFeed.js). The key in
// the address is the only lock, so a wrong or missing key gets the same plain
// 404 as any page that does not exist.
//
// No rate limit and no cache: Treatwell polls from addresses we do not know,
// and a cached copy would delay a new booking reaching it. If any calendar
// cannot be read the answer is 502, never an empty calendar, which Treatwell
// would take as every time being free.

import { timingSafeEqual, unavailableResponse } from '../../../src/lib/functionsShared.js';
import { busyBlocks, isCalendarConfigured } from '../../../src/lib/googleCalendar.js';
import { busyFeedIcs } from '../../../src/lib/busyFeed.js';

const DAY_MS = 24 * 60 * 60 * 1000;
// Google refuses a free/busy query much over 92 days. A day back keeps
// today's earlier bookings in the feed; 90 ahead matches the booking window.
const DAYS_BACK = 1;
const DAYS_AHEAD = 90;

function notFound() {
  return new Response('Not found', { status: 404 });
}

export async function onRequestGet(context) {
  const { env, params } = context;

  const key = env.BUSY_FEED_KEY;
  if (!key || !timingSafeEqual(String(params.file), `${key}.ics`)) return notFound();
  if (!isCalendarConfigured(env)) return unavailableResponse();

  const nowMs = Date.now();
  let blocks;
  try {
    blocks = await busyBlocks(env, nowMs - DAYS_BACK * DAY_MS, nowMs + DAYS_AHEAD * DAY_MS);
  } catch (err) {
    console.error('Busy feed could not read the calendar:', err.message);
    return new Response('Calendar unavailable', { status: 502 });
  }

  return new Response(await busyFeedIcs(blocks, nowMs), {
    status: 200,
    headers: { 'Content-Type': 'text/calendar; charset=utf-8', 'Cache-Control': 'no-store' }
  });
}
