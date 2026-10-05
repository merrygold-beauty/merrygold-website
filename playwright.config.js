import { defineConfig, devices } from '@playwright/test';

// Two targets. "dev" (default) runs the Vite dev server, which lets data tests
// import app modules straight from /src. "prod" builds the site and serves the
// production bundle, which is what performance, raw-HTML SEO and bundle checks
// must measure. Set MG_TARGET=prod to switch.
const TARGET = process.env.MG_TARGET === 'prod' ? 'prod' : 'dev';
const PORT = TARGET === 'prod' ? 5191 : 5190;

// MG_BASE_URL points the suite at a hosted preview instead of a local server.
const BASE_URL = process.env.MG_BASE_URL || `http://localhost:${PORT}`;
const SLOW_MO = Number(process.env.MG_SLOWMO || 0);

const edge = { channel: 'msedge', launchOptions: { slowMo: SLOW_MO } };

// Most MerryGold visitors arrive on a phone, so the phone project is listed
// first and runs every browser test, not a mobile subset.
const phoneEdge = {
  ...edge,
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
  userAgent: devices['Pixel 7'].userAgent
};

const desktopEdge = { ...edge, viewport: { width: 1440, height: 900 } };

function localServer() {
  if (process.env.MG_BASE_URL) return undefined;
  if (TARGET === 'prod') {
    return {
      command: `npm run build && npx vite preview --port ${PORT} --strictPort`,
      url: BASE_URL,
      reuseExistingServer: false,
      timeout: 240_000
    };
  }
  // Never reuse: port 5190 belongs to the suite, and a leftover server from an
  // interrupted run can die mid-run and fail every test after it.
  return {
    command: `npx vite --port ${PORT} --strictPort`,
    url: BASE_URL,
    reuseExistingServer: false,
    timeout: 90_000
  };
}

export default defineConfig({
  testDir: './tests',
  timeout: 45_000,
  expect: { timeout: 7_000 },
  fullyParallel: true,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  use: {
    baseURL: BASE_URL,
    // Traces carry a full replay of any failure. Video is off because encoding
    // it for every test made a full run several times slower.
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
    locale: 'en-GB',
    timezoneId: 'Europe/London'
  },
  webServer: localServer(),
  projects: TARGET === 'prod'
    ? [
        { name: 'prod-mobile', testDir: './tests/prod', use: phoneEdge },
        { name: 'prod-desktop', testDir: './tests/prod', use: desktopEdge }
      ]
    : [
        { name: 'unit', testDir: './tests/unit' },
        { name: 'mobile', testDir: './tests/e2e', use: phoneEdge },
        { name: 'desktop', testDir: './tests/e2e', use: desktopEdge },
        // Real iPhone engine. Run on demand: --project=mobile-safari
        { name: 'mobile-safari', testDir: './tests/e2e', use: { ...devices['iPhone 13'] } }
      ]
});
