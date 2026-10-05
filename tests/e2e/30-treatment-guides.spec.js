import { test, expect } from '../support/fixtures.js';
import { ui, importAppData, expectBagCount } from '../support/helpers.js';

// Every listed treatment carries an "About this treatment" button that opens
// its guide: what it is, who it suits, preparation and aftercare. The guide
// text comes from the owner's own write-ups, split between the treatment
// (src/data/treatments.js) and its family (src/data/treatmentGuides.js).
const INFO_LABEL = 'About this treatment';

test.describe('Treatment guides', () => {
  let treatments;
  let treatmentGuides;

  test.beforeEach(async ({ page }) => {
    await page.goto('/treatments');
    ({ treatments } = await importAppData(page, '/src/data/treatments.js'));
    ({ treatmentGuides } = await importAppData(page, '/src/data/treatmentGuides.js'));
  });

  test('GDE-01 every treatment names a guide family that exists and can say who it suits', () => {
    const problems = [];
    for (const treatment of treatments) {
      const family = treatmentGuides[treatment.guide];
      if (!family) {
        problems.push(`${treatment.id} names guide "${treatment.guide}", which treatmentGuides.js does not define`);
        continue;
      }
      if (!treatment.about && !family.intro) problems.push(`${treatment.id} has nothing to say about the treatment`);
      if (!treatment.suitableFor && !family.suitableFor) problems.push(`${treatment.id} has nothing on who it suits`);
    }
    expect(problems).toEqual([]);
  });

  test('GDE-02 every listing on the treatments page carries the guide button', async ({ page }) => {
    // A treatment listed in extra categories carries the button in each one.
    const listings = treatments.reduce((count, t) => count + 1 + (t.alsoListedIn?.length ?? 0), 0);
    await expect(page.getByText(INFO_LABEL, { exact: true })).toHaveCount(listings);
  });

  test('GDE-03 the guide opens with the treatment, who it is for, and folding preparation and aftercare', async ({ page }) => {
    const treatment = treatments.find((t) => t.id === 'facial-hydra');
    await page.goto(`/treatments/${treatment.slug}`);

    const guide = page.getByRole('dialog', { name: treatment.name });
    await expect(guide).toBeVisible();
    await expect(guide.getByRole('heading', { name: INFO_LABEL })).toBeVisible();
    await expect(guide.getByText(treatment.about)).toBeVisible();
    await expect(guide.getByRole('heading', { name: 'Who it is for' })).toBeVisible();

    const familyAftercarePoint = treatmentGuides[treatment.guide].aftercare[0];
    await expect(guide.getByText(familyAftercarePoint)).toBeHidden();
    await guide.locator('summary').filter({ hasText: 'Aftercare' }).click();
    await expect(guide.getByText(familyAftercarePoint)).toBeVisible();
  });

  test('GDE-04 a treatment with no price yet offers Enquire, and the form opens already naming it', async ({ page }) => {
    const unpriced = treatments.find((t) => t.price === null);
    test.skip(!unpriced, 'every treatment is priced, so there is nothing to enquire about');
    await page.goto(`/treatments/${unpriced.slug}`);

    const guide = page.getByRole('dialog', { name: unpriced.name });
    await expect(guide.getByRole('button', { name: 'Book', exact: true })).toHaveCount(0);
    await guide.getByRole('button', { name: 'Enquire' }).click();

    await expect(page.locator('#cons-notes')).toHaveValue(`I would like to ask about ${unpriced.name}.`);
    await expectBagCount(page, 0);
  });

  test('GDE-06 Book in the guide closes it and leaves the bag open with the treatment in it', async ({ page }) => {
    const treatment = treatments.find((t) => t.id === 'facial-hydra');
    await page.goto(`/treatments/${treatment.slug}`);

    const guide = page.getByRole('dialog', { name: treatment.name });
    await guide.getByRole('button', { name: 'Book', exact: true }).click();

    await expect(guide).toBeHidden();
    await expect(ui.cartDrawer(page)).toBeVisible();
    await expect(ui.cartDrawer(page).getByRole('button', { name: /^Checkout$/ })).toBeInViewport();
    await expectBagCount(page, 1);
  });

  test('GDE-05 sorting by price never opens on a treatment that shows no price', async ({ page }) => {
    await page.getByRole('combobox', { name: 'Sort' }).selectOption('price-asc');
    // The first listing, whatever shape it takes on this screen, shows pounds.
    const firstPrice = page.locator('.treatments-directory-section .price, .treatments-directory-section .dir-price-badge').first();
    await expect(firstPrice).toContainText('£');
  });
});
