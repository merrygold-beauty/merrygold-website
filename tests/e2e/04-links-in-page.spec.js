import { test, expect } from '../support/fixtures.js';
import { routeByPath, CLINIC } from '../support/site.js';
import { ui, expectOnPage } from '../support/helpers.js';

test.describe('Home page links and controls', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('HOME-01 hero "Treatments" opens the treatments list', async ({ page }) => {
    await page.locator('.hero-actions-cluster').getByRole('link', { name: 'Treatments' }).click();
    await expectOnPage(page, routeByPath('/treatments'));
  });

  test('HOME-02 hero "Find my treatment" opens the finder', async ({ page }) => {
    await page.locator('.hero-actions-cluster').getByRole('button', { name: 'Find my treatment' }).click();
    await expect(ui.finder(page)).toBeVisible();
  });

  test('HOME-03 treatments section "Find my treatment" opens the finder', async ({ page }) => {
    await page.locator('.discovery-section').getByRole('button', { name: 'Find my treatment' }).click();
    await expect(ui.finder(page)).toBeVisible();
  });

  test('HOME-14 Manifesto "About us" opens the about page', async ({ page }) => {
    await page.locator('.manifesto-author-strip').getByRole('link', { name: 'About us' }).click();
    await expectOnPage(page, routeByPath('/about'));
  });

  test('HOME-15 Manifesto portrait "About Oluwakemi Okunniyi" opens the about page', async ({ page }) => {
    await page.locator('.manifesto-author-strip').getByRole('link', { name: 'About Oluwakemi Okunniyi' }).click();
    await expectOnPage(page, routeByPath('/about'));
  });

  test('HOME-16 hero "Book an appointment" opens the treatments list', async ({ page }) => {
    await page.locator('.hero-book-row').getByRole('link', { name: 'Book an appointment' }).click();
    await expectOnPage(page, routeByPath('/treatments'));
  });

  test('HOME-17 hero telephone link dials the clinic', async ({ page }) => {
    await expect(page.locator('.hero-book-row a[href^="tel:"]')).toHaveAttribute('href', CLINIC.phoneHref);
  });

  test('HOME-18 the hero shows Book and the call number above Treatments and Find my treatment', async ({ page }) => {
    const bookRowBox = await page.locator('.hero-book-row').boundingBox();
    const actionsClusterBox = await page.locator('.hero-actions-cluster').boundingBox();
    expect(bookRowBox.y, 'the Book row should sit above the Treatments/Finder row').toBeLessThan(actionsClusterBox.y);
  });

  test('HOME-04 each treatments tab shows only that category, and All Protocols shows a mix', async ({ page }) => {
    const section = page.locator('.discovery-section');
    const tabs = section.locator('.category-tab-pill');
    const count = await tabs.count();
    for (let i = 1; i < count; i += 1) {
      const tab = tabs.nth(i);
      const name = (await tab.innerText()).trim();
      await tab.click();
      await expect(tab).toHaveClass(/active/);
      const labels = await section.locator('.treatment-category-label').allInnerTexts();
      expect(labels.length, `${name} should show at least one treatment`).toBeGreaterThan(0);
      expect(new Set(labels.map((l) => l.trim().toLowerCase())), `${name} tab`).toEqual(new Set([name.toLowerCase()]));
    }
    await tabs.first().click();
    await expect(section.locator('.treatment-card')).toHaveCount(6);
  });

  test('HOME-05 a treatment card "About this treatment" opens the guide for that treatment, not the whole list', async ({ page }) => {
    const card = page.locator('.discovery-section .treatment-card').first();
    const name = (await card.locator('.treatment-name').innerText()).trim();
    await card.getByRole('link', { name: 'About this treatment' }).click();
    await expect(page.getByRole('dialog', { name }), `the guide for ${name} should open`).toBeVisible();
  });

  test('HOME-06 "All Treatments" opens the treatments list', async ({ page }) => {
    await page.getByRole('link', { name: 'All Treatments' }).click();
    await expectOnPage(page, routeByPath('/treatments'));
  });

  test('HOME-07 "View Shop" opens the shop', async ({ page }) => {
    await page.locator('.shop-preview-section').getByRole('link', { name: 'View Shop' }).click();
    await expectOnPage(page, routeByPath('/shop'));
  });

  test('HOME-08 tapping a product, or its Examine button, opens that product', async ({ page }) => {
    const card = page.locator('.shop-preview-section .product-card').first();
    const name = (await card.locator('.product-card-title').innerText()).trim();
    await card.locator('.product-card-title').click();
    await expect(ui.productModal(page).getByRole('heading', { name })).toBeVisible();
    await ui.productModal(page).getByRole('button', { name: 'Close product view' }).click();
    await expect(ui.productModal(page)).toBeHidden();
    await card.getByRole('button', { name: `Quick view ${name}` }).click();
    await expect(ui.productModal(page).getByRole('heading', { name })).toBeVisible();
  });

  test('HOME-09 each results tab shows its own case in the slider', async ({ page }) => {
    const tabs = page.locator('.case-study-tab');
    const count = await tabs.count();
    expect(count).toBeGreaterThan(1);
    for (let i = 0; i < count; i += 1) {
      const treatment = (await tabs.nth(i).locator('.case-tab-treatment').innerText()).trim();
      await tabs.nth(i).click();
      await expect(tabs.nth(i)).toHaveClass(/active/);
      await expect(page.locator('.active-slider-shell .slider-case-title')).toHaveText(treatment);
    }
  });

  test('HOME-10 "View Results" opens the results page', async ({ page }) => {
    await page.getByRole('link', { name: 'View Results' }).click();
    await expectOnPage(page, routeByPath('/results'));
  });

  test('HOME-11 booking section "Find my treatment" opens the finder', async ({ page }) => {
    await page.locator('.invitation-section').getByRole('button', { name: 'Find my treatment' }).click();
    await expect(ui.finder(page)).toBeVisible();
  });

  test('HOME-12 booking section telephone link dials the clinic', async ({ page }) => {
    await expect(page.locator('.invitation-section a[href^="tel:"]')).toHaveAttribute('href', CLINIC.phoneHref);
  });
});

test.describe('Treatments page controls', () => {
  test('TRT-L1 "Find my treatment" banner opens the finder', async ({ page }) => {
    await page.goto('/treatments');
    await page.locator('.finder-banner-strip').getByRole('button', { name: 'Find my treatment' }).click();
    await expect(ui.finder(page)).toBeVisible();
  });
});

test.describe('Legal page cross-links', () => {
  test('PRV-01 Privacy Policy "Cookie Notice" opens the cookie notice page', async ({ page }) => {
    await page.goto('/privacy');
    await page.locator('article.legal-article').getByRole('link', { name: 'Cookie Notice' }).click();
    await expectOnPage(page, routeByPath('/cookies'));
  });

  test('PRV-02 Privacy Policy email link writes to the clinic', async ({ page }) => {
    await page.goto('/privacy');
    await expect(page.locator('article.legal-article a[href^="mailto:"]').first()).toHaveAttribute('href', CLINIC.emailHref);
  });

  test('COO-01 Cookie Notice "Privacy Policy" opens the privacy page', async ({ page }) => {
    await page.goto('/cookies');
    await page.locator('article.legal-article').getByRole('link', { name: 'Privacy Policy' }).click();
    await expectOnPage(page, routeByPath('/privacy'));
  });

  test('TRM-01 Terms and policies "training page" opens training', async ({ page }) => {
    await page.goto('/terms');
    await page.locator('article.legal-article').getByRole('link', { name: 'training page' }).click();
    await expectOnPage(page, routeByPath('/training'));
  });

  test('TRM-02 Terms and policies email link writes to the clinic', async ({ page }) => {
    await page.goto('/terms');
    await expect(page.locator('article.legal-article a[href^="mailto:"]')).toHaveAttribute('href', CLINIC.emailHref);
  });
});

test.describe('Cookie notice links', () => {
  test.use({ cookieNotice: 'show' });

  test('CKN-01 "Cookie Notice" in the notice opens the cookie page', async ({ page }) => {
    await page.goto('/');
    await ui.cookieNotice(page).getByRole('link', { name: 'Cookie Notice' }).click();
    await expectOnPage(page, routeByPath('/cookies'));
  });

  test('CKN-02 "Privacy" in the notice opens the privacy page', async ({ page }) => {
    await page.goto('/');
    await ui.cookieNotice(page).getByRole('link', { name: 'Privacy' }).click();
    await expectOnPage(page, routeByPath('/privacy'));
  });

  test('CKN-03 closing the notice keeps it closed on other pages and after a reload', async ({ page }) => {
    await page.goto('/');
    await ui.cookieNotice(page).getByRole('button', { name: 'Close cookie notice' }).click();
    await expect(ui.cookieNotice(page)).toBeHidden();
    await page.goto('/shop');
    await expect(ui.cookieNotice(page)).toBeHidden();
    await page.reload();
    await expect(ui.cookieNotice(page)).toBeHidden();
  });

  test('CKN-04 a first-time visitor sees the notice', async ({ page }) => {
    await page.goto('/treatments');
    await expect(ui.cookieNotice(page)).toBeVisible();
  });
});
