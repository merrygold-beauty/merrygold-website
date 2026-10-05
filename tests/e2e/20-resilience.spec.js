import { test, expect } from '../support/fixtures.js';
import { ui, expectBagCount, openBag, isPhoneProject } from '../support/helpers.js';

test.describe('When things go wrong', () => {
  test('RSL-01 with browser storage blocked the site still works, the cookie notice shows, and the bag works for the visit', async ({ page }) => {
    await page.addInitScript(() => {
      const blocked = () => {
        throw new DOMException('Storage blocked', 'SecurityError');
      };
      Storage.prototype.getItem = blocked;
      Storage.prototype.setItem = blocked;
    });
    await page.goto('/shop');
    await expect(page.locator('h1').filter({ hasText: 'Shop' })).toBeVisible();
    await expect(ui.cookieNotice(page)).toBeVisible();
    await page.locator('.shop-catalog-section .product-card').first().getByRole('button', { name: 'Add to formulation bag' }).click();
    await expectBagCount(page, 1);
  });

  test('RSL-02 a damaged saved bag does not break the site', async ({ page }) => {
    await page.addInitScript(() => {
      try {
        localStorage.setItem('merrygold_cart', '{this is not json');
      } catch {
        // storage unavailable on this origin
      }
    });
    await page.goto('/');
    await expect(page.locator('h1').first()).toBeVisible();
    await expectBagCount(page, 0);
  });

  test('RSL-03 a saved bag holding a product that no longer exists does not break the bag', async ({ page }) => {
    await page.addInitScript(() => {
      try {
        localStorage.setItem('merrygold_cart', JSON.stringify([{ product: { id: 'retired-product', name: 'Retired Product', price: 12 }, quantity: 1 }]));
      } catch {
        // storage unavailable on this origin
      }
    });
    await page.goto('/shop');
    await openBag(page);
    await expect(ui.cartDrawer(page)).toBeVisible();
    await expect(ui.cartDrawer(page).locator('.cart-item-card').filter({ hasText: 'Retired Product' }), 'products no longer sold should drop out of the bag').toHaveCount(0);
  });

  test('RSL-04 a page address ending in a slash still opens that page', async ({ page }) => {
    await page.goto('/treatments/');
    await expect(page.locator('h1').filter({ hasText: 'Treatments' })).toBeVisible();
  });

  test('RSL-05 reloading any page keeps the visitor on that page', async ({ page }) => {
    for (const path of ['/training', '/director', '/cookies']) {
      await page.goto(path);
      await page.reload();
      await expect.poll(() => new URL(page.url()).pathname).toBe(path);
    }
  });

  test('RSL-06 if the signal drops after the site has loaded, moving between pages and asking Goldie still work', async ({ page, context }) => {
    test.skip(!isPhoneProject(test.info()), 'a phone scenario');
    await page.goto('/');
    await page.waitForLoadState('load');
    await context.setOffline(true);
    await page.locator('footer.clinic-footer').getByRole('link', { name: 'About the Founder' }).click();
    await expect(page.locator('h1').filter({ hasText: 'Oluwakemi Okunniyi' })).toBeVisible();
    await ui.chatButton(page).click();
    await ui.chat(page).getByRole('button', { name: 'Opening hours & location' }).click();
    await expect(ui.chat(page).locator('.msg-bot').last()).toContainText('Monday');
    await context.setOffline(false);
  });
});
