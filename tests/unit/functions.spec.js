import { test, expect } from '@playwright/test';
import { onRequestPost as enquiryPost } from '../../functions/api/enquiry.js';
import { onRequestPost as webhookPost } from '../../functions/api/stripe-webhook.js';
import { onRequestGet as ordersGet } from '../../functions/api/orders.js';
import { onRequestPost as checkoutPost } from '../../functions/api/checkout.js';
import { onRequestGet as availabilityGet } from '../../functions/api/availability.js';
import { onRequestGet as bookingTimesGet } from '../../functions/api/booking-times.js';
import { onRequestPost as bookingMovePost } from '../../functions/api/booking-move.js';
import { onRequestPost as orderCancelPost } from '../../functions/api/order-cancel.js';
import { onRequestPost as orderSentPost } from '../../functions/api/order-sent.js';
import { onRequestGet as stockGet, onRequestPost as stockPost } from '../../functions/api/stock.js';
import { addDays, londonDateString, londonTimeToInstant } from '../../src/lib/bookingSlots.js';

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

// A week ahead, so it is always inside the 90 day booking window, and 12:00,
// which every day's opening hours include.
const BOOKING_DATE = addDays(londonDateString(Date.now()), 7);
const BOOKING_TIME = '12:00';
const CALENDAR_ID = 'clinic@example.com';

function londonIso(time) {
  const [hours, minutes] = time.split(':').map(Number);
  return new Date(londonTimeToInstant(BOOKING_DATE, hours * 60 + minutes)).toISOString();
}

// A throwaway service account: a real RSA key, so googleCalendar.js signs its
// token request exactly as it does in production.
let calendarEnv;
test.beforeAll(async () => {
  const { privateKey } = await crypto.subtle.generateKey(
    { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
    true,
    ['sign', 'verify']
  );
  const pkcs8 = Buffer.from(await crypto.subtle.exportKey('pkcs8', privateKey)).toString('base64');
  const serviceAccount = { client_email: 'bookings@example.iam.gserviceaccount.com', private_key: `-----BEGIN PRIVATE KEY-----
${pkcs8}
-----END PRIVATE KEY-----
` };
  calendarEnv = { GOOGLE_SERVICE_ACCOUNT_JSON: JSON.stringify(serviceAccount), BOOKING_CALENDAR_ID: CALENDAR_ID };
});

// Stands in for Google (token, freeBusy, event insert), Stripe (open sessions,
// new session, line items) and Resend. Records every call.
function stubServices({ busy = [], openSessions = [], freeBusyStatus = 200, insertStatus = 200, lineItems = [] } = {}) {
  const calls = [];
  globalThis.fetch = async (url, init = {}) => {
    const href = String(url);
    calls.push({ url: href, init });
    const json = (body, status = 200) => new Response(JSON.stringify(body), { status });
    if (href.startsWith('https://oauth2.googleapis.com/token')) return json({ access_token: 'google-token', expires_in: 3600 });
    if (href.endsWith('/freeBusy')) {
      return freeBusyStatus === 200 ? json({ calendars: { [CALENDAR_ID]: { busy } } }) : json({ error: { message: 'backend error' } }, freeBusyStatus);
    }
    if (href.includes('/events')) return json({ id: 'event' }, insertStatus);
    if (href.includes('/checkout/sessions?status=open')) return json({ data: openSessions });
    if (href.includes('/line_items')) return json({ data: lineItems });
    if (href.endsWith('/checkout/sessions')) return json({ url: 'https://checkout.stripe.test/s' });
    return json({ id: 'email_1' });
  };
  return calls;
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
    expect(await response.json()).toEqual({ received: true, emailed: true, customerEmailed: true, calendar: null });
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
    expect(await response.json()).toEqual({ received: true, emailed: true, customerEmailed: false, calendar: null });
  });

  test('FN-13 email not configured answers 200 with emailed:false and no Stripe call', async () => {
    const rawBody = JSON.stringify(paidSessionEvent);
    const signature = await signStripePayload(WEBHOOK_SECRET, rawBody);
    let fetchCalled = false;
    globalThis.fetch = async () => { fetchCalled = true; return new Response('{}', { status: 200 }); };

    const request = new Request('https://example.test/api/stripe-webhook', { method: 'POST', headers: { 'Stripe-Signature': signature }, body: rawBody });
    const response = await webhookPost({ request, env: { STRIPE_WEBHOOK_SECRET: WEBHOOK_SECRET, STRIPE_SECRET_KEY: 'sk_test_123' } });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ received: true, emailed: false, calendar: null });
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
          metadata: { customer_name: 'A B', phone: '07700000000', appointment_date: '2026-10-01', appointment_time: '11:30' },
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
    expect(data.orders[0]).toMatchObject({ id: 'cs_1', customerName: 'A B', amountTotal: 5000, reference: 'pi_1', appointmentTime: '11:30' });
    expect(data.hasMore).toBe(true);
    expect(data.nextCursor).toBe('cs_2');
  });
});

test.describe('POST /api/checkout', () => {
  const CHECKOUT_ENV = { STRIPE_SECRET_KEY: 'sk_test_x' };
  const CUSTOMER = { name: 'Jane Doe', email: 'jane@example.com', phone: '07700 900123' };

  function checkoutRequest(items) {
    return jsonRequest('https://example.test/api/checkout', { items, customer: CUSTOMER, booking: { date: BOOKING_DATE, time: BOOKING_TIME } });
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
      const request = jsonRequest('https://example.test/api/checkout', { items: [{ id: 'facial-gold', quantity: 1 }], customer: CUSTOMER, booking: { date: BOOKING_DATE, time: BOOKING_TIME } }, '203.0.113.7');
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

test.describe('GET /api/availability', () => {
  function availabilityRequest(params) {
    const query = new URLSearchParams({ treatment: 'facial-gold', date: BOOKING_DATE, ...params });
    return new Request(`https://example.test/api/availability?${query}`, { headers: { 'CF-Connecting-IP': `198.51.100.${nextClientNumber++ % 250}` } });
  }
  const env = () => ({ STRIPE_SECRET_KEY: 'sk_test_x', ...calendarEnv });

  test('AV-01 answers 503 when the calendar is not configured', async () => {
    const response = await availabilityGet({ request: availabilityRequest({}), env: { STRIPE_SECRET_KEY: 'sk_test_x' } });
    expect(response.status).toBe(503);
  });

  test('AV-02 a product or unknown id is refused with 400', async () => {
    stubServices();
    for (const treatment of ['flawless-glow-extra-brightening-serum', 'no-such-treatment']) {
      const response = await availabilityGet({ request: availabilityRequest({ treatment }), env: env() });
      expect(response.status).toBe(400);
    }
  });

  test('AV-03 a date more than 90 days ahead is refused with 400', async () => {
    stubServices();
    const date = addDays(londonDateString(Date.now()), 91);
    const response = await availabilityGet({ request: availabilityRequest({ date }), env: env() });
    expect(response.status).toBe(400);
  });

  test('AV-04 lists only start times clear of the calendar and of other customers holds, never the busy blocks', async () => {
    stubServices({
      busy: [{ start: londonIso('12:00'), end: londonIso('13:00') }],
      openSessions: [
        { metadata: { appointment_date: BOOKING_DATE, appointment_time: '15:00', appointment_minutes: '30', holder_key: 'someone-else-123' } },
        { metadata: { appointment_date: BOOKING_DATE, appointment_time: '16:30', appointment_minutes: '30', holder_key: 'this-visitor-123' } }
      ]
    });
    const response = await availabilityGet({ request: availabilityRequest({ holder: 'this-visitor-123' }), env: env() });
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(Object.keys(data)).toEqual(['times']);
    expect(data.times).toContain('10:00');
    for (const taken of ['11:00', '12:00', '13:00', '14:00', '15:00']) expect(data.times).not.toContain(taken);
    expect(data.times).toContain('13:15');
    expect(data.times).toContain('16:30');
  });

  test('AV-05 a calendar failure answers 502 with a message to call', async () => {
    stubServices({ freeBusyStatus: 500 });
    const response = await availabilityGet({ request: availabilityRequest({}), env: env() });
    expect(response.status).toBe(502);
    expect((await response.json()).error).toMatch(/call us/);
  });
});

test.describe('POST /api/checkout with a booking time', () => {
  const CUSTOMER = { name: 'Jane Doe', email: 'jane@example.com', phone: '07700 900123' };
  const env = () => ({ STRIPE_SECRET_KEY: 'sk_test_x', ...calendarEnv });
  const bookingRequest = (booking) =>
    jsonRequest('https://example.test/api/checkout', { items: [{ id: 'facial-gold', quantity: 1 }], customer: CUSTOMER, booking });
  const sessionCreates = (calls) => calls.filter((call) => call.url.endsWith('/checkout/sessions'));

  test('FN-34 a treatment with no time, or a time outside opening hours or the steps, is refused with 400', async () => {
    const calls = stubServices();
    for (const booking of [{ date: BOOKING_DATE }, { date: BOOKING_DATE, time: '07:00' }, { date: BOOKING_DATE, time: '12:05' }]) {
      const response = await checkoutPost({ request: bookingRequest(booking), env: env() });
      expect(response.status).toBe(400);
    }
    expect(sessionCreates(calls)).toHaveLength(0);
  });

  test('FN-35 a time taken in the calendar answers 409 and starts no payment', async () => {
    const calls = stubServices({ busy: [{ start: londonIso('12:30'), end: londonIso('13:00') }] });
    const response = await checkoutPost({ request: bookingRequest({ date: BOOKING_DATE, time: BOOKING_TIME }), env: env() });
    expect(response.status).toBe(409);
    expect((await response.json()).error).toBe('That time has just been taken. Please choose another.');
    expect(sessionCreates(calls)).toHaveLength(0);
  });

  test('FN-36 a free time goes to Stripe in the metadata, with a 31 minute expiry as the hold', async () => {
    const calls = stubServices();
    const before = Math.floor(Date.now() / 1000);
    const response = await checkoutPost({
      request: bookingRequest({ date: BOOKING_DATE, time: BOOKING_TIME, holder: 'this-visitor-123' }),
      env: env()
    });
    expect(response.status).toBe(200);
    const [create] = sessionCreates(calls);
    const form = new URLSearchParams(create.init.body);
    expect(form.get('metadata[appointment_date]')).toBe(BOOKING_DATE);
    expect(form.get('metadata[appointment_time]')).toBe(BOOKING_TIME);
    expect(form.get('metadata[appointment_minutes]')).toBe('60');
    expect(form.get('metadata[appointment_treatment]')).toBe('Gold Facial');
    expect(form.get('metadata[holder_key]')).toBe('this-visitor-123');
    expect(Number(form.get('expires_at')) - before).toBeGreaterThanOrEqual(31 * 60);
  });

  test('FN-37 a calendar that cannot be read does not stop the payment', async () => {
    const calls = stubServices({ freeBusyStatus: 500 });
    const response = await checkoutPost({ request: bookingRequest({ date: BOOKING_DATE, time: BOOKING_TIME }), env: env() });
    expect(response.status).toBe(200);
    expect(sessionCreates(calls)).toHaveLength(1);
  });

  test('FN-38 a product order has no appointment and keeps the default Stripe expiry', async () => {
    const calls = stubServices();
    const request = jsonRequest('https://example.test/api/checkout', {
      items: [{ id: 'flawless-glow-extra-brightening-serum', quantity: 1 }],
      customer: CUSTOMER,
      delivery: { address: '1 High Street', postcode: 'IG11 7AA' }
    });
    const response = await checkoutPost({ request, env: env() });
    expect(response.status).toBe(200);
    const form = new URLSearchParams(sessionCreates(calls)[0].init.body);
    expect(form.get('expires_at')).toBeNull();
    expect(form.get('metadata[appointment_time]')).toBe('');
  });
});

test.describe('POST /api/stripe-webhook with a booking time', () => {
  const WEBHOOK_SECRET = 'whsec_test_secret';
  const env = () => ({ STRIPE_WEBHOOK_SECRET: WEBHOOK_SECRET, STRIPE_SECRET_KEY: 'sk_test_123', ...NOTIFY_ENV, ...calendarEnv });
  const LINE_ITEMS = [{ description: 'Gold Facial', quantity: 1, amount_total: 20000 }];

  async function deliverBooking() {
    const rawBody = JSON.stringify({
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_456',
          payment_status: 'paid',
          payment_intent: 'pi_test_456',
          livemode: false,
          created: 1700000000,
          amount_total: 20000,
          customer_details: { email: 'client@example.com', name: 'Client Name' },
          metadata: {
            customer_name: 'Client Name',
            phone: '07700 900123',
            appointment_treatment: 'Gold Facial',
            appointment_date: BOOKING_DATE,
            appointment_time: '14:30',
            appointment_minutes: '60',
            notes: 'TEST, ignore'
          }
        }
      }
    });
    const signature = await signStripePayload(WEBHOOK_SECRET, rawBody);
    const request = new Request('https://example.test/api/stripe-webhook', { method: 'POST', headers: { 'Stripe-Signature': signature }, body: rawBody });
    return webhookPost({ request, env: env() });
  }

  const eventInsert = (calls) => calls.find((call) => call.url.includes('/events'));
  const emails = (calls) => calls.filter((call) => call.url === 'https://api.resend.com/emails').map((call) => JSON.parse(call.init.body));

  test('FN-40 a paid booking is added to the calendar at its time and both emails show the time', async () => {
    const calls = stubServices({ lineItems: LINE_ITEMS });
    const response = await deliverBooking();
    expect(response.status).toBe(200);
    expect((await response.json()).calendar).toBe('added');

    const event = JSON.parse(eventInsert(calls).init.body);
    expect(event.id).toMatch(/^[0-9a-f]{64}$/);
    expect(event.summary).toBe('Gold Facial: Client Name');
    expect(event.start.dateTime).toBe(londonIso('14:30'));
    expect(Date.parse(event.end.dateTime) - Date.parse(event.start.dateTime)).toBe(60 * 60 * 1000);
    expect(event.description).toContain('07700 900123');

    const [clinic, customer] = emails(calls);
    expect(clinic.text).toMatch(/Appointment: \w+ \d{1,2} \w+ \d{4} at 14:30/);
    expect(clinic.text).not.toContain('Calendar:');
    expect(customer.text).toMatch(/Appointment: \w+ \d{1,2} \w+ \d{4} at 14:30/);
    expect(customer.html).toContain('at 14:30');
  });

  test('FN-41 a booking that overlaps the calendar is still added, marked CLASH, and flagged to the clinic', async () => {
    const calls = stubServices({ lineItems: LINE_ITEMS, busy: [{ start: londonIso('15:00'), end: londonIso('16:00') }] });
    const response = await deliverBooking();
    expect((await response.json()).calendar).toBe('clash');
    expect(JSON.parse(eventInsert(calls).init.body).summary.startsWith('CLASH, ')).toBe(true);
    expect(emails(calls)[0].text).toContain('Calendar: this time overlaps something already in the calendar');
  });

  test('FN-42 a calendar failure still emails the order with 200 and asks the clinic to add it by hand', async () => {
    const calls = stubServices({ lineItems: LINE_ITEMS, freeBusyStatus: 500 });
    const response = await deliverBooking();
    expect(response.status).toBe(200);
    expect((await response.json()).calendar).toBe('failed');
    expect(emails(calls)[0].text).toContain('Please add it by hand.');
  });

  test('FN-43 a retried delivery finds its event already there and reports no clash', async () => {
    const calls = stubServices({ lineItems: LINE_ITEMS, insertStatus: 409, busy: [{ start: londonIso('14:30'), end: londonIso('15:30') }] });
    const response = await deliverBooking();
    expect((await response.json()).calendar).toBe('added');
    expect(emails(calls)[0].text).not.toContain('Calendar:');
  });
});

test.describe('Order management (orders page Move, Cancel and Mark as sent)', () => {
  const PASSWORD = 'letmein';
  const env = () => ({ ORDERS_DASHBOARD_PASSWORD: PASSWORD, STRIPE_SECRET_KEY: 'sk_test_x', ...calendarEnv, ...NOTIFY_ENV });
  const APPOINTMENT = {
    customer_name: 'Client Name', phone: '07700 900123', appointment_treatment: 'Gold Facial',
    appointment_date: BOOKING_DATE, appointment_time: '12:00', appointment_minutes: '60'
  };

  function paidBooking(intentMetadata = {}) {
    return {
      id: 'cs_test_m1', payment_status: 'paid', livemode: false, created: 1700000000, amount_total: 20000, currency: 'gbp',
      customer_details: { email: 'client@example.com' }, metadata: APPOINTMENT,
      payment_intent: { id: 'pi_test_m1', metadata: { ...APPOINTMENT, ...intentMetadata } },
      line_items: { data: [{ description: 'Gold Facial', quantity: 1, amount_total: 20000 }] }
    };
  }

  // Google (token, event read, freeBusy, move, delete), Stripe (session read,
  // refund, payment update) and Resend. The booking's own event sits at 12:00.
  function stubManagement({ session = paidBooking(), busy, eventExists = true, refundResponse } = {}) {
    const calls = [];
    globalThis.fetch = async (url, init = {}) => {
      const href = String(url);
      const method = init.method || 'GET';
      calls.push({ href, method, init });
      const json = (body, status = 200) => new Response(JSON.stringify(body), { status });
      if (href.startsWith('https://oauth2.googleapis.com/token')) return json({ access_token: 'google-token', expires_in: 3600 });
      if (href.endsWith('/freeBusy')) return json({ calendars: { [CALENDAR_ID]: { busy: busy || [{ start: londonIso('12:00'), end: londonIso('13:00') }] } } });
      if (href.includes('/events/')) {
        if (method === 'GET') {
          return eventExists
            ? json({ status: 'confirmed', start: { dateTime: londonIso('12:00') }, end: { dateTime: londonIso('13:00') } })
            : json({ error: { message: 'Not Found' } }, 404);
        }
        return method === 'DELETE' ? new Response(null, { status: 204 }) : json({ id: 'event' });
      }
      if (href.includes('/checkout/sessions?status=open')) return json({ data: [] });
      if (href.includes('/checkout/sessions/cs_test_m1')) return json(session);
      if (href.endsWith('/refunds')) return refundResponse ? refundResponse() : json({ id: 're_1', status: 'succeeded' });
      if (href.includes('/payment_intents/pi_test_m1')) return json({ id: 'pi_test_m1' });
      return json({ id: 'email_1' });
    };
    return calls;
  }

  function staffRequest(path, body, password = PASSWORD) {
    return new Request(`https://example.test${path}`, {
      method: body ? 'POST' : 'GET',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${password}`, 'CF-Connecting-IP': `198.51.100.${nextClientNumber++ % 250}` },
      body: body ? JSON.stringify(body) : undefined
    });
  }

  const emailsIn = (calls) => calls.filter((call) => call.href === 'https://api.resend.com/emails').map((call) => JSON.parse(call.init.body));
  const paymentUpdate = (calls) => {
    const call = calls.find((c) => c.href.includes('/payment_intents/pi_test_m1') && c.method === 'POST');
    return call ? new URLSearchParams(call.init.body) : null;
  };

  test('MB-01 a wrong password is refused with 401 and nothing is read', async () => {
    const calls = stubManagement();
    const response = await orderCancelPost({ request: staffRequest('/api/order-cancel', { session: 'cs_test_m1', refund: true }, 'nope'), env: env() });
    expect(response.status).toBe(401);
    expect(calls).toHaveLength(0);
  });

  test('MB-02 move times count the booking\'s own slot as free', async () => {
    stubManagement();
    const response = await bookingTimesGet({ request: staffRequest(`/api/booking-times?session=cs_test_m1&date=${BOOKING_DATE}`), env: env() });
    expect(response.status).toBe(200);
    const { times } = await response.json();
    expect(times).toContain('12:00');
    expect(times).toContain('12:15');
  });

  test('MB-03 a move patches the event, records the new time on the payment and emails the customer', async () => {
    const calls = stubManagement();
    const response = await bookingMovePost({ request: staffRequest('/api/booking-move', { session: 'cs_test_m1', date: BOOKING_DATE, time: '15:00' }), env: env() });
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.order.appointmentTime).toBe('15:00');
    expect(data.order.movedFrom).toBe(`${BOOKING_DATE} 12:00`);
    expect(data.customerEmailed).toBe(true);

    const patch = calls.find((call) => call.method === 'PATCH');
    expect(JSON.parse(patch.init.body).start.dateTime).toBe(londonIso('15:00'));
    expect(paymentUpdate(calls).get('metadata[appointment_time]')).toBe('15:00');
    const [email] = emailsIn(calls);
    expect(email.subject).toBe('Your MerryGold booking has moved');
    expect(email.text).toContain('at 15:00');
    expect(email.text).toContain('previously booked for');
  });

  test('MB-04 a move to a taken time is refused with 409 and nothing changes', async () => {
    const calls = stubManagement({ busy: [{ start: londonIso('12:00'), end: londonIso('13:00') }, { start: londonIso('15:00'), end: londonIso('16:00') }] });
    const response = await bookingMovePost({ request: staffRequest('/api/booking-move', { session: 'cs_test_m1', date: BOOKING_DATE, time: '15:00' }), env: env() });
    expect(response.status).toBe(409);
    expect(calls.some((call) => call.method === 'PATCH')).toBe(false);
    expect(paymentUpdate(calls)).toBeNull();
  });

  test('MB-05 a booking no longer in the calendar cannot be moved', async () => {
    stubManagement({ eventExists: false });
    const response = await bookingMovePost({ request: staffRequest('/api/booking-move', { session: 'cs_test_m1', date: BOOKING_DATE, time: '15:00' }), env: env() });
    expect(response.status).toBe(409);
    expect((await response.json()).error).toMatch(/not in the calendar/);
  });

  test('MB-06 a cancel with refund refunds first, then frees the calendar, records it and emails the customer', async () => {
    const calls = stubManagement();
    const response = await orderCancelPost({ request: staffRequest('/api/order-cancel', { session: 'cs_test_m1', refund: true }), env: env() });
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.order.cancelled).toBe(true);
    expect(data.order.refunded).toBe(true);
    expect(data.order.canMove).toBe(false);
    expect(data.order.canCancel).toBe(false);
    expect(data).toMatchObject({ calendarFreed: true, recordUpdated: true, customerEmailed: true });

    const refundIndex = calls.findIndex((call) => call.href.endsWith('/refunds'));
    const deleteIndex = calls.findIndex((call) => call.method === 'DELETE');
    expect(refundIndex).toBeGreaterThan(-1);
    expect(deleteIndex).toBeGreaterThan(refundIndex);
    expect(calls[refundIndex].init.headers['Idempotency-Key']).toBe('order-cancel-refund-cs_test_m1');
    expect(paymentUpdate(calls).get('metadata[order_status]')).toBe('cancelled');
    expect(paymentUpdate(calls).get('metadata[refund]')).toBe('full');
    const [email] = emailsIn(calls);
    expect(email.subject).toBe('Your MerryGold booking is cancelled');
    expect(email.text).toContain('We have refunded £200.00');
  });

  test('MB-07 a refund Stripe refuses stops the cancel before the calendar is touched', async () => {
    const calls = stubManagement({ refundResponse: () => new Response(JSON.stringify({ error: { message: 'insufficient balance' } }), { status: 400 }) });
    const response = await orderCancelPost({ request: staffRequest('/api/order-cancel', { session: 'cs_test_m1', refund: true }), env: env() });
    expect(response.status).toBe(502);
    expect(calls.some((call) => call.method === 'DELETE')).toBe(false);
    expect(paymentUpdate(calls)).toBeNull();
    expect(emailsIn(calls)).toHaveLength(0);
  });

  test('MB-08 a payment already refunded in Stripe counts as refunded', async () => {
    stubManagement({ refundResponse: () => new Response(JSON.stringify({ error: { code: 'charge_already_refunded', message: 'already' } }), { status: 400 }) });
    const response = await orderCancelPost({ request: staffRequest('/api/order-cancel', { session: 'cs_test_m1', refund: true }), env: env() });
    expect(response.status).toBe(200);
  });

  test('MB-09 a cancel without refund makes no refund and says so to the customer', async () => {
    const calls = stubManagement();
    const response = await orderCancelPost({ request: staffRequest('/api/order-cancel', { session: 'cs_test_m1', refund: false }), env: env() });
    expect(response.status).toBe(200);
    expect(calls.some((call) => call.href.endsWith('/refunds'))).toBe(false);
    expect(paymentUpdate(calls).get('metadata[refund]')).toBe('none');
    expect(emailsIn(calls)[0].text).toContain('No refund has been made');
  });

  test('MB-10 an already cancelled booking is refused with 409 and no second refund', async () => {
    const calls = stubManagement({ session: paidBooking({ order_status: 'cancelled', refund: 'full' }) });
    const response = await orderCancelPost({ request: staffRequest('/api/order-cancel', { session: 'cs_test_m1', refund: true }), env: env() });
    expect(response.status).toBe(409);
    expect(calls.some((call) => call.href.endsWith('/refunds'))).toBe(false);
  });

  // A product order: a serum with a delivery address, no appointment.
  function paidProductOrder(intentMetadata = {}) {
    const metadata = { customer_name: 'Client Name', phone: '07700 900123', delivery_address: '1 High Street', delivery_postcode: 'IG11 7AA' };
    return {
      ...paidBooking(),
      metadata,
      payment_intent: { id: 'pi_test_m1', metadata: { ...metadata, ...intentMetadata } },
      line_items: { data: [{ description: 'Flawless Glow Extra Brightening Serum 100ml', quantity: 2, amount_total: 7000 }] }
    };
  }

  test('MB-12 cancelling a product order refunds it and never touches the calendar', async () => {
    const calls = stubManagement({ session: paidProductOrder() });
    const response = await orderCancelPost({ request: staffRequest('/api/order-cancel', { session: 'cs_test_m1', refund: true }), env: env() });
    expect(response.status).toBe(200);
    expect(calls.some((call) => call.href.endsWith('/refunds'))).toBe(true);
    expect(calls.some((call) => call.href.includes('googleapis.com'))).toBe(false);
    expect(emailsIn(calls)[0].subject).toBe('Your MerryGold order is cancelled');
  });

  test('MB-13 mark as sent records the date and tracking on the payment and emails what is in the parcel', async () => {
    const calls = stubManagement({ session: paidProductOrder() });
    const response = await orderSentPost({ request: staffRequest('/api/order-sent', { session: 'cs_test_m1', tracking: 'RM123456789GB' }), env: env() });
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.order.sentAt).toBeTruthy();
    expect(data.order.tracking).toBe('RM123456789GB');
    expect(data.order.canMarkSent).toBe(false);
    expect(paymentUpdate(calls).get('metadata[tracking]')).toBe('RM123456789GB');
    const [email] = emailsIn(calls);
    expect(email.subject).toBe('Your MerryGold order is on its way');
    expect(email.text).toContain('1 High Street, IG11 7AA');
    expect(email.text).toContain('Flawless Glow Extra Brightening Serum 100ml x 2');
    expect(email.text).toContain('Tracking number: RM123456789GB');
  });

  test('MB-14 an order already sent, or with nothing to post, cannot be marked as sent', async () => {
    stubManagement({ session: paidProductOrder({ sent_at: '2026-10-07T10:00:00.000Z' }) });
    const again = await orderSentPost({ request: staffRequest('/api/order-sent', { session: 'cs_test_m1' }), env: env() });
    expect(again.status).toBe(409);
    stubManagement();
    const booking = await orderSentPost({ request: staffRequest('/api/order-sent', { session: 'cs_test_m1' }), env: env() });
    expect(booking.status).toBe(409);
  });

  test('MB-11 the orders list reads a moved or cancelled booking from the payment, not the session', async () => {
    globalThis.fetch = async () => new Response(JSON.stringify({
      data: [{ ...paidBooking({ appointment_time: '15:00', moved_from: `${BOOKING_DATE} 12:00` }) }],
      has_more: false
    }), { status: 200 });
    const response = await ordersGet({ request: new Request('https://example.test/api/orders', { headers: { Authorization: `Bearer ${PASSWORD}` } }), env: env() });
    const { orders } = await response.json();
    expect(orders[0]).toMatchObject({ appointmentTime: '15:00', movedFrom: `${BOOKING_DATE} 12:00`, cancelled: false, canMove: true, canCancel: true, canMarkSent: false });
  });
});

test.describe('Shop stock (sold out products)', () => {
  // A stand-in for the SHOP_SETTINGS KV namespace.
  function memoryStore() {
    const values = new Map();
    return {
      get: async (key) => (values.has(key) ? values.get(key) : null),
      put: async (key, value) => { values.set(key, value); },
      delete: async (key) => { values.delete(key); }
    };
  }
  const SERUM = 'flawless-glow-extra-brightening-serum';
  const stockRequest = (body, password = 'letmein') => new Request('https://example.test/api/stock', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${password}` }, body: JSON.stringify(body)
  });

  test('ST-01 staff can mark a product sold out and back, and the public list follows', async () => {
    const env = { ORDERS_DASHBOARD_PASSWORD: 'letmein', SHOP_SETTINGS: memoryStore() };
    const listed = async () => (await (await stockGet({ request: new Request('https://example.test/api/stock'), env })).json()).soldOut;
    expect((await stockPost({ request: stockRequest({ id: SERUM, soldOut: true }), env })).status).toBe(200);
    expect(await listed()).toEqual([SERUM]);
    await stockPost({ request: stockRequest({ id: '3d-false-eyelashes', soldOut: true }), env });
    await stockPost({ request: stockRequest({ id: SERUM, soldOut: false }), env });
    expect(await listed()).toEqual(['3d-false-eyelashes']);
  });

  test('ST-02 a wrong password or a treatment id is refused', async () => {
    const env = { ORDERS_DASHBOARD_PASSWORD: 'letmein', SHOP_SETTINGS: memoryStore() };
    expect((await stockPost({ request: stockRequest({ id: SERUM, soldOut: true }, 'nope'), env })).status).toBe(401);
    expect((await stockPost({ request: stockRequest({ id: 'facial-gold', soldOut: true }), env })).status).toBe(400);
  });

  test('ST-03 checkout refuses a product marked sold out', async () => {
    const env = { STRIPE_SECRET_KEY: 'sk_test_x', SHOP_SETTINGS: memoryStore() };
    await env.SHOP_SETTINGS.put(`sold-out:${SERUM}`, 'yes');
    let stripeCalled = false;
    globalThis.fetch = async () => { stripeCalled = true; return new Response('{}', { status: 200 }); };
    const request = jsonRequest('https://example.test/api/checkout', {
      items: [{ id: SERUM, quantity: 1 }],
      customer: { name: 'Jane Doe', email: 'jane@example.com', phone: '07700 900123' },
      delivery: { address: '1 High Street', postcode: 'IG11 7AA' }
    });
    const response = await checkoutPost({ request, env });
    expect(response.status).toBe(400);
    expect((await response.json()).error).toMatch(/sold out/);
    expect(stripeCalled).toBe(false);
  });
});
