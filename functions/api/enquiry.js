// Cloudflare Pages Function: POST /api/enquiry
//
// Contact, free consultation and training enquiries from the site's forms.
// Mails the clinic via Resend (src/lib/notify.js); the client falls back to
// a prefilled WhatsApp message when this returns 503 (email not set up).

import { jsonResponse, unavailableResponse } from '../../src/lib/functionsShared.js';
import { rateLimitResponse } from '../../src/lib/rateLimit.js';
import { isNotifyConfigured, sendClinicEmail } from '../../src/lib/notify.js';
import { buildEnquirySubject, buildEnquiryBody } from '../../src/lib/enquiryEmail.js';

const TYPES = new Set(['contact', 'consultation', 'training']);
const PREFERRED_TIMES = new Set(['Morning', 'Afternoon', 'Evening', 'Any']);
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // same pattern as functions/api/checkout.js
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MAX_SHORT_TEXT = 120; // name, treatment, experience, preferredTime, each programme entry
const MAX_PHONE = 40;
const MAX_LONG_TEXT = 2000; // message, notes
const MAX_PROGRAMMES = 10;

function badRequest(message) {
  return jsonResponse({ error: message }, 400);
}

// Returns either { type, fields } (trimmed and ready to email) or
// { error: '<sentence for the visitor>' }. Only fields the caller actually
// sent end up in `fields`, so buildEnquiryBody prints just the ones supplied.
function validateBody(body) {
  const type = body?.type;
  if (!TYPES.has(type)) return { error: 'Please choose what your enquiry is about.' };

  const name = String(body?.name ?? '').trim();
  if (!name) return { error: 'Please enter your name.' };
  if (name.length > MAX_SHORT_TEXT) return { error: 'Please enter a shorter name.' };

  const email = String(body?.email ?? '').trim();
  if (!EMAIL_PATTERN.test(email)) return { error: 'That email address does not look right.' };

  const phone = String(body?.phone ?? '').trim();
  if (!phone) return { error: 'Please enter a telephone number.' };
  if (phone.length > MAX_PHONE) return { error: 'Please enter a shorter telephone number.' };

  const fields = { name, email, phone };

  if (body?.message !== undefined) {
    const message = String(body.message).trim();
    if (message.length > MAX_LONG_TEXT) return { error: `Your message must be ${MAX_LONG_TEXT} characters or fewer.` };
    if (message) fields.message = message;
  }

  if (body?.treatment !== undefined) {
    const treatment = String(body.treatment).trim();
    if (treatment.length > MAX_SHORT_TEXT) return { error: 'That treatment name is too long.' };
    if (treatment) fields.treatment = treatment;
  }

  if (body?.preferredDate !== undefined) {
    const preferredDate = String(body.preferredDate).trim();
    if (preferredDate && !DATE_PATTERN.test(preferredDate)) return { error: 'That preferred date does not look right.' };
    if (preferredDate) fields.preferredDate = preferredDate;
  }

  if (body?.preferredTime !== undefined) {
    const preferredTime = String(body.preferredTime).trim();
    // Membership in this short, fixed set already implies the 120-character
    // cap, so there is no separate length check to fail on.
    if (preferredTime && !PREFERRED_TIMES.has(preferredTime)) return { error: 'That preferred time is not one of the options.' };
    if (preferredTime) fields.preferredTime = preferredTime;
  }

  if (body?.programmes !== undefined) {
    const programmes = body.programmes;
    const isValid = Array.isArray(programmes) && programmes.length <= MAX_PROGRAMMES &&
      programmes.every((entry) => typeof entry === 'string' && entry.length <= MAX_SHORT_TEXT);
    if (!isValid) return { error: `Choose up to ${MAX_PROGRAMMES} training programmes.` };
    if (programmes.length) fields.programmes = programmes;
  }

  if (body?.experience !== undefined) {
    const experience = String(body.experience).trim();
    if (experience.length > MAX_SHORT_TEXT) return { error: 'That experience description is too long.' };
    if (experience) fields.experience = experience;
  }

  if (body?.notes !== undefined) {
    const notes = String(body.notes).trim();
    if (notes.length > MAX_LONG_TEXT) return { error: `Notes must be ${MAX_LONG_TEXT} characters or fewer.` };
    if (notes) fields.notes = notes;
  }

  return { type, fields };
}

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!isNotifyConfigured(env)) return unavailableResponse();

  const limited = rateLimitResponse(request, { name: 'enquiry', limit: 5, windowSeconds: 600 });
  if (limited) return limited;

  let body;
  try {
    body = await request.json();
  } catch (err) {
    console.error('Enquiry request body was not valid JSON:', err.message);
    return badRequest('The enquiry details could not be read.');
  }

  // Honeypot: a real visitor never fills in this hidden field. Answer as if
  // it worked so a bot has no signal that its submission was dropped.
  if (typeof body?.company === 'string' && body.company.trim()) {
    console.log('Enquiry honeypot triggered, submission dropped');
    return jsonResponse({ ok: true });
  }

  const result = validateBody(body);
  if (result.error) return badRequest(result.error);
  const { type, fields } = result;

  const subject = buildEnquirySubject(type, fields.name);
  const text = buildEnquiryBody(type, fields);

  try {
    await sendClinicEmail(env, { subject, text, replyTo: fields.email });
  } catch (err) {
    console.error('Enquiry email send failed:', err.message);
    return jsonResponse({ error: 'The message could not be sent. Please try again or use WhatsApp.' }, 502);
  }

  return jsonResponse({ ok: true });
}
