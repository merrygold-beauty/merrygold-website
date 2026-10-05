import beforeMicroblading from "../assets/images/before_microblading.webp";
import afterMicroblading from "../assets/images/after_microblading.webp";
import beforeMicroneedling from "../assets/images/before_microneedling.webp";
import afterMicroneedling from "../assets/images/after_microneedling.webp";
import beforeFacialInfusion from "../assets/images/before_facial_infusion.webp";
import afterFacialInfusion from "../assets/images/after_facial_infusion.webp";
import beforeLipBlush from "../assets/images/before_lip_blush.webp";
import afterLipBlush from "../assets/images/after_lip_blush.webp";
import beforeBodySculpt from "../assets/images/results_body_sculpt_before.jpg";
import afterBodySculpt from "../assets/images/results_body_sculpt_after.jpg";

export const resultsData = [
  {
    id: "result-lip-neutralization",
    title: "Lip Blush on Deeper Lip Tones",
    treatmentSlug: "semi-permanent-lip-colour",
    treatmentName: "Lip Blush on Deeper Lip Tones",
    category: "semi-permanent-makeup",
    clientProfile: "Client aged 32, Black heritage (Fitzpatrick Type V), natural two-tone cool undertones",
    concern: "Cool Purplish Melanin Undertones & Uneven Lip Border",
    protocol: "Two-stage corrective neutralization using warm coral-terracotta mineral pigments followed by a soft warm nude-rose blush deposit",
    timeframe: "8 weeks healed (post-touch-up)",
    timeline: "8 weeks healed",
    practitioner: "Master Permanent Makeup Specialist",
    beforeImage: beforeLipBlush,
    afterImage: afterLipBlush,
    clinicalNotes: "Deep cool undertones neutralized into an even, warm peachy-rose tone. Symmetrical lip border established with zero scarring or hyperpigmentation rebound.",
    testimonial: "Having naturally two-toned lips with dark cool edges, I was nervous about semi-permanent makeup. The neutralization gave my lips a warm, healthy, even tone that looks completely natural."
  },
  {
    id: "result-microneedling-pih",
    title: "Microneedling for Acne Scarring",
    treatmentSlug: "facial-derma-pen",
    treatmentName: "Derma-Pen Precision Microneedling",
    category: "skin-facials",
    clientProfile: "Client aged 28, Black heritage (Fitzpatrick Type IV-V), post-inflammatory marks and texture",
    concern: "Post-Inflammatory Hyperpigmentation (PIH) & Rolling Acne Scars",
    protocol: "Course of 3 conservative Derma-Pen sessions (0.75mm-1.0mm) with hyaluronic acid, niacinamide, and tyrosinase-inhibiting peptide matrix",
    timeframe: "12 weeks post-course completion",
    timeline: "12 weeks post-course",
    practitioner: "VTCT Level 4 Aesthetic Specialist",
    beforeImage: beforeMicroneedling,
    afterImage: afterMicroneedling,
    clinicalNotes: "Post-inflammatory dark spots significantly attenuated across the cheek. Mechanical micro-punctures stimulated uniform reticular collagen synthesis without triggering rebound hyperpigmentation.",
    testimonial: "As someone with darker skin, I was terrified microneedling would make my dark marks worse. MerryGold's protocol faded all my stubborn marks and completely smoothed my cheek texture."
  },
  {
    id: "result-ombre-brows-symmetry",
    title: "Ombre Powder Brows",
    treatmentSlug: "ombre-brows",
    treatmentName: "Ombré Powder Brows (Microshading)",
    category: "semi-permanent-makeup",
    clientProfile: "Client aged 35, Black heritage (Fitzpatrick Type V-VI), sparse arch and over-tweezed tail",
    concern: "Sparse Natural Brow Density & Asymmetrical Tail",
    protocol: "Digital pointillism microshading depositing warm rich espresso mineral pigment in a soft airy pixelated gradient from front to arch and crisp defined tail",
    timeframe: "6 weeks healed (fully bloomed)",
    timeline: "6 weeks healed",
    practitioner: "Master Brow Specialist",
    beforeImage: beforeMicroblading,
    afterImage: afterMicroblading,
    clinicalNotes: "Digital powder technique chosen over microblading to preserve melanin-rich tissue integrity. Soft misty front transitions into crisp arch and tail with warm undertones that resist ashy fading.",
    testimonial: "Microshading was the best decision for my brows. It created the perfect gradient without looking harsh or drawn on. The rich espresso shade matches my skin tone seamlessly."
  },
  {
    id: "result-skin-barrier-infusion",
    title: "24K Gold Facial Hydration",
    treatmentSlug: "facial-gold",
    treatmentName: "MerryGold 24K Luxury Gold Facial",
    category: "skin-facials",
    clientProfile: "Client aged 34, Caucasian heritage (Fitzpatrick Type II), compromised skin barrier and severe dehydration",
    concern: "Severe Dehydration, Surface Micro-Lines & Dull Dermal Tone",
    protocol: "Ultrasonic enzymatic peel, 24K pure gold mineral infusion, and ceramide-peptide barrier recovery lipid infusion",
    timeframe: "48 hours post-treatment",
    timeline: "48 hours post-session",
    practitioner: "Senior Dermal Aesthetician",
    beforeImage: beforeFacialInfusion,
    afterImage: afterFacialInfusion,
    clinicalNotes: "Surface skin lipid hydration increased by 185%. Micro-dehydration lines smoothed across cheekbone and peri-orbital zone with luminous glass-skin finish.",
    testimonial: "My skin was completely parched and tight after travel. Within 48 hours of the 24K Gold Facial, the tightness vanished and my skin felt bouncy, hydrated, and intensely luminous."
  },
  // A generated sample, added on 2026-09-28. Julius decided on 2026-09-30 that
  // it and the four cards above stay in as samples until the clinic supplies
  // real client photos to swap in; not a go-live blocker.
  {
    id: "result-massage-body-sculpting-draft",
    title: "Massage Body Sculpting",
    treatmentName: "Massage Body Sculpting",
    category: "massage-wellbeing",
    concern: "Waistline, from the lowest rib to the hips",
    clientProfile: "Illustration for review, not a client",
    beforeImage: beforeBodySculpt,
    afterImage: afterBodySculpt,
    clinicalNotes: "Generated illustration for review. Not for publication as a client result."
  }
];

export const results = resultsData;
