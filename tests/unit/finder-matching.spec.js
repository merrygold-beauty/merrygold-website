import { test, expect } from '@playwright/test';
import { QUESTIONS, rankTreatments, buildRationale, commitmentOf } from '../../src/components/finder/finderMatching.js';

const option = (questionId, optionId) =>
  QUESTIONS.find((question) => question.id === questionId).options.find((opt) => opt.id === optionId);

const answers = (concern, area, commitment) => ({
  concern: option('concern', concern),
  area: option('area', area),
  commitment: option('commitment', commitment)
});

// Small, made-up treatments so each rule can be seen working on its own.
const SAMPLE = [
  { id: 'lip', name: 'Lip Blush', category: 'semi-permanent-makeup', concerns: ['Pale Lip Tone'] },
  { id: 'liner', name: 'Eyeliner', category: 'semi-permanent-makeup', concerns: ['Sparse lash line'] },
  { id: 'laser-face', name: 'Face Laser', category: 'laser-hair-removal', concerns: ['Upper Lip Shadow'] },
  { id: 'thread', name: 'Face Threading', category: 'waxing-threading', concerns: ['Facial Peach Fuzz'] },
  { id: 'wax', name: 'Leg Wax', category: 'waxing-threading', concerns: ['Unwanted Hair'] },
  { id: 'body-laser', name: 'Full Body Laser', category: 'laser-hair-removal', concerns: ['Full Body Unwanted Hair'] }
];

test.describe('Treatment Finder matching', () => {
  test('UNT-F01 three questions, with seven, four and three answers, all with distinct ids', () => {
    expect(QUESTIONS.map((q) => q.options.length)).toEqual([7, 4, 3]);
    for (const question of QUESTIONS) {
      const ids = question.options.map((opt) => opt.id);
      expect(new Set(ids).size, question.id).toBe(ids.length);
    }
  });

  test('UNT-F02 result lasting time comes from the category unless the name says otherwise', () => {
    expect(commitmentOf({ name: 'Classic Facial', category: 'skin-facials' })).toBe('single');
    expect(commitmentOf({ name: 'Chemical Peel', category: 'skin-facials' })).toBe('course');
    expect(commitmentOf({ name: 'Lash Lift & Tint', category: 'brows-lashes' })).toBe('lasting');
    expect(commitmentOf({ name: 'Something', category: 'unknown' })).toBe('single');
  });

  test('UNT-F03 a treatment unrelated to the concern is never recommended', () => {
    const results = rankTreatments(SAMPLE, answers('lips-eyeliner', 'face', 'course'));
    expect(results.map((t) => t.id)).not.toContain('laser-face');
    expect(results.every((t) => t.category === 'semi-permanent-makeup')).toBe(true);
  });

  test('UNT-F04 at most three results come back, best first', () => {
    const results = rankTreatments(SAMPLE, answers('unwanted-hair', 'body', 'course'));
    expect(results.length).toBeLessThanOrEqual(3);
    expect(results[0].id).toBe('body-laser');
  });

  test('UNT-F05 asking for a one-off pushes course-based treatments down', () => {
    const results = rankTreatments(SAMPLE, answers('unwanted-hair', 'face', 'single'));
    expect(results[0].category).toBe('waxing-threading');
  });

  test('UNT-F06 the explanation names the concern and area, and drops the area for no preference', () => {
    const matches = [SAMPLE[0]];
    expect(buildRationale(answers('lips-eyeliner', 'face', 'lasting'), matches)).toBe(
      'Matched on lip colour and semi-permanent eyeliner, focused on the face, jawline and neck, and weighted toward a semi-permanent result.'
    );
    expect(buildRationale(answers('lips-eyeliner', 'no-preference', 'lasting'), matches)).not.toContain('focused on');
    expect(buildRationale(answers('lips-eyeliner', 'face', 'lasting'), [])).toBe('');
  });
});
