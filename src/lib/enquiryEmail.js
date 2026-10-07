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

export function formatPence(pence) {
  return `£${(pence / 100).toFixed(2)}`;
}

// What the clinic is told about the calendar, by the status
// functions/api/stripe-webhook.js reports. Nothing is said when it was added
// cleanly.
const CALENDAR_NOTES = {
  clash: 'Calendar: this time overlaps something already in the calendar (it was still added, marked CLASH). Move one of them when you call.',
  failed: 'Calendar: the booking could not be added to the Google Calendar. Please add it by hand.'
};

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
  appointmentTime,
  calendarStatus,
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

  // The website cannot see Treatwell's bookings, so every paid booking is
  // still confirmed by a call; the customer has been told to expect it. A
  // booking from before time slots (date only) still needs its time agreed.
  const toDo = appointmentDate
    ? [
        appointmentTime
          ? `To do: call or WhatsApp ${customerName} on ${phone} to confirm the appointment.`
          : `To do: call or WhatsApp ${customerName} on ${phone} to confirm the appointment time.`,
        ...(CALENDAR_NOTES[calendarStatus] ? [CALENDAR_NOTES[calendarStatus]] : []),
        ''
      ]
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

  if (appointmentDate) lines.push(`${appointmentLabelFor(appointmentTime)}: ${formatAppointment(appointmentDate, appointmentTime)}`);
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

// appointmentTime is the "HH:MM" chosen at checkout. Bookings paid before
// time slots existed carry a date only.
export function formatAppointment(appointmentDate, appointmentTime) {
  const date = formatAppointmentDate(appointmentDate);
  return appointmentTime ? `${date} at ${appointmentTime}` : date;
}

function appointmentLabelFor(appointmentTime) {
  return appointmentTime ? 'Appointment' : 'Requested date';
}

function confirmNoteFor(appointmentTime) {
  return appointmentTime
    ? 'We will contact you by phone or WhatsApp to confirm your appointment.'
    : 'We will contact you by phone or WhatsApp to confirm your appointment time.';
}

// What the customer's confirmation says, once. buildCustomerBody renders it as
// plain text and src/lib/customerEmailHtml.js as the branded HTML version, so
// the two can never say different things.
export function buildCustomerContent({
  reference,
  customerName,
  items,
  totalPence,
  appointmentDate,
  appointmentTime,
  deliveryAddress,
  deliveryPostcode
}) {
  return {
    greeting: `Dear ${customerName || 'customer'},`,
    intro: `Thank you for ${appointmentDate ? 'booking with' : 'your order from'} ${clinicData.name}. We have received your payment.`,
    lines: items.map((item) => ({ label: `${item.name} x ${item.quantity}`, amount: formatPence(item.amountPence) })),
    total: formatPence(totalPence),
    appointmentLabel: appointmentDate ? appointmentLabelFor(appointmentTime) : null,
    appointment: appointmentDate ? formatAppointment(appointmentDate, appointmentTime) : null,
    confirmNote: appointmentDate ? confirmNoteFor(appointmentTime) : null,
    deliveryTo: deliveryAddress ? [deliveryAddress, deliveryPostcode].filter(Boolean).join(', ') : null,
    ...closingContent(reference)
  };
}

// How every customer email ends: the reference, how to change anything, the terms.
function closingContent(reference) {
  return {
    reference,
    changeNote: `To change anything, reply to this email or call us on ${clinicData.contact.phone}.`,
    termsUrl: `${SITE_ORIGIN}/terms`
  };
}

function closingLines(content) {
  return [
    `Your reference: ${content.reference}`,
    '',
    content.changeNote,
    `Booking and cancellation terms: ${content.termsUrl}`,
    '',
    clinicData.name,
    formatClinicAddress(),
    SITE_ORIGIN
  ];
}

export function buildCustomerBody(details) {
  const content = buildCustomerContent(details);
  const lines = [
    content.greeting,
    '',
    content.intro,
    '',
    ...content.lines.map((line) => `${line.label}, ${line.amount}`),
    `Total paid: ${content.total}`,
    ''
  ];

  if (content.appointment) lines.push(`${content.appointmentLabel}: ${content.appointment}`, content.confirmNote, '');
  if (content.deliveryTo) lines.push(`We will send your order to: ${content.deliveryTo}`, '');

  lines.push(...closingLines(content));

  return lines.join('\n');
}

// The notice sent when the clinic cancels an order from the orders page: a
// booking (appointmentDate given) or a product order. Stripe sends its own
// refund receipt as well (customer refund emails are on in the Stripe
// account), so the notice says to expect it.
export function buildCancellationNotice({ customerName, treatment, appointmentDate, appointmentTime, refunded, amountPence, reference }) {
  const isBooking = Boolean(appointmentDate);
  return {
    subject: isBooking ? 'Your MerryGold booking is cancelled' : 'Your MerryGold order is cancelled',
    heading: isBooking ? 'Your booking is cancelled' : 'Your order is cancelled',
    greeting: `Dear ${customerName || 'customer'},`,
    paragraphs: [
      isBooking
        ? `Your booking for ${treatment || 'your treatment'} on ${formatAppointment(appointmentDate, appointmentTime)} has been cancelled.`
        : 'Your order has been cancelled.',
      refunded
        ? `We have refunded ${formatPence(amountPence)} to the card you paid with. Stripe will also email you a refund receipt, and the money usually reaches your account within 5 to 10 working days.`
        : 'No refund has been made for this booking. If you have a question about this, reply to this email.'
    ],
    ...closingContent(reference)
  };
}

// The notice sent when the clinic moves a booking from the orders page.
export function buildMoveNotice({ customerName, treatment, appointmentDate, appointmentTime, previousDate, previousTime, reference }) {
  return {
    subject: 'Your MerryGold booking has moved',
    heading: 'Your booking has moved',
    greeting: `Dear ${customerName || 'customer'},`,
    paragraphs: [
      `Your ${treatment || 'treatment'} appointment is now on ${formatAppointment(appointmentDate, appointmentTime)}.`,
      `It was previously booked for ${formatAppointment(previousDate, previousTime)}.`
    ],
    ...closingContent(reference)
  };
}

// The notice sent when the clinic marks a product order as posted.
export function buildSentNotice({ customerName, items, deliveryTo, tracking, reference }) {
  const contents = items.map((item) => `${item.name} x ${item.quantity}`).join(', ');
  return {
    subject: 'Your MerryGold order is on its way',
    heading: 'Your order is on its way',
    greeting: `Dear ${customerName || 'customer'},`,
    paragraphs: [
      `We have posted your order to ${deliveryTo}.`,
      `In the parcel: ${contents}.`,
      ...(tracking ? [`Tracking number: ${tracking}`] : [])
    ],
    ...closingContent(reference)
  };
}

export function buildNoticeBody(notice) {
  return [notice.greeting, '', ...notice.paragraphs.flatMap((text) => [text, '']), ...closingLines(notice)].join('\n');
}
