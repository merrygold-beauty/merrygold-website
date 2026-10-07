// The staff dashboard's one shared password (ORDERS_DASHBOARD_PASSWORD), sent
// as "Authorization: Bearer <password>". Checked by every dashboard endpoint:
// orders.js, booking-times.js, booking-move.js and booking-cancel.js. Since
// 2026-10-07 it also authorises refunds and booking changes.

import { jsonResponse, timingSafeEqual } from './functionsShared.js';

export function isDashboardAuthorized(request, env) {
  const [scheme, password] = (request.headers.get('Authorization') || '').split(' ');
  if (scheme !== 'Bearer' || !password) return false;
  return timingSafeEqual(password, env.ORDERS_DASHBOARD_PASSWORD);
}

export function wrongPasswordResponse() {
  return jsonResponse({ error: 'Wrong password.' }, 401);
}
