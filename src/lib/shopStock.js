// Which shop products the clinic has marked sold out, kept in the Cloudflare
// KV namespace bound as SHOP_SETTINGS (merrygold-shop-settings for
// production, merrygold-shop-settings-preview for previews, so a test on a
// preview never changes the live shop). Olu switches it from the orders page;
// functions/api/stock.js serves it, and checkout.js refuses a sold out product.

const SOLD_OUT_KEY = 'sold-out-products';

// The ids marked sold out. With no store bound (local development, tests)
// nothing is sold out.
export async function readSoldOut(env) {
  if (!env.SHOP_SETTINGS) return [];
  const saved = await env.SHOP_SETTINGS.get(SOLD_OUT_KEY, 'json');
  return Array.isArray(saved) ? saved : [];
}

// Returns the list as saved.
export async function setSoldOut(env, productId, soldOut) {
  const current = new Set(await readSoldOut(env));
  if (soldOut) current.add(productId);
  else current.delete(productId);
  const ids = [...current].sort();
  await env.SHOP_SETTINGS.put(SOLD_OUT_KEY, JSON.stringify(ids));
  return ids;
}
