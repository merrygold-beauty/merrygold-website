import { expect } from '@playwright/test';
import { NAV_COLLAPSE_MAX } from './site.js';

export const isPhoneProject = (testInfo) => testInfo.project.use?.isMobile === true;

export const viewportWidth = (page) => page.viewportSize()?.width ?? 1440;
export const usesMobileMenu = (page) => viewportWidth(page) <= NAV_COLLAPSE_MAX;

// Locators for the site's overlays. Most have no dialog role yet (an open
// accessibility defect), so they are found by class.
export const ui = {
  header: (page) => page.locator('header.navbar-header'),
  mainNav: (page) => page.getByRole('navigation', { name: 'Main Navigation' }),
  megaMenu: (page) => page.locator('.treatments-mega-menu'),
  mobileMenu: (page) => page.locator('.mobile-nav-panel'),
  stickyBar: (page) => page.locator('.mobile-sticky-bar'),
  footer: (page) => page.locator('footer.clinic-footer'),
  cookieNotice: (page) => page.getByRole('region', { name: 'Cookie notice' }),
  bagButton: (page) => page.getByRole('button', { name: /open bag with/i }),
  cartDrawer: (page) => page.locator('.cart-drawer-panel'),
  checkout: (page) => page.locator('.checkout-modal-card'),
  finder: (page) => page.locator('.finder-card'),
  productModal: (page) => page.locator('.product-modal-card'),
  // Phones hide the floating button and open the chat from the dock instead.
  chatButton: (page) => page.locator('button.goldie-fab, .mobile-sticky-bar button.dock-item').filter({ visible: true }),
  chat: (page) => page.getByRole('dialog', { name: 'Goldie AI Concierge' })
};

export async function gotoRoute(page, path) {
  await page.goto(path);
  await expect(page.locator('h1').first()).toBeAttached();
}

// Proves a navigation landed on the page it was meant to: the path matches and
// that page's own heading is showing.
export async function expectOnPage(page, route, { search } = {}) {
  await expect.poll(() => new URL(page.url()).pathname, { message: `expected to land on ${route.path}` }).toBe(route.path);
  if (search !== undefined) {
    await expect.poll(() => new URL(page.url()).search).toBe(search);
  }
  await expect(page.locator('h1').filter({ hasText: route.h1 }).first()).toBeVisible();
}

// On the home page the header stays hidden until the visitor scrolls.
export async function revealHeader(page) {
  if (new URL(page.url()).pathname === '/') {
    await page.evaluate(() => window.scrollTo(0, 240));
  }
  await expect(ui.header(page)).toHaveClass(/is-revealed/);
}

export async function openMobileMenu(page) {
  await revealHeader(page);
  await page.getByRole('button', { name: 'Toggle navigation menu' }).click();
  await expect(ui.mobileMenu(page)).toBeVisible();
  return ui.mobileMenu(page);
}

// Goes through whichever menu this viewport shows, the way a visitor would.
export async function navigateByMenu(page, linkName) {
  if (usesMobileMenu(page)) {
    const menu = await openMobileMenu(page);
    await menu.getByRole('link', { name: linkName, exact: true }).click();
    return;
  }
  await revealHeader(page);
  await ui.mainNav(page).getByRole('link', { name: linkName, exact: true }).click();
}

export async function expectBagCount(page, count) {
  await expect(ui.bagButton(page)).toHaveAccessibleName(new RegExp(`open bag with ${count} items?`, 'i'));
}

export async function openBag(page) {
  await revealHeader(page);
  if (!(await ui.cartDrawer(page).isVisible())) {
    await ui.bagButton(page).click();
  }
  await expect(ui.cartDrawer(page)).toBeVisible();
  return ui.cartDrawer(page);
}

// Clicks something that opens a new tab and returns the URL that tab loaded.
// A rel="noopener" tab starts on a blank page with no URL, so wait for it to
// reach a real address before reading it or closing it; closing it mid-way
// leaves the stubbed request hanging and stalls the test's teardown.
export async function urlOpenedInNewTab(page, locator) {
  const [tab] = await Promise.all([page.context().waitForEvent('page'), locator.click()]);
  await tab.waitForURL((url) => url.protocol === 'https:' || url.protocol === 'http:', { timeout: 10_000 });
  await tab.waitForLoadState('domcontentloaded');
  const url = tab.url();
  await tab.close();
  return url;
}

export function parseWhatsApp(url) {
  const parsed = new URL(url);
  return {
    host: parsed.host,
    number: parsed.pathname.replace(/\//g, ''),
    text: parsed.searchParams.get('text') || ''
  };
}

// Loads an app module through the Vite dev server so tests read the same data
// the page renders, image imports included. Dev target only.
// The site's rule, restated for counting: a treatment shows in its own
// category and in each category its alsoListedIn names.
export const treatmentsListedIn = (treatments, categoryId) =>
  treatments.filter((t) => t.category === categoryId || t.alsoListedIn?.some((l) => l.category === categoryId));

export async function importAppData(page, modulePath) {
  if (new URL(page.url()).origin === 'null' || page.url() === 'about:blank') {
    await page.goto('/');
  }
  return page.evaluate(async (path) => {
    const mod = await import(path);
    return JSON.parse(JSON.stringify({ ...mod }, (key, value) => (typeof value === 'function' ? undefined : value)));
  }, modulePath);
}

export async function completeFinder(page, [concern, area, commitment]) {
  const finder = ui.finder(page);
  await expect(finder).toBeVisible();
  for (const answer of [concern, area, commitment]) {
    await finder.getByRole('button', { name: answer, exact: true }).click();
  }
  await expect(finder.getByRole('heading', { name: 'Your matches' })).toBeVisible();
  return finder.locator('.matched-treatment-card');
}

export function futureDate(daysAhead = 14) {
  const date = new Date(Date.now() + daysAhead * 86_400_000);
  return date.toISOString().slice(0, 10);
}

export const TEST_CLIENT = {
  name: 'Test Client',
  email: 'test.client@example.com',
  phone: '07700 900123',
  address: '1 Test Street',
  postcode: 'IG11 8RT'
};

// Fills whichever checkout fields the current mode shows.
export async function fillCheckout(page, client = TEST_CLIENT) {
  const form = ui.checkout(page);
  await form.getByLabel(/full name/i).fill(client.name);
  await form.getByLabel(/email/i).fill(client.email);
  await form.getByLabel(/telephone/i).fill(client.phone);
  const date = form.getByLabel(/date/i);
  if (await date.count()) {
    // The Vite dev server runs no Functions, so the free times are faked here.
    await page.route('**/api/availability*', (route) => route.fulfill({ json: { times: ['10:00', '10:15'] } }));
    await date.fill(futureDate());
    await form.getByRole('button', { name: '10:00' }).click();
  }
  const address = form.getByLabel(/delivery address/i);
  if (await address.count()) await address.fill(client.address);
  const postcode = form.getByLabel(/postal code|postcode/i);
  if (await postcode.count()) await postcode.fill(client.postcode);
}

export function moneyValues(text) {
  return [...text.matchAll(/£\s?([0-9][0-9,]*(?:\.[0-9]+)?)/g)].map((m) => m[0].replace(/\s/g, ''));
}

// A price string is well formed when it has no pence or exactly two digits.
export const WELL_FORMED_MONEY = /^£\d{1,3}(,\d{3})*(\.\d{2})?$/;

// Returns a description of whatever sits on top of the element's centre, or
// null when the element itself would receive the tap.
export async function coveringElement(locator) {
  return locator.evaluate((el) => {
    const rect = el.getBoundingClientRect();
    const top = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
    if (!top || el.contains(top)) return null;
    return `${top.tagName.toLowerCase()}.${String(top.className).split(' ')[0]}`;
  });
}

// Finds a link to `href` that a visitor can see in the site's own navigation:
// the mobile menu or header, then the footer. Returns null when there is none.
export async function visibleSiteLink(page, href) {
  const candidates = [];
  if (usesMobileMenu(page)) {
    await openMobileMenu(page);
    candidates.push(ui.mobileMenu(page).locator(`a[href="${href}"]`));
  } else {
    await revealHeader(page);
    candidates.push(ui.header(page).locator(`a[href="${href}"]`));
  }
  candidates.push(ui.footer(page).locator(`a[href="${href}"]`));
  for (const candidate of candidates) {
    if (await candidate.first().isVisible()) return candidate.first();
  }
  if (usesMobileMenu(page)) await ui.mobileMenu(page).getByRole('button', { name: 'Close menu' }).click();
  return null;
}

export function boxesOverlap(a, b) {
  if (!a || !b) return false;
  return a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
}

// Returns the widest elements that push the page sideways, for a useful message.
export async function horizontalOverflow(page) {
  return page.evaluate(() => {
    const root = document.scrollingElement;
    const limit = root.clientWidth;
    const offenders = [];
    if (root.scrollWidth > limit + 1) {
      for (const el of document.querySelectorAll('body *')) {
        const rect = el.getBoundingClientRect();
        if (rect.right > limit + 1 && rect.width > 0) {
          const style = getComputedStyle(el);
          if (style.position !== 'fixed') {
            offenders.push(`${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0]} right=${Math.round(rect.right)}`);
          }
        }
        if (offenders.length >= 5) break;
      }
    }
    return { scrollWidth: root.scrollWidth, clientWidth: limit, offenders };
  });
}
