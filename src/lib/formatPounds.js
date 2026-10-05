// "£60" for whole pounds and "£4.90" otherwise, the way the clinic writes
// its prices.
export function formatPounds(pounds) {
  return Number.isInteger(pounds) ? `£${pounds}` : `£${pounds.toFixed(2)}`;
}
