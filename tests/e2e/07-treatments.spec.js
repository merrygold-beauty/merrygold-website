import { test, expect } from '../support/fixtures.js';
import { CATEGORIES, categoryUrl } from '../support/site.js';
import { importAppData, isPhoneProject, treatmentsListedIn } from '../support/helpers.js';

const cards = (page) => page.locator('.treatment-directory-card');
const pill = (page, name) => page.locator('.cat-filter-btn').filter({ hasText: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\&]/g, '\\$&')}`) });
// The search box drives a suggestions listbox, so its role is combobox, not textbox.
const search = (page) => page.getByRole('combobox', { name: 'Search treatments' });
const suggestionRows = (page) => page.locator('.search-suggestion');
const categorySuggestionRows = (page) => suggestionRows(page).filter({ has: page.locator('.search-suggestion-kind') });
const treatmentSuggestionRows = (page) => suggestionRows(page).filter({ has: page.locator('.search-suggestion-meta') });

// Only a treatment with a photo ever renders as a .treatment-directory-card;
// one without renders as a text-only .service-row instead.
const photographed = (treatments) => treatments.filter((t) => t.image);

async function visibleCardFacts(page) {
  return cards(page).evaluateAll((els) =>
    els.map((el) => ({
      name: el.querySelector('.dir-title')?.innerText.trim(),
      category: el.querySelector('.dir-category')?.innerText.trim(),
      text: el.innerText.toLowerCase()
    }))
  );
}

test.describe('Treatments directory', () => {
  let data;

  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(isPhoneProject(testInfo), 'directory cards are desktop layout; phone list covered in 23-phone-listings');
    await page.goto('/treatments');
    data = await importAppData(page, '/src/data/treatments.js');
  });

  test('TRT-01 "All" lists every photographed treatment and says how many treatments exist', async ({ page }) => {
    await expect(cards(page)).toHaveCount(photographed(data.treatments).length);
    await expect(pill(page, 'All')).toHaveText(`All (${data.treatments.length})`);
    await expect(pill(page, 'All')).toHaveClass(/active/);
  });

  for (const category of CATEGORIES) {
    test(`TRT-02 "${category.name}" shows only its photographed treatments`, async ({ page }) => {
      const expected = photographed(data.treatments.filter((t) => t.category === category.id));
      await pill(page, category.name).click();
      await expect(cards(page)).toHaveCount(expected.length);
      if (expected.length === 0) return;
      const facts = await visibleCardFacts(page);
      expect(new Set(facts.map((f) => f.category))).toEqual(new Set([category.name]));
      expect(facts.map((f) => f.name).sort()).toEqual(expected.map((t) => t.name).sort());
    });
  }

  test('TRT-03 only the chosen category is marked as selected', async ({ page }) => {
    await pill(page, 'Laser Hair Removal').click();
    await expect(page.locator('.cat-filter-btn.active')).toHaveCount(1);
    await expect(page.locator('.cat-filter-btn.active')).toHaveText('Laser Hair Removal / Laser Treatment');
  });

  test('TRT-04 search finds treatments by name, description or category, whatever the case', async ({ page }) => {
    for (const query of ['HYDRA', 'collagen', 'laser']) {
      await search(page).fill(query);
      const facts = await visibleCardFacts(page);
      expect(facts.length, `results for "${query}"`).toBeGreaterThan(0);
      // Checked against the catalogue, not the card's text: search reads every
      // benefit, while a card prints only the first three.
      for (const fact of facts) {
        const treatment = data.treatments.find((t) => t.name === fact.name);
        const searchable = [treatment.name, treatment.categoryName, treatment.subcategory, treatment.tagline, ...treatment.concerns, ...treatment.benefits].join(' ').toLowerCase();
        expect(searchable, `"${fact.name}" should relate to "${query}"`).toContain(query.toLowerCase());
      }
    }
    await search(page).fill('hydra');
    await expect(cards(page).filter({ hasText: 'Hydra Facial' })).toHaveCount(1);
  });

  test('TRT-05 search and category narrow the list together', async ({ page }) => {
    await pill(page, 'Laser Hair Removal').click();
    await search(page).fill('face');
    const facts = await visibleCardFacts(page);
    expect(facts.length).toBeGreaterThan(0);
    for (const fact of facts) {
      expect(fact.category).toBe('Laser Hair Removal / Laser Treatment');
      expect(fact.text).toContain('face');
    }
  });

  test('TRT-06 a search with no matches says so, and Reset brings everything back', async ({ page }) => {
    await pill(page, 'Brows & Lashes').click();
    await search(page).fill('zzzz not a treatment');
    await expect(cards(page)).toHaveCount(0);
    await expect(page.locator('.no-results-box')).toContainText('No treatments matched');
    await page.getByRole('button', { name: 'Reset' }).click();
    await expect(cards(page)).toHaveCount(photographed(data.treatments).length);
    await expect(search(page)).toHaveValue('');
    await expect(pill(page, 'All')).toHaveClass(/active/);
  });

  test('TRT-07 every card shows the bookable price, duration, category, benefits and a described photo, and an unphotographed treatment renders as a ServiceRow instead', async ({ page }) => {
    const withImage = photographed(data.treatments);
    await expect(cards(page)).toHaveCount(withImage.length);
    for (let i = 0; i < withImage.length; i += 1) {
      const card = cards(page).nth(i);
      const treatment = withImage[i];
      await expect(card.locator('.dir-title')).toHaveText(treatment.name);
      await expect(card.locator('.dir-price-badge')).toHaveText(treatment.priceDisplay);
      await expect(card.locator('.dir-duration')).toHaveText(treatment.duration);
      await expect(card.locator('.dir-category')).toHaveText(treatment.categoryName);
      await expect(card.locator('.dir-benefits-list li')).toHaveCount(Math.min(3, treatment.benefits.length));
      await expect(card.locator('img')).toHaveAttribute('alt', treatment.name);
    }

    // A treatment listed in several categories (alsoListedIn) has a row in each.
    const textOnlyRows = CATEGORIES.flatMap((category) => treatmentsListedIn(data.treatments, category.id)).filter((t) => !t.image);
    await expect(page.locator('.service-row')).toHaveCount(textOnlyRows.length);
    await expect(page.locator('.service-row img')).toHaveCount(0);
  });

  for (const category of CATEGORIES) {
    test(`TRT-08 the "${category.name}" page shows that category straight away, under its own heading`, async ({ page }) => {
      await page.goto(categoryUrl(category.id));
      const expected = photographed(data.treatments.filter((t) => t.category === category.id)).length;
      await expect(cards(page)).toHaveCount(expected);
      await expect(page.locator('.cat-filter-btn.active')).toHaveText(category.name);
      await expect(page.locator('h1')).toHaveText(category.name);
    });
  }

  test('TRT-09 an old /treatments?category= link lands on the category page', async ({ page }) => {
    const category = CATEGORIES[1];
    await page.goto(`/treatments?category=${category.id}`);
    await expect.poll(() => new URL(page.url()).pathname).toBe(categoryUrl(category.id));
    await expect(page.locator('h1')).toHaveText(category.name);
  });

  test('TRT-40 typing "Makeup" suggests both makeup categories and at least one treatment', async ({ page }) => {
    await search(page).fill('Makeup');
    await expect(page.getByRole('listbox')).toBeVisible();
    const categoryNames = await categorySuggestionRows(page).locator('.search-suggestion-name').allInnerTexts();
    expect(categoryNames.sort()).toEqual(['Editorial & Bridal Makeup', 'Semi-Permanent Makeup']);
    expect(await treatmentSuggestionRows(page).count()).toBeGreaterThan(0);
  });

  test('TRT-41 choosing a category suggestion selects that chip and clears the search box', async ({ page }) => {
    await search(page).fill('Makeup');
    // Categories always render before treatments, so the first row that
    // mentions the category name is the category row itself.
    await suggestionRows(page).filter({ hasText: 'Semi-Permanent Makeup' }).first().click();
    await expect(pill(page, 'Semi-Permanent Makeup')).toHaveClass(/active/);
    await expect(search(page)).toHaveValue('');
    await expect(page.getByRole('listbox')).toHaveCount(0);
  });

  test('TRT-42 choosing a treatment suggestion opens its detail sheet', async ({ page }) => {
    await search(page).fill('Hydra Facial');
    await treatmentSuggestionRows(page).filter({ hasText: 'Hydra Facial' }).first().click();
    await expect(page.getByRole('dialog', { name: 'Hydra Facial' })).toBeVisible();
  });

  test('TRT-43 typing "Lip Waxing" finds the unphotographed service', async ({ page }) => {
    await search(page).fill('Lip Waxing');
    await expect(suggestionRows(page).filter({ hasText: 'Lip Waxing' })).toHaveCount(1);
    await expect(page.locator('.service-row').filter({ hasText: 'Lip Waxing' })).toHaveCount(1);
  });

  test('TRT-44 ArrowDown then Enter selects the first suggestion', async ({ page }) => {
    await search(page).fill('Makeup');
    await search(page).press('ArrowDown');
    await search(page).press('Enter');
    await expect(search(page)).toHaveValue('');
    // Categories always rank first, in catalogue order, so Enter selects the
    // first category with "Makeup" in its name, whichever that is today.
    const firstMakeupCategory = data.treatmentCategories.find((category) => /makeup/i.test(category.name));
    await expect(pill(page, firstMakeupCategory.name)).toHaveClass(/active/);
  });
});
