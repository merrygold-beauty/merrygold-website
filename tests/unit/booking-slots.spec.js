import { test, expect } from '@playwright/test';
import { durationMinutes } from '../../src/lib/treatmentDuration.js';
import {
  addDays,
  freeStartTimes,
  isBookableDate,
  londonDateString,
  londonTimeToInstant
} from '../../src/lib/bookingSlots.js';
import catalogueIndex from '../../src/data/catalogueIndex.js';

const HOUR_MS = 60 * 60 * 1000;

test.describe('treatment durations', () => {
  const cases = [
    ['1 hour', 60],
    ['45 mins', 45],
    ['1 hour 30 mins', 90],
    ['2 hours', 120],
    ['5 mins', 5],
    ['45 to 60 mins', 60],
    ['1 hour 30 mins to 2 hours 30 mins', 150],
    ['1 hour to 2 hours', 120],
    ['20, 30 or 45 mins', 45],
    ['On enquiry', 180]
  ];
  for (const [text, minutes] of cases) {
    test(`SLT-01 "${text}" blocks ${minutes} minutes`, () => {
      expect(durationMinutes(text)).toBe(minutes);
    });
  }

  test('SLT-02 text with no length in it is refused', () => {
    expect(durationMinutes('Varies')).toBeNull();
    expect(durationMinutes('')).toBeNull();
  });

  test('SLT-03 every priced treatment in the price index has minutes', () => {
    const missing = catalogueIndex.filter((entry) => entry.kind === 'treatment' && entry.pence !== null && !entry.minutes);
    expect(missing.map((entry) => entry.id)).toEqual([]);
  });
});

test.describe('London time', () => {
  test('SLT-10 opening time is 09:00 UTC in summer and 10:00 UTC in winter, across both clock changes', () => {
    expect(new Date(londonTimeToInstant('2026-10-24', 600)).toISOString()).toBe('2026-10-24T09:00:00.000Z');
    expect(new Date(londonTimeToInstant('2026-10-25', 600)).toISOString()).toBe('2026-10-25T10:00:00.000Z');
    expect(new Date(londonTimeToInstant('2027-03-27', 600)).toISOString()).toBe('2027-03-27T10:00:00.000Z');
    expect(new Date(londonTimeToInstant('2027-03-28', 600)).toISOString()).toBe('2027-03-28T09:00:00.000Z');
  });

  test('SLT-11 the clinic date rolls over at London midnight, not UTC midnight', () => {
    expect(londonDateString(Date.parse('2026-07-01T23:30:00Z'))).toBe('2026-07-02');
    expect(londonDateString(Date.parse('2026-12-01T23:30:00Z'))).toBe('2026-12-01');
  });

  test('SLT-12 bookable dates run from today to 90 days ahead and must be real', () => {
    const now = Date.parse('2026-11-02T12:00:00Z');
    expect(isBookableDate('2026-11-02', now)).toBe(true);
    expect(isBookableDate(addDays('2026-11-02', 90), now)).toBe(true);
    expect(isBookableDate(addDays('2026-11-02', 91), now)).toBe(false);
    expect(isBookableDate('2026-11-01', now)).toBe(false);
    expect(isBookableDate('2027-02-30', now)).toBe(false);
    expect(isBookableDate('02/11/2026', now)).toBe(false);
  });
});

test.describe('free start times', () => {
  const longAgo = Date.parse('2026-01-01T00:00:00Z');

  test('SLT-20 a Monday offers 15 minute steps from 10:00 to the last start that finishes by 20:00', () => {
    const times = freeStartTimes({ date: '2026-11-02', durationMinutes: 60, busy: [], nowMs: longAgo });
    expect(times[0]).toBe('10:00');
    expect(times[1]).toBe('10:15');
    expect(times.at(-1)).toBe('19:00');
    expect(times).toHaveLength(37);
  });

  test('SLT-21 a Sunday closes at 18:00', () => {
    const times = freeStartTimes({ date: '2026-11-01', durationMinutes: 60, busy: [], nowMs: longAgo });
    expect(times.at(-1)).toBe('17:00');
  });

  test('SLT-22 a busy block keeps a 15 minute gap on both sides', () => {
    const noon = londonTimeToInstant('2026-11-02', 12 * 60);
    const busy = [{ startMs: noon, endMs: noon + HOUR_MS }];
    const times = freeStartTimes({ date: '2026-11-02', durationMinutes: 60, busy, nowMs: longAgo });
    expect(times).toContain('10:45');
    for (const taken of ['11:00', '11:45', '12:00', '13:00']) expect(times).not.toContain(taken);
    expect(times).toContain('13:15');
  });

  test('SLT-23 today offers nothing that has already started, with no minimum notice', () => {
    const now = londonTimeToInstant('2026-11-02', 14 * 60 + 5);
    const times = freeStartTimes({ date: '2026-11-02', durationMinutes: 30, busy: [], nowMs: now });
    expect(times[0]).toBe('14:15');
  });

  test('SLT-24 a treatment longer than the day offers no times', () => {
    expect(freeStartTimes({ date: '2026-11-01', durationMinutes: 9 * 60, busy: [], nowMs: longAgo })).toEqual([]);
  });
});
