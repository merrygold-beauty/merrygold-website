import { test, expect } from '../support/fixtures.js';
import { ROUTES, ALLOWED_THIRD_PARTY_HOSTS, CLINIC } from '../support/site.js';
import { ui, isPhoneProject, completeFinder } from '../support/helpers.js';

// A representative visit: browse, book, add to the bag, use the finder and chat.
async function typicalVisit(page) {
  await page.goto('/');
  await page.goto('/treatments');
  await page.locator('.treatment-directory-card').first().getByRole('button', { name: 'Book' }).click();
  if (await ui.checkout(page).isVisible()) await ui.checkout(page).getByRole('button', { name: 'Close checkout' }).click();
  await page.goto('/shop');
  await page.locator('.shop-catalog-section .product-card').first().getByRole('button', { name: 'Add to formulation bag' }).click();
  await ui.cartDrawer(page).getByRole('button', { name: 'Close cart drawer' }).click();
  await page.goto('/#finder');
  await completeFinder(page, ['Short, straight or sparse lashes', 'Brows and eyes', 'A one-off appointment']);
  await ui.finder(page).getByRole('button', { name: 'Close Treatment Finder' }).click();
  await ui.chatButton(page).click();
  await ui.chat(page).getByRole('button', { name: 'Opening hours & location' }).click();
  await expect(ui.chat(page).locator('.msg-bot')).toHaveCount(2);
}

test.beforeEach(() => {
  test.skip(!isPhoneProject(test.info()), 'privacy checks run once, in the phone project');
});

test.describe('What the site stores and shares', () => {
  test('SEC-01 a full visit sets no cookies at all', async ({ page, context, baseURL }) => {
    await typicalVisit(page);
    expect(await context.cookies(baseURL)).toEqual([]);
  });

  test.describe('first visit', () => {
    test.use({ cookieNotice: 'show' });

    test('SEC-02 the browser holds only the bag and the cookie notice choice, as the Cookie Notice says', async ({ page }) => {
      await typicalVisit(page);
      await ui.cookieNotice(page).getByRole('button', { name: 'Close cookie notice' }).click();
      const storage = await page.evaluate(() => ({ local: Object.keys(localStorage), session: Object.keys(sessionStorage) }));
      expect(storage.local.sort()).toEqual(['merrygold_cart', 'merrygold_cookie_notice']);
      expect(storage.session).toEqual([]);
    });
  });

  test('SEC-03 a visit makes no request to a tracker or any unplanned outside service', async ({ page, baseURL }) => {
    const siteHost = new URL(baseURL).host;
    const outside = new Set();
    page.on('request', (request) => {
      const url = new URL(request.url());
      if (!/^https?:$/.test(url.protocol)) return;
      if (url.host !== siteHost && !ALLOWED_THIRD_PARTY_HOSTS.includes(url.host)) outside.add(url.host);
    });
    await typicalVisit(page);
    expect([...outside]).toEqual([]);
  });

  test('SEC-04 the page loads no script from another site', async ({ page, baseURL }) => {
    const siteHost = new URL(baseURL).host;
    const foreign = [];
    for (const route of ROUTES) {
      await page.goto(route.path);
      const hosts = await page.evaluate(() => [...document.scripts].filter((s) => s.src).map((s) => new URL(s.src).host));
      foreign.push(...hosts.filter((host) => host !== siteHost).map((host) => `${route.path}: ${host}`));
    }
    expect(foreign).toEqual([]);
  });

  test('SEC-05 the browser never calls the AI service directly, so no key can be exposed', async ({ page, context }) => {
    const calls = [];
    await context.route('https://openrouter.ai/**', (route) => {
      calls.push(route.request().url());
      return route.abort();
    });
    await page.goto('/');
    await ui.chatButton(page).click();
    await ui.chat(page).getByRole('button', { name: 'Million Dollar Facial' }).click();
    await expect(ui.chat(page).locator('.msg-bot')).toHaveCount(2);
    expect(calls, 'Goldie should reach the AI service through the site\'s own server function').toEqual([]);
  });
});

test.describe('Links and forms', () => {
  test('SEC-06 every link that opens a new tab uses noopener', async ({ page }) => {
    const unsafe = [];
    for (const route of ROUTES) {
      await page.goto(route.path);
      const found = await page.locator('a[target="_blank"]').evaluateAll((links) =>
        links.filter((a) => !/noopener/.test(a.getAttribute('rel') || '')).map((a) => a.getAttribute('href'))
      );
      unsafe.push(...found.map((href) => `${route.path}: ${href}`));
    }
    expect(unsafe).toEqual([]);
  });

  test('SEC-07 the contact and training forms ask for no health information', async ({ page }) => {
    const asked = [];
    for (const path of ['/contact', '/training']) {
      await page.goto(path);
      const labels = await page.locator('form label, form legend').allInnerTexts();
      asked.push(...labels.filter((label) => /allerg|medicat|pregnan|medical|condition|sensitivit/i.test(label)).map((label) => `${path}: ${label}`));
    }
    expect(asked).toEqual([]);
  });

  test('SEC-08 details typed into a form never end up in the page address', async ({ page }) => {
    await page.goto('/contact');
    await page.getByLabel('Full Name *').fill('Privacy Check');
    await page.getByLabel('Email Address *').fill('privacy.check@example.com');
    await page.getByLabel('Telephone *').fill('07700 900789');
    await page.getByLabel(/how may we assist/i).fill('Checking the address bar.');
    await page.getByRole('button', { name: 'Send Message' }).click();
    await page.waitForTimeout(800);
    expect(page.url()).not.toMatch(/privacy\.check|07700|Privacy/);
  });

  test('SEC-09 go-live: every WhatsApp link goes to the clinic\'s own number', async ({ page }) => {
    test.skip(!process.env.MG_GO_LIVE, 'set MG_GO_LIVE=1 for the pre-launch run');
    const wrong = [];
    for (const route of ROUTES) {
      await page.goto(route.path);
      const numbers = await page.locator('a[href*="wa.me/"]').evaluateAll((links) => links.map((a) => new URL(a.href).pathname.replace(/\//g, '')));
      wrong.push(...numbers.filter((n) => n !== CLINIC.whatsappClinic).map((n) => `${route.path}: ${n}`));
    }
    expect(wrong).toEqual([]);
  });
});
