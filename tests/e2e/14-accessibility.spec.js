import AxeBuilder from '@axe-core/playwright';
import { test, expect } from '../support/fixtures.js';
import { ROUTES } from '../support/site.js';
import { ui, openMobileMenu, openBag, usesMobileMenu, isPhoneProject, revealHeader, completeFinder } from '../support/helpers.js';

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

async function seriousViolations(page, include) {
  let builder = new AxeBuilder({ page }).withTags(WCAG_TAGS);
  if (include) builder = builder.include(include);
  const { violations } = await builder.analyze();
  return violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => `${v.impact} ${v.id}: ${v.help} (${v.nodes.length}x, e.g. ${v.nodes[0].target.join(' ')})`);
}

// Each overlay, how to open it, and the selector of its panel.
const OVERLAYS = [
  { id: 'finder', open: async (page) => { await page.goto('/#finder'); }, panel: '.finder-card' },
  { id: 'bag', open: async (page) => { await page.goto('/shop'); await openBag(page); }, panel: '.cart-drawer-panel' },
  {
    id: 'product view',
    open: async (page) => {
      await page.goto('/shop');
      await page.locator('.shop-catalog-section .product-card .product-card-title').first().click();
    },
    panel: '.product-modal-card'
  },
  {
    id: 'checkout',
    open: async (page) => {
      await page.goto('/shop');
      await page.locator('.shop-catalog-section .product-card').first().getByRole('button', { name: 'Add to formulation bag' }).click();
      await ui.cartDrawer(page).getByRole('button', { name: 'Checkout' }).click();
    },
    panel: '.checkout-modal-card'
  },
  { id: 'chat', open: async (page) => { await page.goto('/'); await ui.chatButton(page).click(); }, panel: '.goldie-panel' },
  {
    id: 'mobile menu',
    phoneOnly: true,
    open: async (page) => { await page.goto('/shop'); await openMobileMenu(page); },
    panel: '.mobile-nav-panel'
  }
];

test.describe('Automated WCAG 2.2 AA scan', () => {
  for (const route of ROUTES) {
    test(`A11Y-01 ${route.path} has no serious or critical accessibility failures`, async ({ page }) => {
      await page.goto(route.path);
      await expect(page.locator('h1').first()).toBeVisible();
      await page.waitForTimeout(900);
      expect(await seriousViolations(page)).toEqual([]);
    });
  }

  for (const overlay of OVERLAYS) {
    test(`A11Y-02 the open ${overlay.id} has no serious or critical accessibility failures`, async ({ page }) => {
      test.skip(overlay.phoneOnly && !usesMobileMenu(page), 'phone layout only');
      await overlay.open(page);
      await expect(page.locator(overlay.panel)).toBeVisible();
      await page.waitForTimeout(400);
      expect(await seriousViolations(page, overlay.panel)).toEqual([]);
    });
  }
});

test.describe('Dialogs behave like dialogs', () => {
  for (const overlay of OVERLAYS) {
    test(`A11Y-03 the ${overlay.id} is announced as a named dialog`, async ({ page }) => {
      test.skip(overlay.phoneOnly && !usesMobileMenu(page), 'phone layout only');
      await overlay.open(page);
      const panel = page.locator(overlay.panel);
      await expect(panel).toBeVisible();
      const semantics = await panel.evaluate((el) => {
        const dialog = el.closest('[role=dialog], dialog') || el.querySelector('[role=dialog]');
        return {
          isDialog: Boolean(dialog),
          modal: dialog?.getAttribute('aria-modal') === 'true' || dialog?.tagName === 'DIALOG',
          named: Boolean(dialog?.getAttribute('aria-label') || dialog?.getAttribute('aria-labelledby'))
        };
      });
      expect(semantics).toEqual({ isDialog: true, modal: true, named: true });
    });

    test(`A11Y-04 Escape closes the ${overlay.id}`, async ({ page }) => {
      test.skip(overlay.phoneOnly && !usesMobileMenu(page), 'phone layout only');
      await overlay.open(page);
      await expect(page.locator(overlay.panel)).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(page.locator(overlay.panel)).toBeHidden();
    });
  }

  test('A11Y-05 opening the bag moves focus into it, and closing it puts focus back on the bag button', async ({ page }) => {
    await page.goto('/shop');
    await revealHeader(page);
    await ui.bagButton(page).focus();
    await page.keyboard.press('Enter');
    await expect(ui.cartDrawer(page)).toBeVisible();
    expect(await ui.cartDrawer(page).evaluate((el) => el.contains(document.activeElement))).toBe(true);
    await ui.cartDrawer(page).getByRole('button', { name: 'Close cart drawer' }).click();
    await expect(ui.bagButton(page)).toBeFocused();
  });
});

test.describe('Keyboard use', () => {
  test('A11Y-06 a "skip to main content" link is the first stop for keyboard users', async ({ page }) => {
    test.skip(isPhoneProject(test.info()), 'keyboard navigation is a desktop concern');
    await page.goto('/treatments');
    await page.keyboard.press('Tab');
    const first = await page.evaluate(() => ({ text: document.activeElement?.innerText || '', href: document.activeElement?.getAttribute('href') }));
    expect(first.text).toMatch(/skip/i);
    expect(first.href).toBe('#main-content');
  });

  test('A11Y-07 keyboard users can reach the treatment categories in the menu', async ({ page }) => {
    test.skip(usesMobileMenu(page), 'desktop menu only');
    await page.goto('/results');
    await ui.mainNav(page).getByRole('link', { name: 'Treatments', exact: true }).focus();
    await page.keyboard.press('Tab');
    const focusedInMenu = await page.evaluate(() => Boolean(document.activeElement?.closest('.treatments-mega-menu')));
    expect(focusedInMenu, 'Tab from Treatments should move into the category list').toBe(true);
  });

  test('A11Y-08 the before and after slider can be moved with the arrow keys', async ({ page }) => {
    test.skip(isPhoneProject(test.info()), 'keyboard control is a desktop concern; touch is covered in UI tests');
    await page.goto('/results');
    const slider = page.locator('.slider-viewport').first();
    const clip = slider.locator('.slider-image-clipped-container');
    const before = await clip.getAttribute('style');
    await slider.focus();
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');
    expect(await clip.getAttribute('style')).not.toBe(before);
  });
});

test.describe('Touch and motion', () => {
  test('A11Y-09 on phones every tappable control is at least 24 by 24 pixels', async ({ page }) => {
    test.skip(!isPhoneProject(test.info()), 'phone check');
    const tooSmall = [];
    for (const path of ['/', '/treatments', '/shop', '/contact', '/training']) {
      await page.goto(path);
      await page.waitForTimeout(500);
      const found = await page.evaluate(() =>
        [...document.querySelectorAll('a[href], button, input[type=checkbox], select')]
          .filter((el) => !el.closest('p'))
          .map((el) => {
            const target = el.matches('input[type=checkbox]') ? el.closest('label') || el : el;
            const rect = target.getBoundingClientRect();
            const style = getComputedStyle(target);
            return { rect, visible: rect.width > 0 && style.visibility !== 'hidden' && Number(style.opacity) > 0.01, label: (el.getAttribute('aria-label') || el.innerText || el.getAttribute('href') || '').trim().slice(0, 40) };
          })
          .filter((item) => item.visible && (item.rect.width < 24 || item.rect.height < 24))
          .map((item) => `${Math.round(item.rect.width)}x${Math.round(item.rect.height)} "${item.label}"`)
      );
      tooSmall.push(...found.map((entry) => `${path} ${entry}`));
    }
    expect([...new Set(tooSmall)]).toEqual([]);
  });

  test('A11Y-10 with reduced motion requested, the reviews stop scrolling by themselves', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    expect(await page.locator('.reviews-stream-track').evaluate((el) => getComputedStyle(el).animationName)).toBe('none');
  });

  test('A11Y-11 with reduced motion requested, the hero video does not play by itself', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await page.waitForTimeout(1500);
    const playing = await page.evaluate(() => {
      const video = document.querySelector('video');
      return Boolean(video && !video.paused);
    });
    expect(playing).toBe(false);
  });

  test('A11Y-12 the moving reviews strip has a pause control', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.reviews-section').getByRole('button', { name: /pause|stop/i })).toHaveCount(1);
  });
});
