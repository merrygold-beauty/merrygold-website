// Calls to the Stripe API from the Pages Functions, with plain fetch (no SDK,
// see functions/api/checkout.js). Used by checkout.js and the order
// management functions (order-cancel.js, order-sent.js).

import { STRIPE_API_BASE } from './functionsShared.js';

// Flattens nested objects and arrays into Stripe's bracket form encoding,
// e.g. { line_items: [{ quantity: 1 }] } -> [["line_items[0][quantity]", "1"]].
export function encodeForm(value, prefix = '') {
  const pairs = [];
  for (const [key, val] of Object.entries(value)) {
    if (val === undefined || val === null) continue;
    const paramKey = prefix ? `${prefix}[${key}]` : key;
    if (Array.isArray(val)) {
      val.forEach((item, index) => {
        const arrayKey = `${paramKey}[${index}]`;
        if (typeof item === 'object') pairs.push(...encodeForm(item, arrayKey));
        else pairs.push([arrayKey, String(item)]);
      });
    } else if (typeof val === 'object') {
      pairs.push(...encodeForm(val, paramKey));
    } else {
      pairs.push([paramKey, String(val)]);
    }
  }
  return pairs;
}

// Returns { ok, status, data }; never throws for a Stripe error response,
// only for a network failure. idempotencyKey makes Stripe answer a repeated
// request (a double click, a retry) with the first result instead of acting twice.
export async function stripeRequest(env, path, { method = 'GET', params, idempotencyKey } = {}) {
  const headers = { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}` };
  let body;
  if (params) {
    headers['Content-Type'] = 'application/x-www-form-urlencoded';
    body = new URLSearchParams(encodeForm(params)).toString();
  }
  if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;
  const response = await fetch(`${STRIPE_API_BASE}${path}`, { method, headers, body });
  const data = await response.json();
  return { ok: response.ok, status: response.status, data };
}
