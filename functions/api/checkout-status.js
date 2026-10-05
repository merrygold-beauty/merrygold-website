// Cloudflare Pages Function: GET /api/checkout-status?session_id=cs_...
//
// Reads back a Stripe Checkout session for the success page. Never returns
// the whole Stripe session (it can carry more than the receipt needs), only
// the fields the page shows.

import { STRIPE_API_BASE, jsonResponse, unavailableResponse } from '../../src/lib/functionsShared.js';

const SESSION_ID_PATTERN = /^cs_(test|live)_[A-Za-z0-9]+$/;

export async function onRequestGet(context) {
  const { request, env } = context;
  const sessionId = new URL(request.url).searchParams.get('session_id');

  if (!sessionId || !SESSION_ID_PATTERN.test(sessionId)) {
    return jsonResponse({ error: 'That does not look like a valid checkout session.' }, 400);
  }

  if (!env.STRIPE_SECRET_KEY) return unavailableResponse();

  let response;
  try {
    response = await fetch(`${STRIPE_API_BASE}/checkout/sessions/${sessionId}?expand[]=line_items`, {
      headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}` }
    });
  } catch (err) {
    console.error('Stripe checkout session lookup failed:', err.message);
    return jsonResponse({ error: 'Could not check the payment. Please try again.' }, 502);
  }

  const session = await response.json();
  if (!response.ok) {
    console.error('Stripe checkout session lookup error:', session.error?.message);
    return jsonResponse({ error: 'Could not check the payment. Please try again.' }, 502);
  }

  const payload = {
    status: session.payment_status,
    reference: session.payment_intent || session.id,
    amountTotal: session.amount_total,
    currency: session.currency,
    customerEmail: session.customer_details?.email ?? null,
    items: (session.line_items?.data || []).map((line) => ({ name: line.description, quantity: line.quantity })),
    appointmentDate: session.metadata?.appointment_date || null
  };

  return jsonResponse(payload, 200, { 'Cache-Control': 'no-store' });
}
