import { test, expect } from '../support/fixtures.js';
import { routeByPath, CLINIC, WHATSAPP_NUMBERS, STICKY_BAR_MAX } from '../support/site.js';
import {
  ui,
  viewportWidth,
  navigateByMenu,
  expectOnPage,
  expectBagCount,
  openBag,
  fillCheckout,
  completeFinder,
  urlOpenedInNewTab,
  parseWhatsApp,
  visibleSiteLink,
  revealHeader
} from '../support/helpers.js';

// End-to-end journeys for the seven visitors the design brief was written for.
// Each one goes the way that visitor would, through the menu or controls this
// screen size actually shows, and ends where that visitor needs to end.

async function goToTreatments(page) {
  // The drawer reads "Treatments" too now (NAV_ITEMS drives both), so one
  // name works regardless of which menu this screen size shows.
  await navigateByMenu(page, 'Treatments');
  await expectOnPage(page, routeByPath('/treatments'));
}

async function checkoutToPending(page, expectedItems) {
  await openBag(page);
  await ui.cartDrawer(page).getByRole('button', { name: 'Checkout' }).click();
  await expect(ui.checkout(page)).toBeVisible();
  for (const item of expectedItems) await expect(ui.checkout(page)).toContainText(item);
  await fillCheckout(page);
  await ui.checkout(page).locator('button[type=submit]').click();
  await expect(ui.checkout(page).getByText(/pending/i).first(), 'the journey should end with the order pending payment').toBeVisible({ timeout: 10_000 });
}

test.describe('User journeys', () => {
  test('UJ-01 a first-time visitor finds laser hair removal, books it and reaches a pending checkout', async ({ page }) => {
    await page.goto('/');
    await goToTreatments(page);
    await page.locator('.cat-filter-btn').filter({ hasText: 'Laser Hair Removal' }).click();
    const card = page.locator('.treatment-directory-card').first();
    const name = (await card.locator('.dir-title').innerText()).trim();
    await card.getByRole('button', { name: 'Book' }).click();
    await expectBagCount(page, 1);
    await checkoutToPending(page, [name]);
  });

  test('UJ-02 a returning client books a Hydra Facial quickly from another page', async ({ page }) => {
    await page.goto('/results');
    if (viewportWidth(page) <= STICKY_BAR_MAX) {
      await ui.stickyBar(page).getByRole('link', { name: 'Book', exact: true }).click();
    } else {
      await revealHeader(page);
      await ui.header(page).getByRole('link', { name: 'Book' }).click();
    }
    await page.getByRole('combobox', { name: 'Search treatments' }).fill('hydra');
    await page.locator('.treatment-directory-card').filter({ hasText: 'Hydra Facial' }).getByRole('button', { name: 'Book' }).click();
    await expectBagCount(page, 1);
    await checkoutToPending(page, ['Hydra Facial']);
  });

  test('UJ-03 a visitor who does not know treatment names uses the finder, reads the details and books', async ({ page }) => {
    await page.goto('/');
    await page.locator('.hero-actions-cluster').getByRole('button', { name: 'Find my treatment' }).click();
    const matches = await completeFinder(page, ['Fine lines, pigmentation and sun damage', 'Face, jawline and neck', 'A course of sessions for a lasting change']);
    const name = (await matches.first().locator('.matched-name').innerText()).trim();
    await matches.first().getByRole('link', { name: 'About this treatment' }).click();
    const guide = page.getByRole('dialog', { name });
    await expect(guide, `the guide for ${name}`).toBeVisible();
    await guide.getByRole('button', { name: 'Book', exact: true }).click();
    await expectBagCount(page, 1);
  });

  test('UJ-04 a visitor arriving on the shop from Instagram compares products and orders two', async ({ page }) => {
    await page.goto('/shop');
    const serum = page.locator('.shop-catalog-section .product-card').filter({ hasText: 'Extra Brightening Serum' });
    await serum.locator('.product-card-title').click();
    await ui.productModal(page).getByRole('button', { name: 'Add', exact: true }).click();
    await ui.productModal(page).getByRole('button', { name: 'Close product view' }).click();
    if (await ui.cartDrawer(page).isVisible()) await ui.cartDrawer(page).getByRole('button', { name: 'Close cart drawer' }).click();
    await page.locator('.shop-filter-pill').filter({ hasText: /^Exfoliators$/ }).click();
    await page.locator('.shop-catalog-section .product-card').filter({ hasText: 'Revive Your Radiance' }).getByRole('button', { name: 'Add to formulation bag' }).click();
    await ui.cartDrawer(page).locator('.cart-item-card').filter({ hasText: 'Revive Your Radiance' }).getByRole('button', { name: 'Increase quantity' }).click();
    await expectBagCount(page, 3);
    await checkoutToPending(page, ['Extra Brightening Serum', 'Revive Your Radiance']);
  });

  test('UJ-05 a cautious visitor looks at results and the founder, then requests a consultation', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'View Results' }).click();
    await expectOnPage(page, routeByPath('/results'));
    const about = await visibleSiteLink(page, '/about');
    expect(about, 'a visible link to the about page').not.toBeNull();
    await about.click();
    await expectOnPage(page, routeByPath('/about'));
    // Book a free consultation opens a consultation sheet built separately
    // from this journey; what this proves from here is that the request
    // starts, and that nothing lands in the bag by mistake.
    await page.getByRole('button', { name: 'Book a free consultation' }).click();
    await expectBagCount(page, 0);
  });

  test('UJ-06 a visitor who wants to talk first finds the phone number, WhatsApp and directions', async ({ page }) => {
    await page.goto('/');
    const contact = await visibleSiteLink(page, '/contact');
    expect(contact, 'a visible link to the contact page from the menu or footer').not.toBeNull();
    await contact.click();
    await expectOnPage(page, routeByPath('/contact'));
    await expect(page.locator('main a[href^="tel:"]')).toHaveAttribute('href', CLINIC.phoneHref);
    const chat = parseWhatsApp(await urlOpenedInNewTab(page, page.locator('.contact-whatsapp-btn')));
    expect(WHATSAPP_NUMBERS).toContain(chat.number);
    await expect(page.locator('main a[href*="maps"]').first(), 'directions').toBeVisible();
  });

  test('UJ-07 someone interested in training sends an enquiry through WhatsApp', async ({ page }) => {
    await page.goto('/');
    const training = await visibleSiteLink(page, '/training');
    expect(training).not.toBeNull();
    await training.click();
    await expectOnPage(page, routeByPath('/training'));
    await page.getByLabel('Full name *').fill('Trainee Test');
    await page.getByLabel('Email *').fill('trainee@example.com');
    await page.getByLabel('Telephone *').fill('07700 900456');
    await page.getByRole('checkbox', { name: 'Brows, Lash Lifts and Extensions' }).check();
    const chat = parseWhatsApp(await urlOpenedInNewTab(page, page.getByRole('button', { name: 'Enquire now' })));
    expect(chat.text).toContain('Brows, Lash Lifts and Extensions');
  });

  test('UJ-08 a visitor asks Goldie about laser prices and goes on to book a treatment', async ({ page }) => {
    await page.goto('/treatments');
    await ui.chatButton(page).click();
    await ui.chat(page).getByRole('button', { name: 'Laser hair removal prices' }).click();
    await expect(ui.chat(page).locator('.msg-bot').last()).toContainText('£');
    await ui.chat(page).getByRole('link', { name: 'Book a treatment' }).click();
    await expect(page).toHaveURL(/\/treatments/);
  });

  test('UJ-09 a price-conscious visitor finds the full price list from the menu or footer', async ({ page }) => {
    await page.goto('/');
    const pricing = await visibleSiteLink(page, '/pricing');
    expect(pricing, 'a visible link to /pricing').not.toBeNull();
    await pricing.click();
    await expectOnPage(page, routeByPath('/pricing'));
  });

  test('UJ-10 a visitor reads a blog article starting from the home page', async ({ page }) => {
    await page.goto('/');
    const blog = await visibleSiteLink(page, '/blog');
    expect(blog, 'a visible link to the blog').not.toBeNull();
    await blog.click();
    await expectOnPage(page, routeByPath('/blog'));
    await page.locator('main article a[href^="/blog/"]').first().click();
    await expect(page.locator('h1').first()).not.toHaveText('Blog');
  });

  test.describe('first visit', () => {
    test.use({ cookieNotice: 'show' });

    test('UJ-11 a privacy-conscious first-time visitor reads the notices and closes the cookie message for good', async ({ page }) => {
      await page.goto('/');
      await expect(ui.cookieNotice(page)).toBeVisible();
      await ui.cookieNotice(page).getByRole('link', { name: 'Cookie Notice' }).click();
      await expectOnPage(page, routeByPath('/cookies'));
      await page.locator('article.legal-article').getByRole('link', { name: 'Privacy Policy' }).click();
      await expectOnPage(page, routeByPath('/privacy'));
      await ui.cookieNotice(page).getByRole('button', { name: 'Close cookie notice' }).click();
      await page.goto('/shop');
      await page.reload();
      await expect(ui.cookieNotice(page)).toBeHidden();
    });
  });
});
