import { test, expect } from '@playwright/test';
import { onRequestPost as enquiryPost } from '../../functions/api/enquiry.js';
import { onRequestPost as webhookPost } from '../../functions/api/stripe-webhook.js';
import { onRequestGet as ordersGet } from '../../functions/api/orders.js';
import { onRequestPost as checkoutPost } from '../../functions/api/checkout.js';

// Every test stubs globalThis.fetch to capture the outgoing Resend/Stripe
// call instead of making one; this restores the real fetch afterwards so
// stubs from one test never leak into the next.
const originalFetch = globalThis.fetch;
test.afterEach(() => {
  globalThis.fetch = originalFetch;
});

// Each request comes from its own address unless one is given, so the
// functions' per-visitor rate limits (src/lib/rateLimit.js) only bite in the
// test that is about them.
let nextClientNumber = 1;
function jsonRequest(url, body, clientIp = `198.51.100.${nextClientNumber++ % 250}`) {
  return new Request(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'CF-Connecting-IP': clientIp },
    body: JSON.stringify(body)
  });
}

async function signStripePayload(secret, rawBody, timestamp = Math.floor(Date.now() / 1000)) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${timestamp}.${rawBody}`));
  const hex = [...new Uint8Array(signatureBuffer)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
  return `t=${timestamp},v1=${hex}`;
}

const NOTIFY_ENV = { RESEND_API_KEY: 'key', NOTIFY_FROM_EMAIL: 'MerryGold <from@merrygoldclinics.com>', NOTIFY_TO_EMAIL: 'to@merrygoldclinics.com' };
const VALID_CONTACT = { type: 'contact', name: 'Jane Doe', email: 'jane@example.com', phone: '07700 900123', message: 'Hello' };

test.describe('POST /api/enquiry', () => {
  const invalidCases = [
    ['an unknown type', { ...VALID_CONTACT, type: 'nope' }],
    ['no name', { ...VALID_CONTACT, name: '' }],
    ['a name over 120 characters', { ...VALID_CONTACT, name: 'x'.repeat(121) }],
    ['a bad email address', { ...VALID_CONTACT, email: 'not-an-email' }],
    ['no phone number', { ...VALID_CONTACT, phone: '' }],
    ['a preferred time outside the fixed options', { ...VALID_CONTACT, preferredTime: 'Midnight' }],
    ['a preferred date not in YYYY-MM-DD', { ...VALID_CONTACT, preferredDate: '01/10/2026' }],
    ['more than 10 training programmes', { type: 'training', name: 'Jane', email: 'jane@example.com', phone: '07700 900123', programmes: Array(11).fill('Facials') }]
  ];

  for (const [label, body] of invalidCases) {
    test(`FN-01 rejects ${label} with 400`, async () => {
      globalThis.fetch = async () => { throw new Error('fetch must not be called for an invalid submission'); };
      const response = await enquiryPost({ request: jsonRequest('https://example.test/api/enquiry', body), env: NOTIFY_ENV });
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(typeof data.error).toBe('string');
      expect(data.error.length).toBeGreaterThan(0);
    });
  }

  test('FN-02 the honeypot field drops the submission with 200 and no email sent', async () => {
    let fetchCalled = false;
    globalThis.fetch = async () => {
      fetchCalled = true;
      return new Response('{}', { status: 200 });
    };
    const response = await enquiryPost({
      request: jsonRequest('https://example.test/api/enquiry', { ...VALID_CONTACT, company: 'Totally Real Company Ltd' }),
      env: NOTIFY_ENV
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(fetchCalled).toBe(false);
  });

  test('FN-03 answers 503 when email is not configured', async () => {
    const response = await enquiryPost({ request: jsonRequest('https://example.test/api/enquiry', VALID_CONTACT), env: {} });
    expect(response.status).toBe(503);
  });

  test('FN-04 a valid submission emails the clinic via Resend with reply-to set', async () => {
    const calls = [];
    globalThis.fetch = async (url, init) => {
      calls.push({ url: String(url), init });
      return new Response(JSON.stringify({ id: 'email_1' }), { status: 200 });
    };
    const response = await enquiryPost({ request: jsonRequest('https://example.test/api/enquiry', VALID_CONTACT), env: NOTIFY_ENV });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });

    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe('https://api.resend.com/emails');
    const payload = JSON.parse(calls[0].init.body);
    expect(payload.to).toEqual(['to@merrygoldclinics.com']);
    expect(payload.reply_to).toBe(VALID_CONTACT.email);
    expect(payload.subject).toBe('New contact enquiry from Jane Doe');
    expect(payload.text).toContain('Name: Jane Doe');
  });

  test('FN-05 a Resend failure answers 502 pointing the visitor at WhatsApp', async () => {
    globalThis.fetch = async () => new Response(JSON.stringify({ message: 'invalid from address' }), { status: 422 });
    const response = await enquiryPost({ request: jsonRequest('https://example.test/api/enquiry', VALID_CONTACT), env: NOTIFY_ENV });
    expect(response.status).toBe(502);
    expect((await response.json()).error).toContain('WhatsApp');
  });
});

test.describe('POST /api/stripe-webhook', () => {
  const WEBHOOK_SECRET = 'whsec_test_secret';
  const WEBHOOK_ENV = { STRIPE_WEBHOOK_SECRET: WEBHOOK_SECRET, STRIPE_SECRET_KEY: 'sk_test_123', ...NOTIFY_ENV };

  const paidSessionEvent = {
    type: 'checkout.session.completed',
    data: {
      object: {
        id: 'cs_test_123',
        payment_status: 'paid',
        payment_intent: 'pi_test_123',
        livemode: false,
        created: 1700000000,
        amount_total: 25000,
        customer_details: { email: 'client@example.com', name: 'Client Name' },
        metadata: { customer_name: 'Client Name', phone: '07700 900123', appointment_date: '2026-10-01', notes: '' }
      }
    }
  };

  test('FN-10 missing Stripe env answers 503', async () => {
    const response = await webhookPost({ request: new Request('https://example.test/api/stripe-webhook', { method: 'POST', body: '{}' }), env: {} });
    expect(response.status).toBe(503);
  });

  test('FN-11 a bad signature is rejected with 400', async () => {
    const rawBody = JSON.stringify(paidSessionEvent);
    const request = new Request('https://example.test/api/stripe-webhook', {
      method: 'POST',
      headers: { 'Stripe-Signature': 't=1700000000,v1=0000000000000000000000000000000000000000000000000000000000000000' },
      body: rawBody
    });
    const response = await webhookPost({ request, env: WEBHOOK_ENV });
    expect(response.status).toBe(400);
  });

  test('FN-12 a correctly signed paid session fetches its line items and emails the clinic, then the customer', async () => {
    const rawBody = JSON.stringify(paidSessionEvent);
    const signature = await signStripePayload(WEBHOOK_SECRET, rawBody);
    const calls = [];
    globalThis.fetch = async (url, init) => {
      calls.push({ url: String(url), init });
      if (String(url).includes('/line_items')) {
        return new Response(JSON.stringify({ data: [{ description: 'Microblading Brows', quantity: 1, amount_total: 25000 }] }), { status: 200 });
      }
      return new Response(JSON.stringify({ id: 'email_1' }), { status: 200 });
    };

    const request = new Request('https://example.test/api/stripe-webhook', { method: 'POST', headers: { 'Stripe-Signature': signature }, body: rawBody });
    const response = await webhookPost({ request, env: WEBHOOK_ENV });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ received: true, emailed: true, customerEmailed: true });
    expect(calls).toHaveLength(3);
    expect(calls[0].url).toContain('/checkout/sessions/cs_test_123/line_items');
    expect(calls[1].url).toBe('https://api.resend.com/emails');
    const payload = JSON.parse(calls[1].init.body);
    expect(payload.subject).toBe('New paid booking: Microblading Brows');
    expect(payload.text).toContain('pi_test_123');
    expect(payload.text.startsWith('To do: call or WhatsApp Client Name on 07700 900123 to confirm the appointment time.')).toBe(true);
    expect(payload.text).toContain('Requested date: Thursday 1 October 2026');

    const customer = JSON.parse(calls[2].init.body);
    expect(customer.to).toEqual(['client@example.com']);
    expect(customer.reply_to).toBe('hello@merrygoldbeautyclinics.com');
    expect(customer.subject).toBe('Your MerryGold booking: Microblading Brows');
    expect(customer.text).toContain('Dear Client Name,');
    expect(customer.text).toContain('Requested date: Thursday 1 October 2026');
    expect(customer.text).toContain('Total paid: £250.00');
    expect(customer.text).toContain('pi_test_123');
  });

  test('FN-15 a failed customer email still answers 200, so Stripe does not retry and email the clinic twice', async () => {
    const rawBody = JSON.stringify(paidSessionEvent);
    const signature = await signStripePayload(WEBHOOK_SECRET, rawBody);
    let emailsSent = 0;
    globalThis.fetch = async (url) => {
      if (String(url).includes('/line_items')) {
        return new Response(JSON.stringify({ data: [{ description: 'Microblading Brows', quantity: 1, amount_total: 25000 }] }), { status: 200 });
      }
      emailsSent += 1;
      return emailsSent === 1
        ? new Response(JSON.stringify({ id: 'email_1' }), { status: 200 })
        : new Response(JSON.stringify({ message: 'rejected' }), { status: 422 });
    };

    const request = new Request('https://example.test/api/stripe-webhook', { method: 'POST', headers: { 'Stripe-Signature': signature }, body: rawBody });
    const response = await webhookPost({ request, env: WEBHOOK_ENV });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ received: true, emailed: true, customerEmailed: false });
  });

  test('FN-13 email not configured answers 200 with emailed:false and no Stripe call', async () => {
    const rawBody = JSON.stringify(paidSessionEvent);
    const signature = await signStripePayload(WEBHOOK_SECRET, rawBody);
    let fetchCalled = false;
    globalThis.fetch = async () => { fetchCalled = true; return new Response('{}', { status: 200 }); };

    const request = new Request('https://example.test/api/stripe-webhook', { method: 'POST', headers: { 'Stripe-Signature': signature }, body: rawBody });
    const response = await webhookPost({ request, env: { STRIPE_WEBHOOK_SECRET: WEBHOOK_SECRET, STRIPE_SECRET_KEY: 'sk_test_123' } });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ received: true, emailed: false });
    expect(fetchCalled).toBe(false);
  });

  test('FN-14 an event that is not a paid checkout session is acknowledged and ignored', async () => {
    const rawBody = JSON.stringify({ type: 'customer.created', data: { object: {} } });
    const signature = await signStripePayload(WEBHOOK_SECRET, rawBody);
    let fetchCalled = false;
    globalThis.fetch = async () => { fetchCalled = true; return new Response('{}', { status: 200 }); };

    const request = new Request('https://example.test/api/stripe-webhook', { method: 'POST', headers: { 'Stripe-Signature': signature }, body: rawBody });
    const response = await webhookPost({ request, env: WEBHOOK_ENV });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ received: true });
    expect(fetchCalled).toBe(false);
  });
});

test.describe('GET /api/orders', () => {
  const ORDERS_ENV = { ORDERS_DASHBOARD_PASSWORD: 'letmein', STRIPE_SECRET_KEY: 'sk_test_123' };

  test('FN-20 no Authorization header is rejected with 401', async () => {
    const response = await ordersGet({ request: new Request('https://example.test/api/orders'), env: ORDERS_ENV });
    expect(response.status).toBe(401);
    expect((await response.json()).error).toBe('Wrong password.');
  });

  test('FN-21 the wrong password is rejected with 401', async () => {
    const response = await ordersGet({
      request: new Request('https://example.test/api/orders', { headers: { Authorization: 'Bearer nope' } }),
      env: ORDERS_ENV
    });
    expect(response.status).toBe(401);
  });

  test('FN-22 no password configured answers 503', async () => {
    const response = await ordersGet({
      request: new Request('https://example.test/api/orders', { headers: { Authorization: 'Bearer letmein' } }),
      env: { STRIPE_SECRET_KEY: 'sk_test_123' }
    });
    expect(response.status).toBe(503);
  });

  test('FN-23 the right password returns shaped, paid-only orders with pagination', async () => {
    globalThis.fetch = async () => new Response(JSON.stringify({
      has_more: true,
      data: [
        {
          id: 'cs_1',
          payment_status: 'paid',
          created: 1700000000,
          livemode: false,
          payment_intent: 'pi_1',
          amount_total: 5000,
          currency: 'gbp',
          customer_details: { email: 'a@b.com', name: 'A B' },
          metadata: { customer_name: 'A B', phone: '07700000000', appointment_date: '2026-10-01' },
          line_items: { data: [{ description: 'Facial', quantity: 1, amount_total: 5000 }] }
        },
        {
          id: 'cs_2',
          payment_status: 'unpaid',
          created: 1699999999,
          livemode: false,
          payment_intent: 'pi_2',
          amount_total: 2000,
          currency: 'gbp',
          customer_details: {},
          metadata: {},
          line_items: { data: [] }
        }
      ]
    }), { status: 200 });

    const response = await ordersGet({
      request: new Request('https://example.test/api/orders', { headers: { Authorization: 'Bearer letmein' } }),
      env: ORDERS_ENV
    });
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.orders).toHaveLength(1);
    expect(data.orders[0]).toMatchObject({ id: 'cs_1', customerName: 'A B', amountTotal: 5000, reference: 'pi_1' });
    expect(data.hasMore).toBe(true);
    expect(data.nextCursor).toBe('cs_2');
  });
});

test.describe('POST /api/checkout', () => {
  const CHECKOUT_ENV = { STRIPE_SECRET_KEY: 'sk_test_x' };
  const CUSTOMER = { name: 'Jane Doe', email: 'jane@example.com', phone: '07700 900123' };

  function checkoutRequest(items) {
    return jsonRequest('https://example.test/api/checkout', { items, customer: CUSTOMER, booking: { date: '2026-11-02' } });
  }

  function stubStripe() {
    const calls = [];
    globalThis.fetch = async (url) => {
      calls.push(url);
      return new Response(JSON.stringify({ url: 'https://checkout.stripe.test/s' }), { status: 200 });
    };
    return calls;
  }

  test('FN-30 two different treatments are refused with 400 and Stripe is not called', async () => {
    const calls = stubStripe();
    const response = await checkoutPost({
      request: checkoutRequest([{ id: 'facial-gold', quantity: 1 }, { id: 'facial-derma-pen', quantity: 1 }]),
      env: CHECKOUT_ENV
    });
    expect(response.status).toBe(400);
    expect((await response.json()).error).toBe('Each booking is for one treatment.');
    expect(calls).toHaveLength(0);
  });

  test('FN-31 one treatment booked twice is refused with 400', async () => {
    const calls = stubStripe();
    const response = await checkoutPost({ request: checkoutRequest([{ id: 'facial-gold', quantity: 2 }]), env: CHECKOUT_ENV });
    expect(response.status).toBe(400);
    expect(calls).toHaveLength(0);
  });

  test('FN-33 one visitor is answered 429 after 10 checkouts in 10 minutes', async () => {
    stubStripe();
    const statuses = [];
    for (let attempt = 0; attempt < 11; attempt += 1) {
      const request = jsonRequest('https://example.test/api/checkout', { items: [{ id: 'facial-gold', quantity: 1 }], customer: CUSTOMER }, '203.0.113.7');
      statuses.push((await checkoutPost({ request, env: CHECKOUT_ENV })).status);
    }
    expect(statuses.slice(0, 10).every((status) => status === 200)).toBe(true);
    expect(statuses[10]).toBe(429);
  });

  test('FN-32 one treatment beside several products goes to Stripe', async () => {
    const calls = stubStripe();
    const response = await checkoutPost({
      request: checkoutRequest([{ id: 'facial-gold', quantity: 1 }, { id: 'flawless-glow-extra-brightening-serum', quantity: 3 }]),
      env: CHECKOUT_ENV
    });
    expect(response.status).toBe(200);
    expect(calls).toHaveLength(1);
  });
});
