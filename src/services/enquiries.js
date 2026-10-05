import { buildWhatsAppUrl } from '../data/clinic';

// Enquiry forms (contact, free consultation, training) and the one event that
// opens the consultation sheet from anywhere on the site. The sheet itself is
// mounted once in Layout.jsx, the same way the treatment finder is.
export const OPEN_CONSULTATION_EVENT = 'open-consultation-form';

export function openConsultationForm() {
  window.dispatchEvent(new CustomEvent(OPEN_CONSULTATION_EVENT));
}

// Same sheet, opened from a treatment that cannot be booked online yet, so
// the form arrives already saying which treatment the visitor is asking
// about. A separate function, not an optional argument, because
// openConsultationForm is used directly as an onClick handler and would be
// handed the click event as its first argument.
export function openTreatmentEnquiry(treatment) {
  window.dispatchEvent(new CustomEvent(OPEN_CONSULTATION_EVENT, {
    detail: { treatmentName: treatment.name, categoryName: treatment.categoryName }
  }));
}

const ENQUIRY_ENDPOINT = '/api/enquiry';

const ENQUIRY_OPENERS = {
  contact: 'Hello MerryGold, I have an enquiry.',
  consultation: 'Hello MerryGold, I would like to book a free consultation.',
  training: 'Hello MerryGold, I would like to enquire about training.'
};

// Builds the WhatsApp fallback text for any enquiry type. The training shape
// is the original one FRM-T01 parses; contact and consultation follow the
// same Name/Email/Phone block with their own opening line and detail fields.
// The honeypot field is never included: it exists only for the server-side
// spam check, not for a human to read.
export function buildEnquiryMessage(payload) {
  const lines = [
    ENQUIRY_OPENERS[payload.type],
    '',
    `Name: ${payload.name}`,
    `Email: ${payload.email}`,
    `Phone: ${payload.phone}`
  ];

  if (payload.type === 'training') {
    lines.push(`Programmes: ${(payload.programmes || []).join(', ')}`);
    lines.push(`Experience: ${payload.experience}`);
  } else if (payload.type === 'consultation') {
    lines.push(`Treatment or concern: ${payload.treatment}`);
    if (payload.preferredDate) lines.push(`Preferred date: ${payload.preferredDate}`);
    lines.push(`Preferred time: ${payload.preferredTime}`);
  } else {
    lines.push(`Message: ${payload.message}`);
  }

  if (payload.notes && payload.notes.trim()) {
    lines.push(`Notes: ${payload.notes.trim()}`);
  }

  return lines.join('\n');
}

function openWhatsAppFallback(payload) {
  const url = buildWhatsAppUrl(buildEnquiryMessage(payload));
  window.open(url, '_blank', 'noopener,noreferrer');
  return { delivered: 'whatsapp' };
}

// Posts an enquiry to the clinic's inbox and falls back to a prefilled
// WhatsApp message whenever email delivery is not available: a 503 (no
// provider configured), a 502 or other 5xx (the provider failed), a network
// failure, or a response body that is not JSON (what the Vite dev server
// returns for a route it does not know). Only a 400 throws, so the form that
// called this can show the validation sentence inline instead.
export async function submitEnquiry(payload) {
  let response;
  try {
    response = await fetch(ENQUIRY_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch {
    return openWhatsAppFallback(payload);
  }

  if (response.status === 400) {
    const { error } = await response.json();
    throw new Error(error);
  }

  let data;
  try {
    data = await response.json();
  } catch {
    return openWhatsAppFallback(payload);
  }

  if (response.ok && data?.ok === true) {
    return { delivered: 'email' };
  }

  return openWhatsAppFallback(payload);
}
