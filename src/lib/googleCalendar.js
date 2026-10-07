// The clinic's Google Calendar, reached through a Google Cloud service
// account (website-bookings@merrygold-website.iam.gserviceaccount.com) that
// the calendar is shared with. Used by functions/api/availability.js,
// functions/api/checkout.js and functions/api/stripe-webhook.js.
//
// Signs its own token request with WebCrypto (an RS256 JWT, Google's
// "service account" flow) because Pages Functions cannot run Google's Node
// client library. Plain fetch, the same way checkout.js talks to Stripe.

import { BOOKING_TIME_ZONE } from './bookingSlots.js';

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const CALENDAR_API = 'https://www.googleapis.com/calendar/v3';
const CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar';
const TOKEN_LIFETIME_SECONDS = 3600;

// One token per running isolate, reused until five minutes before it expires,
// so a visitor clicking through days does not sign a new JWT every time.
let cachedToken = null;

export function isCalendarConfigured(env) {
  return Boolean(env.GOOGLE_SERVICE_ACCOUNT_JSON && env.BOOKING_CALENDAR_ID);
}

function base64Url(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function base64UrlJson(value) {
  return base64Url(new TextEncoder().encode(JSON.stringify(value)));
}

async function signedAssertion(serviceAccount) {
  const pemBody = serviceAccount.private_key.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '');
  const keyBytes = Uint8Array.from(atob(pemBody), (char) => char.charCodeAt(0));
  const key = await crypto.subtle.importKey('pkcs8', keyBytes, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const now = Math.floor(Date.now() / 1000);
  const unsigned = `${base64UrlJson({ alg: 'RS256', typ: 'JWT' })}.${base64UrlJson({
    iss: serviceAccount.client_email,
    scope: CALENDAR_SCOPE,
    aud: TOKEN_URL,
    iat: now,
    exp: now + TOKEN_LIFETIME_SECONDS
  })}`;
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(unsigned));
  return `${unsigned}.${base64Url(new Uint8Array(signature))}`;
}

async function accessToken(env) {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 5 * 60 * 1000) return cachedToken.value;
  const assertion = await signedAssertion(JSON.parse(env.GOOGLE_SERVICE_ACCOUNT_JSON));
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion })
  });
  const data = await response.json();
  if (!response.ok || !data.access_token) throw new Error(`Google token request failed: ${data.error_description || data.error || response.status}`);
  cachedToken = { value: data.access_token, expiresAt: Date.now() + (data.expires_in || TOKEN_LIFETIME_SECONDS) * 1000 };
  return cachedToken.value;
}

async function calendarFetch(env, path, init = {}) {
  const token = await accessToken(env);
  return fetch(`${CALENDAR_API}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
  });
}

// The calendar's busy blocks between two instants, as { startMs, endMs }.
// Private events come back as busy blocks too, without their details.
// Throws on any failure: the caller decides whether that blocks anything.
export async function busyBlocks(env, startMs, endMs) {
  const response = await calendarFetch(env, '/freeBusy', {
    method: 'POST',
    body: JSON.stringify({
      timeMin: new Date(startMs).toISOString(),
      timeMax: new Date(endMs).toISOString(),
      timeZone: BOOKING_TIME_ZONE,
      items: [{ id: env.BOOKING_CALENDAR_ID }]
    })
  });
  const data = await response.json();
  const calendar = data.calendars?.[env.BOOKING_CALENDAR_ID];
  if (!response.ok || !calendar || calendar.errors) {
    throw new Error(`Google freeBusy failed: ${data.error?.message || JSON.stringify(calendar?.errors) || response.status}`);
  }
  return calendar.busy.map((block) => ({ startMs: Date.parse(block.start), endMs: Date.parse(block.end) }));
}

// A calendar event id that is the same every time for the same text. Google
// accepts ids of lowercase hex (inside its base32hex alphabet), and refuses a
// second event with an id it already has, which is how a retried Stripe
// delivery is kept from adding the booking twice.
export async function eventIdFor(text) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function eventPath(env, id) {
  return `/calendars/${encodeURIComponent(env.BOOKING_CALENDAR_ID)}/events/${id}`;
}

// An event's current { startMs, endMs } (Olu may have dragged it), or null
// when it is not there: never created, deleted, or cancelled in the calendar.
export async function getEvent(env, id) {
  const response = await calendarFetch(env, eventPath(env, id));
  if (response.status === 404 || response.status === 410) return null;
  const data = await response.json();
  if (!response.ok) throw new Error(`Google event read failed: ${data.error?.message || response.status}`);
  if (data.status === 'cancelled') return null;
  return { startMs: Date.parse(data.start.dateTime), endMs: Date.parse(data.end.dateTime) };
}

// Throws on failure, including an event that no longer exists.
export async function moveEvent(env, id, { startMs, endMs }) {
  const response = await calendarFetch(env, eventPath(env, id), {
    method: 'PATCH',
    body: JSON.stringify({
      start: { dateTime: new Date(startMs).toISOString(), timeZone: BOOKING_TIME_ZONE },
      end: { dateTime: new Date(endMs).toISOString(), timeZone: BOOKING_TIME_ZONE }
    })
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(`Google event move failed: ${data.error?.message || response.status}`);
  }
}

// Returns 'deleted', or 'already-gone' when there was nothing to delete.
// Throws on any other failure.
export async function deleteEvent(env, id) {
  const response = await calendarFetch(env, eventPath(env, id), { method: 'DELETE' });
  if (response.status === 404 || response.status === 410) return 'already-gone';
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(`Google event delete failed: ${data.error?.message || response.status}`);
  }
  return 'deleted';
}

// Returns 'added', or 'already-added' when an event with this id exists.
// Throws on any other failure.
export async function addEvent(env, { id, summary, description, startMs, endMs }) {
  const response = await calendarFetch(env, `/calendars/${encodeURIComponent(env.BOOKING_CALENDAR_ID)}/events`, {
    method: 'POST',
    body: JSON.stringify({
      id,
      summary,
      description,
      start: { dateTime: new Date(startMs).toISOString(), timeZone: BOOKING_TIME_ZONE },
      end: { dateTime: new Date(endMs).toISOString(), timeZone: BOOKING_TIME_ZONE }
    })
  });
  if (response.status === 409) return 'already-added';
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(`Google event insert failed: ${data.error?.message || response.status}`);
  }
  return 'added';
}
