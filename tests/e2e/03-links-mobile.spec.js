import { test, expect } from '../support/fixtures.js';
import { routeByPath, STICKY_BAR_MAX } from '../support/site.js';
import { ui, expectOnPage, openMobileMenu, usesMobileMenu, viewportWidth, coveringElement } from '../support/helpers.js';

// The drawer's link list, in the order NAV_ITEMS renders it. Training and
// the old "Sanctuary" wording left the drawer along with the header.
const MENU_LINKS = [
  { id: 'MOB-02', name: 'Home', path: '/' },
  { id: 'MOB-03', name: 'Treatments', path: '/treatments' },
  { id: 'MOB-05', name: 'Results', path: '/results' },
  { id: 'MOB-09', name: 'Book an appointment', path: '/treatments' },
  { id: 'MOB-04', name: 'Shop', path: '/shop' },
  { id: 'MOB-06', name: 'About us', path: '/about' },
  { id: 'MOB-08', name: 'Contact us', path: '/contact' }
];

const START_PAGES = ['/', '/shop'];

for (const start of START_PAGES) {
  test.describe(`Mobile menu, starting on ${start}`, () => {
    test.beforeEach(async ({ page }) => {
      test.skip(!usesMobileMenu(page), 'the mobile menu only exists at 1040px and below');
      await page.goto(start);
    });

    test('MOB-01 the menu button opens the menu and the close button shuts it', async ({ page }) => {
      const menu = await openMobileMenu(page);
      await menu.getByRole('button', { name: 'Close menu' }).click();
      await expect(menu).toBeHidden();
    });

    test('MOB-02 tapping outside the menu closes it', async ({ page }) => {
      const menu = await openMobileMenu(page);
      const { width, height } = page.viewportSize();
      await page.mouse.click(width - 12, Math.round(height * 0.4));
      await expect(menu).toBeHidden();
    });

    for (const link of MENU_LINKS) {
      test(`${link.id} menu "${link.name}" opens ${link.path} and closes the menu`, async ({ page }) => {
        const menu = await openMobileMenu(page);
        await menu.getByRole('link', { name: link.name, exact: true }).click();
        await expectOnPage(page, routeByPath(link.path));
        await expect(menu).toBeHidden();
      });
    }

    test('MOB-10 menu "Find my treatment" closes the menu and opens the finder', async ({ page }) => {
      const menu = await openMobileMenu(page);
      await menu.getByRole('button', { name: 'Find my treatment' }).click();
      await expect(menu).toBeHidden();
      await expect(ui.finder(page)).toBeVisible();
    });

    test('MOB-11 the menu reaches the about page', async ({ page }) => {
      const menu = await openMobileMenu(page);
      await expect(menu.locator('a[href="/about"]'), 'About us should be one tap from the menu').toHaveCount(1);
    });

    test('MOB-13 the bag control in the menu opens the bag and closes the menu', async ({ page }) => {
      const menu = await openMobileMenu(page);
      await menu.getByRole('button', { name: /^Bag/ }).click();
      await expect(menu).toBeHidden();
      await expect(ui.cartDrawer(page)).toBeVisible();
    });

    test('MOB-12 the menu actions are not covered by the booking bar or chat button', async ({ page }) => {
      const menu = await openMobileMenu(page);
      const actions = [
        menu.getByRole('link', { name: 'Book an appointment', exact: true }),
        menu.getByRole('link', { name: 'Chat on WhatsApp' }),
        menu.getByRole('link', { name: /direct line/i })
      ];
      for (const action of actions) {
        await action.scrollIntoViewIfNeeded();
        expect(await coveringElement(action), `${await action.innerText()} is covered`).toBeNull();
      }
    });
  });

  test.describe(`Mobile booking bar, starting on ${start}`, () => {
    test.beforeEach(async ({ page }) => {
      test.skip(viewportWidth(page) > STICKY_BAR_MAX, 'the booking bar only shows at 768px and below');
      await page.goto(start);
    });

    test('STK-01 the bar offers Call, WhatsApp and Book', async ({ page }) => {
      const bar = ui.stickyBar(page);
      await expect(bar).toBeVisible();
      await expect(bar.getByRole('link', { name: 'Call MerryGold Clinic' })).toBeVisible();
      await expect(bar.getByRole('link', { name: 'Chat on WhatsApp' })).toBeVisible();
      await expect(bar.getByRole('link', { name: 'Book', exact: true })).toBeVisible();
    });

    test('STK-02 "Book" opens the treatments list at the top', async ({ page }) => {
      await page.evaluate(() => window.scrollTo(0, 1200));
      await ui.stickyBar(page).getByRole('link', { name: 'Book', exact: true }).click();
      await expectOnPage(page, routeByPath('/treatments'));
      await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(80);
    });
  });
}

test.describe('Mobile booking bar on the treatments page itself', () => {
  test('STK-03 "Book" while already on Treatments returns to the top of the list', async ({ page }) => {
    test.skip(viewportWidth(page) > STICKY_BAR_MAX, 'the booking bar only shows at 768px and below');
    await page.goto('/treatments');
    await page.evaluate(() => window.scrollTo(0, 2000));
    await ui.stickyBar(page).getByRole('link', { name: 'Book', exact: true }).click();
    await expect.poll(() => page.evaluate(() => window.scrollY), { message: 'Book should visibly do something' }).toBeLessThan(80);
  });
});
