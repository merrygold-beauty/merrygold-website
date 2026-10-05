// Writes public/sitemap.xml, the one list of public pages. scripts/prerender.mjs
// pre-renders exactly these pages, so a page added here is also built.

import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { SITE_ORIGIN } from '../src/data/clinic.js';

const TREATMENTS_FILE = 'src/data/treatments.js';
const BLOG_FILE = 'src/data/blog.js';

const treatmentsText = fs.readFileSync(TREATMENTS_FILE, 'utf8');

// Anchored to the start of a line (only optional indentation before it), so
// this matches an object literal's own `slug: "..."` field and never a
// mid-sentence example inside a `//` comment, such as blog.js's own header
// comment describing this exact regex.
const SLUG_LINE = /^\s*slug:\s*["']([^"']+)["']/gm;
const ID_LINE = /^\s*id:\s*["']([^"']+)["']/gm;

// Category ids come straight out of the treatmentCategories block, so a
// renamed or added category is picked up here without a second, hand-kept
// list drifting out of sync with it.
const categoriesBlock = treatmentsText.match(/export const treatmentCategories = \[([\s\S]*?)\n\];/)?.[1] || '';
const catSlugs = new Set([...categoriesBlock.matchAll(ID_LINE)].map((m) => m[1]));

// Only the treatments array: the consultation entry later in the file has a
// slug too but no page of its own.
const treatmentsBlock = treatmentsText.match(/export const treatments = \[([\s\S]*?)\n\];/)?.[1] || '';
const slugs = [...treatmentsBlock.matchAll(SLUG_LINE)].map((m) => m[1]);
console.log(`Found exactly ${slugs.length} treatment slugs and ${catSlugs.size} categories`);

const blogSlugs = [...fs.readFileSync(BLOG_FILE, 'utf8').matchAll(SLUG_LINE)].map((m) => m[1]);
console.log(`Found ${blogSlugs.length} blog slugs`);

function git(args) {
  return execFileSync('git', args, { encoding: 'utf8' }).trim();
}

// lastmod is the date of the last commit to the file the page is built from,
// so it only moves when the page really changed (SEO standard, item 5).
const lastCommits = new Map();
function lastCommit(file) {
  if (!lastCommits.has(file)) {
    const [hash, date] = git(['log', '-1', '--format=%H %cs', '--', file]).split(' ');
    if (!date) throw new Error(`${file} has no commit, so the sitemap has no lastmod for it`);
    lastCommits.set(file, { hash, date });
  }
  return lastCommits.get(file);
}

// A commit with no parent holds every file, so its date says nothing about
// when a page changed. That is the repository's starting snapshot, or the one
// commit a shallow clone fetches. For a file last touched there, the page keeps
// the lastmod already in the committed sitemap, which carries the real dates
// from before the snapshot.
const parentlessCommits = new Set(git(['rev-list', '--max-parents=0', 'HEAD']).split('\n'));
const committedLastmods = new Map(
  [...fs.readFileSync('public/sitemap.xml', 'utf8').matchAll(/<loc>([^<]+)<\/loc>\s*<lastmod>([^<]+)<\/lastmod>/g)]
    .map((match) => [match[1], match[2]])
);

function lastmodFor(route) {
  const { hash, date } = lastCommit(route.source);
  if (!parentlessCommits.has(hash)) return date;
  return committedLastmods.get(`${SITE_ORIGIN}${route.path}`) || date;
}

const routes = [
  { path: '/', source: 'src/pages/Home.jsx', priority: '1.0', changefreq: 'weekly' },
  { path: '/treatments', source: TREATMENTS_FILE, priority: '0.9', changefreq: 'weekly' },
  { path: '/pricing', source: TREATMENTS_FILE, priority: '0.8', changefreq: 'monthly' },
  { path: '/shop', source: 'src/data/products.js', priority: '0.8', changefreq: 'weekly' },
  { path: '/results', source: 'src/data/results.js', priority: '0.8', changefreq: 'weekly' },
  { path: '/the-clinic', source: 'src/pages/TheClinic.jsx', priority: '0.7', changefreq: 'monthly' },
  { path: '/about', source: 'src/pages/About.jsx', priority: '0.8', changefreq: 'monthly' },
  { path: '/contact', source: 'src/pages/Contact.jsx', priority: '0.7', changefreq: 'monthly' },
  { path: '/training', source: 'src/pages/Training.jsx', priority: '0.8', changefreq: 'monthly' },
  { path: '/blog', source: BLOG_FILE, priority: '0.8', changefreq: 'weekly' },
  { path: '/privacy', source: 'src/pages/Privacy.jsx', priority: '0.3', changefreq: 'yearly' },
  { path: '/cookies', source: 'src/pages/Cookies.jsx', priority: '0.3', changefreq: 'yearly' },
  { path: '/terms', source: 'src/pages/Terms.jsx', priority: '0.3', changefreq: 'yearly' },
  ...[...catSlugs].map((id) => ({ path: `/treatments/${id}`, source: TREATMENTS_FILE, priority: '0.8', changefreq: 'monthly' })),
  ...slugs.map((slug) => ({ path: `/treatments/${slug}`, source: TREATMENTS_FILE, priority: '0.7', changefreq: 'monthly' })),
  ...blogSlugs.map((slug) => ({ path: `/blog/${slug}`, source: BLOG_FILE, priority: '0.6', changefreq: 'monthly' }))
];

let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
for (const route of routes) {
  xml += '  <url>\n';
  xml += `    <loc>${SITE_ORIGIN}${route.path}</loc>\n`;
  xml += `    <lastmod>${lastmodFor(route)}</lastmod>\n`;
  xml += `    <changefreq>${route.changefreq}</changefreq>\n`;
  xml += `    <priority>${route.priority}</priority>\n`;
  xml += '  </url>\n';
}
xml += '</urlset>\n';

fs.writeFileSync('public/sitemap.xml', xml, 'utf8');
console.log(`Generated public/sitemap.xml with ${routes.length} URLs`);
