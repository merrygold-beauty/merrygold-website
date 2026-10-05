import { test, expect } from '../support/fixtures.js';
import { ui, completeFinder, isPhoneProject } from '../support/helpers.js';

const BROWS = ['Sparse, uneven or unruly brows', 'Brows and eyes', 'A one-off appointment'];

async function openFinder(page) {
  await page.goto('/#finder');
  await expect(ui.finder(page)).toBeVisible();
  return ui.finder(page);
}

test.describe('Treatment Finder', () => {
  test('FND-01 a link to /#finder opens the finder straight away', async ({ page }) => {
    await openFinder(page);
    await expect(ui.finder(page).locator('.question-step-number')).toHaveText('Step 01 of 03');
  });

  test('FND-02 the three questions come in order and the progress bar fills', async ({ page }) => {
    const finder = await openFinder(page);
    const fill = finder.locator('.finder-progress-fill');
    const widths = [];
    for (const [index, answer] of BROWS.entries()) {
      await expect(finder.locator('.question-step-number')).toHaveText(`Step 0${index + 1} of 03`);
      widths.push(await fill.evaluate((el) => parseFloat(el.style.width)));
      await finder.getByRole('button', { name: answer, exact: true }).click();
    }
    expect(widths.map(Math.round)).toEqual([33, 67, 100]);
    await expect(finder.getByRole('heading', { name: 'Your matches' })).toBeVisible();
  });

  test('FND-03 Back returns to the previous question', async ({ page }) => {
    const finder = await openFinder(page);
    await expect(finder.getByRole('button', { name: 'Back' })).toHaveCount(0);
    await finder.getByRole('button', { name: BROWS[0], exact: true }).click();
    await finder.getByRole('button', { name: 'Back' }).click();
    await expect(finder.locator('.question-step-number')).toHaveText('Step 01 of 03');
  });

  test('FND-04 every concern ends with three matches and an explanation', async ({ page }) => {
    await page.goto('/');
    const concerns = await page.evaluate(async () => {
      const { QUESTIONS } = await import('/src/components/finder/finderMatching.js');
      return QUESTIONS[0].options.map((option) => option.label);
    });
    for (const concern of concerns) {
      await page.goto('/#finder');
      const matches = await completeFinder(page, [concern, 'No preference, recommend for me', 'A one-off appointment']);
      await expect(matches, concern).toHaveCount(3);
      await expect(ui.finder(page).locator('.results-rationale')).toContainText(concern.charAt(0).toLowerCase() + concern.slice(1));
    }
  });

  test('FND-05 all 84 answer combinations return three matches that fit the concern', async ({ page }) => {
    test.skip(!isPhoneProject(test.info()), 'a data check; running it once is enough');
    await page.goto('/');
    const problems = await page.evaluate(async () => {
      const { QUESTIONS, rankTreatments } = await import('/src/components/finder/finderMatching.js');
      const { treatments } = await import('/src/data/treatments.js');
      const [concernQ, areaQ, commitmentQ] = QUESTIONS;
      const fits = (treatment, concern) =>
        concern.categories.includes(treatment.category) ||
        (treatment.concerns || []).some((c) => concern.tags.some((tag) => c.toLowerCase().includes(tag.toLowerCase()) || tag.toLowerCase().includes(c.toLowerCase())));
      const found = [];
      for (const concern of concernQ.options) {
        for (const area of areaQ.options) {
          for (const commitment of commitmentQ.options) {
            const results = rankTreatments(treatments, { concern, area, commitment });
            const path = `${concern.id} / ${area.id} / ${commitment.id}`;
            if (results.length !== 3) found.push(`${path} returned ${results.length}`);
            for (const t of results) if (!fits(t, concern)) found.push(`${path} suggested ${t.name}`);
          }
        }
      }
      return found;
    });
    expect(problems).toEqual([]);
  });

  test('FND-06 Restart goes back to the first question', async ({ page }) => {
    await openFinder(page);
    await completeFinder(page, BROWS);
    await ui.finder(page).getByRole('button', { name: 'Restart' }).click();
    await expect(ui.finder(page).locator('.question-step-number')).toHaveText('Step 01 of 03');
  });

  test('FND-07 "Ask Goldie" closes the finder and asks Goldie about that treatment', async ({ page }) => {
    await openFinder(page);
    const matches = await completeFinder(page, BROWS);
    const name = (await matches.first().locator('.matched-name').innerText()).trim();
    await matches.first().getByRole('button', { name: 'Ask Goldie' }).click();
    await expect(ui.finder(page)).toBeHidden();
    await expect(ui.chat(page)).toBeVisible();
    await expect(ui.chat(page).locator('.msg-user').last()).toContainText(name);
    await expect(ui.chat(page).locator('.msg-bot')).toHaveCount(2);
  });

  test('FND-08 "About this treatment" opens the guide for that treatment', async ({ page }) => {
    await openFinder(page);
    const matches = await completeFinder(page, BROWS);
    const name = (await matches.first().locator('.matched-name').innerText()).trim();
    await matches.first().getByRole('link', { name: 'About this treatment' }).click();
    await expect(ui.finder(page)).toBeHidden();
    await expect(page.getByRole('dialog', { name }), `the guide for ${name}`).toBeVisible();
  });

  test('FND-09 the close button and a tap outside both close the finder', async ({ page }) => {
    const finder = await openFinder(page);
    await finder.getByRole('button', { name: 'Close Treatment Finder' }).click();
    await expect(finder).toBeHidden();
    await page.goto('/');
    await page.evaluate(() => window.dispatchEvent(new CustomEvent('open-treatment-finder')));
    await expect(finder).toBeVisible();
    await page.locator('.finder-backdrop').click({ position: { x: 3, y: 3 } });
    await expect(finder).toBeHidden();
  });

  test('FND-10 Escape closes the finder', async ({ page }) => {
    await openFinder(page);
    await page.keyboard.press('Escape');
    await expect(ui.finder(page)).toBeHidden();
  });
});
