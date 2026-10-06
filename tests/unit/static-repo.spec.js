import { test, expect } from '@playwright/test';
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { CANONICAL_ORIGIN, DEAD_DOMAIN, ROUTES, PLANNED_ROUTES } from '../support/site.js';
import { LEGACY_WORDPRESS_PATHS } from '../fixtures/legacy-wordpress-urls.js';

// Tests run from the folder holding playwright.config.js, which is the repo root.
const repoRoot = () => path.dirname(test.info().config.configFile);
const read = (relative) => readFileSync(path.join(repoRoot(), relative), 'utf8');

function filesUnder(relative, extensions) {
  const found = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir)) {
      const full = path.join(dir, entry);
      if (statSync(full).isDirectory()) walk(full);
      else if (extensions.some((ext) => entry.endsWith(ext))) found.push(full);
    }
  };
  walk(path.join(repoRoot(), relative));
  return found;
}

const sourceFiles = () => filesUnder('src', ['.js', '.jsx', '.css']);
const sitemapPaths = () =>
  [...read('public/sitemap.xml').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

// Cloudflare Pages _redirects: "from to [status]", with * and :placeholder.
function parseRedirects(text) {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .map((line) => {
      const [from, to, status = '302'] = line.split(/\s+/);
      const pattern = new RegExp(`^${from.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/:[a-z]+/gi, '[^/]+')}$`);
      return { from, to, status, pattern };
    });
}

test.describe('Search setup in the repository', () => {
  test('STA-01 nothing public points at the retired domain', () => {
    const files = [...sourceFiles(), ...filesUnder('public', ['.xml', '.txt', '.html', '.json']), path.join(repoRoot(), 'index.html')];
    const offenders = files.filter((file) => readFileSync(file, 'utf8').includes(DEAD_DOMAIN)).map((file) => path.relative(repoRoot(), file));
    expect(offenders).toEqual([]);
  });

  test('STA-02 robots.txt names the sitemap on the canonical host', () => {
    expect(read('public/robots.txt')).toContain(`Sitemap: ${CANONICAL_ORIGIN}/sitemap.xml`);
  });

  test('STA-03 every sitemap URL is on the canonical host', () => {
    const offHost = sitemapPaths().filter((url) => !url.startsWith(`${CANONICAL_ORIGIN}/`));
    expect(offHost).toEqual([]);
  });

  test('STA-04 the sitemap lists only pages the site actually serves', () => {
    const known = new Set([...ROUTES, ...PLANNED_ROUTES].map((route) => route.path));
    const dynamic = [/^\/treatments\/[a-z0-9-]+(\/[a-z0-9-]+)?$/, /^\/shop\/[a-z0-9-]+$/, /^\/blog\/[a-z0-9-]+$/];
    const unknown = sitemapPaths()
      .map((url) => new URL(url).pathname.replace(/\/$/, '') || '/')
      .filter((p) => !known.has(p) && !dynamic.some((pattern) => pattern.test(p)));
    expect(unknown).toEqual([]);
  });

  test('STA-05 every public page is in the sitemap', () => {
    const listed = new Set(sitemapPaths().map((url) => new URL(url).pathname.replace(/\/$/, '') || '/'));
    const missing = [...ROUTES, ...PLANNED_ROUTES].map((route) => route.path).filter((p) => !listed.has(p));
    expect(missing).toEqual([]);
  });

  test('STA-06 every old WordPress URL has a one-hop permanent redirect', () => {
    const file = path.join(repoRoot(), 'public/_redirects');
    expect(existsSync(file), 'public/_redirects must exist before launch').toBe(true);
    const rules = parseRedirects(readFileSync(file, 'utf8'));
    const problems = [];
    for (const legacy of LEGACY_WORDPRESS_PATHS.filter((p) => p !== '/')) {
      const rule = rules.find((r) => r.pattern.test(legacy));
      if (!rule) problems.push(`${legacy} has no redirect`);
      else if (rule.status !== '301') problems.push(`${legacy} redirects with ${rule.status}, not 301`);
      else if (rules.some((r) => r !== rule && r.pattern.test(rule.to))) problems.push(`${legacy} -> ${rule.to} chains into another redirect`);
    }
    expect(problems).toEqual([]);
  });

  test('STA-07 index.html declares British English and a zoomable viewport', () => {
    const html = read('index.html');
    expect(html).toMatch(/<html lang="en-GB"/);
    expect(html).toMatch(/name="viewport"/);
    expect(html).not.toMatch(/user-scalable\s*=\s*no|maximum-scale\s*=\s*1(\.0)?\b/);
  });
});

test.describe('Secrets and privacy in the repository', () => {
  test('STA-08 no secret is read into the browser bundle', () => {
    const offenders = sourceFiles()
      .filter((file) => /import\.meta\.env\.VITE_[A-Z_]*(KEY|SECRET|TOKEN|PASSWORD)/.test(readFileSync(file, 'utf8')))
      .map((file) => path.relative(repoRoot(), file));
    expect(offenders, 'VITE_ variables are published in the bundle; keys belong in a server function').toEqual([]);
  });

  test('STA-09 environment files stay out of git', () => {
    const ignore = read('.gitignore');
    expect(ignore).toMatch(/^\.env$/m);
    expect(ignore).toMatch(/^\.env\.\*$/m);
  });
});

test.describe('Code and copy hygiene', () => {
  test('STA-10 every page and component file is used somewhere', () => {
    const files = [...filesUnder('src/pages', ['.jsx', '.css']), ...filesUnder('src/components', ['.jsx', '.css'])];
    const everything = sourceFiles().map((file) => ({ file, text: readFileSync(file, 'utf8') }));
    const unused = files.filter((file) => {
      const base = path.basename(file);
      const stem = base.replace(/\.(jsx|css)$/, '');
      const importPattern = base.endsWith('.css') ? new RegExp(`['"][^'"]*/${base.replace('.', '\\.')}['"]`) : new RegExp(`from ['"][^'"]*/${stem}['"]`);
      return !everything.some(({ file: other, text }) => other !== file && importPattern.test(text));
    });
    expect(unused.map((file) => path.relative(repoRoot(), file))).toEqual([]);
  });

  test('STA-11 every image tag in the source has alt text', () => {
    const offenders = filesUnder('src', ['.jsx']).flatMap((file) =>
      [...readFileSync(file, 'utf8').matchAll(/<img\b(?![^>]*\balt=)[^>]*>/g)].map((m) => `${path.relative(repoRoot(), file)}: ${m[0].slice(0, 60)}`)
    );
    expect(offenders).toEqual([]);
  });

  test('STA-12 no em dash or en dash in words visitors read', () => {
    const files = [...filesUnder('src', ['.jsx']), ...filesUnder('src/data', ['.js']), path.join(repoRoot(), 'index.html')];
    const offenders = files.flatMap((file) =>
      readFileSync(file, 'utf8')
        .split('\n')
        .map((line, index) => ({ line, index }))
        .filter(({ line }) => /[–—]|&mdash;|&ndash;/.test(line))
        .map(({ index }) => `${path.relative(repoRoot(), file)}:${index + 1}`)
    );
    expect(offenders).toEqual([]);
  });

  test('STA-13 no laser technology or equipment brand is named in site copy', () => {
    const banned = /\b(diode|alexandrite|sapphire|soprano|alma lasers?|nd:?yag)\b/i;
    const offenders = [...filesUnder('src', ['.jsx']), ...filesUnder('src/data', ['.js']), path.join(repoRoot(), 'src/services/goldieChat.js')]
      .filter((file) => banned.test(readFileSync(file, 'utf8')))
      .map((file) => path.relative(repoRoot(), file));
    expect(offenders, 'the clinic machine is unverified, so copy must not name a technology').toEqual([]);
  });

  test('STA-14 no placeholder names left over from the design brief', () => {
    const offenders = [...filesUnder('src', ['.jsx', '.js'])]
      .filter((file) => /\bAlex\b|Lorem ipsum|TODO copy|placeholder copy/i.test(readFileSync(file, 'utf8')))
      .map((file) => path.relative(repoRoot(), file));
    expect(offenders).toEqual([]);
  });
});

test.describe('Checkout price index', () => {
  // The checkout Pages Functions price every order from catalogueIndex.js,
  // never from the client, so a stale index would let checkout charge the
  // wrong amount. "node scripts/build-catalogue-index.mjs" (wired as
  // "prebuild") regenerates it from these same two data files.
  test('STA-15 catalogueIndex.js has every treatment and product at its current price', async () => {
    const index = (await import(pathToFileURL(path.join(repoRoot(), 'src/data/catalogueIndex.js')).href)).default;
    const byId = new Map(index.map((entry) => [entry.id, entry]));

    const treatmentsText = read('src/data/treatments.js');
    const treatmentBlocks = [...treatmentsText.slice(treatmentsText.indexOf('export const treatments = [')).matchAll(/^  \{([\s\S]*?)\n  \},?\n/gm)].map((m) => m[1]);
    const consultationBlock = treatmentsText.match(/export const consultation =\s*\{([\s\S]*?)\n\};/)[1];

    const productsText = read('src/data/products.js');
    const productBlocks = [...productsText.slice(productsText.indexOf('export const products = [')).matchAll(/^  \{([\s\S]*?)\n  \},?\n/gm)].map((m) => m[1]);

    const problems = [];
    const check = (block, source) => {
      const priceMatch = block.match(/\bprice:\s*([\d.]+)/);
      if (!priceMatch) return; // an unpriced treatment (price: null) has nothing to check
      const id = block.match(/\bid:\s*["']([^"']+)["']/)?.[1];
      const expectedPence = Math.round(Number(priceMatch[1]) * 100);
      const entry = byId.get(id);
      if (!entry) problems.push(`${source} ${id} is missing from catalogueIndex.js`);
      else if (entry.pence !== expectedPence) problems.push(`${source} ${id} is now £${priceMatch[1]} but the index still has ${entry.pence}p`);
    };

    treatmentBlocks.forEach((block) => check(block, 'treatment'));
    check(consultationBlock, 'treatment');
    productBlocks.forEach((block) => check(block, 'product'));

    expect(problems, 'run "node scripts/build-catalogue-index.mjs" to refresh the index').toEqual([]);
  });
});
