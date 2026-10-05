import { test, expect } from '../support/fixtures.js';
import { ui, importAppData, openBag, expectBagCount, WELL_FORMED_MONEY, moneyValues, isPhoneProject } from '../support/helpers.js';

const FILTERS = ['All', 'Serums', 'Moisturisers', 'Exfoliators', 'Body', 'Lashes'];
const productCard = (page, name) => page.locator('.shop-catalog-section .product-card').filter({ hasText: name });
const bagLine = (page, name) => ui.cartDrawer(page).locator('.cart-item-card').filter({ hasText: name });

async function addFromCard(page, name) {
  await productCard(page, name).getByRole('button', { name: 'Add to formulation bag' }).click();
  await expect(ui.cartDrawer(page)).toBeVisible();
}

async function closeBag(page) {
  await ui.cartDrawer(page).getByRole('button', { name: 'Close cart drawer' }).click();
  await expect(ui.cartDrawer(page)).toBeHidden();
}

test.describe('Shop catalogue', () => {
  let products;

  test.beforeEach(async ({ page }) => {
    await page.goto('/shop');
    ({ products } = await importAppData(page, '/src/data/products.js'));
  });

  test('SHP-01 each filter shows exactly the products in it', async ({ page }) => {
    for (const filter of FILTERS) {
      await page.locator('.shop-filter-pill').filter({ hasText: new RegExp(`^${filter}$`) }).click();
      const expected = filter === 'All' ? products : products.filter((p) => p.category === filter);
      await expect(page.locator('.shop-catalog-section .product-card'), filter).toHaveCount(expected.length);
      await expect(page.locator('.shop-filter-pill.active')).toHaveText(filter);
    }
  });

  test('SHP-02 no filter is empty', async () => {
    for (const filter of FILTERS.slice(1)) {
      expect(products.filter((p) => p.category === filter).length, `${filter} filter`).toBeGreaterThan(0);
    }
  });

  test('SHP-03 every card shows the name, price, size and category from the product list', async ({ page }) => {
    for (const product of products) {
      const card = productCard(page, product.name);
      await expect(card.locator('.product-card-title')).toHaveText(product.name);
      await expect(card.locator('.product-price')).toHaveText(product.priceDisplay);
      await expect(card.locator('.product-category')).toHaveText(product.category);
      if (product.volume) await expect(card.locator('.product-volume')).toHaveText(product.volume);
    }
  });

  test('SHP-04 a product opens its details, which close with the close button or a tap outside', async ({ page }, testInfo) => {
    const product = products[0];
    await productCard(page, product.name).locator('.product-card-title').click();
    const modal = ui.productModal(page);
    await expect(modal.getByRole('heading', { name: product.name })).toBeVisible();
    await expect(modal.locator('.modal-price')).toHaveText(product.priceDisplay);
    await expect(modal.locator('.modal-description')).toHaveText(product.description);
    await modal.getByRole('button', { name: 'Close product view' }).click();
    await expect(modal).toBeHidden();

    // The quick-view button only takes clicks while its card is hovered, so
    // phones, which have no hover, open products by tapping the card above.
    if (isPhoneProject(testInfo)) return;
    await productCard(page, product.name).hover();
    await productCard(page, product.name).getByRole('button', { name: `Quick view ${product.name}` }).click();
    await expect(modal).toBeVisible();
    await page.locator('.product-modal-backdrop').click({ position: { x: 4, y: 4 } });
    await expect(modal).toBeHidden();
  });

  test('SHP-05 "Add" in the product details adds it and keeps the details open', async ({ page }) => {
    const product = products[1];
    await productCard(page, product.name).locator('.product-card-title').click();
    await ui.productModal(page).getByRole('button', { name: 'Add', exact: true }).click();
    await expectBagCount(page, 1);
  });
});

test.describe('Bag', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/shop');
  });

  test('CRT-01 "Add" puts a product in the bag and opens it; adding again raises the quantity', async ({ page }) => {
    await addFromCard(page, 'Organic Golden Glow Body Oil');
    await expect(bagLine(page, 'Organic Golden Glow Body Oil')).toHaveCount(1);
    await closeBag(page);
    await addFromCard(page, 'Organic Golden Glow Body Oil');
    await expect(bagLine(page, 'Organic Golden Glow Body Oil')).toHaveCount(1);
    await expect(bagLine(page, 'Organic Golden Glow Body Oil').locator('.qty-stepper span')).toHaveText('2');
    await expect(ui.cartDrawer(page).locator('.subtotal-val')).toHaveText('£40');
    await expectBagCount(page, 2);
  });

  test('CRT-02 plus and minus change quantity and total, and minus at one removes the line', async ({ page }) => {
    await addFromCard(page, 'Flawless Glow Extra Brightening Cream');
    const line = bagLine(page, 'Flawless Glow Extra Brightening Cream');
    await line.getByRole('button', { name: 'Increase quantity' }).click();
    await expect(line.locator('.qty-stepper span')).toHaveText('2');
    await expect(ui.cartDrawer(page).locator('.subtotal-val')).toHaveText('£80');
    await line.getByRole('button', { name: 'Decrease quantity' }).click();
    await line.getByRole('button', { name: 'Decrease quantity' }).click();
    await expect(line).toHaveCount(0);
    await expectBagCount(page, 0);
  });

  test('CRT-03 removing the last item shows the empty bag', async ({ page }) => {
    await addFromCard(page, '3D False Eyelashes');
    await bagLine(page, '3D False Eyelashes').getByRole('button', { name: 'Remove item' }).click();
    await expect(ui.cartDrawer(page).locator('.cart-empty-state')).toBeVisible();
  });

  test('CRT-04 the bag is still there after a reload and on another page', async ({ page }) => {
    await addFromCard(page, 'Revive Your Radiance');
    await closeBag(page);
    await page.reload();
    await expectBagCount(page, 1);
    await page.goto('/contact');
    await expectBagCount(page, 1);
    await openBag(page);
    await expect(bagLine(page, 'Revive Your Radiance')).toHaveCount(1);
  });

  test('CRT-05 the free delivery meter counts down and confirms at £80', async ({ page }) => {
    await addFromCard(page, 'Flawless Glow Extra Brightening Cream');
    await expect(ui.cartDrawer(page).locator('.shipping-meter-text')).toContainText('£40');
    await bagLine(page, 'Flawless Glow Extra Brightening Cream').getByRole('button', { name: 'Increase quantity' }).click();
    await expect(ui.cartDrawer(page).locator('.shipping-meter-text')).toContainText(/qualify/i);
  });

  test('CRT-06 every amount in the bag is written as whole pounds or pounds and pence', async ({ page }) => {
    await addFromCard(page, 'Revive Your Radiance');
    const line = bagLine(page, 'Revive Your Radiance');
    await line.getByRole('button', { name: 'Increase quantity' }).click();
    await line.getByRole('button', { name: 'Increase quantity' }).click();
    await expect(ui.cartDrawer(page).locator('.subtotal-val')).toHaveText('£44.97');
    const amounts = moneyValues(await ui.cartDrawer(page).innerText());
    expect(amounts.filter((amount) => !WELL_FORMED_MONEY.test(amount))).toEqual([]);
  });

  test('CRT-07 the empty bag links to the shop and to the treatments', async ({ page }) => {
    await page.goto('/treatments');
    await openBag(page);
    await ui.cartDrawer(page).getByRole('link', { name: 'Products', exact: true }).click();
    await expect(ui.cartDrawer(page)).toBeHidden();
    await expect.poll(() => new URL(page.url()).pathname).toBe('/shop');

    await openBag(page);
    await ui.cartDrawer(page).getByRole('link', { name: 'Treatments', exact: true }).click();
    await expect(ui.cartDrawer(page)).toBeHidden();
    await expect.poll(() => new URL(page.url()).pathname).toBe('/treatments');
  });

  test('CRT-08 the bag closes with its close button and with a tap outside', async ({ page }) => {
    await openBag(page);
    await closeBag(page);
    await openBag(page);
    await page.locator('.cart-drawer-backdrop').click({ position: { x: 6, y: 200 } });
    await expect(ui.cartDrawer(page)).toBeHidden();
  });

  test('CRT-10 a bag line saved more than 7 days ago is dropped, a recent one stays', async ({ page }) => {
    await page.evaluate(() => {
      const day = 24 * 60 * 60 * 1000;
      localStorage.setItem('merrygold_cart', JSON.stringify([
        { product: { id: 'old-line', name: 'Old line', price: 10 }, quantity: 1, addedAt: Date.now() - 8 * day },
        { product: { id: 'recent-line', name: 'Recent line', price: 10 }, quantity: 1, addedAt: Date.now() - day }
      ]));
    });
    await page.reload();
    await openBag(page);
    await expect(bagLine(page, 'Recent line')).toHaveCount(1);
    await expect(bagLine(page, 'Old line')).toHaveCount(0);
  });

  test('CRT-09 the bag badge shows the item count and disappears when empty', async ({ page }) => {
    await expect(page.locator('.cart-badge')).toHaveCount(0);
    await addFromCard(page, 'Organic Golden Glow Body Oil');
    await expect(page.locator('.cart-badge')).toHaveText('1');
    await bagLine(page, 'Organic Golden Glow Body Oil').getByRole('button', { name: 'Remove item' }).click();
    await expect(page.locator('.cart-badge')).toHaveCount(0);
  });
});
