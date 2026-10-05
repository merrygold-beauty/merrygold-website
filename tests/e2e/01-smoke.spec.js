import { test, expect } from '../support/fixtures.js';
import { ROUTES, routeByPath } from '../support/site.js';

// Scrolls the whole page in steps so lazy images load, then lists any image
// that finished loading without decoding.
async function brokenImagesAfterScroll(page) {
  await page.evaluate(async () => {
    const step = Math.max(300, Math.floor(window.innerHeight * 0.8));
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 120));
    }
  });
  await page.waitForTimeout(800);
  return page.evaluate(() =>
    [...document.images]
      .filter((img) => img.complete && img.naturalWidth === 0 && img.getAttribute('src'))
      .map((img) => img.getAttribute('src'))
  );
}

test.describe('Smoke: every page loads cleanly', () => {
  for (const route of ROUTES) {
    test(`SMK-01 ${route.path} loads with its heading, no console errors and no broken requests`, async ({ page, baseURL }) => {
      const origin = new URL(baseURL).origin;
      const consoleErrors = [];
      const badResponses = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
      });
      page.on('response', (response) => {
        if (response.status() >= 400 && response.url().startsWith(origin)) {
          badResponses.push(`${response.status()} ${response.url()}`);
        }
      });

      const response = await page.goto(route.path);
      expect(response.status()).toBeLessThan(400);
      await expect(page.locator('h1').filter({ hasText: route.h1 }).first()).toBeVisible();
      await page.waitForLoadState('load');

      const broken = await brokenImagesAfterScroll(page);
      expect(broken, 'images that failed to decode').toEqual([]);
      expect(badResponses, 'same-origin requests that failed').toEqual([]);
      expect(consoleErrors, 'console errors').toEqual([]);
    });
  }

  test('SMK-02 browser back and forward return to the right pages', async ({ page }) => {
    await page.goto('/');
    await page.goto('/treatments');
    await page.goto('/shop');
    await page.goBack();
    await expect(page.locator('h1').filter({ hasText: 'Treatments' })).toBeVisible();
    await page.goBack();
    await expect(page.locator('h1').first()).toHaveText(routeByPath('/').h1);
    await page.goForward();
    await expect(page.locator('h1').filter({ hasText: 'Treatments' })).toBeVisible();
  });

  test('SMK-03 the hero poster image is a real, decodable image', async ({ page }) => {
    await page.goto('/');
    const poster = await page.locator('video.hero-video-element').getAttribute('poster');
    expect(poster, 'hero video poster attribute').toBeTruthy();
    const size = await page.evaluate(async (src) => {
      const img = new Image();
      img.src = src;
      try {
        await img.decode();
        return { width: img.naturalWidth, height: img.naturalHeight };
      } catch {
        return { width: 0, height: 0 };
      }
    }, poster);
    expect(size.width, `poster ${poster} should decode to a real image`).toBeGreaterThan(300);
  });
});
