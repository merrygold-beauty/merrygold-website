import { test, expect } from '../support/fixtures.js';
import { ROUTES, CANONICAL_ORIGIN } from '../support/site.js';

// What a search engine or a link preview sees before any JavaScript runs. This
// is the check that decides whether the site can be indexed properly: a
// client-rendered page answers every URL with the same empty shell.

const decode = (text) => text.replace(/&amp;/g, '&').replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>');

function readHead(html) {
  const meta = (pattern) => decode((html.match(pattern) || [])[1] || '');
  return {
    title: decode((html.match(/<title[^>]*>([^<]*)<\/title>/i) || [])[1] || ''),
    description: meta(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i),
    canonical: meta(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']*)["']/i),
    ogTitle: meta(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']*)["']/i),
    ogImage: meta(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']*)["']/i),
    h1: decode(((html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [])[1] || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()),
    jsonLdBlocks: (html.match(/<script[^>]+type=["']application\/ld\+json["']/gi) || []).length,
    words: html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length
  };
}

test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name !== 'prod-mobile', 'raw HTML is the same for every device; checked once');
});

test.describe('The HTML each page sends before JavaScript runs', () => {
  for (const route of ROUTES) {
    test(`PRD-01 ${route.path} sends its own title, description, canonical, heading and content`, async ({ request }) => {
      const response = await request.get(route.path);
      expect(response.status()).toBe(200);
      const head = readHead(await response.text());
      expect(head.title, 'title in the HTML').toContain(route.topic);
      expect(head.description.length, 'meta description in the HTML').toBeGreaterThanOrEqual(70);
      expect(head.canonical, 'canonical in the HTML').toBe(`${CANONICAL_ORIGIN}${route.path}`);
      expect(head.ogTitle, 'og:title in the HTML').toBeTruthy();
      expect(head.ogImage, 'og:image in the HTML').toMatch(/^https:\/\//);
      expect(head.h1, 'main heading in the HTML').toContain(route.h1);
      expect(head.jsonLdBlocks, 'structured data in the HTML').toBeGreaterThan(0);
      expect(head.words, 'real page content in the HTML, not an empty shell').toBeGreaterThan(80);
    });
  }

  test('PRD-02 no two pages send the same title', async ({ request }) => {
    const titles = [];
    for (const route of ROUTES) titles.push(readHead(await (await request.get(route.path)).text()).title);
    expect(new Set(titles).size, `titles sent: ${[...new Set(titles)].join(' | ')}`).toBe(ROUTES.length);
  });

  test('PRD-03 the title in the HTML is the title the page keeps once it has loaded', async ({ page, request }) => {
    for (const route of ROUTES) {
      const sent = readHead(await (await request.get(route.path)).text()).title;
      await page.goto(route.path);
      await expect(page.locator('h1').first()).toBeAttached();
      expect(await page.title(), route.path).toBe(sent);
    }
  });

  test('PRD-04 with JavaScript switched off, every page still shows its heading and its links', async ({ browser, baseURL }) => {
    const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
    const page = await context.newPage();
    const empty = [];
    for (const route of ROUTES) {
      await page.goto(route.path);
      const h1 = await page.locator('h1').first().textContent().catch(() => null);
      const links = await page.locator('a[href^="/"]').count();
      if (!h1 || !h1.includes(route.h1) || links < 5) empty.push(`${route.path}: heading "${h1}", ${links} links`);
    }
    await context.close();
    expect(empty).toEqual([]);
  });
});
