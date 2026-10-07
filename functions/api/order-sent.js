// Cloudflare Pages Function: POST /api/order-sent  { session, tracking }
//
// Staff only (dashboard password). Marks a product order as posted: records
// the date and any tracking number on the Stripe payment
// (src/lib/bookingRecord.js), then emails the customer that it is on its way.
// The record is the point of this, so if Stripe refuses it nothing is emailed.

import { jsonResponse } from '../../src/lib/functionsShared.js';
import { bookingMetadata, paymentIntentId, recordOnPayment, shapeOrder, withRecorded } from '../../src/lib/bookingRecord.js';
import { dashboardRequestRefusal, emailNotice, loadOrderToManage } from '../../src/lib/manageOrder.js';
import { buildSentNotice } from '../../src/lib/enquiryEmail.js';
import catalogueIndex from '../../src/data/catalogueIndex.js';

const MAX_TRACKING_LENGTH = 100;

// Stripe line items carry the name checkout gave them (the catalogue name),
// so this tells the products in a parcel apart from a treatment in the same order.
const PRODUCT_NAMES = new Set(catalogueIndex.filter((entry) => entry.kind === 'product').map((entry) => entry.name));

export async function onRequestPost(context) {
  const { request, env } = context;

  const refusal = dashboardRequestRefusal(request, env);
  if (refusal) return refusal;

  const body = await request.json().catch(() => ({}));
  const tracking = typeof body.tracking === 'string' ? body.tracking.trim() : '';
  if (tracking.length > MAX_TRACKING_LENGTH) return jsonResponse({ error: `Tracking numbers must be ${MAX_TRACKING_LENGTH} characters or fewer.` }, 400);

  const order = await loadOrderToManage(env, body.session);
  if (order.response) return order.response;
  const { session } = order;
  const metadata = bookingMetadata(session);
  if (!metadata.delivery_address) return jsonResponse({ error: 'This order has nothing to post.' }, 409);
  if (metadata.sent_at) return jsonResponse({ error: 'This order is already marked as sent.' }, 409);

  const record = { sent_at: new Date().toISOString(), tracking };
  try {
    await recordOnPayment(env, session, record);
  } catch (err) {
    console.error('Order could not be marked as sent:', session.id, err.message);
    return jsonResponse({ error: 'Stripe could not save this, so the order is not marked as sent. Please try again.' }, 502);
  }

  const notice = buildSentNotice({
    customerName: metadata.customer_name,
    items: (session.line_items?.data || [])
      .filter((line) => PRODUCT_NAMES.has(line.description))
      .map((line) => ({ name: line.description, quantity: line.quantity })),
    deliveryTo: [metadata.delivery_address, metadata.delivery_postcode].filter(Boolean).join(', '),
    tracking,
    reference: paymentIntentId(session)
  });
  const customerEmailed = await emailNotice(env, session, notice);

  return jsonResponse({ order: shapeOrder(withRecorded(session, record)), customerEmailed });
}
