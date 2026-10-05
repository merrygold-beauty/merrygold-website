import { test as base, expect } from '@playwright/test';
import { EXTERNAL_HOST_PATTERN } from './site.js';

function stubPage(url) {
  const safe = url.replace(/[<>&"]/g, (ch) => `&#${ch.charCodeAt(0)};`);
  return `<!doctype html><meta charset="utf-8"><title>External page stub</title>
<body style="font-family:sans-serif;padding:2rem"><h1>External page opened</h1><p>${safe}</p></body>`;
}

export const test = base.extend({
  // 'dismissed' pre-closes the cookie notice so it cannot sit over controls.
  // Tests about the notice itself use test.use({ cookieNotice: 'show' }).
  cookieNotice: ['dismissed', { option: true }],

  context: async ({ context, cookieNotice }, use) => {
    await context.route(EXTERNAL_HOST_PATTERN, (route) =>
      route.fulfill({ status: 200, contentType: 'text/html', body: stubPage(route.request().url()) })
    );
    // Goldie must answer from its local knowledge in tests, never a paid API.
    await context.route('https://openrouter.ai/**', (route) => route.abort());
    if (cookieNotice === 'dismissed') {
      await context.addInitScript(() => {
        try {
          window.localStorage.setItem('merrygold_cookie_notice', 'dismissed');
        } catch {
          // about:blank and stub pages have no usable storage
        }
      });
    }
    await use(context);
  },

  // Any uncaught exception fails the test that caused it.
  pageErrors: [
    async ({ page }, use) => {
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await use(errors);
      expect(errors, 'uncaught JavaScript errors on the page').toEqual([]);
    },
    { auto: true }
  ]
});

export { expect };
