import { test, expect } from '../support/fixtures.js';
import { ROUTES } from '../support/site.js';
import { ui, isPhoneProject, moneyValues, WELL_FORMED_MONEY } from '../support/helpers.js';

test.describe('Header behaviour', () => {
  test('UI-01 on the home page the header waits until the visitor scrolls; elsewhere it always shows', async ({ page }) => {
    await page.goto('/');
    await expect(ui.header(page)).toHaveClass(/is-hidden/);
    await page.evaluate(() => window.scrollTo(0, 300));
    await expect(ui.header(page)).toHaveClass(/is-revealed/);
    await page.goto('/results');
    await expect(ui.header(page)).toHaveClass(/is-revealed/);
  });
});

test.describe('Home page hero', () => {
  test('UI-02 the hero shows the clinic sign, the headline, the sub-line and both buttons', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.hero-logo img')).toBeVisible();
    await expect(page.locator('h1')).toHaveText('Your confidant for your best skin');
    await expect(page.locator('.hero-narrative')).toBeVisible();
    await expect(page.locator('.hero-actions-cluster').getByRole('link', { name: 'Treatments' })).toBeVisible();
    await expect(page.locator('.hero-actions-cluster').getByRole('button', { name: 'Find my treatment' })).toBeVisible();
  });

  test('UI-03 if the hero video cannot load, the poster photograph shows in its place', async ({ page }) => {
    // Matches both hero-facial.mp4 (desktop) and hero-facial-portrait.mp4 (phone).
    await page.route('**/hero-facial*.mp4', (route) => route.abort());
    await page.goto('/');
    await page.waitForLoadState('load');
    await expect(page.locator('video.hero-video-element')).toHaveCount(0, { timeout: 10_000 });
    const fallback = page.locator('.hero-poster-fallback');
    await expect(fallback).toBeVisible();
    const image = await fallback.evaluate((el) => getComputedStyle(el).backgroundImage);
    const expectedPoster = isPhoneProject(test.info()) ? 'hero-poster-portrait.jpg' : 'hero-poster.jpg';
    expect(image).toContain(expectedPoster);
  });

  test('UI-04 the sign and headline load with the page and do not wait for an animation to finish', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1200);
    const opacity = await page.locator('h1').evaluate((el) => Number(getComputedStyle(el.closest('.hero-text-block')).opacity));
    expect(opacity).toBeGreaterThan(0.95);
  });
});

test.describe('Before and after sliders', () => {
  test('UI-05 dragging the slider reveals more of the before or after photo', async ({ page }) => {
    await page.goto('/results');
    const slider = page.locator('.slider-viewport').first();
    await slider.scrollIntoViewIfNeeded();
    const box = await slider.boundingBox();
    const y = box.y + box.height / 2;
    const clipRight = () => slider.locator('.slider-image-clipped-container').evaluate((el) => parseFloat(el.style.clipPath.split(' ')[1]));

    if (isPhoneProject(test.info())) {
      await slider.evaluate((el, { x, y: touchY }) => {
        const touch = (clientX) => new Touch({ identifier: 1, target: el, clientX, clientY: touchY });
        el.dispatchEvent(new TouchEvent('touchstart', { touches: [touch(x)], bubbles: true }));
        el.dispatchEvent(new TouchEvent('touchmove', { touches: [touch(x - el.getBoundingClientRect().width * 0.3)], bubbles: true }));
        el.dispatchEvent(new TouchEvent('touchend', { touches: [], bubbles: true }));
      }, { x: box.x + box.width / 2, y });
    } else {
      await page.mouse.move(box.x + box.width / 2, y);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width * 0.2, y, { steps: 8 });
      await page.mouse.up();
    }
    expect(await clipRight(), 'the divider should have moved left').toBeGreaterThan(60);
  });

  test('UI-06 each slider is labelled Before and After and both photographs load', async ({ page }) => {
    await page.goto('/results');
    const sliders = page.locator('.slider-card-wrapper');
    const count = await sliders.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i += 1) {
      const slider = sliders.nth(i);
      await slider.scrollIntoViewIfNeeded();
      await expect(slider.locator('.slider-tag-before')).toHaveText('Before');
      await expect(slider.locator('.slider-tag-after')).toHaveText('After');
      const decoded = await slider.locator('img').evaluateAll((imgs) => imgs.every((img) => img.complete && img.naturalWidth > 0));
      expect(decoded, `slider ${i + 1} photographs`).toBe(true);
    }
  });
});

test.describe('Reviews strip', () => {
  test('UI-07 the reviews move on their own and pause under the pointer', async ({ page }) => {
    test.skip(isPhoneProject(test.info()), 'hover exists on desktop only');
    await page.goto('/');
    const track = page.locator('.reviews-section .marquee-track');
    await track.scrollIntoViewIfNeeded();
    expect(await track.evaluate((el) => getComputedStyle(el).animationPlayState)).toBe('running');
    await page.locator('.reviews-section .marquee-wrapper').hover();
    await expect.poll(() => track.evaluate((el) => getComputedStyle(el).animationPlayState)).toBe('paused');
  });
});

test.describe('Brand and presentation', () => {
  test('UI-08 the brand typefaces load', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    const loaded = await page.evaluate(() => ({
      editorial: document.fonts.check('32px "Gilda Display"'),
      body: document.fonts.check('16px "Montserrat"')
    }));
    expect(loaded).toEqual({ editorial: true, body: true });
  });

  test('UI-09 every price on every page is written as whole pounds or pounds and pence', async ({ page }) => {
    const malformed = [];
    for (const route of ROUTES) {
      await page.goto(route.path);
      const amounts = moneyValues(await page.locator('body').innerText());
      malformed.push(...amounts.filter((amount) => !WELL_FORMED_MONEY.test(amount)).map((amount) => `${route.path}: ${amount}`));
    }
    expect(malformed).toEqual([]);
  });

  test('UI-10 below-the-fold photographs load lazily and the hero does not', async ({ page }) => {
    await page.goto('/treatments');
    const eagerCards = await page.locator('.treatment-directory-card img:not([loading="lazy"])').count();
    expect(eagerCards, 'treatment photos should use loading="lazy"').toBe(0);
    await page.goto('/');
    expect(await page.locator('.hero-logo img').getAttribute('loading')).not.toBe('lazy');
  });
});
