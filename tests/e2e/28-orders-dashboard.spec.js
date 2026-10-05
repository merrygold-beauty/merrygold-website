import { test, expect } from '../support/fixtures.js';
import { viewportWidth } from '../support/helpers.js';
import { STICKY_BAR_MAX } from '../support/site.js';

// The desktop table and the phone card list both render in the DOM at once
// (CSS switches which one shows at STICKY_BAR_MAX, the same breakpoint the
// site's own mobile booking bar uses), so any order text matches twice.
// .first() is not reliable here since it follows DOM order, not which one is
// visually shown, so order-content locators are scoped to whichever wrapper
// this project's viewport actually displays.
function ordersView(page) {
  return page.locator(viewportWidth(page) <= STICKY_BAR_MAX ? '.orders-cards' : '.orders-table-wrap');
}

const CORRECT_PASSWORD = 'letmein';

const TWO_ORDERS_RESPONSE = {
  orders: [
    {
      id: 'cs_1',
      created: 1700000000,
      livemode: false,
      customerName: 'Jane Doe',
      customerEmail: 'jane@example.com',
      phone: '07700 900123',
      amountTotal: 25000,
      currency: 'gbp',
      items: [{ name: 'Microblading Brows', quantity: 1, amountTotal: 25000 }],
      appointmentDate: '2026-10-01',
      notes: '',
      deliveryAddress: null,
      deliveryPostcode: null,
      reference: 'pi_1',
      stripeUrl: 'https://dashboard.stripe.com/test/payments/pi_1'
    },
    {
      id: 'cs_2',
      created: 1699999999,
      livemode: false,
      customerName: 'John Smith',
      customerEmail: 'john@example.com',
      phone: '07700 900456',
      amountTotal: 3499,
      currency: 'gbp',
      items: [{ name: 'Revive Your Radiance', quantity: 1, amountTotal: 3499 }],
      appointmentDate: null,
      notes: '',
      deliveryAddress: '1 Test Street',
      deliveryPostcode: 'IG11 8RT',
      reference: 'pi_2',
      stripeUrl: 'https://dashboard.stripe.com/test/payments/pi_2'
    }
  ],
  hasMore: false,
  nextCursor: null
};

async function mockOrdersApi(page) {
  await page.route('**/api/orders*', async (route) => {
    const auth = route.request().headers().authorization || '';
    if (auth === `Bearer ${CORRECT_PASSWORD}`) {
      await route.fulfill({ json: TWO_ORDERS_RESPONSE });
    } else {
      await route.fulfill({ status: 401, json: { error: 'Wrong password.' } });
    }
  });
}

async function signIn(page, password) {
  await page.goto('/admin/orders');
  await page.getByLabel('Dashboard password').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
}

test.describe('Orders dashboard', () => {
  test('ORD-01 a wrong password shows the error and the sign-in form stays', async ({ page }) => {
    await mockOrdersApi(page);
    await signIn(page, 'not-the-password');

    await expect(page.getByText('Wrong password.')).toBeVisible();
    await expect(page.getByLabel('Dashboard password')).toBeVisible();
  });

  test('ORD-02 the right password shows both orders and a Stripe link', async ({ page }) => {
    await mockOrdersApi(page);
    await signIn(page, CORRECT_PASSWORD);

    await expect(page.getByText('2 paid orders')).toBeVisible();
    const view = ordersView(page);
    await expect(view.getByText('Jane Doe')).toBeVisible();
    await expect(view.getByText('John Smith')).toBeVisible();
    await expect(view.getByRole('link', { name: 'View in Stripe' }).first()).toHaveAttribute('href', 'https://dashboard.stripe.com/test/payments/pi_1');
  });

  test('ORD-03 the sign-in is kept in sessionStorage across a reload', async ({ page }) => {
    await mockOrdersApi(page);
    await signIn(page, CORRECT_PASSWORD);
    await expect(page.getByText('2 paid orders')).toBeVisible();

    await page.reload();

    await expect(page.getByText('2 paid orders')).toBeVisible();
    await expect(page.getByLabel('Dashboard password')).toHaveCount(0);
  });

  test('ORD-04 signing out clears the session and returns to the sign-in form', async ({ page }) => {
    await mockOrdersApi(page);
    await signIn(page, CORRECT_PASSWORD);
    await expect(page.getByText('2 paid orders')).toBeVisible();

    await page.getByRole('button', { name: 'Sign out' }).click();
    await expect(page.getByLabel('Dashboard password')).toBeVisible();

    await page.reload();
    await expect(page.getByLabel('Dashboard password')).toBeVisible();
  });
});
