// The expected shape of the site, in one place. Tests assert against these
// values; when the site genuinely changes, change it here once.

export const CANONICAL_ORIGIN = 'https://www.merrygoldbeautyclinics.com';

// The retired domain that never resolved. Nothing public may reference it.
export const DEAD_DOMAIN = 'merrygoldclinic.co.uk';

// Every route a visitor can reach today. `h1` proves the right page opened;
// `topic` is the word the page's <title> must contain.
export const ROUTES = [
  { path: '/', h1: 'Your confidant for your best skin', topic: 'MerryGold' },
  { path: '/treatments', h1: 'Treatments', topic: 'Treatments' },
  { path: '/pricing', h1: 'Pricing Guide', topic: 'Pricing' },
  { path: '/shop', h1: 'Shop', topic: 'Shop' },
  { path: '/results', h1: 'Results', topic: 'Results' },
  { path: '/the-clinic', h1: 'The Clinic', topic: 'Clinic' },
  { path: '/about', h1: 'About us', topic: 'About' },
  { path: '/contact', h1: 'Contact us', topic: 'Contact' },
  { path: '/training', h1: 'Clinic Training', topic: 'Training' },
  { path: '/blog', h1: 'Blog', topic: 'Blog' },
  { path: '/privacy', h1: 'Privacy Policy', topic: 'Privacy' },
  { path: '/cookies', h1: 'Cookie Notice', topic: 'Cookie' },
  { path: '/terms', h1: 'Terms and policies', topic: 'Terms' }
];

// Pages the build plan adds. Tests for them fail until they exist, which is
// the point: they are the acceptance criteria.
export const PLANNED_ROUTES = [];

export const routeByPath = (path) =>
  [...ROUTES, ...PLANNED_ROUTES].find((route) => route.path === path);

// The site's URL scheme (category pages added 2026-10-03). Treatments keep their
// flat /treatments/<slug> address, so the category argument is unused. Products
// have no pages of their own yet, so productUrl is still only a proposal.
export const categoryUrl = (categoryId) => `/treatments/${categoryId}`;
export const treatmentUrl = (_categoryId, treatmentSlug) => `/treatments/${treatmentSlug}`;
export const productUrl = (productSlug) => `/shop/${productSlug}`;
export const articleUrl = (articleSlug) => `/blog/${articleSlug}`;

// Names as the mega menu and category pills show them, in the owner's order
// (2026-09-24).
export const CATEGORIES = [
  { id: 'skin-facials', name: 'Facials & Advanced Skin' },
  { id: 'laser-hair-removal', name: 'Laser Hair Removal / Laser Treatment' },
  { id: 'massage-wellbeing', name: 'Massage & Wellbeing' },
  { id: 'brows-lashes', name: 'Brows & Lashes' },
  { id: 'waxing-threading', name: 'Waxing & Facial Threading' },
  { id: 'semi-permanent-makeup', name: 'Semi-Permanent Makeup' },
  { id: 'makeup-glam', name: 'Editorial & Bridal Makeup' }
];

export const CLINIC = {
  phoneHref: 'tel:+447939402111',
  emailHref: 'mailto:hello@merrygoldbeautyclinics.com',
  email: 'hello@merrygoldbeautyclinics.com',
  treatwellBookingUrl: 'https://trea.tw/bGnj8v279digB9A3f',
  // The clinic's own WhatsApp. The site currently routes to a test handset on
  // purpose (see clinic.js); only the go-live check insists on this number.
  whatsappClinic: '447939402111',
  whatsappTestHandset: '447939402111',
  instagram: 'https://www.instagram.com/merrygoldbeautyclinicltd/',
  tiktok: 'https://www.tiktok.com/@merrygoldbeauty',
  // Not live yet; mirrors clinic.js's social.facebook. Tests that check for a
  // Facebook link must handle null instead of asserting a URL.
  facebook: null,
  legalName: 'Merrygold Beauty and Aesthetics Clinics Limited',
  companyNumber: '16606278',
  postcode: 'IG11 8RT'
};

export const WHATSAPP_NUMBERS = [CLINIC.whatsappClinic, CLINIC.whatsappTestHandset];

// Third-party hosts a normal visit may load from. Anything else is a tracker
// or an unplanned dependency.
export const ALLOWED_THIRD_PARTY_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

// Hosts that open in a new tab. Tests serve a stub page for them so a run never
// depends on WhatsApp, Instagram, or TikTok being up.
export const EXTERNAL_HOST_PATTERN =
  /^https:\/\/(wa\.me|api\.whatsapp\.com|www\.instagram\.com|www\.tiktok\.com|www\.google\.com|maps\.google\.com|maps\.app\.goo\.gl)\//;

// Viewports for layout checks, phone first.
export const VIEWPORTS = [
  { name: 'small phone', width: 320, height: 640 },
  { name: 'android', width: 360, height: 780 },
  { name: 'iphone', width: 390, height: 844 },
  { name: 'large phone', width: 430, height: 932 },
  { name: 'phone landscape', width: 844, height: 390 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'small laptop', width: 1024, height: 768 },
  { name: 'laptop', width: 1280, height: 800 },
  { name: 'desktop', width: 1920, height: 1080 }
];

// Breakpoints taken from the CSS: the desktop nav hides at 1280px (eight
// NAV_ITEMS plus the inline Book button need the extra room) and the sticky
// booking bar appears at 768px.
export const NAV_COLLAPSE_MAX = 1280;
export const STICKY_BAR_MAX = 768;
