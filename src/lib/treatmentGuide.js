// Builds what the "About this treatment" sheet shows for one treatment.
//
// Guide content lives at two levels so nothing is written twice. What is
// specific to one treatment sits on its entry in src/data/treatments.js
// (about, benefits, suitableFor, notSuitableFor, aftercare). What a whole
// family shares (every laser hair removal area has the same preparation and
// aftercare) sits once in src/data/treatmentGuides.js, and each treatment
// names its family in its `guide` field.
import { treatmentGuides } from '../data/treatmentGuides';

export function getTreatmentGuide(treatment) {
  const family = treatmentGuides[treatment.guide] || {};
  return {
    about: treatment.about || family.intro || null,
    suitableFor: treatment.suitableFor || family.suitableFor || null,
    notSuitableFor: treatment.notSuitableFor || family.notSuitableFor || null,
    before: family.before || [],
    aftercare: family.aftercare || [],
    goodToKnow: family.goodToKnow || [],
    notice: family.notice || null
  };
}
