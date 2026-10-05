// Question set and ranking for the Treatment Finder.
//
// Kept apart from the component so the matching can be exercised directly
// without rendering React, and so treatments are passed in rather than
// imported (treatments.js pulls in image files, which a test runner cannot
// resolve).

// Every option's tags are drawn from the `concerns` arrays in treatments.js.
// If a treatment's concerns change, check these still line up, or the option
// stops matching on tags and falls back to its category alone.
export const QUESTIONS = [
  {
    id: 'concern',
    step: '01',
    label: 'What brings you in',
    subtext: 'Choose the result you are most interested in.',
    options: [
      {
        id: 'skin-health',
        label: 'Dullness, congestion and rough texture',
        categories: ['skin-facials'],
        tags: ['Dullness', 'Dull Tone', 'Dull, Flaky Skin', 'Congestion', 'Acne & Congestion', 'Texture', 'Rough Texture', 'Enlarged Pores', 'Blackheads', 'Dehydration', 'Oil and Tightness', 'Tired-Looking Skin', 'Skincare Not Absorbing']
      },
      {
        id: 'ageing',
        label: 'Fine lines, pigmentation and sun damage',
        categories: ['skin-facials'],
        tags: ['Fine Lines', 'Fine Lines & Wrinkles', 'Loss of Elasticity', 'Sun Damage', 'Hyperpigmentation', 'Melasma & Sun Spots', 'Pigmentation', 'Uneven Complexion', 'Acne Scarring', 'Post-Acne Redness', 'Redness']
      },
      {
        id: 'unwanted-hair',
        label: 'Unwanted hair, ingrown hairs and shaving irritation',
        categories: ['laser-hair-removal', 'waxing-threading'],
        tags: ['Unwanted Hair', 'Full Body Unwanted Hair', 'Ingrown Hairs', 'Shaving Irritation', 'Shaving Bumps', 'Razor Burn', 'Daily Leg Shaving', 'Underarm Shadow', 'Bikini Line Razor Bumps', 'Hormonal Facial Hair', 'Upper Lip Shadow', 'Neck Shaving Bumps', 'Facial Peach Fuzz', 'Peach fuzz', 'Wax Sensitivity']
      },
      {
        id: 'brows',
        label: 'Sparse, uneven or unruly brows',
        categories: ['brows-lashes', 'semi-permanent-makeup', 'waxing-threading'],
        tags: ['Sparse Brows', 'Thin Brows', 'Gaps in Brow Arch', 'Unruly Brows', 'Unruly Brow Hairs', 'Downward Growing Brows', 'Over-Tweezed Shape', 'Uneven Arches', 'Sparse Brow Tails', 'Uneven density', 'Sparse look', 'Brows That Fade on Oily Skin', 'Powder-Finish Look']
      },
      {
        id: 'lashes',
        label: 'Short, straight or sparse lashes',
        categories: ['brows-lashes', 'semi-permanent-makeup'],
        tags: ['Straight Lashes', 'Downward Lashes', 'Short Lashes', 'Sparse Lashes', 'Flat Lash Line', 'Pale Lash Tips', 'Mascara Smudging', 'Mascara Time', 'Undefined Eyes', 'Need for Definition', 'Sparse extensions', 'Sparse lash line']
      },
      {
        id: 'lips-eyeliner',
        label: 'Lip colour and semi-permanent eyeliner',
        categories: ['semi-permanent-makeup'],
        tags: ['Pale Lip Tone', 'Faded Lip Line', 'Uneven Lip Shape', 'Sparse lash line', 'Daily makeup time']
      },
      {
        id: 'event-makeup',
        label: 'Makeup for a wedding, event or shoot',
        categories: ['makeup-glam'],
        tags: ['Wedding Day Makeup', 'Wedding Day Makeup Longevity', 'Bridal Stress', 'Event Glamour', 'Event Hair and Makeup', 'Flash Photography', 'High-Definition Photography', 'All-Day Hold', 'Festival Colour', 'Long Wear Outdoors', 'Pre-Wedding Events', 'Everyday Glam', 'Day Events', 'Pre-Event Glow']
      }
    ]
  },
  {
    id: 'area',
    step: '02',
    label: 'Where',
    subtext: 'Where would you like us to focus?',
    options: [
      { id: 'face', label: 'Face, jawline and neck', keywords: ['face', 'facial', 'neck', 'chin', 'lip', 'cheek', 'peel', 'threading', 'dermaplaning', 'microdermabrasion', 'glow', 'skin'] },
      { id: 'body', label: 'Legs, underarms and bikini', keywords: ['body', 'leg', 'bikini', 'underarm', 'brazilian', 'hollywood', 'back', 'chest', 'arm', 'shoulder', 'abdomen'] },
      { id: 'eyes', label: 'Brows and eyes', keywords: ['brow', 'lash', 'eyeliner', 'eye'] },
      { id: 'no-preference', label: 'No preference, recommend for me', keywords: [] }
    ]
  },
  {
    id: 'commitment',
    step: '03',
    label: 'Commitment',
    subtext: 'How long would you like the result to last?',
    options: [
      { id: 'single', label: 'A one-off appointment', commitment: 'single' },
      { id: 'course', label: 'A course of sessions for a lasting change', commitment: 'course' },
      { id: 'lasting', label: 'Semi-permanent, months rather than days', commitment: 'lasting' }
    ]
  }
];

// How long a treatment's result lasts, used to weight question 03. The category
// gives the default; these name fragments override it where a treatment behaves
// differently from the rest of its category (a peel is a course, a lash lift
// lasts months).
const COMMITMENT_BY_CATEGORY = {
  'skin-facials': 'single',
  'laser-hair-removal': 'course',
  'waxing-threading': 'single',
  'brows-lashes': 'single',
  'semi-permanent-makeup': 'lasting',
  'makeup-glam': 'single'
};

const COMMITMENT_OVERRIDES = [
  { match: 'microneedling', commitment: 'course' },
  { match: 'peel', commitment: 'course' },
  { match: 'bb glow', commitment: 'course' },
  { match: 'lash extensions', commitment: 'lasting' },
  { match: 'lamination', commitment: 'lasting' },
  { match: 'lash lift', commitment: 'lasting' }
];

export function commitmentOf(treatment) {
  const name = treatment.name.toLowerCase();
  const override = COMMITMENT_OVERRIDES.find((o) => name.includes(o.match));
  return override ? override.commitment : COMMITMENT_BY_CATEGORY[treatment.category] || 'single';
}

// Concern tags are authored by hand and drift in case and wording ("Texture"
// against "Textural Roughness", "Peach fuzz" against "Facial Peach Fuzz"), so
// compare loosely in both directions rather than on equality.
function tagsOverlap(treatment, tags) {
  const concerns = (treatment.concerns || []).map((c) => c.toLowerCase());
  return tags.filter((tag) => {
    const needle = tag.toLowerCase();
    return concerns.some((c) => c.includes(needle) || needle.includes(c));
  }).length;
}

function matchesArea(treatment, areaOption) {
  if (!areaOption.keywords.length) return false;
  const haystack = `${treatment.name} ${(treatment.concerns || []).join(' ')}`.toLowerCase();
  return areaOption.keywords.some((keyword) => haystack.includes(keyword));
}

const SCORE = {
  perTag: 3,
  category: 4,
  // Worth more than a single tag, so the treatment for the zone the customer
  // actually named outranks one that merely shares concern wording.
  area: 4,
  commitment: 2,
  // Wrong commitment is penalised, not merely unrewarded. Without this a
  // semi-permanent tattoo outranks a threading appointment for someone who
  // asked for a one-off, because it wins on every other axis.
  commitmentMismatch: -4,
  featured: 0.5,
  // A treatment the owner has not priced yet (price: null) can only be
  // enquired about. It may still be the right answer, so it stays a
  // candidate, but it loses to a comparable treatment that can be booked now.
  notBookableYet: -1.5
};

// A treatment is only a candidate if it answers the stated concern, by tag or
// by category. Zero means never show it, whatever else it scores: area and
// commitment must re-rank the relevant treatments, never admit an irrelevant
// one. Without this gate, a laser package scores on "face" plus "a course of
// sessions" and gets recommended to someone asking about lip colour.
function concernRelevance(treatment, concern) {
  const tagHits = tagsOverlap(treatment, concern.tags);
  const categoryHit = concern.categories.includes(treatment.category);
  if (!tagHits && !categoryHit) return 0;
  return tagHits * SCORE.perTag + (categoryHit ? SCORE.category : 0);
}

function scoreTreatment(treatment, { concern, area, commitment }) {
  let score = concernRelevance(treatment, concern);
  if (matchesArea(treatment, area)) score += SCORE.area;
  score +=
    commitmentOf(treatment) === commitment.commitment
      ? SCORE.commitment
      : SCORE.commitmentMismatch;
  if (treatment.featured) score += SCORE.featured;
  if (treatment.price === null) score += SCORE.notBookableYet;
  return score;
}

export function rankTreatments(allTreatments, answers, limit = 3) {
  return allTreatments
    .filter((treatment) => concernRelevance(treatment, answers.concern) > 0)
    .map((treatment) => ({ treatment, score: scoreTreatment(treatment, answers) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.treatment);
}

const COMMITMENT_PHRASE = {
  single: 'a single appointment',
  course: 'a course of sessions',
  lasting: 'a semi-permanent result'
};

// Built from the answers that actually drove the ranking, so the wording cannot
// contradict what the customer chose.
export function buildRationale({ concern, area, commitment }, matches) {
  if (!matches.length) return '';
  const focus = concern.label.charAt(0).toLowerCase() + concern.label.slice(1);
  const areaClause = area.keywords.length ? `, focused on the ${area.label.toLowerCase()}` : '';
  return `Matched on ${focus}${areaClause}, and weighted toward ${COMMITMENT_PHRASE[commitment.commitment]}.`;
}
