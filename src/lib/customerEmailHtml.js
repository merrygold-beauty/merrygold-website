// The branded HTML version of the customer's booking or order confirmation,
// sent alongside the plain text (see buildCustomerContent in enquiryEmail.js,
// which both versions render from).
//
// Built the way email clients need: tables for layout, every style inline,
// no web fonts and no CSS the clients strip (Gmail drops <body> backgrounds
// and most <style> rules). The worst case in any client is dark text on a
// light card, which still reads. Colours are the site's own tokens from
// src/styles/tokens.css.

import { SITE_ORIGIN, clinicData, formatClinicAddress } from '../data/clinic.js';
import { buildCustomerContent } from './enquiryEmail.js';
import { escapeHtml } from './escapeHtml.js';

const PAGE_BG = '#F3ECE2'; // --color-bone-warm
const CARD_BG = '#FFFFFF';
const HEADER_BG = '#140C07'; // --color-espresso, so the gold logo stands out
const INK = '#140C07'; // --color-text-primary
const MUTED = '#584E46'; // --color-text-secondary
const GOLD = '#C9A84C'; // --color-gold
const RULE = '#EDE5D8'; // --color-bone-alt

const SANS = "'Montserrat','Helvetica Neue',Helvetica,Arial,sans-serif";
const SERIF = "'Gilda Display','Playfair Display',Georgia,serif";

// Served from public/assets, at about twice the size it is shown for sharp
// rendering on phones.
const LOGO_URL = `${SITE_ORIGIN}/assets/email-logo.png`;

const P = `font-family:${SANS};font-size:15px;line-height:1.7;color:${INK};margin:0 0 16px;`;

function detailRow(label, value, { strong = false } = {}) {
  const weight = strong ? 'font-weight:700;' : '';
  return `<tr>
<td style="font-family:${SANS};font-size:15px;line-height:1.5;color:${INK};padding:10px 0;border-bottom:1px solid ${RULE};${weight}">${escapeHtml(label)}</td>
<td align="right" style="font-family:${SANS};font-size:15px;line-height:1.5;color:${INK};padding:10px 0 10px 16px;border-bottom:1px solid ${RULE};white-space:nowrap;${weight}">${escapeHtml(value)}</td>
</tr>`;
}

export function buildCustomerHtml(details) {
  const content = buildCustomerContent(details);
  const heading = content.appointment ? 'Your booking is paid' : 'Your order is paid';

  const rows = [
    ...content.lines.map((line) => detailRow(line.label, line.amount)),
    detailRow('Total paid', content.total, { strong: true })
  ].join('\n');

  const dateBlock = content.appointment
    ? `<p style="${P}"><strong>${escapeHtml(content.appointmentLabel)}:</strong> ${escapeHtml(content.appointment)}</p>
<p style="${P}">${escapeHtml(content.confirmNote)}</p>`
    : '';
  const deliveryBlock = content.deliveryTo
    ? `<p style="${P}"><strong>We will send your order to:</strong> ${escapeHtml(content.deliveryTo)}</p>`
    : '';

  return `<!DOCTYPE html><html lang="en-GB"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(heading)}</title></head>
<body style="margin:0;padding:0;background:${PAGE_BG};-webkit-text-size-adjust:100%;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(content.intro)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${PAGE_BG};">
<tr><td align="center" style="padding:28px 12px;">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:560px;background:${CARD_BG};border-radius:8px;overflow:hidden;">
<tr><td align="center" style="background:${HEADER_BG};padding:28px 24px;">
<a href="${SITE_ORIGIN}" style="text-decoration:none;"><img src="${LOGO_URL}" width="180" alt="${escapeHtml(clinicData.name)}" style="display:block;width:180px;max-width:60%;height:auto;border:0;"></a>
</td></tr>
<tr><td style="height:3px;background:${GOLD};font-size:0;line-height:0;">&nbsp;</td></tr>
<tr><td style="padding:32px 32px 8px;">
<h1 style="font-family:${SERIF};font-size:26px;line-height:1.3;font-weight:400;color:${INK};margin:0 0 20px;">${escapeHtml(heading)}</h1>
<p style="${P}">${escapeHtml(content.greeting)}</p>
<p style="${P}">${escapeHtml(content.intro)}</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 24px;border-top:1px solid ${RULE};">
${rows}
</table>
${dateBlock}
${deliveryBlock}
<p style="${P}"><strong>Your reference:</strong> <span style="font-family:Consolas,Menlo,monospace;font-size:13px;color:${MUTED};">${escapeHtml(content.reference)}</span></p>
<p style="${P}">${escapeHtml(content.changeNote)}</p>
<p style="${P}"><a href="${content.termsUrl}" style="color:${INK};text-decoration:underline;">Booking and cancellation terms</a></p>
</td></tr>
<tr><td style="padding:8px 32px 32px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid ${RULE};">
<tr><td style="padding-top:20px;font-family:${SANS};font-size:12px;line-height:1.7;color:${MUTED};">
<strong style="color:${INK};">${escapeHtml(clinicData.name)}</strong><br>
${escapeHtml(formatClinicAddress())}<br>
<a href="${SITE_ORIGIN}" style="color:${MUTED};text-decoration:underline;">${SITE_ORIGIN.replace('https://', '')}</a> · ${escapeHtml(clinicData.contact.phone)}
</td></tr>
</table>
</td></tr>
</table>
</td></tr>
</table>
</body></html>`;
}
