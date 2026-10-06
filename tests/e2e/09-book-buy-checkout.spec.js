import { test, expect } from '../support/fixtures.js';
import { ui, expectBagCount, openBag, fillCheckout, completeFinder, revealHeader, TEST_CLIENT } from '../support/helpers.js';

// Every Book and Buy adds the selection to one bag. Checkout hands the bag
// off to Stripe Checkout for the full price (no deposits); these scenarios
// mock /api/checkout and /api/checkout-status so the flow runs without a
// real Stripe key.

const bagLine = (page, name) => ui.cartDrawer(page).locator('.cart-item-card').filter({ hasText: name });

async function expectInBag(page, name, count = 1) {
  await expectBagCount(page, count);
  await openBag(page);
  await expect(bagLine(page, name), `${name} should be in the bag`).toHaveCount(1);
}

async function startCheckoutFromBag(page) {
  await openBag(page);
  await ui.cartDrawer(page).getByRole('button', { name: 'Checkout' }).click();
  await expect(ui.checkout(page)).toBeVisible();
}

async function submitCheckout(page) {
  await ui.checkout(page).locator('button[type=submit]').click();
}

// A treatment's own page opens its details, whose Book button is there on
// phones and desktop alike (the list cards' Book buttons are desktop only).
async function bookFromTreatmentPage(page, slug, name) {
  await page.goto(`/treatments/${slug}`);
  await page.getByRole('dialog', { name }).getByRole('button', { name: 'Book' }).click();
  await expect(ui.cartDrawer(page)).toBeVisible();
}

async function addProductsFromShop(page, names) {
  await page.goto('/shop');
  for (const name of names) {
    await page.locator('.shop-catalog-section .product-card').filter({ hasText: name }).getByRole('button', { name: 'Add to formulation bag' }).click();
    await ui.cartDrawer(page).getByRole('button', { name: 'Close cart drawer' }).click();
  }
}

test.describe('Book and Buy add to the bag', () => {
  test('BB-01 "Book" on the treatments page adds that treatment', async ({ page }) => {
    await page.goto('/treatments');
    const card = page.locator('.treatment-directory-card').first();
    const name = (await card.locator('.dir-title').innerText()).trim();
    await card.getByRole('button', { name: 'Book' }).click();
    await expectInBag(page, name);
  });

  test('BB-02 "Book" on a home page treatment card adds that treatment', async ({ page }) => {
    await page.goto('/');
    const card = page.locator('.discovery-section .treatment-card').first();
    const name = (await card.locator('.treatment-name').innerText()).trim();
    await card.getByRole('button', { name: 'Book' }).click();
    await expectInBag(page, name);
  });

  test('BB-03 "Buy" on a product card adds that product', async ({ page }) => {
    await page.goto('/shop');
    const card = page.locator('.shop-catalog-section .product-card').first();
    const name = (await card.locator('.product-card-title').innerText()).trim();
    await card.getByRole('button', { name: 'Buy' }).click();
    await expectInBag(page, name);
  });

  test('BB-04 "Buy Now" in the product details adds that product', async ({ page }) => {
    await page.goto('/shop');
    const card = page.locator('.shop-catalog-section .product-card').nth(2);
    const name = (await card.locator('.product-card-title').innerText()).trim();
    await card.locator('.product-card-title').click();
    await ui.productModal(page).getByRole('button', { name: 'Buy Now' }).click();
    await expectInBag(page, name);
  });

  test('BB-05 "Book Consultation" on the home page adds a consultation', async ({ page }) => {
    await page.goto('/');
    await page.locator('.invitation-section').getByRole('button', { name: 'Book Consultation' }).click();
    await expectInBag(page, 'Consultation');
  });

  test('BB-06 "Book Consultation" on the director page adds a consultation', async ({ page }) => {
    await page.goto('/director');
    await page.getByRole('button', { name: 'Book Consultation' }).click();
    await expectInBag(page, 'Consultation');
  });

  test('BB-07 "Book" in the Treatment Finder results adds that treatment and closes the finder', async ({ page }) => {
    await page.goto('/#finder');
    const matches = await completeFinder(page, ['Sparse, uneven or unruly brows', 'Brows and eyes', 'A one-off appointment']);
    const name = (await matches.first().locator('.matched-name').innerText()).trim();
    await matches.first().getByRole('button', { name: 'Book' }).click();
    await expect(ui.finder(page)).toBeHidden();
    await expectInBag(page, name);
  });

  test('BB-08 treatments and products build up together in one bag', async ({ page }) => {
    await page.goto('/treatments');
    await page.getByRole('combobox', { name: 'Search treatments' }).fill('Microblading Brows');
    await page.locator('.treatment-directory-card').filter({ hasText: 'Microblading Brows' }).getByRole('button', { name: 'Book' }).click();
    await expectBagCount(page, 1);

    await page.goto('/shop');
    await page.locator('.shop-catalog-section .product-card').filter({ hasText: 'Extra Brightening Serum' }).getByRole('button', { name: 'Buy' }).click();
    await expectBagCount(page, 2);

    await addProductsFromShop(page, ['Organic Golden Glow Body Oil', 'Organic Golden Glow Body Oil']);
    await expectBagCount(page, 4);
    await openBag(page);
    for (const name of ['Microblading Brows', 'Extra Brightening Serum', 'Organic Golden Glow Body Oil']) {
      await expect(bagLine(page, name), name).toHaveCount(1);
    }
  });

  test('BB-09 booking a second treatment replaces the first, says so, and keeps the products', async ({ page }) => {
    await addProductsFromShop(page, ['Organic Golden Glow Body Oil']);
    await bookFromTreatmentPage(page, 'microblading-brows', 'Microblading Brows');
    await ui.cartDrawer(page).getByRole('button', { name: 'Close cart drawer' }).click();
    await bookFromTreatmentPage(page, 'facial-gold', 'Gold Facial');

    await expect(ui.cartDrawer(page).locator('.cart-notice')).toHaveText('Gold Facial replaced Microblading Brows. Each booking is for one treatment.');
    await expect(bagLine(page, 'Microblading Brows')).toHaveCount(0);
    await expect(bagLine(page, 'Gold Facial')).toHaveCount(1);
    await expect(bagLine(page, 'Organic Golden Glow Body Oil')).toHaveCount(1);
    await expectBagCount(page, 2);
  });

  test('BB-10 a treatment in the bag has no quantity buttons, a product does', async ({ page }) => {
    await addProductsFromShop(page, ['Organic Golden Glow Body Oil']);
    await bookFromTreatmentPage(page, 'microblading-brows', 'Microblading Brows');
    await expect(bagLine(page, 'Microblading Brows').locator('.qty-stepper')).toHaveCount(0);
    await expect(bagLine(page, 'Microblading Brows').getByRole('button', { name: 'Remove item' })).toBeVisible();
    await expect(bagLine(page, 'Organic Golden Glow Body Oil').locator('.qty-stepper')).toHaveCount(1);
  });
});

test.describe('Checkout hands off to Stripe', () => {
  test('CHK-01 checkout from the bag lists every item and the same total as the bag', async ({ page }) => {
    await addProductsFromShop(page, ['Flawless Glow Extra Brightening Cream', 'Flawless Glow Extra Brightening Serum']);
    await openBag(page);
    const bagTotal = (await ui.cartDrawer(page).locator('.subtotal-val').innerText()).trim();
    await startCheckoutFromBag(page);
    const summary = ui.checkout(page);
    await expect(summary).toContainText('Flawless Glow Extra Brightening Cream');
    await expect(summary).toContainText('Flawless Glow Extra Brightening Serum');
    await expect(summary).toContainText(bagTotal);
  });

  test('CHK-02 submitting valid details posts every bag item with no price, then lands on the paid success page', async ({ page }) => {
    await addProductsFromShop(page, ['Revive Your Radiance', '3D False Eyelashes']);
    await startCheckoutFromBag(page);
    await fillCheckout(page);

    let postedBody = null;
    await page.route('**/api/checkout', async (route) => {
      postedBody = route.request().postDataJSON();
      await route.fulfill({ json: { url: '/checkout/success?session_id=cs_test_mock' } });
    });
    await page.route('**/api/checkout-status*', async (route) => {
      await route.fulfill({
        json: {
          status: 'paid',
          reference: 'pi_test_mock123',
          amountTotal: 3499,
          currency: 'gbp',
          customerEmail: TEST_CLIENT.email,
          items: [
            { name: 'Revive Your Radiance', quantity: 1 },
            { name: '3D False Eyelashes', quantity: 1 }
          ],
          appointmentDate: null
        }
      });
    });

    await submitCheckout(page);

    await expect.poll(() => postedBody, 'the bag should have been posted to /api/checkout').not.toBeNull();
    expect(postedBody.items.map((i) => i.id).sort()).toEqual(['3d-false-eyelashes', 'revive-your-radiance']);
    for (const line of postedBody.items) {
      expect(Object.keys(line).sort(), 'no price should be sent by the client').toEqual(['id', 'quantity']);
      expect(line.quantity).toBe(1);
    }

    await expect(page).toHaveURL(/\/checkout\/success/);
    await expect(page.getByRole('heading', { name: 'Payment received' })).toBeVisible();
    await expect(page.getByText('Revive Your Radiance')).toBeVisible();
    await expect(page.getByText('3D False Eyelashes')).toBeVisible();
    await expect(page.getByText('£34.99')).toBeVisible();
    await expectBagCount(page, 0);
  });

  test('CHK-03 a rejected checkout shows the server error inline', async ({ page }) => {
    await addProductsFromShop(page, ['Revive Your Radiance']);
    await startCheckoutFromBag(page);
    await fillCheckout(page);
    await page.route('**/api/checkout', (route) => route.fulfill({ status: 400, json: { error: 'That email address does not look right.' } }));

    await submitCheckout(page);

    await expect(ui.checkout(page).getByText('That email address does not look right.')).toBeVisible();
    await expect(ui.checkout(page).locator('form')).toBeVisible();
  });

  test('CHK-04 checkout will not go through with required details missing', async ({ page }) => {
    await addProductsFromShop(page, ['Revive Your Radiance']);
    await startCheckoutFromBag(page);
    await submitCheckout(page);
    await expect(ui.checkout(page).locator('form')).toBeVisible();
    await expect(ui.checkout(page).locator('.checkout-error')).toHaveCount(0);
    expect(await ui.checkout(page).getByLabel(/full name/i).evaluate((input) => input.validity.valid)).toBe(false);
  });

  test('CHK-05 an email address without an @ is refused', async ({ page }) => {
    await addProductsFromShop(page, ['Revive Your Radiance']);
    await startCheckoutFromBag(page);
    await fillCheckout(page);
    await ui.checkout(page).getByLabel(/email/i).fill('not-an-email');
    await submitCheckout(page);
    await expect(ui.checkout(page).locator('form')).toBeVisible();
    expect(await ui.checkout(page).getByLabel(/email/i).evaluate((input) => input.validity.valid)).toBe(false);
  });

  test('CHK-06 a postcode that the server refuses shows the server error inline', async ({ page }) => {
    await addProductsFromShop(page, ['Revive Your Radiance']);
    await startCheckoutFromBag(page);
    await fillCheckout(page);
    const postcode = ui.checkout(page).getByLabel(/postal code|postcode/i);
    test.skip((await postcode.count()) === 0, 'checkout no longer asks for a postcode');
    await postcode.fill('12345');
    await page.route('**/api/checkout', (route) => route.fulfill({ status: 400, json: { error: 'That is not a UK postcode.' } }));
    await submitCheckout(page);
    await expect(ui.checkout(page).getByText('That is not a UK postcode.')).toBeVisible();
  });

  test('CHK-07 an appointment date cannot be in the past', async ({ page }) => {
    await page.goto('/director');
    await page.getByRole('button', { name: 'Book Consultation' }).click();
    if (!(await ui.checkout(page).isVisible())) await (await openBag(page)).getByRole('button', { name: 'Checkout' }).click();
    const date = ui.checkout(page).getByLabel(/date/i);
    test.skip((await date.count()) === 0, 'checkout does not ask for a date');
    const today = new Date().toISOString().slice(0, 10);
    expect(await date.getAttribute('min'), 'the date picker should start from today').toBeTruthy();
    expect((await date.getAttribute('min')) >= today).toBe(true);
  });

  test('CHK-13 a treatment offers the free start times for the chosen day and posts the one picked', async ({ page }) => {
    const availabilityUrls = [];
    await page.route('**/api/availability*', (route) => {
      availabilityUrls.push(new URL(route.request().url()));
      return route.fulfill({ json: { times: ['11:00', '14:30'] } });
    });
    let postedBody = null;
    await page.route('**/api/checkout', (route) => {
      postedBody = route.request().postDataJSON();
      return route.fulfill({ status: 400, json: { error: 'Stopped by the test.' } });
    });

    await bookFromTreatmentPage(page, 'facial-gold', 'Gold Facial');
    if (!(await ui.checkout(page).isVisible())) await startCheckoutFromBag(page);
    const form = ui.checkout(page);
    await form.getByLabel(/full name/i).fill(TEST_CLIENT.name);
    await form.getByLabel(/email/i).fill(TEST_CLIENT.email);
    await form.getByLabel(/telephone/i).fill(TEST_CLIENT.phone);

    const submit = form.locator('button[type=submit]');
    await expect(form.getByText('Choose a date to see the free times.')).toBeVisible();
    await expect(submit, 'payment should wait for a time').toBeDisabled();

    const date = form.getByLabel(/date/i);
    const max = await date.getAttribute('max');
    expect(max > (await date.getAttribute('min')), 'the date picker should allow days ahead').toBe(true);
    await date.fill(max);
    await expect.poll(() => availabilityUrls.length).toBe(1);
    expect(availabilityUrls[0].searchParams.get('treatment')).toBe('facial-gold');
    expect(availabilityUrls[0].searchParams.get('date')).toBe(max);
    expect(availabilityUrls[0].searchParams.get('holder')).toBeTruthy();

    await form.getByRole('button', { name: '14:30' }).click();
    await expect(form.getByRole('button', { name: '14:30' })).toHaveAttribute('aria-pressed', 'true');
    await submitCheckout(page);
    await expect.poll(() => postedBody).not.toBeNull();
    expect(postedBody.booking).toMatchObject({ date: max, time: '14:30' });
    expect(postedBody.booking.holder).toBe(availabilityUrls[0].searchParams.get('holder'));
  });

  test('CHK-14 a day with no free times says so', async ({ page }) => {
    await page.route('**/api/availability*', (route) => route.fulfill({ json: { times: [] } }));
    await bookFromTreatmentPage(page, 'facial-gold', 'Gold Facial');
    if (!(await ui.checkout(page).isVisible())) await startCheckoutFromBag(page);
    const date = ui.checkout(page).getByLabel(/date/i);
    await date.fill(await date.getAttribute('max'));
    await expect(ui.checkout(page).getByText('No free times on this day. Please choose another day.')).toBeVisible();
  });

  test('CHK-08 checkout asks for no health information', async ({ page }) => {
    await page.goto('/treatments');
    await page.locator('.treatment-directory-card').first().getByRole('button', { name: 'Book' }).click();
    if (!(await ui.checkout(page).isVisible())) await (await openBag(page)).getByRole('button', { name: 'Checkout' }).click();
    await expect(ui.checkout(page)).toBeVisible();
    const labels = await ui.checkout(page).locator('label').allInnerTexts();
    expect(labels.filter((label) => /clinical|sensitivit|allerg|medicat|pregnan|medical|skin condition/i.test(label))).toEqual([]);
  });

  test('CHK-09 checkout fields bring up the right phone keyboard and autofill', async ({ page }) => {
    await addProductsFromShop(page, ['Revive Your Radiance']);
    await startCheckoutFromBag(page);
    const form = ui.checkout(page);
    await expect(form.getByLabel(/full name/i)).toHaveAttribute('autocomplete', 'name');
    await expect(form.getByLabel(/email/i)).toHaveAttribute('type', 'email');
    await expect(form.getByLabel(/email/i)).toHaveAttribute('autocomplete', 'email');
    await expect(form.getByLabel(/telephone/i)).toHaveAttribute('type', 'tel');
    await expect(form.getByLabel(/telephone/i)).toHaveAttribute('autocomplete', 'tel');
    const postcode = form.getByLabel(/postal code|postcode/i);
    if (await postcode.count()) await expect(postcode).toHaveAttribute('autocomplete', 'postal-code');
  });

  test('CHK-10 closing checkout leaves the bag as it was', async ({ page }) => {
    await addProductsFromShop(page, ['Revive Your Radiance', '3D False Eyelashes']);
    await startCheckoutFromBag(page);
    await ui.checkout(page).getByRole('button', { name: 'Close checkout' }).click();
    await expect(ui.checkout(page)).toBeHidden();
    await revealHeader(page);
    await expectBagCount(page, 2);
  });

  test('CHK-11 the cancelled page shows and leaves the bag untouched', async ({ page }) => {
    await addProductsFromShop(page, ['Revive Your Radiance']);
    await page.goto('/checkout/cancelled');
    await expect(page.getByRole('heading', { name: 'Payment cancelled' })).toBeVisible();
    await revealHeader(page);
    await expectBagCount(page, 1);
  });

  test('CHK-12 a paid success page clears the bag with no update-loop error, and Back to home works', async ({ page }) => {
    // React reports a runaway effect loop as a dev-mode console.error, not a
    // thrown exception, so both channels are watched.
    const updateLoopErrors = [];
    page.on('pageerror', (error) => {
      if (error.message.includes('Maximum update depth')) updateLoopErrors.push(error.message);
    });
    page.on('console', (message) => {
      if (message.type() === 'error' && message.text().includes('Maximum update depth')) updateLoopErrors.push(message.text());
    });

    // Seeds the same shape ShopContext persists, so the page mounts with a
    // non-empty bag for clearCart to act on.
    await page.addInitScript(() => {
      localStorage.setItem('merrygold_cart', JSON.stringify([
        { product: { id: 'test-item', name: 'Test', price: 10 }, quantity: 1 }
      ]));
    });
    await page.route('**/api/checkout-status**', (route) => route.fulfill({
      json: {
        status: 'paid',
        reference: 'pi_test',
        amountTotal: 28500,
        currency: 'gbp',
        customerEmail: 'a@b.com',
        items: [{ name: 'Test', quantity: 1 }],
        appointmentDate: '2026-10-01'
      }
    }));

    await page.goto('/checkout/success?session_id=cs_test_abc');
    await expect(page.getByRole('heading', { name: 'Payment received' })).toBeVisible();

    // A runaway effect loop needs several passive-effect cycles (each a
    // separate browser macrotask) before React's internal counter trips and
    // logs the error, so proving it does NOT happen needs a real dwell here,
    // not just a fast-resolving assertion.
    await page.waitForTimeout(1500);
    expect(updateLoopErrors, 'clearing the bag on a paid result must not loop').toEqual([]);

    await revealHeader(page);
    await expectBagCount(page, 0);

    await page.getByRole('link', { name: 'Back to home' }).click();
    await expect.poll(() => new URL(page.url()).pathname).toBe('/');
    await expect(page.locator('h1').first()).toBeVisible();
  });
});
