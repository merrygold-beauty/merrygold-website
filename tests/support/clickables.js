// The inventory of every clickable control on the site and the tests that
// cover it. The coverage crawl (06-link-coverage-crawl.spec.js) fails when it
// finds a control that matches none of these rules, so a new link or button
// cannot ship without a test being named for it.
//
// A rule matches a control on role, accessible name, and where it sits.
// `pages` limits a rule to certain paths; leave it out for site-wide controls.

const ANY = /.*/;

// The five ported blog posts (src/data/blog.js). Listed by hand, matching
// this file's own "expected shape, not derived from app code" convention;
// update alongside blog.js if an article is added, renamed or removed.
const BLOG_ARTICLE_PATHS = [
  '/blog/medical-grade-laser-hair-removal-a-london-case-study-in-permanent-smoothness',
  '/blog/microneedling-for-acne-scars-a-comprehensive-guide-to-skin-resurfacing',
  '/blog/professional-skincare-in-east-ham-a-guide-to-advanced-clinical-treatments',
  '/blog/the-ultimate-guide-to-dermaplaning-benefits-for-skin-achieve-a-london-glow',
  '/blog/laser-hair-removal-in-east-london'
];

export const CLICKABLE_RULES = [
  // Header. NAV_ITEMS now also renders Home, About us and Contact us as
  // plain links, so they join the one regex instead of each getting its
  // own line.
  { zone: 'header', role: 'link', name: 'MerryGold Home', covers: 'HDR-01' },
  { zone: 'header', role: 'link', name: /^(Home|Treatments|Results|Shop|About us|Contact us)$/, covers: 'HDR-02..05' },
  { zone: 'header', role: 'link', name: 'Book an appointment', covers: 'HDR-06' },
  { zone: 'header', role: 'button', name: 'Find my treatment', covers: 'HDR-07, HDR-11' },
  { zone: 'header', role: 'button', name: /^Open bag with/, covers: 'HDR-08' },
  { zone: 'header', role: 'link', name: 'Chat on WhatsApp', covers: 'EXT-01' },
  { zone: 'header', role: 'button', name: 'Toggle navigation menu', covers: 'MOB-01' },
  { zone: 'header', role: 'link', name: ANY, href: /^\/treatments\/[a-z-]+$/, covers: 'HDR-10' },
  { zone: 'header', role: 'link', name: /^MerryGold (Instagram|Facebook|TikTok)$/, covers: 'HDR-12, HDR-13' },

  // Duplicate social icons, main nav and Book over the home hero, shown only
  // until the visitor scrolls and the header's own copy takes over.
  { zone: 'hero-bar', role: 'link', name: /^MerryGold (Instagram|Facebook|TikTok)$/, covers: 'HDR-12, HDR-13' },
  { zone: 'hero-bar', role: 'link', name: /^(Home|Treatments|Results|Shop|About us|Contact us)$/, covers: 'HDR-14' },
  { zone: 'hero-bar', role: 'button', name: 'Find my treatment', covers: 'HDR-14' },
  { zone: 'hero-bar', role: 'link', name: 'Book an appointment', covers: 'HDR-14' },
  { zone: 'hero-bar', role: 'button', name: 'Open menu', covers: 'HDR-14' },

  // Mobile nav drawer: the same NAV_ITEMS as the header, Book styled as a
  // button-like link inside the list, then Bag as the final control.
  { zone: 'drawer', role: 'link', name: /^(Home|Treatments|Results|Book an appointment|Shop|About us|Contact us)$/, covers: 'MOB-03..09' },
  { zone: 'drawer', role: 'button', name: 'Find my treatment', covers: 'MOB-10' },
  { zone: 'drawer', role: 'button', name: /^Bag/, covers: 'MOB-13' },

  // Mobile booking bar
  { zone: 'sticky', role: 'link', name: 'Call MerryGold Clinic', covers: 'EXT-12' },
  { zone: 'sticky', role: 'link', name: 'Chat on WhatsApp', covers: 'EXT-03' },
  { zone: 'sticky', role: 'link', name: 'Book', covers: 'STK-02, STK-03' },
  { zone: 'sticky', role: 'button', name: 'Open Ask Olu chat', covers: 'STK-04' },

  // Footer
  { zone: 'footer', role: 'link', name: 'MerryGold Beauty & Aesthetics Clinics', covers: 'FTR-01' },
  { zone: 'footer', role: 'link', name: /^MerryGold (Instagram|Facebook|TikTok)$/, covers: 'EXT-07, EXT-08' },
  { zone: 'footer', role: 'link', name: ANY, href: /^\/treatments\/[a-z-]+$/, covers: 'FTR-04..08' },
  { zone: 'footer', role: 'link', name: 'Pricing', covers: 'LNK-02' },
  { zone: 'footer', role: 'link', name: 'Clinic Training', covers: 'FTR-09' },
  { zone: 'footer', role: 'button', name: 'Find my treatment', covers: 'FTR-10' },
  { zone: 'footer', role: 'link', name: ANY, href: /^\/shop\?product=/, covers: 'FTR-11..14' },
  { zone: 'footer', role: 'link', name: 'All skincare', covers: 'FTR-23' },
  { zone: 'footer', role: 'link', name: 'About us', covers: 'FTR-24' },
  { zone: 'footer', role: 'link', name: 'The clinic', covers: 'FTR-25' },
  { zone: 'footer', role: 'link', name: 'Results', covers: 'FTR-26' },
  { zone: 'footer', role: 'link', name: 'Blog', covers: 'FTR-27' },
  { zone: 'footer', role: 'link', name: 'Contact us', covers: 'FTR-28' },
  { zone: 'footer', role: 'link', name: 'Book on Treatwell', covers: 'EXT-15' },
  { zone: 'footer', role: 'link', name: ANY, href: /^(tel|mailto):/, covers: 'EXT-10' },
  { zone: 'footer', role: 'link', name: /^(Privacy Policy|Cookie Notice|Terms and policies)$/, covers: 'FTR-19..21' },

  // Ask Olu launcher and its direct-access chips
  { zone: 'chat', role: 'button', name: /Ask Olu chat$/, covers: 'GLD-01' },
  { zone: 'chat', role: 'link', name: 'Book a treatment', covers: 'GLD-11' },
  { zone: 'chat', role: 'button', name: 'Free consultation', covers: 'GLD-13' },
  { zone: 'chat', role: 'link', name: 'WhatsApp', covers: 'GLD-12' },

  // Home. The hero, the treatments section and the booking card all say
  // "Find my treatment" now, so one rule covers all three instead of three
  // near-identical ones; the tel: rule below already covers the new hero
  // phone link too, since it matches on href, not name.
  { pages: ['/'], zone: 'main', role: 'link', name: 'Treatments', covers: 'HOME-01' },
  { pages: ['/'], zone: 'main', role: 'button', name: 'Find my treatment', covers: 'HOME-02, HOME-03, HOME-11' },
  { pages: ['/'], zone: 'main', role: 'button', className: 'category-tab-pill', name: ANY, covers: 'HOME-04' },
  { pages: ['/'], zone: 'main', role: 'link', name: 'About this treatment', covers: 'HOME-05' },
  { pages: ['/'], zone: 'main', role: 'link', name: 'All Treatments', covers: 'HOME-06' },
  { pages: ['/'], zone: 'main', role: 'link', name: 'View Shop', covers: 'HOME-07' },
  { pages: ['/'], zone: 'main', role: 'button', className: 'case-study-tab', name: ANY, covers: 'HOME-09' },
  { pages: ['/'], zone: 'main', role: 'link', name: 'View Results', covers: 'HOME-10' },
  { pages: ['/'], zone: 'main', role: 'link', name: ANY, href: /^tel:/, covers: 'HOME-12' },
  { pages: ['/'], zone: 'main', role: 'link', name: 'Book an appointment', covers: 'HOME-16' },
  { pages: ['/'], zone: 'main', role: 'link', name: 'About us', covers: 'HOME-14' },
  { pages: ['/'], zone: 'main', role: 'link', name: 'About Oluwakemi Okunniyi', covers: 'HOME-15' },
  // Shared by the live Google reviews band and the curated reviews section;
  // both render at zone 'main' on the home page.
  { pages: ['/'], zone: 'main', role: 'link', name: 'See all on Google', covers: 'GRV-02, GRV-03' },
  { pages: ['/', '/about'], zone: 'main', role: 'button', name: 'Book a free consultation', covers: 'BB-05, BB-06' },

  // Treatment cards (home and treatments page)
  { pages: ['/', '/treatments'], zone: 'main', role: 'button', name: 'Book', covers: 'BB-01, BB-02' },
  { pages: ['/', '/treatments'], zone: 'main', role: 'button', name: 'Enquire', covers: 'OTH-08' },

  // Treatments page
  { pages: ['/treatments'], zone: 'main', role: 'link', className: 'cat-filter-btn', name: ANY, covers: 'TRT-02, TRT-03' },
  { pages: ['/treatments'], zone: 'main', role: 'select', name: 'Sort', covers: 'TRT-31' },
  { pages: ['/treatments'], zone: 'main', role: 'button', name: 'Find my treatment', covers: 'TRT-L1' },
  { pages: ['/treatments'], zone: 'main', role: 'link', name: ANY, href: /^\/treatments\/[a-z0-9-]+$/, covers: 'TRT-20' },

  // Pricing page
  { pages: ['/pricing'], zone: 'main', role: 'link', name: ANY, covers: 'PRC-01' },

  // Treatment detail sheet (phone row -> /treatments/:slug)
  { zone: 'dialog', role: 'button', name: 'Book', covers: 'TRT-21' },
  { zone: 'dialog', role: 'button', name: 'Close', covers: 'TRT-22' },

  // Consultation sheet (opened from the free-consultation button anywhere on the site)
  { zone: 'dialog', role: 'button', name: 'Send request', covers: 'FRM-CS01..CS03' },

  // Checkout modal (Book/Buy on any page opens it, so no `pages` filter).
  // Submitting hands off to Stripe's own hosted page, which is outside this site.
  { zone: 'main', role: 'button', name: 'Continue to payment', covers: 'CHK-02, CHK-03, CHK-06' },

  // Checkout result pages. Not in ROUTES/site.js (success needs a real Stripe
  // session id, so the coverage crawl never lands here), but named for when a
  // test opens them directly.
  { pages: ['/checkout/cancelled', '/checkout/success'], zone: 'main', role: 'button', name: 'Open your bag', covers: 'CHK-11' },
  { pages: ['/checkout/cancelled', '/checkout/success'], zone: 'main', role: 'link', name: 'Back to home', covers: 'CHK-11' },

  // Product cards (home and shop)
  { pages: ['/', '/shop'], zone: 'main', role: 'other', className: 'product-card', name: ANY, covers: 'HOME-08, SHP-04' },
  { pages: ['/', '/shop'], zone: 'main', role: 'button', name: /^Quick view /, covers: 'HOME-08, SHP-04' },
  { pages: ['/', '/shop'], zone: 'main', role: 'button', name: 'Add to formulation bag', covers: 'CRT-01' },
  { pages: ['/', '/shop'], zone: 'main', role: 'button', name: 'Buy', covers: 'BB-03' },

  // Shop page
  { pages: ['/shop'], zone: 'main', role: 'button', className: 'shop-filter-pill', name: ANY, covers: 'SHP-01, SHP-02' },

  // Results sliders (home and results)
  { pages: ['/', '/results'], zone: 'main', role: 'other', className: 'slider-viewport', name: ANY, covers: 'UI-06' },

  // Training form
  { pages: ['/training'], zone: 'main', role: 'checkbox', name: ANY, covers: 'FRM-T03' },
  { pages: ['/training'], zone: 'main', role: 'select', name: ANY, covers: 'FRM-T04' },
  { pages: ['/training'], zone: 'main', role: 'button', name: 'Send enquiry', covers: 'FRM-T01..T09' },
  { pages: ['/training'], zone: 'main', role: 'other', className: 'training-check', name: ANY, covers: 'FRM-T03' },

  // About page (the free-consultation button rule for pages ['/', '/about'] belongs to
  // whichever agent wires up the home page's own button; not duplicated here)
  { pages: ['/about'], zone: 'main', role: 'link', name: 'Book an appointment', covers: 'ABT-01' },
  { pages: ['/about'], zone: 'main', role: 'link', name: 'WhatsApp', covers: 'ABT-02' },
  { pages: ['/about'], zone: 'main', role: 'link', name: 'See the clinic', covers: 'ABT-03' },
  { pages: ['/about'], zone: 'main', role: 'link', name: 'Contact us', covers: 'ABT-04' },

  // Contact page
  { pages: ['/contact'], zone: 'main', role: 'link', name: ANY, href: /^(tel|mailto):/, covers: 'EXT-11' },
  { pages: ['/contact'], zone: 'main', role: 'link', name: 'WhatsApp', covers: 'EXT-04' },
  { pages: ['/contact'], zone: 'main', role: 'link', name: 'Open in Google Maps', covers: 'EXT-13' },
  { pages: ['/contact'], zone: 'main', role: 'button', name: 'Send enquiry', covers: 'FRM-C01..C04' },

  // Blog
  { pages: ['/blog'], zone: 'main', role: 'link', name: 'Read article', covers: 'BLG-01' },
  { pages: ['/blog'], zone: 'main', role: 'link', name: ANY, href: /^\/blog\//, covers: 'BLG-02' },
  // /blog/:slug is not in ROUTES, so the site-wide crawl never opens an
  // article page, but the controls are real and get their own spec (29).
  { pages: BLOG_ARTICLE_PATHS, zone: 'main', role: 'link', name: 'Back to blog', covers: 'BLG-03' },
  { pages: BLOG_ARTICLE_PATHS, zone: 'main', role: 'link', name: 'Book an appointment', covers: 'BLG-04' },

  // Legal pages
  { pages: ['/privacy'], zone: 'main', role: 'link', name: 'Cookie Notice', covers: 'PRV-01' },
  { pages: ['/privacy', '/terms'], zone: 'main', role: 'link', name: ANY, href: /^mailto:/, covers: 'PRV-02, TRM-02' },
  { pages: ['/cookies'], zone: 'main', role: 'link', name: 'Privacy Policy', covers: 'COO-01' },
  { pages: ['/terms'], zone: 'main', role: 'link', name: 'training page', covers: 'TRM-01' },
  { pages: ['/terms'], zone: 'main', role: 'link', name: ANY, href: '/privacy', covers: 'TRM-03' },

  // Orders dashboard (staff only, noindex; not in ROUTES so the site-wide
  // crawl never opens it, but the controls are real and get their own spec, 28)
  { pages: ['/admin/orders'], zone: 'main', role: 'button', name: 'Sign in', covers: 'ORD-01' },
  { pages: ['/admin/orders'], zone: 'main', role: 'button', name: 'Sign out', covers: 'ORD-02' },
  { pages: ['/admin/orders'], zone: 'main', role: 'button', name: 'Refresh', covers: 'ORD-03' },
  { pages: ['/admin/orders'], zone: 'main', role: 'button', name: 'Load more', covers: 'ORD-04' },
  { pages: ['/admin/orders'], zone: 'main', role: 'link', name: 'View in Stripe', covers: 'ORD-05' }
];

function textMatches(expected, actual) {
  if (expected instanceof RegExp) return expected.test(actual);
  return expected === actual;
}

export function ruleFor(control, pagePath) {
  return CLICKABLE_RULES.find((rule) =>
    (!rule.pages || rule.pages.includes(pagePath)) &&
    rule.zone === control.zone &&
    rule.role === control.role &&
    (!rule.className || control.classes.includes(rule.className)) &&
    textMatches(rule.name, control.name) &&
    (rule.href === undefined || textMatches(rule.href, control.href || ''))
  );
}

// Runs in the browser. Lists every control a visitor can see and use, with the
// facts the rules above match on.
export function collectVisibleControls() {
  const INTERACTIVE_CURSORS = new Set(['pointer', 'grab', 'ew-resize', 'col-resize']);
  const isVisible = (el) => {
    const rect = el.getBoundingClientRect();
    const style = getComputedStyle(el);
    return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none' && Number(style.opacity) > 0.01;
  };
  const zoneOf = (el) => {
    if (el.closest('.mobile-sticky-bar')) return 'sticky';
    if (el.closest('header.navbar-header')) return 'header';
    if (el.closest('.mobile-nav-panel')) return 'drawer';
    if (el.closest('.hero-bar')) return 'hero-bar';
    if (el.closest('footer.clinic-footer')) return 'footer';
    if (el.closest('.goldie-chat-wrapper')) return 'chat';
    if (el.closest('.cookie-notice')) return 'cookie';
    if (el.closest('[role="dialog"]')) return 'dialog';
    return 'main';
  };
  const nameOf = (el) => {
    const label = el.getAttribute('aria-label');
    if (label) return label.trim();
    // textContent, not innerText: innerText applies CSS text-transform, so an
    // uppercase-styled "Treatments" would read as "TREATMENTS".
    if (el.labels && el.labels.length) return el.labels[0].textContent.replace(/\s+/g, ' ').trim();
    const text = (el.textContent || '').replace(/\s+/g, ' ').trim();
    if (text) return text.slice(0, 120);
    const img = el.querySelector('img[alt]');
    if (img) return img.getAttribute('alt').trim();
    return (el.getAttribute('title') || '').trim();
  };
  const roleOf = (el) => {
    if (el.matches('a[href]')) return 'link';
    if (el.matches('button, [role=button], input[type=submit], input[type=button]')) return 'button';
    if (el.matches('input[type=checkbox]')) return 'checkbox';
    if (el.matches('select')) return 'select';
    return 'other';
  };

  const semantic = [...document.querySelectorAll('a[href], button, [role=button], input[type=submit], input[type=button], input[type=checkbox], select')];
  const controls = new Set(semantic);
  for (const el of document.querySelectorAll('body *')) {
    if (controls.has(el)) continue;
    if (!INTERACTIVE_CURSORS.has(getComputedStyle(el).cursor)) continue;
    // Skip children of a control, and wrappers whose only job is to hold one.
    if (semantic.some((control) => control.contains(el) || el.contains(control) && el.matches('label'))) continue;
    const parent = el.parentElement;
    if (parent && INTERACTIVE_CURSORS.has(getComputedStyle(parent).cursor)) continue;
    controls.add(el);
  }

  return [...controls]
    .filter((el) => (el.matches('input[type=checkbox]') ? isVisible(el.closest('label') || el) : isVisible(el)))
    .map((el) => ({
      role: roleOf(el),
      name: nameOf(el),
      href: el.getAttribute('href'),
      zone: zoneOf(el),
      classes: String(el.className || '').split(/\s+/).filter(Boolean)
    }));
}
