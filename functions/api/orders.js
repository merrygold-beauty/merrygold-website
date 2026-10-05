// Cloudflare Pages Function: GET /api/orders
//
// Paid Stripe checkout sessions for the staff-only orders dashboard
// (src/pages/OrdersDashboard.jsx). Gated by one shared password, not a
// per-user login: this is a small clinic with one person checking orders,
// not a multi-account system.

import { STRIPE_API_BASE, jsonResponse, unavailableResponse, timingSafeEqual } from '../../src/lib/functionsShared.js';

const PAGE_LIMIT = 50;

function unauthorized() {
  return jsonResponse({ error: 'Wrong password.' }, 401);
}

function isAuthorized(request, env) {
  const [scheme, password] = (request.headers.get('Authorization') || '').split(' ');
  if (scheme !== 'Bearer' || !password) return false;
  return timingSafeEqual(password, env.ORDERS_DASHBOARD_PASSWORD);
}

function shapeOrder(session) {
  const metadata = session.metadata || {};
  return {
    id: session.id,
    created: session.created,
    livemode: session.livemode,
    customerName: metadata.customer_name || session.customer_details?.name || '',
    customerEmail: session.customer_details?.email || '',
    phone: metadata.phone || '',
    amountTotal: session.amount_total,
    currency: session.currency,
    items: (session.line_items?.data || []).map((line) => ({
      name: line.description,
      quantity: line.quantity,
      amountTotal: line.amount_total
    })),
    appointmentDate: metadata.appointment_date || null,
    notes: metadata.notes || null,
    deliveryAddress: metadata.delivery_address || null,
    deliveryPostcode: metadata.delivery_postcode || null,
    reference: session.payment_intent,
    stripeUrl: `https://dashboard.stripe.com/${session.livemode ? '' : 'test/'}payments/${session.payment_intent}`
  };
}

export async function onRequestGet(context) {
  const { request, env } = context;

  if (!env.ORDERS_DASHBOARD_PASSWORD || !env.STRIPE_SECRET_KEY) return unavailableResponse();
  if (!isAuthorized(request, env)) return unauthorized();

  const cursor = new URL(request.url).searchParams.get('cursor');
  const params = new URLSearchParams({ limit: String(PAGE_LIMIT), status: 'complete', 'expand[]': 'data.line_items' });
  if (cursor) params.set('starting_after', cursor);

  let response;
  try {
    response = await fetch(`${STRIPE_API_BASE}/checkout/sessions?${params.toString()}`, {
      headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}` }
    });
  } catch (err) {
    console.error('Stripe checkout sessions request failed:', err.message);
    return jsonResponse({ error: 'Could not load orders. Please try again.' }, 502);
  }

  const data = await response.json();
  if (!response.ok) {
    console.error('Stripe checkout sessions error:', data.error?.message);
    return jsonResponse({ error: 'Could not load orders. Please try again.' }, 502);
  }

  // The pagination cursor follows Stripe's own raw page, not the paid-only
  // subset below it, so the next call continues from exactly where this
  // page of the underlying Stripe list left off.
  const rawSessions = data.data || [];
  const orders = rawSessions.filter((session) => session.payment_status === 'paid').map(shapeOrder);
  const nextCursor = rawSessions.length ? rawSessions[rawSessions.length - 1].id : null;

  return jsonResponse({ orders, hasMore: Boolean(data.has_more), nextCursor }, 200, { 'Cache-Control': 'no-store' });
}
