import { test, expect } from '../support/fixtures.js';
import { ROUTES, VIEWPORTS, NAV_COLLAPSE_MAX, STICKY_BAR_MAX } from '../support/site.js';
import { ui, isPhoneProject, horizontalOverflow, boxesOverlap, openMobileMenu, coveringElement, expectOnPage } from '../support/helpers.js';

const PHONE_VIEWPORTS = VIEWPORTS.filter((v) => v.width <= 430 || v.height < 500);
const WIDE_VIEWPORTS = VIEWPORTS.filter((v) => !PHONE_VIEWPORTS.includes(v));

test.describe('No page scrolls sideways', () => {
  for (const viewport of VIEWPORTS) {
    test(`RESP-01 ${viewport.name} ${viewport.width}x${viewport.height}: every page fits the screen width`, async ({ page }) => {
      const phoneSize = PHONE_VIEWPORTS.includes(viewport);
      test.skip(phoneSize !== isPhoneProject(test.info()), 'phone sizes run in the phone project, wider sizes in desktop');
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      const overflowing = [];
      for (const route of ROUTES) {
        await page.goto(route.path);
        await page.waitForTimeout(400);
        const result = await horizontalOverflow(page);
        if (result.scrollWidth > result.clientWidth + 1) {
          overflowing.push(`${route.path} is ${result.scrollWidth}px wide in ${result.clientWidth}px: ${result.offenders.join(', ')}`);
        }
      }
      expect(overflowing).toEqual([]);
    });
  }
});

test.describe('The header adapts at 1040px', () => {
  test.beforeEach(() => {
    test.skip(isPhoneProject(test.info()), 'breakpoint checks resize a desktop window');
  });

  test('RESP-02 above 1040px the full menu shows; at 1040px and below the menu button takes over', async ({ page }) => {
    await page.setViewportSize({ width: NAV_COLLAPSE_MAX + 1, height: 900 });
    await page.goto('/results');
    await expect(ui.mainNav(page)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Toggle navigation menu' })).toBeHidden();
    await expect(ui.header(page).getByRole('link', { name: 'Book' })).toBeVisible();
    await expect(ui.bagButton(page)).toBeVisible();

    await page.setViewportSize({ width: NAV_COLLAPSE_MAX, height: 900 });
    await expect(ui.mainNav(page)).toBeHidden();
    await expect(page.getByRole('button', { name: 'Toggle navigation menu' })).toBeVisible();
    await expect(ui.header(page).getByRole('link', { name: 'Book' })).toBeHidden();
    await expect(ui.bagButton(page)).toBeVisible();
  });

  test('RESP-03 the booking bar shows at 768px and below and not above', async ({ page }) => {
    await page.setViewportSize({ width: STICKY_BAR_MAX + 1, height: 900 });
    await page.goto('/shop');
    await expect(ui.stickyBar(page)).toBeHidden();
    await page.setViewportSize({ width: STICKY_BAR_MAX, height: 900 });
    await expect(ui.stickyBar(page)).toBeVisible();
  });
});

test.describe('Phone layout', () => {
  test.beforeEach(() => {
    test.skip(!isPhoneProject(test.info()), 'phone project only');
  });

  test('RESP-04 the bottom of every page can be scrolled clear of the booking bar', async ({ page }) => {
    for (const route of ROUTES) {
      await page.goto(route.path);
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(300);
      const lastLink = ui.footer(page).getByRole('link', { name: 'Terms and policies' });
      const link = await lastLink.boundingBox();
      const bar = await ui.stickyBar(page).boundingBox();
      expect(link.y + link.height, `${route.path}: last footer link sits under the booking bar`).toBeLessThanOrEqual(bar.y);
    }
  });

  test.describe('with the cookie notice showing', () => {
    test.use({ cookieNotice: 'show' });

    for (const width of [320, 360, 390]) {
      test(`RESP-05 at ${width}px the chat button, cookie notice and booking bar do not overlap`, async ({ page }) => {
        await page.setViewportSize({ width, height: 740 });
        await page.goto('/treatments');
        const boxes = {
          chat: await ui.chatButton(page).boundingBox(),
          cookie: await ui.cookieNotice(page).boundingBox(),
          bar: await ui.stickyBar(page).boundingBox()
        };
        expect(boxesOverlap(boxes.chat, boxes.cookie), 'chat button over cookie notice').toBe(false);
        expect(boxesOverlap(boxes.chat, boxes.bar), 'chat button over booking bar').toBe(false);
        expect(boxesOverlap(boxes.cookie, boxes.bar), 'cookie notice over booking bar').toBe(false);
      });
    }
  });

  const SMALL_PHONE = { width: 360, height: 640 };

  const overlayChecks = [
    {
      id: 'finder',
      open: (page) => page.goto('/#finder'),
      controls: (page) => [ui.finder(page).getByRole('button', { name: 'Close Treatment Finder' }), ui.finder(page).locator('.finder-option-btn').last()]
    },
    {
      id: 'bag',
      open: async (page) => {
        await page.goto('/shop');
        await page.locator('.shop-catalog-section .product-card').first().getByRole('button', { name: 'Add to formulation bag' }).click();
      },
      controls: (page) => [ui.cartDrawer(page).getByRole('button', { name: 'Close cart drawer' }), ui.cartDrawer(page).getByRole('button', { name: 'Checkout' })]
    },
    {
      id: 'product view',
      open: async (page) => {
        await page.goto('/shop');
        await page.locator('.shop-catalog-section .product-card .product-card-title').first().click();
      },
      controls: (page) => [ui.productModal(page).getByRole('button', { name: 'Close product view' }), ui.productModal(page).getByRole('button', { name: 'Buy Now' })]
    },
    {
      id: 'checkout',
      open: async (page) => {
        await page.goto('/shop');
        await page.locator('.shop-catalog-section .product-card').first().getByRole('button', { name: 'Add to formulation bag' }).click();
        await ui.cartDrawer(page).getByRole('button', { name: 'Checkout' }).click();
      },
      controls: (page) => [ui.checkout(page).getByRole('button', { name: 'Close checkout' }), ui.checkout(page).locator('button[type=submit]')]
    },
    {
      id: 'mobile menu',
      open: async (page) => {
        await page.goto('/results');
        await openMobileMenu(page);
      },
      controls: (page) => [ui.mobileMenu(page).getByRole('button', { name: 'Close menu' }), ui.mobileMenu(page).getByRole('link', { name: 'Book' })]
    }
  ];

  for (const overlay of overlayChecks) {
    test(`RESP-06 on a 360x640 phone the ${overlay.id} can be closed and its main action tapped`, async ({ page }) => {
      await page.setViewportSize(SMALL_PHONE);
      await overlay.open(page);
      for (const control of overlay.controls(page)) {
        await expect(control).toBeVisible();
        await control.scrollIntoViewIfNeeded();
        await expect(control).toBeInViewport();
        expect(await coveringElement(control), `${overlay.id}: "${await control.innerText()}" is covered`).toBeNull();
      }
    });
  }

  test('RESP-07 form fields use at least 16px text so iPhones do not zoom in when tapped', async ({ page }) => {
    const small = [];
    const measure = async (label) => {
      const found = await page.evaluate(() =>
        [...document.querySelectorAll('input:not([type=checkbox]):not([type=hidden]), select, textarea')]
          .filter((el) => el.getBoundingClientRect().width > 0)
          .map((el) => ({ name: el.id || el.name || el.placeholder || el.type, size: parseFloat(getComputedStyle(el).fontSize) }))
          .filter((field) => field.size < 16)
          .map((field) => `${field.name} ${field.size}px`)
      );
      small.push(...found.map((entry) => `${label}: ${entry}`));
    };
    for (const path of ['/contact', '/training', '/treatments']) {
      await page.goto(path);
      await measure(path);
    }
    await page.goto('/shop');
    await page.locator('.shop-catalog-section .product-card').first().getByRole('button', { name: 'Add to formulation bag' }).click();
    await ui.cartDrawer(page).getByRole('button', { name: 'Checkout' }).click();
    await measure('checkout');
    await ui.checkout(page).getByRole('button', { name: 'Close checkout' }).click();
    await ui.chatButton(page).click();
    await measure('Goldie chat');
    expect([...new Set(small)]).toEqual([]);
  });

  test('RESP-08 the header logo is visible at every phone width', async ({ page }) => {
    for (const viewport of PHONE_VIEWPORTS) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/results');
      const logo = await ui.header(page).locator('img.navbar-brand-logo').boundingBox();
      expect(logo?.width ?? 0, `${viewport.name}: logo width`).toBeGreaterThanOrEqual(32);
    }
  });

  test('RESP-09 on the home page the menu button can be tapped without scrolling first', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Toggle navigation menu' }).click({ timeout: 3000 });
    await expect(ui.mobileMenu(page)).toBeVisible();
  });

  test('RESP-10 in landscape the menu scrolls to its last link and that link works', async ({ page }) => {
    await page.setViewportSize({ width: 844, height: 390 });
    await page.goto('/shop');
    const menu = await openMobileMenu(page);
    const contact = menu.getByRole('link', { name: 'Contact us', exact: true });
    await contact.scrollIntoViewIfNeeded();
    await contact.click();
    await expectOnPage(page, ROUTES.find((r) => r.path === '/contact'));
  });

  test('RESP-11 the first screen of the home page shows the headline and a way to book', async ({ page }) => {
    for (const size of [{ width: 360, height: 640 }, { width: 390, height: 844 }]) {
      await page.setViewportSize(size);
      await page.goto('/');
      await expect(page.locator('h1').first(), `${size.width}x${size.height}`).toBeInViewport();
      await expect(page.locator('.hero-actions-cluster').getByRole('link', { name: 'Treatments' })).toBeInViewport();
    }
  });

  test('RESP-12 text is large enough to read without zooming', async ({ page }) => {
    const report = [];
    for (const route of ROUTES) {
      await page.goto(route.path);
      const share = await page.evaluate(() => {
        let small = 0;
        let total = 0;
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        while (walker.nextNode()) {
          const text = walker.currentNode.textContent.trim();
          const parent = walker.currentNode.parentElement;
          if (!text || !parent || parent.getBoundingClientRect().width === 0) continue;
          total += text.length;
          if (parseFloat(getComputedStyle(parent).fontSize) < 12) small += text.length;
        }
        return total ? small / total : 0;
      });
      if (share > 0.4) report.push(`${route.path}: ${Math.round(share * 100)}% of text is under 12px`);
    }
    expect(report).toEqual([]);
  });

  test('RESP-13 photographs are never stretched out of shape', async ({ page }) => {
    const stretched = [];
    for (const path of ['/', '/treatments', '/shop', '/the-clinic', '/about']) {
      await page.goto(path);
      await page.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += 700) {
          window.scrollTo(0, y);
          await new Promise((resolve) => setTimeout(resolve, 80));
        }
      });
      const found = await page.evaluate(() =>
        [...document.images]
          .filter((img) => img.naturalWidth && img.getBoundingClientRect().width > 0 && getComputedStyle(img).objectFit === 'fill')
          .filter((img) => {
            const rect = img.getBoundingClientRect();
            return Math.abs(rect.width / rect.height - img.naturalWidth / img.naturalHeight) > 0.03 * (img.naturalWidth / img.naturalHeight);
          })
          .map((img) => img.getAttribute('alt') || img.getAttribute('src'))
      );
      stretched.push(...found.map((name) => `${path}: ${name}`));
    }
    expect(stretched).toEqual([]);
  });

  // 640px is what a phone leaves once its browser bars take their share. The
  // project's own 844px viewport is tall enough to hide a reveal trigger that
  // depends on the section's height, which is how a blank treatments section
  // reached the preview.
  test('RESP-15 every home page section fades in on a short phone screen, however tall the section is', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 640 });
    await page.goto('/');
    await page.evaluate(async () => {
      for (let y = 0; y < document.documentElement.scrollHeight; y += 380) {
        window.scrollTo(0, y);
        await new Promise((resolve) => setTimeout(resolve, 120));
      }
    });
    await expect
      .poll(() =>
        page.evaluate(() =>
          [...document.querySelectorAll('.page-home > section > .container')]
            .filter((wrapper) => Number(getComputedStyle(wrapper).opacity) < 1)
            .map((wrapper) => wrapper.parentElement.className.split(' ')[0])
        ),
        { message: 'sections still invisible after scrolling past them' }
      )
      .toEqual([]);
  });
});

test.describe('Wide layouts', () => {
  for (const viewport of WIDE_VIEWPORTS.filter((v) => v.width >= 1280)) {
    test(`RESP-14 at ${viewport.width}px the content does not stretch edge to edge`, async ({ page }) => {
      test.skip(isPhoneProject(test.info()), 'desktop project only');
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/terms');
      const article = await page.locator('article.legal-article').boundingBox();
      expect(article.width, 'long text should keep a readable measure').toBeLessThanOrEqual(1320);
    });
  }
});
