// The steps every order management endpoint (booking-times.js,
// booking-move.js, order-cancel.js, order-sent.js) takes before acting:
// switched on, right password, not hammered, and a paid order that is not
// cancelled. Each returns either a Response to send back as it is, or what
// the caller needs.

import { jsonResponse, unavailableResponse } from './functionsShared.js';
import { isDashboardAuthorized, wrongPasswordResponse } from './dashboardAuth.js';
import { rateLimitResponse } from './rateLimit.js';
import { appointmentOf, bookingMetadata, isSessionId, loadPaidSession } from './bookingRecord.js';
import { isNotifyConfigured, sendCustomerEmail } from './notify.js';
import { buildNoticeBody } from './enquiryEmail.js';
import { buildNoticeHtml } from './customerEmailHtml.js';

// Returns a Response to send back, or null to carry on.
export function dashboardRequestRefusal(request, env) {
  if (!env.ORDERS_DASHBOARD_PASSWORD || !env.STRIPE_SECRET_KEY) return unavailableResponse();
  if (!isDashboardAuthorized(request, env)) return wrongPasswordResponse();
  return rateLimitResponse(request, { name: 'manage-order', limit: 60, windowSeconds: 600 });
}

// Returns { response } to send back, or { session, appointment } for a paid
// order that is not cancelled; appointment is null when it has no time slot.
export async function loadOrderToManage(env, sessionId) {
  if (!isSessionId(sessionId)) return { response: jsonResponse({ error: 'That order was not found.' }, 400) };
  let session;
  try {
    session = await loadPaidSession(env, sessionId);
  } catch (err) {
    console.error('Order could not be read from Stripe:', sessionId, err.message);
    return { response: jsonResponse({ error: 'Stripe could not be reached. Please try again.' }, 502) };
  }
  if (!session) return { response: jsonResponse({ error: 'That order was not found.' }, 404) };
  if (bookingMetadata(session).order_status === 'cancelled') {
    return { response: jsonResponse({ error: 'This order is already cancelled.' }, 409) };
  }
  return { session, appointment: appointmentOf(session) };
}

// Emails the customer a cancellation, move or dispatch notice. Best effort: returns
// whether it was sent, and never throws, because the change itself is done.
export async function emailNotice(env, session, notice) {
  const to = session.customer_details?.email;
  if (!to || !isNotifyConfigured(env)) return false;
  try {
    await sendCustomerEmail(env, { to, subject: notice.subject, text: buildNoticeBody(notice), html: buildNoticeHtml(notice) });
    return true;
  } catch (err) {
    console.error('Order changed but the customer email failed:', session.id, err.message);
    return false;
  }
}
