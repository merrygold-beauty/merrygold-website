// The booking rules and the time maths behind the free start times the
// checkout offers. Pure functions, no fetch or env, shared by
// functions/api/availability.js, functions/api/checkout.js,
// functions/api/stripe-webhook.js and the checkout form.
//
// One practitioner (Olu), so any two bookings must not overlap. Rules decided
// by Julius on 2026-10-06: 15 minute steps, a 15 minute gap between bookings,
// no minimum notice, Treatwell's opening hours, up to 90 days ahead.

export const BOOKING_TIME_ZONE = 'Europe/London';
export const STEP_MINUTES = 15;
export const GAP_MINUTES = 15;
export const DAYS_AHEAD = 90;

// Treatwell's hours, in minutes from midnight: Monday to Saturday 10:00 to
// 20:00, Sunday 10:00 to 18:00. A treatment must finish by closing.
const WEEKDAY_HOURS = { open: 10 * 60, close: 20 * 60 };
const SUNDAY_HOURS = { open: 10 * 60, close: 18 * 60 };

const MINUTE_MS = 60 * 1000;
const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

const londonClock = new Intl.DateTimeFormat('en-GB', {
  timeZone: BOOKING_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23'
});

function londonParts(instantMs) {
  const parts = Object.fromEntries(londonClock.formatToParts(new Date(instantMs)).map((part) => [part.type, part.value]));
  return { year: Number(parts.year), month: Number(parts.month), day: Number(parts.day), hour: Number(parts.hour), minute: Number(parts.minute) };
}

// How far London's wall clock is ahead of UTC at an instant: 0 in winter,
// one hour in summer. Worked out from the time zone database, so the clock
// changes (2026-10-25 back, 2027-03-28 forward) need no table here.
function londonOffsetMs(instantMs) {
  const wholeMinute = Math.floor(instantMs / MINUTE_MS) * MINUTE_MS;
  const p = londonParts(wholeMinute);
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute) - wholeMinute;
}

function parseDate(dateString) {
  const match = DATE_PATTERN.exec(dateString || '');
  if (!match) return null;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(Date.UTC(year, month - 1, day));
  // Rejects dates that roll over, such as 2026-02-30.
  if (date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return { year, month, day };
}

// "YYYY-MM-DD" in London for an instant: today's date at the clinic.
export function londonDateString(instantMs) {
  const p = londonParts(instantMs);
  return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`;
}

export function addDays(dateString, days) {
  const { year, month, day } = parseDate(dateString);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

// The instant a London wall-clock time happens. The offset is looked up
// twice because the first guess can sit on the other side of a clock change;
// opening hours never touch the 01:00 to 02:00 hour that changes, so the
// second lookup is always right.
export function londonTimeToInstant(dateString, minutesFromMidnight) {
  const { year, month, day } = parseDate(dateString);
  const wallClockAsUtc = Date.UTC(year, month - 1, day, 0, minutesFromMidnight);
  const firstGuess = wallClockAsUtc - londonOffsetMs(wallClockAsUtc);
  return wallClockAsUtc - londonOffsetMs(firstGuess);
}

export function openingHours(dateString) {
  const { year, month, day } = parseDate(dateString);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay() === 0 ? SUNDAY_HOURS : WEEKDAY_HOURS;
}

// A real date from today to DAYS_AHEAD days ahead, both in London.
export function isBookableDate(dateString, nowMs) {
  if (!parseDate(dateString)) return false;
  const today = londonDateString(nowMs);
  return dateString >= today && dateString <= addDays(today, DAYS_AHEAD);
}

export function parseTime(timeString) {
  const match = TIME_PATTERN.exec(timeString || '');
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
}

export function formatTime(minutesFromMidnight) {
  return `${String(Math.floor(minutesFromMidnight / 60)).padStart(2, '0')}:${String(minutesFromMidnight % 60).padStart(2, '0')}`;
}

export function appointmentInterval(dateString, timeString, durationMinutes) {
  const startMs = londonTimeToInstant(dateString, parseTime(timeString));
  return { startMs, endMs: startMs + durationMinutes * MINUTE_MS };
}

// True when the booking, widened by the gap on both sides, touches anything
// already taken. The gap is applied on both sides because the calendar's own
// events (a Treatwell booking added by hand, say) carry no gap of their own.
export function clashesWithBusy({ startMs, endMs }, busy) {
  const gapMs = GAP_MINUTES * MINUTE_MS;
  return busy.some((block) => block.startMs < endMs + gapMs && block.endMs > startMs - gapMs);
}

// The window to ask the calendar about for one day: opening hours widened by
// the gap, so a booking that ends just before opening still counts.
export function dayWindow(dateString) {
  const { open, close } = openingHours(dateString);
  return {
    startMs: londonTimeToInstant(dateString, open - GAP_MINUTES),
    endMs: londonTimeToInstant(dateString, close + GAP_MINUTES)
  };
}

// Every "HH:MM" on the day where a treatment of durationMinutes fits inside
// opening hours, has not already started, and clears every busy block by the
// gap. busy is a list of { startMs, endMs }.
export function freeStartTimes({ date, durationMinutes, busy, nowMs }) {
  const { open, close } = openingHours(date);
  const times = [];
  for (let start = open; start + durationMinutes <= close; start += STEP_MINUTES) {
    const time = formatTime(start);
    const interval = appointmentInterval(date, time, durationMinutes);
    if (interval.startMs < nowMs) continue;
    if (clashesWithBusy(interval, busy)) continue;
    times.push(time);
  }
  return times;
}
