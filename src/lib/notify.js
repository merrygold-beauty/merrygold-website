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
async function sendEmail(env, { to, subject, text, replyTo }) {
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
      reply_to: replyTo
    })
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    console.error('Resend email error:', data.message || response.status);
    throw new Error('Resend email send failed');
  }
}

// Throws on failure. Callers decide what that means for their own HTTP
// response: enquiry.js turns it into a 502 for the visitor, stripe-webhook.js
// turns it into a 500 so Stripe retries the delivery.
export async function sendClinicEmail(env, { subject, text, replyTo }) {
  const to = env.NOTIFY_TO_EMAIL.split(',').map((address) => address.trim()).filter(Boolean);
  await sendEmail(env, { to, subject, text, replyTo });
}

// A customer's reply goes to the clinic's public address, not to the
// sending address, which may not have a mailbox behind it.
export async function sendCustomerEmail(env, { to, subject, text }) {
  await sendEmail(env, { to: [to], subject, text, replyTo: clinicData.contact.email });
}
