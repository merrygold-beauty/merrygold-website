// Cloudflare Pages Function: POST /api/checkout
//
// Starts a Stripe Checkout session for the bag, a single treatment, or a
// single product. Prices are looked up in catalogueIndex.js (built by
// scripts/build-catalogue-index.mjs from treatments.js and products.js),
// never taken from the request body, so a tampered client cannot change
// what a customer pays. A treatment also carries its chosen start time,
// checked here against the opening hours, the calendar and the other open
// checkouts before Stripe is called.

import { STRIPE_API_BASE, jsonResponse, unavailableResponse } from '../../src/lib/functionsShared.js';
import { rateLimitResponse } from '../../src/lib/rateLimit.js';
import { encodeForm } from '../../src/lib/stripeRequest.js';
import { catalogueById } from '../../src/lib/catalogueById.js';
import { appointmentInterval, clashesWithBusy, freeStartTimes, isBookableDate } from '../../src/lib/bookingSlots.js';
import { isCalendarConfigured } from '../../src/lib/googleCalendar.js';
import { HOLDER_KEY_PATTERN, takenBlocksForDay } from '../../src/lib/bookingAvailability.js';

const MAX_ITEMS = 20;
const MAX_QUANTITY = 10;
const MAX_METADATA_LENGTH = 500;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// How long an unpaid checkout holds its time. Stripe's shortest allowed
// expiry is 30 minutes from creation; the extra minute keeps the request
// clear of that limit if the clocks differ slightly.
const HOLD_SECONDS = 31 * 60;

function badRequest(message) {
  return jsonResponse({ error: message }, 400);
}

function truncate(value, max) {
  return value.length > max ? value.slice(0, max) : value;
}

// Looks up each bag line in the price index and checks its quantity. Returns
// either { priced } or { error: '<sentence for the 400 response>' }.
function validateItems(items) {
  if (!Array.isArray(items) || items.length < 1 || items.length > MAX_ITEMS) {
    return { error: `Choose between 1 and ${MAX_ITEMS} items.` };
  }
  const priced = [];
  for (const item of items) {
    const entry = catalogueById.get(item?.id);
    // pence is null for a treatment the owner has not priced yet. The site
    // never puts one in the bag, so a request carrying one did not come from it.
    if (!entry || entry.pence === null) return { error: 'One of the items in your bag is no longer available.' };
    if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > MAX_QUANTITY) {
      return { error: 'Quantities must be whole numbers between 1 and 10.' };
    }
    priced.push({ entry, quantity: item.quantity });
  }
  // One paid booking is one calendar entry, so a checkout carries at most one
  // treatment, once. The bag already enforces this; this stops a hand-made request.
  const treatmentLines = priced.filter(({ entry }) => entry.kind === 'treatment');
  if (treatmentLines.length > 1 || treatmentLines.some(({ quantity }) => quantity > 1)) {
    return { error: 'Each booking is for one treatment.' };
  }
  return { priced };
}

// A treatment needs a start time that fits the opening hours and is still
// free. Returns { appointment }, or { error, status } for the response. If the
// calendar cannot be read the time is accepted: the webhook checks it again
// after payment and flags a clash to the clinic, so a calendar failure never
// stops a customer paying.
async function validateAppointment(env, treatment, booking) {
  const date = booking?.date;
  const time = booking?.time;
  const nowMs = Date.now();
  if (!isBookableDate(date, nowMs)) return { error: 'Please choose a date in the next 90 days.', status: 400 };
  const fitsOpeningHours = freeStartTimes({ date, durationMinutes: treatment.minutes, busy: [], nowMs }).includes(time);
  if (!fitsOpeningHours) return { error: 'Please choose one of the times shown.', status: 400 };

  const holderKey = HOLDER_KEY_PATTERN.test(booking?.holder || '') ? booking.holder : '';
  if (isCalendarConfigured(env)) {
    try {
      const taken = await takenBlocksForDay(env, date, holderKey);
      if (clashesWithBusy(appointmentInterval(date, time, treatment.minutes), taken)) {
        return { error: 'That time has just been taken. Please choose another.', status: 409 };
      }
    } catch (err) {
      console.error('Checkout could not re-check the calendar, time accepted:', err.message);
    }
  }
  return { appointment: { date, time, minutes: treatment.minutes, holderKey } };
}

function validateCustomer(customer) {
  const name = customer?.name;
  const email = customer?.email;
  const phone = customer?.phone;
  if (!name || !String(name).trim()) return { error: 'Please enter your name.' };
  if (!email || !EMAIL_PATTERN.test(String(email))) return { error: 'That email address does not look right.' };
  if (!phone || !String(phone).trim()) return { error: 'Please enter a telephone number.' };
  return {};
}

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!env.STRIPE_SECRET_KEY) return unavailableResponse();

  const limited = rateLimitResponse(request, { name: 'checkout', limit: 10, windowSeconds: 600 });
  if (limited) return limited;

  let body;
  try {
    body = await request.json();
  } catch (err) {
    console.error('Checkout request body was not valid JSON:', err.message);
    return badRequest('The order details could not be read.');
  }

  const { items, customer, booking, delivery } = body || {};

  const itemsResult = validateItems(items);
  if (itemsResult.error) return badRequest(itemsResult.error);

  const customerResult = validateCustomer(customer);
  if (customerResult.error) return badRequest(customerResult.error);

  const notes = booking?.notes ?? '';
  if (typeof notes !== 'string' || notes.length > MAX_METADATA_LENGTH) {
    return badRequest(`Notes must be ${MAX_METADATA_LENGTH} characters or fewer.`);
  }

  const { priced } = itemsResult;

  const treatmentLine = priced.find(({ entry }) => entry.kind === 'treatment');
  let appointment = null;
  if (treatmentLine) {
    const appointmentResult = await validateAppointment(env, treatmentLine.entry, booking);
    if (appointmentResult.error) return jsonResponse({ error: appointmentResult.error }, appointmentResult.status);
    appointment = appointmentResult.appointment;
  }

  const origin = env.SITE_ORIGIN || new URL(request.url).origin;

  const lineItems = priced.map(({ entry, quantity }) => ({
    price_data: {
      currency: 'gbp',
      unit_amount: entry.pence,
      product_data: { name: entry.name }
    },
    quantity
  }));

  const firstItemName = priced[0].entry.name;
  const description =
    priced.length > 1 ? `MerryGold: ${firstItemName} and ${priced.length - 1} more` : `MerryGold: ${firstItemName}`;
  const itemsSummary = truncate(priced.map(({ entry, quantity }) => `${entry.id} x ${quantity}`).join(', '), MAX_METADATA_LENGTH);

  const metadata = {
    customer_name: truncate(String(customer.name), MAX_METADATA_LENGTH),
    phone: truncate(String(customer.phone), MAX_METADATA_LENGTH),
    // The webhook, the success page and bookingAvailability.js's holds read
    // the appointment fields.
    appointment_treatment: appointment ? treatmentLine.entry.name : '',
    appointment_date: appointment?.date || '',
    appointment_time: appointment?.time || '',
    appointment_minutes: appointment ? String(appointment.minutes) : '',
    holder_key: appointment?.holderKey || '',
    notes: truncate(notes, MAX_METADATA_LENGTH),
    delivery_address: truncate(delivery?.address || '', MAX_METADATA_LENGTH),
    delivery_postcode: truncate(delivery?.postcode || '', MAX_METADATA_LENGTH),
    items: itemsSummary
  };

  const sessionParams = {
    mode: 'payment',
    customer_email: customer.email,
    success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/checkout/cancelled`,
    line_items: lineItems,
    // Only a booking holds anything, so product orders keep Stripe's default expiry.
    expires_at: appointment ? Math.floor(Date.now() / 1000) + HOLD_SECONDS : undefined,
    // The same metadata goes on the PaymentIntent too: the Payments view in
    // the Stripe dashboard, which the owner reads, shows the intent, not
    // the session. receipt_email makes Stripe send its receipt to the buyer.
    payment_intent_data: { description, receipt_email: customer.email, metadata },
    metadata
  };

  let response;
  try {
    response = await fetch(`${STRIPE_API_BASE}/checkout/sessions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams(encodeForm(sessionParams)).toString()
    });
  } catch (err) {
    console.error('Stripe checkout session request failed:', err.message);
    return jsonResponse({ error: 'Stripe could not start the payment. Please try again.' }, 502);
  }

  const session = await response.json();
  if (!response.ok) {
    console.error('Stripe checkout session error:', session.error?.message);
    return jsonResponse({ error: 'Stripe could not start the payment. Please try again.' }, 502);
  }

  return jsonResponse({ url: session.url });
}
