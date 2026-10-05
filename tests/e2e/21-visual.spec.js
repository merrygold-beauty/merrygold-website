import { test, expect } from '../support/fixtures.js';
import { ROUTES } from '../support/site.js';

// Screenshot comparison, off by default because the treatment photographs are
// still being replaced. Once they settle, record baselines with
//   $env:MG_VISUAL=1; npx playwright test tests/e2e/21-visual.spec.js --update-snapshots
// and every later run with MG_VISUAL=1 flags any visual change for review.

test.beforeEach(() => {
  test.skip(!process.env.MG_VISUAL, 'set MG_VISUAL=1 to run screenshot comparison');
});

for (const route of ROUTES) {
  test(`VIS-01 ${route.path} looks the same as its approved screenshot`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(route.path);
    await expect(page.locator('h1').first()).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(800);
    await expect(page).toHaveScreenshot(`${route.path === '/' ? 'home' : route.path.slice(1)}.png`, {
      fullPage: true,
      animations: 'disabled',
      mask: [page.locator('video'), page.locator('.reviews-stream-track'), page.locator('.footer-bottom-strip .copyright-text')],
      maxDiffPixelRatio: 0.01
    });
  });
}
