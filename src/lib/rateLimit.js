// Per-visitor request limits for the public functions (chat, enquiry,
// checkout). Pages Functions have no rate-limiting binding, and Cloudflare's
// WAF rules need the domain's DNS on Cloudflare (it is at IONOS), so counts are
// kept in the memory of the running isolate. That is per data centre and is
// lost when the isolate restarts: it stops one visitor hammering a form or the
// paid chat model, not a spread-out attack.

import { jsonResponse } from './functionsShared.js';

const hitsByKey = new Map();

// Keeps the map from growing without bound on a long-lived isolate.
const MAX_TRACKED_KEYS = 5000;

// Returns a 429 response when the visitor is over the limit, otherwise null.
export function rateLimitResponse(request, { name, limit, windowSeconds }) {
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const key = `${name}:${ip}`;
  const now = Date.now();
  const windowStart = now - windowSeconds * 1000;
  const recent = (hitsByKey.get(key) || []).filter((time) => time > windowStart);

  if (recent.length >= limit) {
    const retryAfter = Math.ceil((recent[0] - windowStart) / 1000);
    return jsonResponse(
      { error: 'Too many requests. Please wait a minute and try again.' },
      429,
      { 'Retry-After': String(retryAfter) }
    );
  }

  if (!hitsByKey.has(key) && hitsByKey.size >= MAX_TRACKED_KEYS) hitsByKey.clear();
  recent.push(now);
  hitsByKey.set(key, recent);
  return null;
}
