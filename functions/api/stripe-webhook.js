// Cloudflare Pages Function: POST /api/stripe-webhook
//
// Emails the clinic, then the customer, when a checkout session is paid. Configure this endpoint
// in the Stripe dashboard for the checkout.session.completed event; every
// other event type is acknowledged and ignored.
//
// A retried delivery (Stripe retries anything that does not answer 2xx) will
// email the clinic again: there is no dedup store here, so an occasional
// duplicate is the accepted cost of keeping this function stateless.

import { STRIPE_API_BASE, jsonResponse, unavailableResponse, timingSafeEqual } from '../../src/lib/functionsShared.js';
import { isNotifyConfigured, sendClinicEmail, sendCustomerEmail } from '../../src/lib/notify.js';
import { buildOrderSubject, buildOrderBody, buildCustomerSubject, buildCustomerBody } from '../../src/lib/enquiryEmail.js';

const SIGNATURE_TOLERANCE_SECONDS = 300;

async function hmacSha256Hex(secret, message) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return [...new Uint8Array(signature)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

// Stripe-Signature looks like "t=1614556800,v1=...,v1=...": a unix timestamp
// plus one or more v1 HMACs (more than one only during Stripe's own secret
// rotation). Verifies the timestamp is recent and at least one v1 matches.
async function verifyStripeSignature(rawBody, header, secret) {
  if (!header) return false;
  const parts = header.split(',').map((part) => part.trim().split('='));
  const timestamp = parts.find(([key]) => key === 't')?.[1];
  const candidates = parts.filter(([key]) => key === 'v1').map(([, value]) => value);
  if (!timestamp || candidates.length === 0) return false;

  const ageSeconds = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(ageSeconds) || ageSeconds > SIGNATURE_TOLERANCE_SECONDS) return false;

  const expected = await hmacSha256Hex(secret, `${timestamp}.${rawBody}`);
  return candidates.some((candidate) => timingSafeEqual(candidate, expected));
}

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!env.STRIPE_WEBHOOK_SECRET || !env.STRIPE_SECRET_KEY) return unavailableResponse();

  const rawBody = await request.text();
  const verified = await verifyStripeSignature(rawBody, request.headers.get('Stripe-Signature'), env.STRIPE_WEBHOOK_SECRET);
  if (!verified) {
    console.error('Stripe webhook signature did not verify');
    return jsonResponse({ error: 'Invalid signature.' }, 400);
  }

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch (err) {
    console.error('Stripe webhook body was not valid JSON:', err.message);
    return jsonResponse({ error: 'The event body could not be read.' }, 400);
  }

  const session = event?.data?.object;
  if (event?.type !== 'checkout.session.completed' || session?.payment_status !== 'paid') {
    return jsonResponse({ received: true });
  }

  // Nothing downstream needs a Stripe line-items call if there is nowhere to
  // send the result, so this is checked before that fetch, not after it.
  if (!isNotifyConfigured(env)) {
    console.log('Stripe webhook: email not configured, order not emailed', session.id);
    return jsonResponse({ received: true, emailed: false });
  }

  let lineItemsResponse;
  try {
    lineItemsResponse = await fetch(`${STRIPE_API_BASE}/checkout/sessions/${session.id}/line_items?limit=100`, {
      headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}` }
    });
  } catch (err) {
    console.error('Stripe line items request failed:', err.message);
    return jsonResponse({ error: 'Could not read the order line items.' }, 500);
  }

  const lineItemsData = await lineItemsResponse.json();
  if (!lineItemsResponse.ok) {
    console.error('Stripe line items error:', lineItemsData.error?.message);
    return jsonResponse({ error: 'Could not read the order line items.' }, 500);
  }

  const items = (lineItemsData.data || []).map((line) => ({
    name: line.description,
    quantity: line.quantity,
    amountPence: line.amount_total
  }));

  const metadata = session.metadata || {};
  const subject = buildOrderSubject({
    firstItemName: items[0]?.name || 'order',
    extraItemCount: Math.max(items.length - 1, 0),
    hasAppointment: Boolean(metadata.appointment_date)
  });
  const text = buildOrderBody({
    reference: session.payment_intent,
    createdAt: new Date(session.created * 1000),
    customerName: metadata.customer_name || session.customer_details?.name || '',
    customerEmail: session.customer_details?.email || '',
    phone: metadata.phone || '',
    items,
    totalPence: session.amount_total,
    appointmentDate: metadata.appointment_date,
    notes: metadata.notes,
    deliveryAddress: metadata.delivery_address,
    deliveryPostcode: metadata.delivery_postcode,
    stripeUrl: `https://dashboard.stripe.com/${session.livemode ? '' : 'test/'}payments/${session.payment_intent}`
  });

  const customerEmail = session.customer_details?.email || '';
  try {
    await sendClinicEmail(env, { subject, text, replyTo: customerEmail || undefined });
  } catch (err) {
    console.error('Stripe webhook email send failed:', err.message);
    return jsonResponse({ error: 'The order email could not be sent.' }, 500);
  }

  // Best effort, after the clinic's email: a failure here is logged and not
  // retried, because a Stripe retry would email the clinic a second time.
  let customerEmailed = false;
  if (customerEmail) {
    try {
      await sendCustomerEmail(env, {
        to: customerEmail,
        subject: buildCustomerSubject({ firstItemName: items[0]?.name || 'order', hasAppointment: Boolean(metadata.appointment_date) }),
        text: buildCustomerBody({
          reference: session.payment_intent,
          customerName: metadata.customer_name || session.customer_details?.name || '',
          items,
          totalPence: session.amount_total,
          appointmentDate: metadata.appointment_date,
          deliveryAddress: metadata.delivery_address,
          deliveryPostcode: metadata.delivery_postcode
        })
      });
      customerEmailed = true;
    } catch (err) {
      console.error('Stripe webhook customer email send failed:', session.id, err.message);
    }
  }

  return jsonResponse({ received: true, emailed: true, customerEmailed });
}
