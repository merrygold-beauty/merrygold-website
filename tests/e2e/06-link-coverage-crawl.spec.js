import { test, expect } from '../support/fixtures.js';
import { ROUTES, routeByPath } from '../support/site.js';
import { ui, usesMobileMenu, openMobileMenu, revealHeader } from '../support/helpers.js';
import { ruleFor, collectVisibleControls } from '../support/clickables.js';

const isInternal = (href) => href && href.startsWith('/') && !href.startsWith('//');

// Links a visitor can actually use at this width: whatever is visible, plus
// the links behind the mobile menu or the Treatments mega menu.
async function usableInternalLinks(page) {
  const visibleHrefs = () =>
    page.locator('a[href]').evaluateAll((links) =>
      links
        .filter((a) => {
          const rect = a.getBoundingClientRect();
          const style = getComputedStyle(a);
          return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && Number(style.opacity) > 0.01;
        })
        .map((a) => a.getAttribute('href'))
    );

  await revealHeader(page);
  const hrefs = new Set(await visibleHrefs());
  if (usesMobileMenu(page)) {
    await openMobileMenu(page);
    for (const href of await ui.mobileMenu(page).locator('a[href]').evaluateAll((links) => links.map((a) => a.getAttribute('href')))) {
      hrefs.add(href);
    }
    await ui.mobileMenu(page).getByRole('button', { name: 'Close menu' }).click();
  } else {
    await ui.mainNav(page).getByRole('link', { name: 'Treatments', exact: true }).hover();
    for (const href of await ui.megaMenu(page).locator('a[href]').evaluateAll((links) => links.map((a) => a.getAttribute('href')))) {
      hrefs.add(href);
    }
  }
  return [...hrefs].filter(isInternal);
}

test.describe('Every clickable control is covered by a test', () => {
  for (const route of ROUTES) {
    test(`COV-01 ${route.path} has no clickable control without a named test`, async ({ page }) => {
      await page.goto(route.path);
      await revealHeader(page);
      // Scroll through so lazily revealed sections are counted.
      await page.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += 600) {
          window.scrollTo(0, y);
          await new Promise((resolve) => setTimeout(resolve, 60));
        }
        window.scrollTo(0, 240);
      });
      const controls = await page.evaluate(collectVisibleControls);
      const uncovered = controls
        .filter((control) => !ruleFor(control, route.path))
        .map((control) => `${control.zone} ${control.role} "${control.name}"${control.href ? ` -> ${control.href}` : ''} [${control.classes[0] || ''}]`);
      expect([...new Set(uncovered)], `clickable controls on ${route.path} with no test in clickables.js`).toEqual([]);
    });
  }
});

test.describe('Internal links lead to real pages', () => {
  test('LNK-01 every internal link on every page opens a real page, not a silent redirect home', async ({ page }) => {
    // Visits every page, then every link found, so it needs far longer than one page test.
    test.setTimeout(300_000);
    const hrefs = new Set();
    for (const route of ROUTES) {
      await page.goto(route.path);
      for (const href of await usableInternalLinks(page)) hrefs.add(href);
    }
    const broken = [];
    for (const href of hrefs) {
      await page.goto(href);
      const target = new URL(href, page.url());
      await page.waitForLoadState('domcontentloaded');
      await expect(page.locator('h1').first()).toBeAttached();
      const landed = new URL(page.url());
      if (landed.pathname !== target.pathname) broken.push(`${href} ended up at ${landed.pathname}`);
    }
    expect(broken).toEqual([]);
  });
});

test.describe('No page is left without a way in', () => {
  test('LNK-02 every page can be reached by following links from the home page at this screen size', async ({ page }) => {
    test.setTimeout(300_000);
    const reached = new Set(['/']);
    const queue = ['/'];
    while (queue.length) {
      const path = queue.shift();
      await page.goto(path);
      for (const href of await usableInternalLinks(page)) {
        const next = new URL(href, page.url()).pathname;
        if (routeByPath(next) && !reached.has(next)) {
          reached.add(next);
          queue.push(next);
        }
      }
    }
    const orphans = ROUTES.map((route) => route.path).filter((path) => !reached.has(path));
    expect(orphans, 'pages no visitor can click through to at this width').toEqual([]);
  });
});
