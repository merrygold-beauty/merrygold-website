import { test, expect } from '../support/fixtures.js';
import { isPhoneProject } from '../support/helpers.js';

test.describe('Phone listings', () => {
  test.beforeEach(() => {
    test.skip(!isPhoneProject(test.info()), 'phone layout only');
  });

  test('TRT-20 the treatments page shows grouped list rows instead of the card grid', async ({ page }) => {
    await page.goto('/treatments');
    await expect(page.locator('.list-row').first()).toBeVisible();
    await expect(page.locator('.list-group-heading').first()).toBeVisible();
  });

  test('TRT-21 tapping a row opens the treatment detail sheet with a Book button', async ({ page }) => {
    await page.goto('/treatments');
    const firstRow = page.locator('.list-row').first();
    const href = await firstRow.getAttribute('href');
    await firstRow.click();
    await expect(page).toHaveURL(new RegExp(`${href}$`));
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Book' })).toBeVisible();
  });

  test('TRT-22 Escape closes the treatment detail and returns to the list', async ({ page }) => {
    await page.goto('/treatments');
    await page.locator('.list-row').first().click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden();
    await expect(page).toHaveURL(/\/treatments$/);
  });

  test('TRT-23 the Close button returns to the list', async ({ page }) => {
    await page.goto('/treatments');
    await page.locator('.list-row').first().click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: 'Close' }).click();
    await expect(dialog).toBeHidden();
    await expect(page).toHaveURL(/\/treatments$/);
  });

  test('SHP-10 the shop page shows a two-column product grid', async ({ page }) => {
    await page.goto('/shop');
    const cards = page.locator('.product-card');
    await expect(cards.first()).toBeVisible();
    const first = await cards.nth(0).boundingBox();
    const second = await cards.nth(1).boundingBox();
    expect(first.y).toBeCloseTo(second.y, 0);
  });
});
