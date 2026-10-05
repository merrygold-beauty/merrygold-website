import { test, expect } from '../support/fixtures.js';
import { CLINIC, WHATSAPP_NUMBERS, STICKY_BAR_MAX } from '../support/site.js';
import { ui, openMobileMenu, revealHeader, urlOpenedInNewTab, parseWhatsApp, usesMobileMenu, viewportWidth, completeFinder, importAppData } from '../support/helpers.js';

async function expectOpensSafelyInNewTab(locator) {
  await expect(locator).toHaveAttribute('target', '_blank');
  await expect(locator).toHaveAttribute('rel', /noopener/);
}

async function expectWhatsAppChat(page, locator) {
  await expectOpensSafelyInNewTab(locator);
  const opened = parseWhatsApp(await urlOpenedInNewTab(page, locator));
  expect(opened.host).toBe('wa.me');
  expect(WHATSAPP_NUMBERS, `WhatsApp number ${opened.number}`).toContain(opened.number);
  expect(opened.text.length, 'the chat should open with a message already written').toBeGreaterThan(10);
}

test.describe('WhatsApp links open a chat with the clinic', () => {
  test('EXT-01 header WhatsApp', async ({ page }) => {
    test.skip(usesMobileMenu(page), 'the header WhatsApp button is desktop only');
    await page.goto('/treatments');
    await revealHeader(page);
    await expectWhatsAppChat(page, ui.header(page).getByRole('link', { name: 'Chat on WhatsApp' }));
  });

  test('EXT-02 mobile menu WhatsApp', async ({ page }) => {
    test.skip(!usesMobileMenu(page), 'mobile menu only');
    await page.goto('/treatments');
    const menu = await openMobileMenu(page);
    await expectWhatsAppChat(page, menu.getByRole('link', { name: 'Chat on WhatsApp' }));
  });

  test('EXT-03 booking bar WhatsApp', async ({ page }) => {
    test.skip(viewportWidth(page) > STICKY_BAR_MAX, 'booking bar only');
    await page.goto('/');
    await expectWhatsAppChat(page, ui.stickyBar(page).getByRole('link', { name: 'Chat on WhatsApp' }));
  });

  test('EXT-04 contact page WhatsApp', async ({ page }) => {
    await page.goto('/contact');
    await expectWhatsAppChat(page, page.locator('.contact-whatsapp-btn'));
  });

  test('EXT-05 Treatment Finder results WhatsApp', async ({ page }) => {
    await page.goto('/#finder');
    await completeFinder(page, ['Unwanted hair, ingrown hairs and shaving irritation', 'Legs, underarms and bikini', 'A course of sessions for a lasting change']);
    await expectWhatsAppChat(page, ui.finder(page).getByRole('link', { name: 'Chat on WhatsApp' }));
  });

  test('EXT-06 Goldie "WhatsApp Us"', async ({ page }) => {
    await page.goto('/');
    await ui.chatButton(page).click();
    await expectWhatsAppChat(page, ui.chat(page).getByRole('link', { name: 'WhatsApp Us' }));
  });
});

test.describe('Other external links open the right site in a new tab', () => {
  test('EXT-07 footer Instagram opens the clinic Instagram', async ({ page }) => {
    await page.goto('/');
    const { clinicData } = await importAppData(page, '/src/data/clinic.js');
    test.skip(!clinicData.social.showLinks, 'social links are switched off (clinic.js social.showLinks)');
    const link = ui.footer(page).getByRole('link', { name: 'MerryGold Instagram' });
    await expectOpensSafelyInNewTab(link);
    expect(await urlOpenedInNewTab(page, link)).toBe(CLINIC.instagram);
  });

  test('EXT-08 footer TikTok opens the clinic TikTok', async ({ page }) => {
    await page.goto('/');
    const { clinicData } = await importAppData(page, '/src/data/clinic.js');
    test.skip(!clinicData.social.showLinks, 'social links are switched off (clinic.js social.showLinks)');
    const link = ui.footer(page).getByRole('link', { name: 'MerryGold TikTok' });
    await expectOpensSafelyInNewTab(link);
    expect(await urlOpenedInNewTab(page, link)).toBe(CLINIC.tiktok);
  });

  test('EXT-09 footer Facebook opens the clinic Facebook page', async ({ page }) => {
    test.skip(!CLINIC.facebook, 'the owner has not supplied a Facebook page URL yet');
    await page.goto('/');
    const { clinicData } = await importAppData(page, '/src/data/clinic.js');
    test.skip(!clinicData.social.showLinks, 'social links are switched off (clinic.js social.showLinks)');
    const link = ui.footer(page).getByRole('link', { name: 'MerryGold Facebook' });
    await expectOpensSafelyInNewTab(link);
    expect(await urlOpenedInNewTab(page, link)).toBe(CLINIC.facebook);
  });
});

test.describe('Call and email links', () => {
  test('EXT-10 footer phone and email', async ({ page }) => {
    await page.goto('/');
    await expect(ui.footer(page).locator('a[href^="tel:"]')).toHaveAttribute('href', CLINIC.phoneHref);
    await expect(ui.footer(page).locator('a[href^="mailto:"]')).toHaveAttribute('href', CLINIC.emailHref);
  });

  test('EXT-11 contact page phone and email', async ({ page }) => {
    await page.goto('/contact');
    const main = page.locator('main');
    await expect(main.locator('a[href^="tel:"]')).toHaveAttribute('href', CLINIC.phoneHref);
    await expect(main.locator('a[href^="mailto:"]')).toHaveAttribute('href', CLINIC.emailHref);
  });

  test('EXT-12 booking bar "Call" and mobile menu "Direct Line" dial the clinic', async ({ page }) => {
    test.skip(!usesMobileMenu(page), 'mobile controls');
    await page.goto('/shop');
    if (viewportWidth(page) <= STICKY_BAR_MAX) {
      await expect(ui.stickyBar(page).getByRole('link', { name: 'Call MerryGold Clinic' })).toHaveAttribute('href', CLINIC.phoneHref);
    }
    const menu = await openMobileMenu(page);
    await expect(menu.getByRole('link', { name: /direct line/i })).toHaveAttribute('href', CLINIC.phoneHref);
  });

  test('EXT-13 every telephone link on the site uses the same clinic number', async ({ page }) => {
    for (const path of ['/', '/contact', '/training', '/privacy', '/terms']) {
      await page.goto(path);
      const hrefs = await page.locator('a[href^="tel:"]').evaluateAll((links) => links.map((a) => a.getAttribute('href')));
      expect(new Set(hrefs), `telephone links on ${path}`).toEqual(new Set([CLINIC.phoneHref]));
    }
  });
});

test.describe('Getting to the clinic', () => {
  test('EXT-14 the contact page offers directions that open a map', async ({ page }) => {
    await page.goto('/contact');
    const directions = page.locator('main').locator('a[href*="google.com/maps"], a[href*="maps.app.goo.gl"], a[href*="maps.apple.com"]');
    await expect(directions.first(), 'a "Get directions" link helps phone visitors find the clinic').toBeVisible();
  });
});

test.describe('Booking on Treatwell', () => {
  test('EXT-15 the footer offers the clinic\'s Treatwell booking link in a new tab', async ({ page }) => {
    await page.goto('/');
    const treatwell = ui.footer(page).getByRole('link', { name: 'Book on Treatwell' });
    await expect(treatwell).toHaveAttribute('href', CLINIC.treatwellBookingUrl);
    await expectOpensSafelyInNewTab(treatwell);
  });
});
