import { test, expect } from '../support/fixtures.js';

// Lab measurements against the production build. Phones run on a throttled
// connection and a slowed CPU, close to the profile Lighthouse uses for mobile.
// Thresholds are Google's "good" Core Web Vitals, from SEO_STANDARD.md.

const KEY_PAGES = ['/', '/treatments', '/shop', '/contact', '/results'];
const LCP_GOOD_MS = 2500;
const CLS_GOOD = 0.1;
const PHONE_PAGE_WEIGHT_BUDGET = 2 * 1024 * 1024;
const IMAGE_WEIGHT_LIMIT = 300 * 1024;

async function throttleIfPhone(page, testInfo) {
  if (testInfo.project.name !== 'prod-mobile') return;
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', {
    offline: false,
    latency: 150,
    downloadThroughput: Math.round((1.6 * 1024 * 1024) / 8),
    uploadThroughput: Math.round((750 * 1024) / 8)
  });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
}

// Records largest contentful paint and layout shifts from the first moment.
async function installVitalsObserver(page) {
  await page.addInitScript(() => {
    window.__vitals = { lcp: 0, cls: 0 };
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) window.__vitals.lcp = entry.startTime;
    }).observe({ type: 'largest-contentful-paint', buffered: true });
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) if (!entry.hadRecentInput) window.__vitals.cls += entry.value;
    }).observe({ type: 'layout-shift', buffered: true });
  });
}

test.describe('Core Web Vitals (lab)', () => {
  for (const path of KEY_PAGES) {
    test(`PRF-01 ${path} shows its main content within 2.5 seconds and does not jump while loading`, async ({ page }, testInfo) => {
      test.setTimeout(120_000);
      await throttleIfPhone(page, testInfo);
      await installVitalsObserver(page);
      await page.goto(path, { waitUntil: 'load', timeout: 90_000 });
      await page.waitForTimeout(3000);
      const vitals = await page.evaluate(() => window.__vitals);
      testInfo.annotations.push({ type: 'vitals', description: `LCP ${Math.round(vitals.lcp)}ms, CLS ${vitals.cls.toFixed(3)}` });
      expect(vitals.lcp, `largest contentful paint on ${path}`).toBeLessThanOrEqual(LCP_GOOD_MS);
      expect(vitals.cls, `layout shift on ${path}`).toBeLessThan(CLS_GOOD);
    });
  }
});

test.describe('Page weight', () => {
  for (const path of KEY_PAGES) {
    test(`PRF-02 ${path} stays within the weight budget and sends no oversized image`, async ({ page }, testInfo) => {
      test.setTimeout(120_000);
      await page.goto(path, { waitUntil: 'load' });
      await page.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += 700) {
          window.scrollTo(0, y);
          await new Promise((resolve) => setTimeout(resolve, 150));
        }
      });
      await page.waitForTimeout(1500);
      const resources = await page.evaluate(() =>
        performance.getEntriesByType('resource').map((r) => ({ name: r.name, type: r.initiatorType, bytes: r.transferSize || r.encodedBodySize }))
      );
      const total = resources.reduce((sum, r) => sum + r.bytes, 0);
      const heaviest = [...resources].sort((a, b) => b.bytes - a.bytes).slice(0, 5).map((r) => `${Math.round(r.bytes / 1024)}KB ${r.name.split('/').pop()}`);
      testInfo.annotations.push({ type: 'weight', description: `${Math.round(total / 1024)}KB total; heaviest: ${heaviest.join(', ')}` });

      const oversized = resources
        .filter((r) => (r.type === 'img' || r.type === 'css' || /\.(png|jpe?g|webp|avif)$/i.test(r.name)) && r.bytes > IMAGE_WEIGHT_LIMIT)
        .map((r) => `${Math.round(r.bytes / 1024)}KB ${r.name.split('/').pop()}`);
      expect(oversized, 'images over 300KB').toEqual([]);
      if (testInfo.project.name === 'prod-mobile') {
        expect(total, `phone page weight: ${heaviest.join(', ')}`).toBeLessThanOrEqual(PHONE_PAGE_WEIGHT_BUDGET);
      }
    });
  }

  test('PRF-03 phones are not sent the hero video, or are sent a light one', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'prod-mobile', 'phone data use');
    await page.goto('/', { waitUntil: 'load' });
    await page.waitForTimeout(3000);
    const videoBytes = await page.evaluate(() =>
      performance.getEntriesByType('resource').filter((r) => /\.(mp4|webm)$/i.test(r.name)).reduce((sum, r) => sum + (r.transferSize || r.encodedBodySize), 0)
    );
    expect(videoBytes, 'video bytes downloaded on a phone').toBeLessThanOrEqual(1.5 * 1024 * 1024);
  });

  test('PRF-04 photographs are not sent far larger than they are shown', async ({ page }) => {
    const oversent = [];
    for (const path of ['/', '/treatments', '/shop']) {
      await page.goto(path, { waitUntil: 'load' });
      await page.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += 700) {
          window.scrollTo(0, y);
          await new Promise((resolve) => setTimeout(resolve, 120));
        }
      });
      const found = await page.evaluate(() => {
        const dpr = window.devicePixelRatio || 1;
        return [...document.images]
          .filter((img) => img.naturalWidth > 800 && img.getBoundingClientRect().width > 0)
          .filter((img) => img.naturalWidth > img.getBoundingClientRect().width * dpr * 2)
          .map((img) => `${img.naturalWidth}px shown at ${Math.round(img.getBoundingClientRect().width)}px: ${img.getAttribute('alt')}`);
      });
      oversent.push(...found.map((entry) => `${path}: ${entry}`));
    }
    expect([...new Set(oversent)]).toEqual([]);
  });
});
