// The staff dashboard's one shared password (ORDERS_DASHBOARD_PASSWORD), sent
// as "Authorization: Bearer <password>". Checked by every dashboard endpoint:
// orders.js, stock.js, booking-times.js, booking-move.js, order-cancel.js and
// order-sent.js. Since 2026-10-07 it also authorises refunds, booking changes
// and stock changes.

import { jsonResponse, timingSafeEqual } from './functionsShared.js';

export function isDashboardAuthorized(request, env) {
  const [scheme, password] = (request.headers.get('Authorization') || '').split(' ');
  if (scheme !== 'Bearer' || !password) return false;
  return timingSafeEqual(password, env.ORDERS_DASHBOARD_PASSWORD);
}

export function wrongPasswordResponse() {
  return jsonResponse({ error: 'Wrong password.' }, 401);
}
