// Writes every page of the built site as its own HTML file, with its own title,
// description, canonical, share tags, structured data and its content already
// in place, so search engines and link previews see the real page before any
// JavaScript runs. Runs after `vite build` (the browser bundle in dist/) and
// `vite build --ssr` (the renderer in dist-ssr/); see "build" in package.json.
//
// Cloudflare Pages serves dist/about.html at /about. Because dist/404.html
// exists, an address with no file gets that page with a 404 status, so every
// route the app has must be written here.

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const DIST = 'dist';
const { render } = await import(pathToFileURL(path.resolve('dist-ssr/entry-server.js')).href);

// The sitemap is the one list of public pages (scripts/build-sitemap.mjs).
const sitemap = fs.readFileSync('public/sitemap.xml', 'utf8');
const publicPaths = [...sitemap.matchAll(/<loc>https?:\/\/[^/]+([^<]*)<\/loc>/g)].map((m) => m[1] || '/');

// Pages the app serves that stay out of search (they carry noindex).
const privatePaths = ['/checkout/success', '/checkout/cancelled', '/admin/orders'];

// Rendered at an address no route claims, so the app draws its not-found page.
const NOT_FOUND_RENDER_PATH = '/__not-found';

const template = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');
for (const placeholder of ['<!--page-head-->', '<!--page-html-->']) {
  if (!template.includes(placeholder)) throw new Error(`index.html has lost its ${placeholder} placeholder`);
}

function writePage(renderPath, file) {
  const { appHtml, headHtml, noindex } = render(renderPath);
  // Replacer functions: a "$" in the page text must not be read as a pattern.
  const html = template.replace('<!--page-head-->', () => headHtml).replace('<!--page-html-->', () => appHtml);
  const target = path.join(DIST, file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, html);
  return noindex;
}

const fileFor = (pagePath) => (pagePath === '/' ? 'index.html' : `${pagePath.slice(1)}.html`);

const problems = [];
for (const pagePath of publicPaths) {
  if (writePage(pagePath, fileFor(pagePath))) problems.push(`${pagePath} is in the sitemap but rendered as noindex (not found?)`);
}
for (const pagePath of privatePaths) {
  if (!writePage(pagePath, fileFor(pagePath))) problems.push(`${pagePath} should be noindex`);
}
writePage(NOT_FOUND_RENDER_PATH, '404.html');

if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}
console.log(`Pre-rendered ${publicPaths.length} public pages, ${privatePaths.length} private pages and 404.html`);
