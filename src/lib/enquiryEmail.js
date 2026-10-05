// Plain text subject lines and bodies for every email the site sends: to the
// clinic for enquiry forms (functions/api/enquiry.js) and paid Stripe bookings
// and orders (functions/api/stripe-webhook.js), and to the customer for the
// same paid booking or order. Kept in one module, with no fetch or env access,
// so the callers stay small and this stays unit-testable by itself.

import { SITE_ORIGIN, clinicData, formatClinicAddress } from '../data/clinic.js';

const ENQUIRY_SUBJECT_LEAD = {
  contact: 'New contact enquiry from',
  consultation: 'Free consultation request from',
  training: 'Training enquiry from'
};

// "The site page it came from" is derived from `type`, the one field every
// enquiry always carries, instead of a separate page field the forms would
// each have to remember to send.
const ENQUIRY_SOURCE_LABELS = {
  contact: 'Contact page',
  consultation: 'Free consultation request',
  training: 'Training page'
};

export function buildEnquirySubject(type, name) {
  return `${ENQUIRY_SUBJECT_LEAD[type]} ${name}`;
}

// One labelled line per field that was actually supplied, in a fixed order,
// so every enquiry email reads the same way whichever form it came from.
export function buildEnquiryBody(type, fields) {
  const lines = [];
  const addLine = (label, value) => {
    if (value === undefined || value === null || value === '') return;
    lines.push(`${label}: ${Array.isArray(value) ? value.join(', ') : value}`);
  };

  addLine('Name', fields.name);
  addLine('Email', fields.email);
  addLine('Phone', fields.phone);
  addLine('Treatment', fields.treatment);
  addLine('Preferred date', fields.preferredDate);
  addLine('Preferred time', fields.preferredTime);
  addLine('Programmes', fields.programmes);
  addLine('Experience', fields.experience);
  addLine('Message', fields.message);
  addLine('Notes', fields.notes);
  lines.push('', `Sent from: ${ENQUIRY_SOURCE_LABELS[type]}`);
  lines.push('', `Reply to this email to answer ${fields.name} directly.`);

  return lines.join('\n');
}

function formatPence(pence) {
  return `£${(pence / 100).toFixed(2)}`;
}

export function buildOrderSubject({ firstItemName, extraItemCount, hasAppointment }) {
  const lead = hasAppointment ? 'New paid booking' : 'New paid order';
  const more = extraItemCount > 0 ? ` (and ${extraItemCount} more)` : '';
  return `${lead}: ${firstItemName}${more}`;
}

// createdAt is a Date (stripe-webhook.js converts the session's unix
// `created` seconds before calling this, keeping this module free of any
// Stripe-specific field shapes).
export function buildOrderBody({
  reference,
  createdAt,
  customerName,
  customerEmail,
  phone,
  items,
  totalPence,
  appointmentDate,
  notes,
  deliveryAddress,
  deliveryPostcode,
  stripeUrl
}) {
  const when = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(createdAt);

  // A paid booking only has a date until the clinic agrees a time with the
  // customer, who has been told to expect that call; so it leads the email.
  const toDo = appointmentDate
    ? [`To do: call or WhatsApp ${customerName} on ${phone} to confirm the appointment time.`, '']
    : [];

  const lines = [
    ...toDo,
    `Reference: ${reference}`,
    `When: ${when}`,
    `Customer: ${customerName}`,
    `Email: ${customerEmail}`,
    `Phone: ${phone}`,
    '',
    ...items.map((item) => `${item.name} x ${item.quantity}, ${formatPence(item.amountPence)}`),
    '',
    `Total: ${formatPence(totalPence)}`
  ];

  if (appointmentDate) lines.push(`Requested date: ${formatAppointmentDate(appointmentDate)}`);
  if (notes) lines.push(`Notes: ${notes}`);
  if (deliveryAddress) lines.push(`Delivery address: ${deliveryAddress}`);
  if (deliveryPostcode) lines.push(`Delivery postcode: ${deliveryPostcode}`);
  lines.push('', stripeUrl);

  return lines.join('\n');
}

export function buildCustomerSubject({ firstItemName, hasAppointment }) {
  return hasAppointment ? `Your MerryGold booking: ${firstItemName}` : 'Your MerryGold order';
}

// appointmentDate is the YYYY-MM-DD the checkout form sends; read as a
// calendar date, so no time zone can move it to the day before.
function formatAppointmentDate(appointmentDate) {
  const date = new Date(`${appointmentDate}T00:00:00Z`);
  // Two formatters: one en-GB pattern with the weekday adds a comma after it.
  const weekday = new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', weekday: 'long' }).format(date);
  const dayMonthYear = new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', day: 'numeric', month: 'long', year: 'numeric' }).format(date);
  return `${weekday} ${dayMonthYear}`;
}

export function buildCustomerBody({
  reference,
  customerName,
  items,
  totalPence,
  appointmentDate,
  deliveryAddress,
  deliveryPostcode
}) {
  const lines = [
    `Dear ${customerName || 'customer'},`,
    '',
    `Thank you for ${appointmentDate ? 'booking with' : 'your order from'} ${clinicData.name}. We have received your payment.`,
    '',
    ...items.map((item) => `${item.name} x ${item.quantity}, ${formatPence(item.amountPence)}`),
    `Total paid: ${formatPence(totalPence)}`,
    ''
  ];

  if (appointmentDate) {
    lines.push(
      `Requested date: ${formatAppointmentDate(appointmentDate)}`,
      'We will contact you by phone or WhatsApp to confirm your appointment time.',
      ''
    );
  }
  if (deliveryAddress) {
    lines.push(`We will send your order to: ${[deliveryAddress, deliveryPostcode].filter(Boolean).join(', ')}`, '');
  }

  lines.push(
    `Your reference: ${reference}`,
    '',
    `To change anything, reply to this email or call us on ${clinicData.contact.phone}.`,
    `Booking and cancellation terms: ${SITE_ORIGIN}/terms`,
    '',
    clinicData.name,
    formatClinicAddress(),
    SITE_ORIGIN
  );

  return lines.join('\n');
}
