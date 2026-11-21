// The clinic's busy times as an iCalendar feed, for Treatwell to read (Olu's
// Treatwell profile, External calendar). Treatwell reads one calendar address
// and has no Google or Fresha link, so this feed gives it the website's and
// Fresha's bookings in one place. It carries start and end times only: no
// names, phone numbers or notes ever leave the clinic's calendar this way.
// Served by functions/api/busy-feed/[file].js.

import { eventIdFor } from './googleCalendar.js';

// Overlapping or touching blocks become one, so Treatwell sees one busy time
// where Fresha and the website both hold the same slot.
export function mergeBlocks(blocks) {
  const sorted = [...blocks].sort((a, b) => a.startMs - b.startMs);
  const merged = [];
  for (const block of sorted) {
    const last = merged[merged.length - 1];
    if (last && block.startMs <= last.endMs) last.endMs = Math.max(last.endMs, block.endMs);
    else merged.push({ ...block });
  }
  return merged;
}

// 2026-11-27T12:00:00.000Z becomes 20261127T120000Z, the UTC form Google's
// own calendar feeds use.
function icsTime(ms) {
  return new Date(ms).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

// The same block always gets the same UID, so a calendar reading the feed
// again sees the same event, not a new one.
async function blockUid(block) {
  const hash = await eventIdFor(`${block.startMs}-${block.endMs}`);
  return `${hash.slice(0, 32)}@merrygoldbeautyclinics.com`;
}

// iCalendar requires CRLF line endings.
export async function busyFeedIcs(blocks, nowMs) {
  const stamp = icsTime(nowMs);
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//MerryGold Beauty Clinic//Busy times//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:MerryGold busy times'
  ];
  for (const block of mergeBlocks(blocks)) {
    lines.push(
      'BEGIN:VEVENT',
      `UID:${await blockUid(block)}`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${icsTime(block.startMs)}`,
      `DTEND:${icsTime(block.endMs)}`,
      'SUMMARY:Busy',
      'STATUS:CONFIRMED',
      'TRANSP:OPAQUE',
      'END:VEVENT'
    );
  }
  lines.push('END:VCALENDAR');
  return `${lines.join('\r\n')}\r\n`;
}
