import { test, expect } from '../support/fixtures.js';
import { ROUTES, CATEGORIES, CANONICAL_ORIGIN, categoryUrl, treatmentUrl, productUrl, articleUrl, CLINIC } from '../support/site.js';
import { isPhoneProject, importAppData } from '../support/helpers.js';

// Search checks run in the phone project, because Google indexes the mobile
// rendering of a page. Raw-HTML checks (what a crawler sees before JavaScript)
// live in tests/prod, against the production build.

const head = (page) =>
  page.evaluate(() => {
    const meta = (selector) => document.querySelector(selector)?.getAttribute('content') ?? null;
    return {
      title: document.title,
      description: meta('meta[name="description"]'),
      robots: meta('meta[name="robots"]'),
      canonicals: [...document.querySelectorAll('link[rel="canonical"]')].map((l) => l.getAttribute('href')),
      ogTitle: meta('meta[property="og:title"]'),
      ogDescription: meta('meta[property="og:description"]'),
      ogImage: meta('meta[property="og:image"]'),
      ogUrl: meta('meta[property="og:url"]'),
      ogType: meta('meta[property="og:type"]'),
      twitterCard: meta('meta[name="twitter:card"]'),
      lang: document.documentElement.getAttribute('lang'),
      jsonLd: [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => s.textContent)
    };
  });

async function loadForSeo(page, path) {
  await page.goto(path);
  await expect(page.locator('h1').first()).toBeAttached();
  await page.waitForTimeout(150);
}

test.beforeEach(() => {
  test.skip(!isPhoneProject(test.info()), 'search checks run once, in the phone project');
});

test.describe('Every page tells search engines what it is', () => {
  for (const route of ROUTES) {
    test(`SEO-01 ${route.path} has its own title, description, canonical and share tags`, async ({ page }) => {
      await loadForSeo(page, route.path);
      const tags = await head(page);
      expect(tags.title, 'title names the page').toContain(route.topic);
      expect(tags.title, 'title names the clinic').toContain('MerryGold');
      expect(tags.description, 'meta description').toBeTruthy();
      expect(tags.description.length, `description "${tags.description}"`).toBeGreaterThanOrEqual(70);
      expect(tags.description.length).toBeLessThanOrEqual(160);
      expect(tags.canonicals, 'exactly one canonical tag').toHaveLength(1);
      expect(tags.canonicals[0], 'canonical is this page on the canonical host').toBe(`${CANONICAL_ORIGIN}${route.path}`);
      expect(tags.ogTitle, 'og:title').toBeTruthy();
      expect(tags.ogDescription, 'og:description').toBeTruthy();
      expect(tags.ogImage, 'og:image').toMatch(/^https:\/\//);
      expect(tags.ogUrl, 'og:url').toBe(tags.canonicals[0]);
      expect(tags.ogType, 'og:type').toBeTruthy();
      expect(tags.twitterCard, 'twitter:card').toBe('summary_large_image');
      expect(tags.robots ?? '', 'public pages must be indexable').not.toMatch(/noindex/i);
    });
  }

  test('SEO-02 no two pages share a title or a description', async ({ page }) => {
    const titles = new Map();
    const descriptions = new Map();
    for (const route of ROUTES) {
      await loadForSeo(page, route.path);
      const tags = await head(page);
      titles.set(route.path, tags.title);
      descriptions.set(route.path, tags.description);
    }
    const duplicates = (valuesByPath) => {
      const entries = [...valuesByPath.entries()];
      return entries
        .filter(([, value]) => entries.filter(([, other]) => other === value).length > 1)
        .map(([path, value]) => `${path}: ${value}`);
    };
    expect(duplicates(titles), 'shared titles').toEqual([]);
    expect(duplicates(descriptions), 'shared descriptions').toEqual([]);
  });

  test('SEO-03 the title changes when a visitor moves to another page inside the site', async ({ page }) => {
    await loadForSeo(page, '/training');
    await page.locator('footer.clinic-footer').getByRole('link', { name: 'Results', exact: true }).click();
    await expect(page.locator('h1').filter({ hasText: 'Results' })).toBeVisible();
    await expect(page).toHaveTitle(/Results/);
    await page.locator('footer.clinic-footer').getByRole('link', { name: 'About us', exact: true }).click();
    await expect(page).toHaveTitle(/About us/);
  });

  test('SEO-04 the home page says what the clinic does and where', async ({ page }) => {
    await loadForSeo(page, '/');
    const tags = await head(page);
    expect(tags.title).toMatch(/Barking|East London/);
    expect(tags.description).toMatch(/Barking|East London/);
  });
});

test.describe('Page structure', () => {
  for (const route of ROUTES) {
    test(`SEO-05 ${route.path} has one main heading, headings in order, and described images`, async ({ page }) => {
      await loadForSeo(page, route.path);
      const structure = await page.evaluate(() => {
        const headings = [...document.querySelectorAll('main h1, main h2, main h3, main h4, main h5, main h6')].map((h) => Number(h.tagName[1]));
        const skips = [];
        headings.forEach((level, index) => {
          if (index > 0 && level > headings[index - 1] + 1) skips.push(`h${headings[index - 1]} then h${level}`);
        });
        return {
          h1Count: document.querySelectorAll('h1').length,
          skips: [...new Set(skips)],
          imagesWithoutAlt: [...document.images].filter((img) => !img.hasAttribute('alt')).map((img) => img.getAttribute('src'))
        };
      });
      expect(structure.h1Count, 'exactly one h1').toBe(1);
      expect(structure.skips, 'heading levels skipped').toEqual([]);
      expect(structure.imagesWithoutAlt, 'images with no alt attribute').toEqual([]);
    });
  }

  test('SEO-06 the page language is British English', async ({ page }) => {
    await loadForSeo(page, '/');
    expect((await head(page)).lang).toBe('en-GB');
  });
});

test.describe('Business details for local search', () => {
  test('SEO-07 business structured data is valid and matches the details the page shows', async ({ page }) => {
    await loadForSeo(page, '/contact');
    const blocks = (await head(page)).jsonLd.map((text) => JSON.parse(text));
    const business = blocks.flatMap((block) => (block['@graph'] ? block['@graph'] : [block])).find((item) => /BeautySalon|HealthAndBeautyBusiness|LocalBusiness/.test(item['@type']));
    expect(business, 'a BeautySalon entity').toBeTruthy();
    const footer = await page.locator('footer.clinic-footer').innerText();
    expect(footer).toContain(business.address.postalCode);
    expect(footer.replace(/\D/g, '')).toContain(String(business.telephone).replace(/\D/g, ''));
    expect(business.url).toBe(CANONICAL_ORIGIN);
    expect(business.address.postalCode).toBe(CLINIC.postcode);
    expect(business.geo, 'map coordinates').toBeTruthy();
  });
});

test.describe('Real pages for the things people search for', () => {
  test('SEO-08 an unknown address shows a not-found page marked noindex, not the home page', async ({ page }) => {
    await page.goto('/this-page-does-not-exist');
    await expect.poll(() => new URL(page.url()).pathname).toBe('/this-page-does-not-exist');
    await expect(page.locator('h1').first()).toHaveText(/not found|can.t find|doesn.t exist/i);
    expect((await head(page)).robots ?? '').toMatch(/noindex/i);
  });

  test('SEO-09 each treatment category has its own page', async ({ page }) => {
    const missing = [];
    for (const category of CATEGORIES) {
      await page.goto(categoryUrl(category.id));
      const landed = new URL(page.url()).pathname;
      const h1 = (await page.locator('h1').first().innerText().catch(() => '')).trim();
      if (landed !== categoryUrl(category.id) || !h1.toLowerCase().includes(category.name.split(' ')[0].toLowerCase())) {
        missing.push(`${categoryUrl(category.id)} landed on ${landed} with heading "${h1}"`);
      }
    }
    expect(missing).toEqual([]);
  });

  test('SEO-10 each treatment has its own page with its name as the heading', async ({ page }) => {
    test.setTimeout(300_000); // opens every treatment page in turn
    await page.goto('/');
    const { treatments } = await importAppData(page, '/src/data/treatments.js');
    const missing = [];
    for (const treatment of treatments) {
      const url = treatmentUrl(treatment.category, treatment.slug);
      await page.goto(url);
      const h1 = (await page.locator('h1').first().innerText().catch(() => '')).trim();
      if (new URL(page.url()).pathname !== url || h1 !== treatment.name) missing.push(`${url} (heading "${h1}")`);
    }
    expect(missing, `${missing.length} of ${treatments.length} treatments have no page`).toEqual([]);
  });

  test('SEO-11 each product has its own page', async ({ page }) => {
    await page.goto('/');
    const { products } = await importAppData(page, '/src/data/products.js');
    const missing = [];
    for (const product of products) {
      await page.goto(productUrl(product.slug));
      const h1 = (await page.locator('h1').first().innerText().catch(() => '')).trim();
      if (h1 !== product.name) missing.push(`${productUrl(product.slug)} (heading "${h1}")`);
    }
    expect(missing).toEqual([]);
  });

  test('SEO-12 each blog article has its own page with the full article', async ({ page }) => {
    await page.goto('/');
    const { blogArticles } = await importAppData(page, '/src/data/blog.js');
    const missing = [];
    for (const article of blogArticles) {
      await page.goto(articleUrl(article.slug));
      const h1 = (await page.locator('h1').first().innerText().catch(() => '')).trim();
      const words = (await page.locator('main').innerText()).split(/\s+/).length;
      if (h1 !== article.title || words < 300) missing.push(`${articleUrl(article.slug)} (heading "${h1}", ${words} words)`);
    }
    expect(missing).toEqual([]);
  });

  test('SEO-13 the pricing page is live', async ({ page }) => {
    await page.goto('/pricing');
    await expect.poll(() => new URL(page.url()).pathname).toBe('/pricing');
    await expect(page.locator('h1').first()).toHaveText('Pricing Guide');
  });

  test('SEO-14 treatment categories and treatments are real links a search engine can follow', async ({ page }) => {
    await page.goto('/');
    const { treatments } = await importAppData(page, '/src/data/treatments.js');
    await page.goto('/treatments');
    for (const category of CATEGORIES) {
      await expect(page.locator(`main a[href="${categoryUrl(category.id)}"]`).first(), `link to ${category.name}`).toBeAttached();
    }
    const first = treatments[0];
    await expect(page.locator(`main a[href="${treatmentUrl(first.category, first.slug)}"]`).first(), `link to ${first.name}`).toBeAttached();
  });

  test('SEO-15 a treatment page carries breadcrumb and service structured data', async ({ page }) => {
    await page.goto('/');
    const { treatments } = await importAppData(page, '/src/data/treatments.js');
    const treatment = treatments[0];
    await loadForSeo(page, treatmentUrl(treatment.category, treatment.slug));
    const items = (await head(page)).jsonLd.map((text) => JSON.parse(text)).flatMap((block) => block['@graph'] || [block]);
    const types = items.map((item) => item['@type']);
    expect(types).toContain('BreadcrumbList');
    expect(types.some((type) => /Service|Product/.test(type))).toBe(true);
  });
});

test.describe('Sitemap and robots.txt as served', () => {
  test('SEO-16 robots.txt is plain text and names the sitemap on the canonical host', async ({ request }) => {
    const response = await request.get('/robots.txt');
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toMatch(/text\/plain/);
    expect(await response.text()).toContain(`Sitemap: ${CANONICAL_ORIGIN}/sitemap.xml`);
  });

  test('SEO-17 every page in the sitemap opens as itself', async ({ page, request }) => {
    test.setTimeout(600_000); // opens every page in the sitemap in turn, about 5 minutes on the dev server
    const xml = await (await request.get('/sitemap.xml')).text();
    const paths = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
    expect(paths.length).toBeGreaterThan(0);
    const broken = [];
    for (const path of paths) {
      await page.goto(path);
      const landed = new URL(page.url()).pathname;
      if (landed.replace(/\/$/, '') !== path.replace(/\/$/, '')) broken.push(`${path} ended at ${landed}`);
    }
    expect(broken).toEqual([]);
  });
});
