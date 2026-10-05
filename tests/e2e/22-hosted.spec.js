import { test, expect } from '../support/fixtures.js';
import { ROUTES, CANONICAL_ORIGIN } from '../support/site.js';
import { LEGACY_WORDPRESS_PATHS } from '../fixtures/legacy-wordpress-urls.js';

// Checks that only a real host can answer: status codes, redirects and headers.
// Run against a deployment:
//   $env:MG_BASE_URL="https://<preview>.pages.dev"; $env:MG_HOSTED="preview"; npx playwright test tests/e2e/22-hosted.spec.js --project=mobile
// Use MG_HOSTED="production" once the domain points at the new site.

const HOSTED = process.env.MG_HOSTED;

test.beforeEach(({ }, testInfo) => {
  test.skip(!HOSTED, 'set MG_BASE_URL and MG_HOSTED=preview|production to check a deployment');
  test.skip(testInfo.project.use?.isMobile !== true, 'hosted checks run once, in the phone project');
});

test.describe('Hosting behaviour', () => {
  test('HST-01 every page answers 200', async ({ request }) => {
    const failing = [];
    for (const route of ROUTES) {
      const response = await request.get(route.path, { maxRedirects: 0 });
      if (response.status() !== 200) failing.push(`${route.path}: ${response.status()}`);
    }
    expect(failing).toEqual([]);
  });

  test('HST-02 an unknown address answers 404, not the home page', async ({ request }) => {
    const response = await request.get('/this-page-does-not-exist', { maxRedirects: 0 });
    expect(response.status()).toBe(404);
  });

  test('HST-03 every old WordPress address answers one 301 to a page that answers 200', async ({ request }) => {
    const problems = [];
    for (const legacy of LEGACY_WORDPRESS_PATHS.filter((p) => p !== '/')) {
      const first = await request.get(legacy, { maxRedirects: 0 });
      const location = first.headers().location;
      if (first.status() !== 301 || !location) {
        problems.push(`${legacy}: ${first.status()}`);
        continue;
      }
      const second = await request.get(location, { maxRedirects: 0 });
      if (second.status() !== 200) problems.push(`${legacy} -> ${location}: ${second.status()}`);
    }
    expect(problems).toEqual([]);
  });

  test('HST-04 security headers are set', async ({ request }) => {
    const headers = (await request.get('/')).headers();
    expect(headers['strict-transport-security']).toMatch(/max-age=\d{7,}/);
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['referrer-policy']).toBeTruthy();
    expect(headers['permissions-policy']).toBeTruthy();
    expect(headers['content-security-policy'] || '').toMatch(/frame-ancestors|default-src/);
  });

  test('HST-05 fingerprinted assets are cached for a year and pages are not cached long', async ({ request, page }) => {
    await page.goto('/');
    const script = await page.evaluate(() => [...document.scripts].map((s) => s.src).find((src) => /\/assets\/.+\.js$/.test(src)));
    expect(script, 'a built script under /assets').toBeTruthy();
    expect((await request.get(script)).headers()['cache-control']).toMatch(/max-age=31536000|immutable/);
    expect((await request.get('/')).headers()['cache-control'] || '').not.toMatch(/max-age=(3153600|[1-9]\d{5,})/);
  });

  test('HST-06 pages and scripts are sent compressed', async ({ request, page }) => {
    await page.goto('/');
    const script = await page.evaluate(() => [...document.scripts].map((s) => s.src).find((src) => /\.js$/.test(src)));
    for (const url of ['/', script]) {
      const response = await request.get(url, { headers: { 'accept-encoding': 'br, gzip' } });
      expect(response.headers()['content-encoding'], url).toMatch(/br|gzip|zstd/);
    }
  });

  test('HST-07 a preview is kept out of search; production is not', async ({ request }) => {
    const robotsHeader = (await request.get('/')).headers()['x-robots-tag'] || '';
    if (HOSTED === 'preview') expect(robotsHeader).toMatch(/noindex/);
    else expect(robotsHeader).not.toMatch(/noindex/);
  });

  test('HST-08 production: http and www arrive at the canonical host in one hop', async ({ request }) => {
    test.skip(HOSTED !== 'production', 'production only');
    // Derived from CANONICAL_ORIGIN instead of a second hardcoded domain, so
    // this keeps testing the live site's own host once that constant changes.
    const canonicalHost = new URL(CANONICAL_ORIGIN).host;
    for (const variant of [`http://${canonicalHost}/`, `https://www.${canonicalHost}/`]) {
      const response = await request.get(variant, { maxRedirects: 0 });
      expect([301, 308], variant).toContain(response.status());
      expect(response.headers().location).toBe(`${CANONICAL_ORIGIN}/`);
    }
  });
});
