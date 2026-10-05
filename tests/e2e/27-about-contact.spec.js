import { test, expect } from '../support/fixtures.js';
import { expectOnPage } from '../support/helpers.js';
import { routeByPath } from '../support/site.js';

test.describe('About us page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/about');
  });

  test('ABT-01 the heading reads About us', async ({ page }) => {
    await expect(page.locator('h1')).toHaveText('About us');
  });

  test('ABT-02 the founder is named on the page', async ({ page }) => {
    const { clinicData } = await page.evaluate(async () => {
      const mod = await import('/src/data/clinic.js');
      return { clinicData: mod.clinicData };
    });
    await expect(page.getByRole('heading', { name: clinicData.director.name })).toBeVisible();
  });

  test('ABT-03 every clinic standard is listed', async ({ page }) => {
    const { clinicData } = await page.evaluate(async () => {
      const mod = await import('/src/data/clinic.js');
      return { clinicData: mod.clinicData };
    });
    for (const standard of clinicData.director.standards) {
      // .first(): the list item and its inner span both carry the exact same
      // text (the icon beside it contributes none), so a plain text match
      // resolves to two elements for the same visible line.
      await expect(page.getByText(standard).first()).toBeVisible();
    }
  });

  test('ABT-04 the free consultation button opens the consultation sheet', async ({ page }) => {
    await page.getByRole('button', { name: 'Book a free consultation' }).click();
    await expect(page.getByRole('dialog', { name: 'Book a free consultation' })).toBeVisible();
  });

  test('ABT-05 See the clinic goes to the clinic page', async ({ page }) => {
    await page.getByRole('link', { name: 'See the clinic' }).click();
    await expectOnPage(page, routeByPath('/the-clinic'));
  });
});

test.describe('Contact us page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/contact');
  });

  test('CTP-01 the heading reads Contact us', async ({ page }) => {
    await expect(page.locator('h1')).toHaveText('Contact us');
  });

  test('CTP-02 telephone, email, WhatsApp and Maps links are all present', async ({ page }) => {
    const { clinicData } = await page.evaluate(async () => {
      const mod = await import('/src/data/clinic.js');
      return { clinicData: mod.clinicData };
    });
    const main = page.locator('#main-content');
    await expect(main.locator(`a[href="${clinicData.contact.phoneHref}"]`)).toBeVisible();
    await expect(main.locator(`a[href="${clinicData.contact.emailHref}"]`)).toBeVisible();
    await expect(page.getByRole('link', { name: 'WhatsApp' })).toHaveAttribute('href', /^https:\/\/wa\.me\//);
    const mapsLink = page.getByRole('link', { name: 'Open in Google Maps' });
    await expect(mapsLink).toHaveAttribute('href', clinicData.google.mapsUrl);
    await expect(mapsLink).toHaveAttribute('target', '_blank');
    await expect(mapsLink).toHaveAttribute('rel', /noopener/);
  });
});
