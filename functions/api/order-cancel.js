// Cloudflare Pages Function: POST /api/order-cancel  { session, refund }
//
// Staff only (dashboard password). Cancels a paid order, booking or products,
// in this order:
// 1. the refund, when refund is true (money first: if Stripe refuses it,
//    nothing else changes and the order stays as it was);
// 2. for a booking, the calendar event, so the time is free to book again;
// 3. the record on the Stripe payment (src/lib/bookingRecord.js);
// 4. the customer's email.
// Steps 2 to 4 are best effort once the refund is done, and the answer says
// which of them failed so the clinic can finish by hand.

import { jsonResponse } from '../../src/lib/functionsShared.js';
import { stripeRequest } from '../../src/lib/stripeRequest.js';
import { deleteEvent, eventIdFor, isCalendarConfigured } from '../../src/lib/googleCalendar.js';
import { bookingMetadata, paymentIntentId, recordOnPayment, shapeOrder, withRecorded } from '../../src/lib/bookingRecord.js';
import { dashboardRequestRefusal, emailNotice, loadOrderToManage } from '../../src/lib/manageOrder.js';
import { buildCancellationNotice } from '../../src/lib/enquiryEmail.js';

// Refunds the whole payment. The idempotency key is tied to the order, so a
// double click or a retry can never refund it twice; a payment refunded
// earlier (in the Stripe dashboard, say) also counts as done.
async function refundInFull(env, session) {
  const result = await stripeRequest(env, '/refunds', {
    method: 'POST',
    params: { payment_intent: paymentIntentId(session) },
    idempotencyKey: `order-cancel-refund-${session.id}`
  });
  if (result.ok || result.data.error?.code === 'charge_already_refunded') return;
  throw new Error(result.data.error?.message || `Stripe answered ${result.status}`);
}

// Returns false only when there was a booking event and it could not be removed.
async function freeCalendarTime(env, session) {
  if (!isCalendarConfigured(env)) return false;
  try {
    await deleteEvent(env, await eventIdFor(session.id));
    return true;
  } catch (err) {
    console.error('Order cancelled but the calendar event was not removed:', session.id, err.message);
    return false;
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;

  const refusal = dashboardRequestRefusal(request, env);
  if (refusal) return refusal;

  const body = await request.json().catch(() => ({}));
  if (typeof body.refund !== 'boolean') return jsonResponse({ error: 'Choose whether to refund the payment.' }, 400);

  const order = await loadOrderToManage(env, body.session);
  if (order.response) return order.response;
  const { session, appointment } = order;

  if (body.refund) {
    try {
      await refundInFull(env, session);
    } catch (err) {
      console.error('Order cancel stopped, refund refused:', session.id, err.message);
      return jsonResponse({ error: 'Stripe did not refund this payment, so the order was not cancelled. Please try again, or refund it in Stripe.' }, 502);
    }
  }

  const calendarFreed = appointment ? await freeCalendarTime(env, session) : true;

  const record = { order_status: 'cancelled', cancelled_at: new Date().toISOString(), refund: body.refund ? 'full' : 'none' };
  let recordUpdated = true;
  try {
    await recordOnPayment(env, session, record);
  } catch (err) {
    recordUpdated = false;
    console.error('Order cancelled but not recorded on the payment:', session.id, err.message);
  }

  const notice = buildCancellationNotice({
    customerName: bookingMetadata(session).customer_name,
    treatment: appointment?.treatment,
    appointmentDate: appointment?.date,
    appointmentTime: appointment?.time,
    refunded: body.refund,
    amountPence: session.amount_total,
    reference: paymentIntentId(session)
  });
  const customerEmailed = await emailNotice(env, session, notice);

  return jsonResponse({ order: shapeOrder(withRecorded(session, record)), calendarFreed, recordUpdated, customerEmailed });
}
