// Cloudflare Pages Function: POST /api/checkout
//
// Starts a Stripe Checkout session for the bag, a single treatment, or a
// single product. Prices are looked up in catalogueIndex.js (built by
// scripts/build-catalogue-index.mjs from treatments.js and products.js),
// never taken from the request body, so a tampered client cannot change
// what a customer pays.

import catalogueIndex from '../../src/data/catalogueIndex.js';
import { STRIPE_API_BASE, jsonResponse, unavailableResponse } from '../../src/lib/functionsShared.js';
import { rateLimitResponse } from '../../src/lib/rateLimit.js';

const MAX_ITEMS = 20;
const MAX_QUANTITY = 10;
const MAX_METADATA_LENGTH = 500;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const catalogueById = new Map(catalogueIndex.map((entry) => [entry.id, entry]));

function badRequest(message) {
  return jsonResponse({ error: message }, 400);
}

function truncate(value, max) {
  return value.length > max ? value.slice(0, max) : value;
}

// Flattens nested objects and arrays into Stripe's bracket form encoding,
// e.g. { line_items: [{ quantity: 1 }] } -> [["line_items[0][quantity]", "1"]].
function encodeForm(value, prefix = '') {
  const pairs = [];
  for (const [key, val] of Object.entries(value)) {
    if (val === undefined || val === null) continue;
    const paramKey = prefix ? `${prefix}[${key}]` : key;
    if (Array.isArray(val)) {
      val.forEach((item, index) => {
        const arrayKey = `${paramKey}[${index}]`;
        if (typeof item === 'object') pairs.push(...encodeForm(item, arrayKey));
        else pairs.push([arrayKey, String(item)]);
      });
    } else if (typeof val === 'object') {
      pairs.push(...encodeForm(val, paramKey));
    } else {
      pairs.push([paramKey, String(val)]);
    }
  }
  return pairs;
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
    appointment_date: truncate(booking?.date || '', MAX_METADATA_LENGTH),
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
