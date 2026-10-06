# MerryGold Beauty Clinic website

The website for MerryGold Beauty Clinic in Barking, served at
https://www.merrygoldbeautyclinics.com. Visitors browse treatments and products,
book and pay for one treatment at a time through Stripe Checkout, buy products,
send enquiries, and ask questions of Goldie, the site's chat assistant.

## Stack

- React 19 and React Router, built with Vite.
- Every public page is pre-rendered to its own HTML file at build time, with its
  own title, description, canonical link and share tags, then hydrated in the
  browser.
- Cloudflare Pages hosts the site; Cloudflare Pages Functions in `functions/api`
  handle everything that needs a secret: checkout, the Stripe webhook, enquiries,
  the chat assistant, Google reviews and the orders dashboard.
- Stripe Checkout takes payment, Resend sends the clinic and customer emails, and
  OpenRouter runs the chat assistant.

## Layout

| Path | What it holds |
|---|---|
| `src/data` | Treatments, products, results, reviews, blog articles and clinic details. Most content changes happen here. |
| `src/pages`, `src/components` | Pages and the components they are built from. |
| `src/lib` | Helpers for the pages and the Functions: head tags, emails, rate limits, the chat prompt. |
| `functions/api` | One file per endpoint under `/api`. |
| `scripts` | Build steps: the price index, the sitemap and the pre-render, plus `test-prod.mjs`. |
| `public` | Files served as they are: `robots.txt`, `sitemap.xml`, `_redirects`, the favicon and the hero videos. |
| `tests` | Playwright tests: `unit`, `e2e` (browser), `prod` (the production build). |

## Running it locally

Node 24 or later.

```bash
npm install
npm run dev                # Vite dev server
npm run dev:functions      # Functions on port 5192, proxying pages to Vite on 5191
```

The Functions need their variables at launch, for example
`npm run dev:functions -- --binding STRIPE_SECRET_KEY=sk_test_...`. Never put a
real key in a committed file.

## Building

```bash
npm run build
```

Before the build, `scripts/build-catalogue-index.mjs` writes
`src/data/catalogueIndex.js` (the prices checkout trusts) and
`scripts/build-sitemap.mjs` writes `public/sitemap.xml`. The build then bundles the
site, builds a server copy into `dist-ssr`, and `scripts/prerender.mjs` writes one
HTML file into `dist` for every URL in the sitemap, plus the checkout and orders
pages (marked noindex) and `404.html`.

The sitemap is the list of pages that get built, so a treatment or article added
to `src/data` gets its page automatically. Because `404.html` exists, Cloudflare
serves it for any path that has no file; there is no single-page fallback.

## Deploying

Cloudflare Pages builds from this repository on every push. `master` is
production; any other branch gets a preview deployment. Build command
`npm run build`, output directory `dist`.

Variables are set in the Pages project, separately for production and preview;
`.env.example` lists every name and what happens when one is missing. Production
holds the live Stripe key and webhook secret and preview holds the test ones, so
only production takes real payments.

## Testing

```bash
npm run test:unit
npm test                   # unit, phone and desktop projects against the dev server
npm run test:prod          # builds the site and runs the performance, raw HTML and bundle checks on it
```

Tests run in Microsoft Edge. Set `MG_BASE_URL` to point the browser tests at a
deployed preview.
