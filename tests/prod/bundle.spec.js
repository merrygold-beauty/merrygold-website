import { test, expect } from '@playwright/test';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import path from 'node:path';
import { ROUTES, DEAD_DOMAIN } from '../support/site.js';

// Inspects the production build on disk. The prod web server runs `npm run
// build` before any test starts, so dist/ is always the current code.

const distDir = () => path.join(path.dirname(test.info().config.configFile), 'dist');

function filesIn(dir) {
  const found = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) found.push(...filesIn(full));
    else found.push(full);
  }
  return found;
}

test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name !== 'prod-mobile', 'the build is the same for every device; checked once');
});

test.describe('What the production build ships', () => {
  test('BND-01 the JavaScript contains no API key and no direct call to the AI service', () => {
    const scripts = filesIn(distDir()).filter((file) => file.endsWith('.js'));
    const findings = scripts.flatMap((file) => {
      const text = readFileSync(file, 'utf8');
      const hits = [];
      if (/sk-or-v1-[a-z0-9]{10,}/i.test(text)) hits.push('an OpenRouter key');
      if (/openrouter\.ai\/api/.test(text)) hits.push('a direct OpenRouter call');
      return hits.map((hit) => `${path.basename(file)}: ${hit}`);
    });
    expect(findings).toEqual([]);
  });

  test('BND-02 nothing in the build refers to the retired domain', () => {
    const offenders = filesIn(distDir())
      .filter((file) => /\.(html|js|xml|txt|json|webmanifest)$/.test(file))
      .filter((file) => readFileSync(file, 'utf8').includes(DEAD_DOMAIN))
      .map((file) => path.relative(distDir(), file));
    expect(offenders).toEqual([]);
  });

  test('BND-03 the JavaScript a phone downloads is under 250KB compressed', () => {
    const scripts = filesIn(distDir()).filter((file) => file.endsWith('.js'));
    const gzipped = scripts.reduce((sum, file) => sum + gzipSync(readFileSync(file)).length, 0);
    expect(Math.round(gzipped / 1024), 'compressed JavaScript in KB').toBeLessThanOrEqual(250);
  });

  // about.html, not about/index.html: Cloudflare Pages serves about.html at
  // /about itself, but answers /about with a redirect to /about/ for the
  // folder form, which is not the canonical address.
  test('BND-04 every page has its own HTML file', () => {
    const missing = ROUTES.filter((route) => route.path !== '/')
      .map((route) => `${route.path.slice(1)}.html`)
      .filter((file) => !existsSync(path.join(distDir(), file)));
    expect(missing).toEqual([]);
  });

  test('BND-05 the build ships a not-found page and the redirect file', () => {
    expect(existsSync(path.join(distDir(), '404.html')), '404.html').toBe(true);
    expect(existsSync(path.join(distDir(), '_redirects')), '_redirects').toBe(true);
  });

  test('BND-06 no draft, debug or unused brand file is published, and no file is over 1MB apart from the hero video', () => {
    const published = filesIn(distDir()).map((file) => ({ file: path.relative(distDir(), file), bytes: statSync(file).size }));
    const drafts = published.filter((entry) => /draft|debug|agy-|layers[\\/]|\.bak$/i.test(entry.file)).map((entry) => entry.file);
    const heavy = published.filter((entry) => entry.bytes > 1024 * 1024 && !/\.mp4$/.test(entry.file)).map((entry) => `${Math.round(entry.bytes / 1024)}KB ${entry.file}`);
    expect(drafts, 'files that should not be public').toEqual([]);
    expect(heavy, 'files over 1MB').toEqual([]);
  });

  test('BND-07 the built pages declare British English', () => {
    expect(readFileSync(path.join(distDir(), 'index.html'), 'utf8')).toMatch(/<html lang="en-GB"/);
  });
});
