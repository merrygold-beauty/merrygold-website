// Which shop products the clinic has marked sold out, kept in the Cloudflare
// KV namespace bound as SHOP_SETTINGS (merrygold-shop-settings for
// production, merrygold-shop-settings-preview for previews, so a test on a
// preview never changes the live shop). Olu switches it from the orders page;
// functions/api/stock.js serves it, and checkout.js refuses a sold out product.
//
// One key per product, never one shared list: KV can take up to a minute to
// show a write everywhere, and a shared list rewritten from a stale read
// would quietly undo a switch made moments earlier.

import catalogueIndex from '../data/catalogueIndex.js';

const PRODUCT_IDS = catalogueIndex.filter((entry) => entry.kind === 'product').map((entry) => entry.id);

function soldOutKey(productId) {
  return `sold-out:${productId}`;
}

// The ids marked sold out. With no store bound (local development, tests)
// nothing is sold out.
export async function readSoldOut(env) {
  if (!env.SHOP_SETTINGS) return [];
  const flags = await Promise.all(PRODUCT_IDS.map((id) => env.SHOP_SETTINGS.get(soldOutKey(id))));
  return PRODUCT_IDS.filter((id, index) => flags[index] === 'yes');
}

export async function setSoldOut(env, productId, soldOut) {
  if (soldOut) await env.SHOP_SETTINGS.put(soldOutKey(productId), 'yes');
  else await env.SHOP_SETTINGS.delete(soldOutKey(productId));
}
