// Shared across functions/api/*.js. Lives in src/lib, not a functions/api/_lib
// folder: Cloudflare's own Pages Functions routing docs do not document
// underscore-prefixed folders as excluded from routing, so that convention
// was not safe to rely on here.
// A relative import from functions/ is what Pages Functions bundles.
export const STRIPE_API_BASE = 'https://api.stripe.com/v1';

export function jsonResponse(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers }
  });
}

export function unavailableResponse() {
  return jsonResponse({ error: 'unavailable' }, 503);
}

// Constant-time compare over two equal-length strings, for anything checked
// against a secret (a webhook signature, a dashboard password): a length
// mismatch is rejected outright, since there is no timing signal worth
// protecting there. Used by stripe-webhook.js and orders.js.
export function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}
