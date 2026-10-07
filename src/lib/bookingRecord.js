// A paid checkout as the staff dashboard sees it. Used by orders.js (the
// list) and the booking management functions (booking-times.js,
// booking-move.js, booking-cancel.js), so all of them describe an order the
// same way.
//
// Where the current appointment lives: checkout.js writes the same metadata
// to the Checkout Session and to its PaymentIntent. A completed session's
// metadata is left as it was at payment; a move or a cancellation is
// recorded on the PaymentIntent, so the PaymentIntent's copy wins.

import { stripeRequest } from './stripeRequest.js';

const SESSION_ID_PATTERN = /^cs_(test|live)_[A-Za-z0-9]+$/;

export function isSessionId(value) {
  return SESSION_ID_PATTERN.test(value || '');
}

function paymentIntentOf(session) {
  return session.payment_intent && typeof session.payment_intent === 'object' ? session.payment_intent : null;
}

export function paymentIntentId(session) {
  return paymentIntentOf(session)?.id || session.payment_intent;
}

export function bookingMetadata(session) {
  return { ...(session.metadata || {}), ...(paymentIntentOf(session)?.metadata || {}) };
}

// The booked appointment, or null for an order with no time slot (products
// only, or a booking paid before time slots, which carries a date only).
export function appointmentOf(session) {
  const metadata = bookingMetadata(session);
  const minutes = Number(metadata.appointment_minutes);
  if (!metadata.appointment_date || !metadata.appointment_time || !minutes) return null;
  return { date: metadata.appointment_date, time: metadata.appointment_time, minutes, treatment: metadata.appointment_treatment || '' };
}

export function shapeOrder(session) {
  const metadata = bookingMetadata(session);
  const reference = paymentIntentId(session);
  const cancelled = metadata.booking_status === 'cancelled';
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
    appointmentTime: metadata.appointment_time || null,
    bookingStatus: cancelled ? 'cancelled' : 'booked',
    refunded: metadata.refund === 'full',
    movedFrom: metadata.moved_from || null,
    // Move and Cancel need a time slot to act on and are pointless once cancelled.
    canManage: !cancelled && Boolean(appointmentOf(session)),
    notes: metadata.notes || null,
    deliveryAddress: metadata.delivery_address || null,
    deliveryPostcode: metadata.delivery_postcode || null,
    reference,
    stripeUrl: `https://dashboard.stripe.com/${session.livemode ? '' : 'test/'}payments/${reference}`
  };
}

// One paid checkout with its PaymentIntent and line items, or null when
// Stripe has no such paid session. Throws when Stripe cannot be reached or
// refuses the request.
export async function loadPaidSession(env, sessionId) {
  const result = await stripeRequest(env, `/checkout/sessions/${sessionId}?expand[]=payment_intent&expand[]=line_items`);
  if (result.status === 404) return null;
  if (!result.ok) throw new Error(`Stripe session read failed: ${result.data.error?.message || result.status}`);
  return result.data.payment_status === 'paid' ? result.data : null;
}

// Records a change on the PaymentIntent (see the top of this file). Values
// are strings; an empty string removes a key.
export async function recordOnPayment(env, session, metadata) {
  const result = await stripeRequest(env, `/payment_intents/${paymentIntentId(session)}`, { method: 'POST', params: { metadata } });
  if (!result.ok) throw new Error(`Stripe payment update failed: ${result.data.error?.message || result.status}`);
}

// The session as it reads once recordOnPayment has saved this change, for
// answering the dashboard without a second Stripe read.
export function withRecorded(session, metadata) {
  const intent = paymentIntentOf(session) || { id: session.payment_intent, metadata: {} };
  return { ...session, payment_intent: { ...intent, metadata: { ...intent.metadata, ...metadata } } };
}
