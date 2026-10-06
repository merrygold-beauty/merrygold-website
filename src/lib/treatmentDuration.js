// Turns a treatment's duration text, as the menu shows it, into the minutes a
// booking blocks in the clinic calendar. Used by scripts/build-catalogue-index.mjs
// at build time, so the Functions only ever read a number.
//
// A range ("45 to 60 mins", "1 hour 30 mins to 2 hours 30 mins") or a choice
// ("20, 30 or 45 mins") blocks its longest option, so a booking never runs
// into the next one.

// Treatments listed "On enquiry" (Traditional Makeup I and II) block three
// hours. Julius chose this on 2026-10-06; Olu can shorten the event in her
// calendar once she has spoken to the customer.
export const ON_ENQUIRY_MINUTES = 180;

// Returns null for text it cannot read, so the build can refuse it.
export function durationMinutes(durationText) {
  if (!durationText) return null;
  const text = durationText.trim().toLowerCase();
  if (text === 'on enquiry') return ON_ENQUIRY_MINUTES;

  const longestOption = text.split(/\s+(?:to|or)\s+|,\s*/).pop();
  const hours = longestOption.match(/(\d+)\s*hours?\b/);
  const minutes = longestOption.match(/(\d+)\s*mins?\b/);
  if (!hours && !minutes) return null;
  return (hours ? Number(hours[1]) * 60 : 0) + (minutes ? Number(minutes[1]) : 0);
}
