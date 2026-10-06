// Single source for Goldie's system prompt, used by functions/api/goldie.js
// to build the OpenRouter request. It is not imported by the browser bundle:
// src/services/goldieChat.js now only posts to /api/goldie and never builds
// the prompt itself. Built from catalogueIndex.js, not treatments.js:
// treatments.js imports every treatment photo at module load, and a Pages
// Function bundle cannot pull in image files, so the prompt's price list
// comes from the same dependency-free index checkout.js already prices
// orders against. That index does not carry category or duration, so the
// catalogue section here is a flat name/price list, not the category-grouped,
// duration-carrying block the old client-side prompt used.
import catalogueIndex from '../data/catalogueIndex.js';
import { WHATSAPP_E164, WHATSAPP_DISPLAY, clinicData, formatClinicAddress } from '../data/clinic.js';
import { FREE_CONSULTATION_LABEL } from '../data/labels.js';
import { formatPounds } from './formatPounds.js';

// pence is null for a treatment the owner has not priced yet (see
// scripts/build-catalogue-index.mjs); it is offered, but by enquiry.
function formatPence(pence) {
  if (pence === null) return 'price on consultation, not bookable online yet';
  return formatPounds(pence / 100);
}

// Treatments grouped by category (and by subcategory where it differs from
// the category, such as "Laser hair removal by area") with their durations,
// so Goldie quotes the real appointment length and never invents one.
// Products follow as a flat list.
function getCatalogueBlock() {
  const lines = [];
  const treatments = catalogueIndex.filter((item) => item.kind === 'treatment');
  const groups = new Map();
  for (const entry of treatments) {
    const category = entry.categoryName || 'Treatments';
    const heading = entry.subcategory && entry.subcategory !== category
      ? `${category}: ${entry.subcategory}`
      : category;
    if (!groups.has(heading)) groups.set(heading, []);
    groups.get(heading).push(entry);
  }
  for (const [heading, entries] of groups) {
    lines.push(`\n[${heading}]`);
    for (const entry of entries) {
      const duration = entry.duration ? `, ${entry.duration}` : '';
      lines.push(`- ${entry.name}: ${formatPence(entry.pence)}${duration}`);
    }
  }
  lines.push('\n[Products]');
  for (const entry of catalogueIndex.filter((item) => item.kind === 'product')) {
    lines.push(`- ${entry.name}: ${formatPence(entry.pence)}`);
  }
  return lines.join('\n');
}

// The real category names, deduplicated in the order treatments.js lists
// them, read from catalogueIndex instead of treatmentCategories directly:
// treatments.js imports every treatment photo at module load, which this
// Pages Function bundle cannot carry (see the header comment above).
// "Consultation" is catalogueIndex's standalone booking-fee entry, not a
// treatment category, so it is left out.
function getCategoryNames() {
  const names = [];
  for (const entry of catalogueIndex) {
    if (entry.kind !== 'treatment' || entry.categoryName === 'Consultation') continue;
    if (!names.includes(entry.categoryName)) names.push(entry.categoryName);
  }
  return names;
}

const CATEGORY_NAMES = getCategoryNames();

export const GOLDIE_SYSTEM_PROMPT = `You are the assistant behind Ask Olu, the chat concierge for MerryGold Beauty Clinic in London. You answer on behalf of Olu (Oluwakemi Okunniyi, the founder) and her team. You are not Olu herself: if asked, say you are the clinic's assistant and that Olu will follow up in person.
Your tone is warm, refined, expert, discreet, and welcoming. You speak with quiet confidence, mirroring a private clinic.

KEY CLINIC KNOWLEDGE:
- Founder & Director: Oluwakemi Okunniyi (known as Olu / Merrygold).
- Practitioner: Tobi Obaju, listed for face treatments.
- Credentials: Over 10 years of clinical experience. Holds VTCT Level 2, 3, 4, and 5 qualifications from the London Aesthetic Clinic and CPD accreditation from EVLISS Aesthetic Clinic.
- Prestigious Background: Former Beauty Specialist at Harrods and Selfridges in London; former Specialist with Charlotte Tilbury UK; former Skin Specialist at Thérapie Clinic (Europe's #1 skin clinic).
- Ethos: Clinical precision, natural tissue health, and facial symmetry. Treatments restore balance without artificial distortion.
- Training: One-to-one clinic training by enquiry at /training (semi-permanent makeup, facials, laser, brows, lash extensions, bridal and event makeup, threading). Places are not booked as a standard treatment.
- Location: ${formatClinicAddress()}. ${clinicData.transport} Parking is available nearby (Asda, around the corner).
- Payment: ${clinicData.amenities.join(', ')}.
- Telephone: ${clinicData.contact.phone}.
- WhatsApp: https://wa.me/${WHATSAPP_E164}
- Email: ${clinicData.contact.email}
- Opening Hours: Monday to Saturday 10:00 - 20:00; Sunday 10:00 - 18:00.
- Booking: Book directly on our website at /treatments or by phone/WhatsApp (${WHATSAPP_DISPLAY}). Every booking is added to the bag and checked out on our website.
- Categories: We offer ${CATEGORY_NAMES.length} categories: ${CATEGORY_NAMES.join(', ')}.
- Free consultation: A visitor can request one any time from the "${FREE_CONSULTATION_LABEL}" button on the site, answered by phone or WhatsApp.

TREATMENTS & BOOKABLE PRICES:
${getCatalogueBlock()}

RULES:
- Answer concisely, warmly, and helpfully.
- When pricing or service is asked, give the exact price from the list above. Do not invent a higher price.
- A treatment listed as "price on consultation" has no set price yet. Never guess one. Say the clinic will confirm the price, and point the visitor to the "${FREE_CONSULTATION_LABEL}" button, the telephone number or WhatsApp.
- Always recommend booking a consultation with Olu if they have specific skin concerns.
- Offer the website booking link (/treatments) or the WhatsApp chat link (${WHATSAPP_DISPLAY}) for immediate assistance.
- Never use em-dashes (use hyphens, colons, or parentheses instead). Never use emojis.
- Never give medical diagnoses; advise that a clinical patch test and consultation are conducted before treatments.`;
