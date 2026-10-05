import { test, expect } from '../support/fixtures.js';
import { ROUTES, CLINIC } from '../support/site.js';
import { isPhoneProject, openBag } from '../support/helpers.js';

// Words and facts a visitor reads. Run once, in the phone project.
test.beforeEach(() => {
  test.skip(!isPhoneProject(test.info()), 'content checks run once, in the phone project');
});

async function everyPageText(page) {
  const texts = [];
  for (const route of ROUTES) {
    await page.goto(route.path);
    await expect(page.locator('h1').first()).toBeAttached();
    texts.push({ path: route.path, text: await page.locator('body').innerText() });
  }
  return texts;
}

test.describe('Copy quality', () => {
  test('CNT-01 no page contains an em dash or en dash', async ({ page }) => {
    const offenders = (await everyPageText(page))
      .flatMap(({ path, text }) => [...text.matchAll(/.{0,30}[–—].{0,30}/g)].map((m) => `${path}: "${m[0]}"`));
    expect(offenders).toEqual([]);
  });

  test('CNT-02 no page shows a placeholder or a broken value', async ({ page }) => {
    const offenders = (await everyPageText(page))
      .flatMap(({ path, text }) => [...text.matchAll(/.{0,25}\b(undefined|NaN|\[object Object\]|lorem ipsum|£null|null)\b.{0,25}/gi)].map((m) => `${path}: "${m[0]}"`));
    expect(offenders).toEqual([]);
  });

  test('CNT-03 no page claims secure Stripe payments while Stripe is not connected', async ({ page }) => {
    const pages = await everyPageText(page);
    await page.goto('/shop');
    await page.locator('.shop-catalog-section .product-card').first().getByRole('button', { name: 'Add to formulation bag' }).click();
    const bag = await (await openBag(page)).innerText();
    await page.locator('.cart-drawer-panel').getByRole('button', { name: 'Checkout' }).click();
    const checkout = await page.locator('.checkout-modal-card').innerText();
    const claims = [...pages, { path: 'bag', text: bag }, { path: 'checkout', text: checkout }]
      .filter(({ text }) => /stripe encrypted|powered by stripe|stripe.s verified checkout/i.test(text))
      .map(({ path }) => path);
    expect(claims).toEqual([]);
  });
});

test.describe('Facts agree everywhere they appear', () => {
  test('CNT-04 phone, email, postcode and opening hours match on the footer and the contact page', async ({ page }) => {
    await page.goto('/contact');
    const footer = await page.locator('footer.clinic-footer').innerText();
    const contact = await page.locator('main').innerText();
    for (const [label, value] of [['phone', '+44 793 940 2111'], ['email', CLINIC.email], ['postcode', CLINIC.postcode]]) {
      expect(footer, `footer ${label}`).toContain(value);
      expect(contact, `contact page ${label}`).toContain(value);
    }
    expect(contact.match(/\d{2}:\d{2}/g)).toEqual(footer.match(/\d{2}:\d{2}/g));
  });

  test('CNT-05 the footer shows the registered company name and number and the current year', async ({ page }) => {
    await page.goto('/');
    const footer = page.locator('footer.clinic-footer');
    await expect(footer).toContainText(CLINIC.legalName);
    await expect(footer).toContainText(`Company No. ${CLINIC.companyNumber}`);
    await expect(footer).toContainText(`© ${new Date().getFullYear()}`);
  });

  test('CNT-06 the walk from Barking station is described the same way on every page', async ({ page }) => {
    const claims = new Set();
    for (const { text } of await everyPageText(page)) {
      for (const match of text.matchAll(/(\w+)-minute walk/gi)) claims.add(match[1].toLowerCase());
    }
    expect([...claims].length, `walking times stated: ${[...claims].join(', ')}`).toBeLessThanOrEqual(1);
  });

  test('CNT-07 the site does not promise free express delivery and "ask about delivery" at the same time', async ({ page }) => {
    const texts = await everyPageText(page);
    const promisesFree = texts.some(({ text }) => /complimentary uk (express )?(courier )?(delivery|shipping)/i.test(text));
    const asksAbout = texts.some(({ text }) => /ask about uk delivery/i.test(text));
    expect(promisesFree && asksAbout, 'home and shop describe delivery differently; confirm the real policy with Olu').toBe(false);
  });

  test('CNT-08 no treatment is listed at £0', async ({ page }) => {
    await page.goto('/treatments');
    const prices = await page.locator('.dir-price-badge').allInnerTexts();
    expect(prices.filter((price) => /£0\b/.test(price))).toEqual([]);
  });
});
