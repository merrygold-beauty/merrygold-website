// The <head> tags for one page, described once. The SEO component applies them
// in the browser, and scripts/prerender.mjs writes the same tags into each
// page's pre-rendered HTML, so what a crawler reads and what the page keeps
// after it loads can never differ.

import { getLocalBusinessSchema } from "../data/clinic.js";
import { escapeHtml } from "./escapeHtml.js";

// Every <meta> or <link> this module manages carries this attribute, so the
// browser updates the tags the pre-rendered HTML sent instead of adding copies.
const MANAGED = "data-page-head";

export function describeHead({ title, description, canonicalUrl, ogImage, ogType = "website", noindex = false, jsonLd = null }) {
  const metas = [
    { name: "description", content: description },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:image", content: ogImage },
    { property: "og:type", content: ogType },
    { property: "og:site_name", content: "MerryGold Beauty Clinic" },
    { name: "twitter:card", content: "summary_large_image" }
  ];
  // A page kept out of search has no canonical address to claim.
  if (noindex) metas.push({ name: "robots", content: "noindex, nofollow" });
  else metas.push({ property: "og:url", content: canonicalUrl });

  const schemas = [getLocalBusinessSchema(), jsonLd].filter(Boolean);
  return { title, metas, canonicalUrl: noindex ? null : canonicalUrl, schemas };
}

// Search results cut a meta description at about 160 characters.
const DESCRIPTION_MAX = 160;

// The first candidate that fits, best first; empty candidates are skipped. When
// none fits, the first is cut at the last whole word that does.
export function pickDescription(candidates) {
  const usable = candidates.filter(Boolean);
  const fitting = usable.find((text) => text.length <= DESCRIPTION_MAX);
  if (fitting) return fitting;
  const cut = usable[0].slice(0, DESCRIPTION_MAX + 1);
  return cut.slice(0, cut.lastIndexOf(" ")).replace(/[,;:]$/, "");
}

// JSON inside a <script> only needs "</" broken up so it cannot close the tag.
const scriptSafeJson = (data) => JSON.stringify(data).replace(/<\//g, "<\\/");

export function headToHtml(head) {
  const lines = [`<title>${escapeHtml(head.title)}</title>`];
  for (const meta of head.metas) {
    const [key, value] = meta.name ? ["name", meta.name] : ["property", meta.property];
    lines.push(`<meta ${key}="${escapeHtml(value)}" content="${escapeHtml(meta.content)}" ${MANAGED}>`);
  }
  if (head.canonicalUrl) lines.push(`<link rel="canonical" href="${escapeHtml(head.canonicalUrl)}" ${MANAGED}>`);
  for (const schema of head.schemas) {
    lines.push(`<script type="application/ld+json" ${MANAGED}>${scriptSafeJson(schema)}</script>`);
  }
  return lines.join("\n    ");
}

export function applyHead(head) {
  document.title = head.title;
  document.head.querySelectorAll(`[${MANAGED}]`).forEach((tag) => tag.remove());
  for (const meta of head.metas) {
    const tag = document.createElement("meta");
    tag.setAttribute(meta.name ? "name" : "property", meta.name ?? meta.property);
    tag.setAttribute("content", meta.content);
    tag.setAttribute(MANAGED, "");
    document.head.appendChild(tag);
  }
  if (head.canonicalUrl) {
    const link = document.createElement("link");
    link.rel = "canonical";
    link.href = head.canonicalUrl;
    link.setAttribute(MANAGED, "");
    document.head.appendChild(link);
  }
  for (const schema of head.schemas) {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(schema);
    script.setAttribute(MANAGED, "");
    document.head.appendChild(script);
  }
}
