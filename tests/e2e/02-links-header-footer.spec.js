import { test, expect } from '../support/fixtures.js';
import { routeByPath, CATEGORIES } from '../support/site.js';
import { ui, expectOnPage, revealHeader, usesMobileMenu, importAppData, isPhoneProject, treatmentsListedIn } from '../support/helpers.js';

// Every header and footer control is clicked from two starting points: the
// home page (where the header starts hidden) and the Treatments page (where a
// link back into the same page is the case most likely to do nothing).
const START_PAGES = ['/', '/treatments'];

async function expectScrolledToTop(page) {
  await expect.poll(() => page.evaluate(() => window.scrollY), { message: 'new page should open at the top' }).toBeLessThan(80);
}

// A category link has done its job when the directory shows that category
// and nothing else. A treatment with a photo counts as a card/list row; one
// without renders as a text-only ServiceRow under the category's "Other ...
// services" heading.
async function expectCategoryShown(page, categoryId) {
  const { treatmentCategories, treatments } = await importAppData(page, '/src/data/treatments.js');
  const category = treatmentCategories.find((cat) => cat.id === categoryId);
  const categoryTreatments = treatmentsListedIn(treatments, categoryId);
  const photographedCount = categoryTreatments.filter((t) => t.image).length;
  const textOnlyCount = categoryTreatments.length - photographedCount;
  await expect.poll(() => new URL(page.url()).pathname).toMatch(/^\/treatments/);
  await expect(page.locator('h1').first()).toBeVisible();
  const isPhone = page.viewportSize() ? page.viewportSize().width <= 640 : false;
  const cards = isPhone ? page.locator('.list-row') : page.locator('.treatment-directory-card');
  await expect(cards, `only ${category.name} treatments should be listed`).toHaveCount(photographedCount);
  await expect(page.locator('.service-row')).toHaveCount(textOnlyCount);
  if (!isPhone && photographedCount > 0) {
    const shownCategories = await cards.locator('.dir-category').allInnerTexts();
    expect(new Set(shownCategories.map((text) => text.trim().toLowerCase()))).toEqual(new Set([category.name.toLowerCase()]));
  }
}

// Home, Treatments, Results, Shop, About us and Contact us are plain nav
// links, found inside the "Main Navigation" landmark (inNav). Book an
// appointment sits in the action group beside the bag instead, so it is
// found by searching the whole header. MerryGold Home (the logo) is also
// outside the nav landmark, in the brand link at the far left.
const HEADER_LINKS = [
  { id: 'HDR-01', name: 'MerryGold Home', path: '/' },
  { id: 'HDR-02', name: 'Home', path: '/', inNav: true },
  { id: 'HDR-03', name: 'Treatments', path: '/treatments', inNav: true },
  { id: 'HDR-04', name: 'Results', path: '/results', inNav: true },
  { id: 'HDR-05', name: 'Shop', path: '/shop', inNav: true },
  { id: 'HDR-06', name: 'About us', path: '/about', inNav: true },
  { id: 'HDR-06b', name: 'Contact us', path: '/contact', inNav: true },
  { id: 'HDR-07', name: 'Book an appointment', path: '/treatments' }
];

const FOOTER_ROUTE_LINKS = [
  { id: 'FTR-01', name: 'MerryGold Beauty & Aesthetics Clinics', path: '/' },
  { id: 'FTR-09', name: 'Clinic Training', path: '/training' },
  { id: 'FTR-23', name: 'All skincare', path: '/shop' },
  { id: 'FTR-24', name: 'About us', path: '/about' },
  { id: 'FTR-25', name: 'The clinic', path: '/the-clinic' },
  { id: 'FTR-26', name: 'Results', path: '/results' },
  { id: 'FTR-27', name: 'Blog', path: '/blog' },
  { id: 'FTR-28', name: 'Contact us', path: '/contact' },
  { id: 'FTR-19', name: 'Privacy Policy', path: '/privacy' },
  { id: 'FTR-20', name: 'Cookie Notice', path: '/cookies' },
  { id: 'FTR-21', name: 'Terms and policies', path: '/terms' }
];

const FOOTER_CATEGORY_LINKS = [
  { id: 'FTR-04', name: 'Facials & Advanced Skin', category: 'skin-facials' },
  { id: 'FTR-05', name: 'Brows & Lashes', category: 'brows-lashes' },
  { id: 'FTR-06', name: 'Laser Hair Removal / Laser Treatment', category: 'laser-hair-removal' },
  { id: 'FTR-07', name: 'Waxing & Facial Threading', category: 'waxing-threading' },
  { id: 'FTR-08', name: 'Massage & Wellbeing', category: 'massage-wellbeing' },
  { id: 'FTR-08b', name: 'Editorial & Bridal Makeup', category: 'makeup-glam' },
  { id: 'FTR-08c', name: 'Semi-Permanent Makeup', category: 'semi-permanent-makeup' }
];

const FOOTER_PRODUCT_LINKS = [
  { id: 'FTR-11', name: 'Flawless Glow Extra Brightening Serum' },
  { id: 'FTR-12', name: 'Flawless Glow Extra Brightening Cream' },
  { id: 'FTR-13', name: 'Revive Your Radiance' },
  { id: 'FTR-14', name: 'Organic Golden Glow Body Oil' }
];

for (const start of START_PAGES) {
  test.describe(`Desktop header links, starting on ${start}`, () => {
    test.beforeEach(async ({ page }) => {
      test.skip(usesMobileMenu(page), 'the desktop header is hidden at this width; mobile menu tests cover it');
      await page.goto(start);
      await revealHeader(page);
    });

    for (const link of HEADER_LINKS) {
      test(`${link.id} "${link.name}" opens ${link.path}`, async ({ page }) => {
        const scope = link.inNav ? ui.mainNav(page) : ui.header(page);
        await page.evaluate(() => window.scrollTo(0, 900));
        await revealHeader(page);
        await scope.getByRole('link', { name: link.name, exact: true }).click();
        await expectOnPage(page, routeByPath(link.path));
        await expectScrolledToTop(page);
      });
    }

    test('HDR-08 "Find my treatment" in the header opens the Treatment Finder', async ({ page }) => {
      await ui.mainNav(page).getByRole('button', { name: 'Find my treatment' }).click();
      await expect(ui.finder(page)).toBeVisible();
    });

    test('HDR-09 the bag button opens the bag', async ({ page }) => {
      await ui.bagButton(page).click();
      await expect(ui.cartDrawer(page)).toBeVisible();
    });

    test('HDR-10 hovering Treatments shows every category and the finder', async ({ page }) => {
      await ui.mainNav(page).getByRole('link', { name: 'Treatments', exact: true }).hover();
      const menu = ui.megaMenu(page);
      await expect(menu).toBeVisible();
      await expect(menu.locator('.mega-category-item')).toHaveCount(CATEGORIES.length);
      await expect(menu.getByRole('button', { name: 'Find my treatment' })).toBeVisible();
    });

    for (const [index, category] of CATEGORIES.entries()) {
      test(`HDR-11.${index + 1} mega menu "${category.name}" shows only that category`, async ({ page }) => {
        await ui.mainNav(page).getByRole('link', { name: 'Treatments', exact: true }).hover();
        await ui.megaMenu(page).locator('.mega-category-item').filter({ hasText: category.name }).click();
        await expectCategoryShown(page, category.id);
      });
    }

    test('HDR-12 mega menu "Find my treatment" opens the Treatment Finder', async ({ page }) => {
      await ui.mainNav(page).getByRole('link', { name: 'Treatments', exact: true }).hover();
      await ui.megaMenu(page).getByRole('button', { name: 'Find my treatment' }).click();
      await expect(ui.finder(page)).toBeVisible();
      await expect(ui.megaMenu(page)).toBeHidden();
    });
  });

  test.describe(`Footer links, starting on ${start}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(start);
    });

    for (const link of FOOTER_ROUTE_LINKS) {
      test(`${link.id} "${link.name}" opens ${link.path}`, async ({ page }) => {
        await ui.footer(page).getByRole('link', { name: link.name, exact: true }).click();
        await expectOnPage(page, routeByPath(link.path));
        await expectScrolledToTop(page);
      });
    }

    for (const link of FOOTER_CATEGORY_LINKS) {
      test(`${link.id} "${link.name}" shows only that category`, async ({ page }) => {
        await ui.footer(page).getByRole('link', { name: link.name, exact: true }).click();
        await expectCategoryShown(page, link.category);
        await expectScrolledToTop(page);
      });
    }

    for (const link of FOOTER_PRODUCT_LINKS) {
      test(`${link.id} "${link.name}" opens that product, not just the shop`, async ({ page }) => {
        await ui.footer(page).getByRole('link', { name: link.name, exact: true }).click();
        const productHeading = page
          .locator('h1, .product-modal-card h2')
          .filter({ hasText: link.name });
        await expect(productHeading.first(), `a page or view for ${link.name} should open`).toBeVisible();
      });
    }

    test('FTR-10 footer "Find my treatment" opens the Treatment Finder', async ({ page }) => {
      await ui.footer(page).getByRole('button', { name: 'Find my treatment' }).click();
      await expect(ui.finder(page)).toBeVisible();
    });

    test('FTR-22 footer lists every treatment category, including waxing and threading', async ({ page }) => {
      await expect(ui.footer(page).getByRole('link', { name: /waxing|threading/i })).toHaveCount(1);
    });
  });
}

test.describe('Header and hero social links', () => {
  test('HDR-13 header Instagram and TikTok links open the clinic profiles', async ({ page }) => {
    await page.goto('/treatments');
    const { clinicData } = await importAppData(page, '/src/data/clinic.js');
    // The links are down while the owner refreshes the accounts (clinic.js social.showLinks).
    test.skip(!clinicData.social.showLinks, "social links are switched off");
    await revealHeader(page);
    await expect(ui.header(page).getByRole('link', { name: 'MerryGold Instagram' })).toHaveAttribute('href', clinicData.social.instagram);
    await expect(ui.header(page).getByRole('link', { name: 'MerryGold TikTok' })).toHaveAttribute('href', clinicData.social.tiktok);
  });

  test('HDR-14 the hero social links show before scroll, then the header copy takes over', async ({ page }) => {
    await page.goto('/');
    const { clinicData } = await importAppData(page, '/src/data/clinic.js');
    // The links are down while the owner refreshes the accounts (clinic.js social.showLinks).
    test.skip(!clinicData.social.showLinks, "social links are switched off");
    const heroBar = page.locator('.hero-bar');
    await expect(heroBar.getByRole('link', { name: 'MerryGold Instagram' })).toBeVisible();
    await expect(heroBar.getByRole('link', { name: 'MerryGold TikTok' })).toBeVisible();
    await expect(ui.header(page).getByRole('link', { name: 'MerryGold Instagram' })).toBeHidden();
    await expect(ui.header(page).getByRole('link', { name: 'MerryGold TikTok' })).toBeHidden();

    await page.evaluate(() => window.scrollTo(0, 300));
    await expect(ui.header(page).getByRole('link', { name: 'MerryGold Instagram' })).toBeVisible();
    await expect(ui.header(page).getByRole('link', { name: 'MerryGold TikTok' })).toBeVisible();
    await expect(heroBar.getByRole('link', { name: 'MerryGold Instagram' })).toBeHidden();
    await expect(heroBar.getByRole('link', { name: 'MerryGold TikTok' })).toBeHidden();
  });

  test('HDR-20 while the social links are switched off, none show in the hero bar, header or footer', async ({ page }) => {
    await page.goto('/');
    const { clinicData } = await importAppData(page, '/src/data/clinic.js');
    test.skip(clinicData.social.showLinks, 'social links are switched on');
    const social = /^MerryGold (Instagram|Facebook|TikTok)$/;
    await expect(page.locator('.hero-bar').getByRole('link', { name: social })).toHaveCount(0);
    await expect(ui.header(page).getByRole('link', { name: social })).toHaveCount(0);
    await expect(ui.footer(page).getByRole('link', { name: social })).toHaveCount(0);
  });

  test('HDR-15 the hero bar carries the main nav and Book before scroll, then the header takes over', async ({ page }, testInfo) => {
    await page.goto('/');
    const heroBar = page.locator('.hero-bar');
    if (isPhoneProject(testInfo)) {
      // Phones show only a hamburger (and the social icons, when they are
      // switched on); Book and the links live in the drawer it opens.
      await expect(heroBar.getByRole('button', { name: 'Open menu' })).toBeVisible();
      await expect(heroBar.getByRole('link', { name: 'Book an appointment' })).toBeHidden();
      await expect(heroBar.getByRole('link', { name: 'Treatments' })).toBeHidden();
      await heroBar.getByRole('button', { name: 'Open menu' }).click();
      await expect(page.locator('.mobile-nav-panel').getByRole('link', { name: 'Book an appointment' })).toBeVisible();
      return;
    }
    await expect(heroBar.getByRole('link', { name: 'Home', exact: true })).toBeVisible();
    await expect(heroBar.getByRole('link', { name: 'Treatments' })).toBeVisible();
    await expect(heroBar.getByRole('button', { name: 'Find my treatment' })).toBeVisible();
    await expect(heroBar.getByRole('link', { name: 'Results' })).toBeVisible();
    await expect(heroBar.getByRole('link', { name: 'Shop' })).toBeVisible();
    await expect(heroBar.getByRole('link', { name: 'About us' })).toBeVisible();
    await expect(heroBar.getByRole('link', { name: 'Contact us' })).toBeVisible();
    await expect(heroBar.getByRole('link', { name: 'Book an appointment' })).toBeVisible();
    await expect(ui.header(page).getByRole('link', { name: 'Book an appointment' })).toBeHidden();

    await page.evaluate(() => window.scrollTo(0, 300));
    await expect(ui.header(page).getByRole('link', { name: 'Book an appointment' })).toBeVisible();
    await expect(heroBar.getByRole('link', { name: 'Treatments' })).toBeHidden();
    await expect(heroBar.getByRole('link', { name: 'Book an appointment' })).toBeHidden();
  });
});

test.describe('Link order across the header, hero bar and drawer', () => {
  test('HDR-16 desktop nav and phone drawer agree on link order, Book excluded', async ({ page }) => {
    // Book is not part of this comparison: the header and hero bar hold it
    // in their action area, not the link list, while the drawer keeps it
    // inside the list (checked separately below), so its position
    // legitimately differs between them.
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await revealHeader(page);
    const headerOrder = await ui.mainNav(page).evaluate((nav) =>
      [...nav.children].map((el) => el.textContent.replace(/\s+/g, ' ').trim())
    );

    await page.setViewportSize({ width: 390, height: 844 });
    const menu = await (async () => {
      await page.getByRole('button', { name: 'Toggle navigation menu' }).click();
      await expect(ui.mobileMenu(page)).toBeVisible();
      return ui.mobileMenu(page);
    })();
    const drawerOrder = await menu.locator('.mobile-nav-links').evaluate((list) =>
      [...list.children]
        .map((el) => el.textContent.replace(/\s+/g, ' ').trim())
        .filter((text) => text !== 'Book an appointment' && !text.startsWith('Bag'))
    );

    expect(drawerOrder).toEqual(headerOrder);
  });

  test('HDR-17 Book is the last control in the header action group, immediately before the bag', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/results');
    await revealHeader(page);
    const classOrder = await page.locator('.nav-actions-group').evaluate((group) =>
      [...group.children].map((el) => el.className)
    );
    expect(classOrder[0]).toContain('nav-link-book');
    expect(classOrder[1]).toContain('nav-cart-btn');
  });

  test('HDR-18 Book is the right-most control in the hero bar', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    const heroBar = page.locator('.hero-bar');
    const bookBox = await heroBar.getByRole('link', { name: 'Book an appointment' }).boundingBox();
    const linksBox = await heroBar.locator('.hero-bar-links').boundingBox();
    expect(bookBox.x, 'Book should sit to the right of the link row').toBeGreaterThan(linksBox.x + linksBox.width);
  });

  test('HDR-19 the drawer keeps Book fifth in its list', async ({ page }) => {
    // Not the home page: home starts pre-scroll with the header (and its
    // own toggle button) hidden off-screen behind the hero bar.
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/results');
    await page.getByRole('button', { name: 'Toggle navigation menu' }).click();
    const menu = ui.mobileMenu(page);
    await expect(menu).toBeVisible();
    const names = await menu.locator('.mobile-nav-links').evaluate((list) =>
      [...list.children].map((el) => el.textContent.replace(/\s+/g, ' ').trim())
    );
    expect(names[4]).toBe('Book an appointment');
  });
});
