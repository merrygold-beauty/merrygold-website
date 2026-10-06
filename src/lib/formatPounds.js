// "£60" for whole pounds and "£4.90" otherwise, the way the clinic writes
// its prices. Rounded to pence first, because bag totals are sums of
// decimals (4.9 * 3 is 14.700000000000001).
export function formatPounds(pounds) {
  const rounded = Math.round(pounds * 100) / 100;
  return Number.isInteger(rounded) ? `£${rounded}` : `£${rounded.toFixed(2)}`;
}
