import { test, expect } from '../support/fixtures.js';
import { importAppData, expectBagCount, openBag, isPhoneProject, treatmentsListedIn } from '../support/helpers.js';

// The owner's layout (2026-09-24): every category is its own section, its
// photographed treatments first, then the ones without a photo under an
// "Other <category> services" heading. The category chips and search stay.
test.describe('Category sections and other services', () => {
  let data;

  test.beforeEach(async ({ page }) => {
    await page.goto('/treatments');
    data = await importAppData(page, '/src/data/treatments.js');
  });

  test('OTH-01 the full list opens with one section per category, in order', async ({ page }) => {
    const sections = page.locator('.treatment-category-section');
    await expect(sections).toHaveCount(data.treatmentCategories.length);
    const headings = await sections.locator(':scope > h2').allInnerTexts();
    expect(headings.map((h) => h.trim())).toEqual(data.treatmentCategories.map((c) => c.name));
  });

  test('OTH-02 each section lists its photographed treatments, then its other services', async ({ page }, testInfo) => {
    const cardSelector = isPhoneProject(testInfo) ? '.list-row' : '.treatment-directory-card';
    for (const [index, category] of data.treatmentCategories.entries()) {
      const section = page.locator('.treatment-category-section').nth(index);
      const inCategory = treatmentsListedIn(data.treatments, category.id);
      const textOnly = inCategory.filter((t) => !t.image);
      await expect(section.locator(cardSelector)).toHaveCount(inCategory.length - textOnly.length);
      await expect(section.locator('.service-row')).toHaveCount(textOnly.length);
      if (textOnly.length > 0) {
        await expect(section.locator('.other-services-heading')).toHaveText(`Other ${category.name} services`);
      }
    }
  });

  test('OTH-03 the Sort select reorders by price', async ({ page }, testInfo) => {
    const isPhone = isPhoneProject(testInfo);
    const sortSelect = page.getByRole('combobox', { name: 'Sort' });
    await expect(sortSelect).toBeVisible();

    await sortSelect.selectOption('price-asc');

    const prices = await page.evaluate((phone) => {
      const selector = phone ? '.list-row' : '.treatment-directory-card';
      const items = Array.from(document.querySelectorAll(selector));
      return items.map(c => {
        const badge = (phone ? c.querySelector('.price') : c.querySelector('.dir-price-badge'))?.textContent || '';
        const num = parseFloat(badge.replace(/[^0-9.]/g, ''));
        // "Price on consultation" sorts after every priced treatment.
        return isNaN(num) ? Number.MAX_SAFE_INTEGER : num;
      });
    }, isPhone);

    expect(prices.length).toBeGreaterThan(10);
    for (let i = 0; i < prices.length - 1; i++) {
      expect(prices[i]).toBeLessThanOrEqual(prices[i + 1]);
    }
  });

  test('OTH-04 a treatment with no image renders as text only and can be added to the bag', async ({ page }) => {
    await page.locator('.cat-filter-btn').filter({ hasText: 'Waxing & Facial Threading' }).click();
    const bookableRow = page.locator('.service-row').filter({ has: page.getByRole('button', { name: 'Book' }) }).first();
    await expect(bookableRow).toBeVisible();
    await expect(bookableRow.locator('img')).toHaveCount(0);
    const name = (await bookableRow.locator('.service-row-name').innerText()).trim();

    await bookableRow.getByRole('button', { name: 'Book' }).click();
    await expectBagCount(page, 1);

    await openBag(page);
    const cartItem = page.locator('.cart-item-card').first();
    await expect(cartItem).toBeVisible();
    await expect(cartItem.locator('img')).toHaveCount(0);
    await expect(cartItem.locator('.cart-item-name')).toHaveText(name);
  });

  test('OTH-05 a category chip shows only that category, still split into cards and other services', async ({ page }) => {
    await page.locator('.cat-filter-btn').filter({ hasText: 'Massage & Wellbeing' }).click();
    const sections = page.locator('.treatment-category-section');
    await expect(sections).toHaveCount(1);
    await expect(sections.locator(':scope > h2')).toHaveText('Massage & Wellbeing');

    const textOnly = data.treatments.filter((t) => t.category === 'massage-wellbeing' && !t.image);
    const subcategories = new Set(textOnly.map((t) => t.subcategory));
    await expect(sections.locator('.other-services-subheading')).toHaveCount(subcategories.size);
  });

  test('OTH-06 every treatment slug opens /treatments/<slug> without a broken image', async ({ page }, testInfo) => {
    test.skip(isPhoneProject(testInfo), 'data check runs once on desktop');
    // One navigation per treatment, so the allowance grows with the catalogue.
    test.setTimeout(data.treatments.length * 3_000);

    await page.goto('/treatments');
    await page.waitForLoadState('networkidle');

    for (let i = 0; i < data.treatments.length; i++) {
      const t = data.treatments[i];
      await page.evaluate((slug) => window.__navigate(`/treatments/${slug}`), t.slug);

      const detailCard = page.locator('.treatment-detail-card');
      await expect(detailCard).toBeVisible();
      await expect(detailCard).toHaveAttribute('aria-label', t.name);

      const img = detailCard.locator('img');
      if (await img.count() > 0) {
        await expect.poll(async () => {
          return await img.first().evaluate(el => el.complete && el.naturalWidth > 0);
        }, { timeout: 5000 }).toBe(true);
      }
    }
  });

  test('OTH-08 a photographed treatment with no price yet offers Enquire on its card, naming it in the form', async ({ page }, testInfo) => {
    test.skip(isPhoneProject(testInfo), 'phone rows open the detail sheet instead, covered by GDE-04');
    const unpriced = data.treatments.find((t) => t.image && t.price === null);
    test.skip(!unpriced, 'every photographed treatment is priced');
    const card = page.locator('.treatment-directory-card').filter({ has: page.locator('.dir-title', { hasText: unpriced.name }) });
    await card.getByRole('button', { name: 'Enquire' }).click();
    await expect(page.locator('#cons-notes')).toHaveValue(`I would like to ask about ${unpriced.name}.`);
    await expectBagCount(page, 0);
  });

  test('OTH-07 facials open with the Gold Facial, Derma-Pen and LED, as the owner asked', async ({ page }, testInfo) => {
    const titleSelector = isPhoneProject(testInfo) ? '.list-row-title' : '.dir-title';
    const facials = page.locator('.treatment-category-section').first();
    const firstThree = (await facials.locator(titleSelector).allInnerTexts()).slice(0, 3).map((t) => t.trim());
    expect(firstThree).toEqual(['Gold Facial', 'Derma-Pen Microneedling', 'LED Light Therapy Facial']);
  });
});
