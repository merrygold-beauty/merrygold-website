// Cloudflare Pages Function: GET /api/orders
//
// Paid Stripe checkout sessions for the staff-only orders dashboard
// (src/pages/OrdersDashboard.jsx). Gated by one shared password, not a
// per-user login: this is a small clinic with one person checking orders,
// not a multi-account system.

import { STRIPE_API_BASE, jsonResponse, unavailableResponse } from '../../src/lib/functionsShared.js';
import { isDashboardAuthorized, wrongPasswordResponse } from '../../src/lib/dashboardAuth.js';
import { shapeOrder } from '../../src/lib/bookingRecord.js';

const PAGE_LIMIT = 50;

export async function onRequestGet(context) {
  const { request, env } = context;

  if (!env.ORDERS_DASHBOARD_PASSWORD || !env.STRIPE_SECRET_KEY) return unavailableResponse();
  if (!isDashboardAuthorized(request, env)) return wrongPasswordResponse();

  const cursor = new URL(request.url).searchParams.get('cursor');
  const params = new URLSearchParams({ limit: String(PAGE_LIMIT), status: 'complete' });
  // The PaymentIntent carries any move or cancellation (see src/lib/bookingRecord.js).
  params.append('expand[]', 'data.line_items');
  params.append('expand[]', 'data.payment_intent');
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
