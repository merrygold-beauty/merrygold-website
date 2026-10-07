// Cloudflare Pages Function: /api/stock
//
// GET (public): { soldOut: [product ids] }, read by the shop's product cards
// and pop-up so a sold out product cannot be added (src/hooks/useSoldOutProducts.js).
// POST (staff, dashboard password) { id, soldOut }: switches one product,
// from the Shop stock list on the orders page.

import { jsonResponse, unavailableResponse } from '../../src/lib/functionsShared.js';
import { isDashboardAuthorized, wrongPasswordResponse } from '../../src/lib/dashboardAuth.js';
import { catalogueById } from '../../src/lib/catalogueById.js';
import { readSoldOut, setSoldOut } from '../../src/lib/shopStock.js';

export async function onRequestGet(context) {
  let soldOut = [];
  try {
    soldOut = await readSoldOut(context.env);
  } catch (err) {
    // Showing everything as available is the safe failure here: checkout
    // reads the list again and refuses a sold out product itself.
    console.error('Sold out list could not be read:', err.message);
  }
  return jsonResponse({ soldOut }, 200, { 'Cache-Control': 'no-store' });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  if (!env.ORDERS_DASHBOARD_PASSWORD || !env.SHOP_SETTINGS) return unavailableResponse();
  if (!isDashboardAuthorized(request, env)) return wrongPasswordResponse();

  const body = await request.json().catch(() => ({}));
  if (catalogueById.get(body.id)?.kind !== 'product' || typeof body.soldOut !== 'boolean') {
    return jsonResponse({ error: 'That product was not found.' }, 400);
  }
  try {
    return jsonResponse({ soldOut: await setSoldOut(env, body.id, body.soldOut) });
  } catch (err) {
    console.error('Sold out list could not be saved:', err.message);
    return jsonResponse({ error: 'The change could not be saved. Please try again.' }, 502);
  }
}
