// Email sending for Cloudflare Pages Functions, via Resend
// (https://api.resend.com). Used by functions/api/enquiry.js and
// functions/api/stripe-webhook.js. Kept provider-specific and small, the
// same way functions/api/checkout.js talks to Stripe with plain fetch
// instead of an SDK: there is only ever going to be one email provider here.

import { clinicData } from '../data/clinic.js';

const RESEND_API_URL = 'https://api.resend.com/emails';

export function isNotifyConfigured(env) {
  return Boolean(env.RESEND_API_KEY && env.NOTIFY_FROM_EMAIL && env.NOTIFY_TO_EMAIL);
}

// Throws on any non-2xx response.
async function sendEmail(env, { to, subject, text, html, replyTo }) {
  const response = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: env.NOTIFY_FROM_EMAIL,
      to,
      subject,
      text,
      html,
      reply_to: replyTo
    })
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    console.error('Resend email error:', data.message || response.status);
    throw new Error('Resend email send failed');
  }
}

function addressList(value) {
  return (value || '').split(',').map((address) => address.trim()).filter(Boolean);
}

// Who at the clinic gets a paid order's email. Live, bookings go to
// bookings@ (NOTIFY_BOOKINGS_EMAIL) and product orders to orders@
// (NOTIFY_ORDERS_EMAIL), both aliases of the hello@ Zoho mailbox, so Olu can
// tell them apart; an order with both goes to both. Either one left unset
// falls back to NOTIFY_TO_EMAIL, which is how every preview test reaches the
// test inbox only.
export function orderRecipients(env, { hasAppointment, hasProducts }) {
  const fallback = addressList(env.NOTIFY_TO_EMAIL);
  const orFallback = (value) => (addressList(value).length ? addressList(value) : fallback);
  const to = [
    ...(hasAppointment ? orFallback(env.NOTIFY_BOOKINGS_EMAIL) : []),
    ...(hasProducts ? orFallback(env.NOTIFY_ORDERS_EMAIL) : [])
  ];
  return to.length ? [...new Set(to)] : fallback;
}

// Throws on failure. Callers decide what that means for their own HTTP
// response: enquiry.js turns it into a 502 for the visitor, stripe-webhook.js
// turns it into a 500 so Stripe retries the delivery. to defaults to
// NOTIFY_TO_EMAIL, where enquiries go.
export async function sendClinicEmail(env, { subject, text, replyTo, to = addressList(env.NOTIFY_TO_EMAIL) }) {
  await sendEmail(env, { to, subject, text, replyTo });
}

// A customer's reply goes to the clinic's public address, not to the
// sending address, which may not have a mailbox behind it.
export async function sendCustomerEmail(env, { to, subject, text, html }) {
  await sendEmail(env, { to: [to], subject, text, html, replyTo: clinicData.contact.email });
}
