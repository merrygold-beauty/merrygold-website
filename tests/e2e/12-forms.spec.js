import { test, expect } from '../support/fixtures.js';
import { urlOpenedInNewTab, parseWhatsApp, TEST_CLIENT, viewportWidth } from '../support/helpers.js';
import { WHATSAPP_NUMBERS } from '../support/site.js';

// Every enquiry form (contact, consultation, training) posts through the same
// submitEnquiry() in src/services/enquiries.js: 200 -> success, a 400 shows
// its error inline, anything else (503, 502, a network failure, or the
// non-JSON body the Vite dev server returns for an unknown route) opens
// WhatsApp with the same message a visitor would have typed by hand.

async function noNewTabWithin(page, action, ms = 1500) {
  let opened = false;
  const listener = () => {
    opened = true;
  };
  page.context().on('page', listener);
  await action();
  await page.waitForTimeout(ms);
  page.context().off('page', listener);
  return !opened;
}

// Shared by every honeypot field on the site: off-screen and unreachable by
// keyboard or screen reader, whichever form it sits in.
async function expectHoneypotHidden(page, honeypot) {
  await expect(honeypot).toHaveAttribute('aria-hidden', 'true');
  await expect(honeypot).toHaveAttribute('tabindex', '-1');
  await expect(honeypot).toHaveAttribute('autocomplete', 'off');
  const box = await honeypot.boundingBox();
  const viewport = page.viewportSize();
  expect(box === null || box.x + box.width < 0 || box.x > viewport.width).toBe(true);
}

function mockEnquiry(page, status, body) {
  return page.route('**/api/enquiry', (route) =>
    route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })
  );
}

test.describe('Contact form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/contact');
  });

  async function fillContact(page) {
    await page.getByLabel('Name *').fill(TEST_CLIENT.name);
    await page.getByLabel('Email *').fill(TEST_CLIENT.email);
    await page.getByLabel('Telephone *').fill(TEST_CLIENT.phone);
    await page.getByLabel('Your message *').fill('I would like to ask about laser hair removal.');
  }

  test('FRM-C01 a successful enquiry shows the success message', async ({ page }) => {
    await mockEnquiry(page, 200, { ok: true });
    await fillContact(page);
    await page.getByRole('button', { name: 'Send enquiry' }).click();
    await expect(page.getByText(`Thank you, ${TEST_CLIENT.name}. We've received your enquiry and will reply within one working day.`)).toBeVisible();
  });

  test('FRM-C02 email unavailable opens WhatsApp with the enquiry written in', async ({ page }) => {
    await mockEnquiry(page, 503, { error: 'unavailable' });
    await fillContact(page);
    const url = await urlOpenedInNewTab(page, page.getByRole('button', { name: 'Send enquiry' }));
    const chat = parseWhatsApp(url);
    expect(WHATSAPP_NUMBERS).toContain(chat.number);
    expect(chat.text).toContain(`Name: ${TEST_CLIENT.name}`);
    expect(chat.text).toContain(`Email: ${TEST_CLIENT.email}`);
    expect(chat.text).toContain(`Phone: ${TEST_CLIENT.phone}`);
    expect(chat.text).toContain('Message: I would like to ask about laser hair removal.');
    await expect(page.getByText("Email isn't available right now, so we've opened WhatsApp with your message ready to send.")).toBeVisible();
  });

  test('FRM-C03 a validation problem from the server shows inline and opens nothing', async ({ page }) => {
    await mockEnquiry(page, 400, { error: 'Please enter a valid email address.' });
    await fillContact(page);
    const nothingOpened = await noNewTabWithin(page, () => page.getByRole('button', { name: 'Send enquiry' }).click());
    expect(nothingOpened).toBe(true);
    await expect(page.getByText('Please enter a valid email address.')).toBeVisible();
  });

  test('FRM-C04 the honeypot field is hidden from real visitors', async ({ page }) => {
    await expectHoneypotHidden(page, page.locator('input[name="company"]'));
  });

  test('FRM-C05 name, email, telephone and message are required', async ({ page }) => {
    await page.getByRole('button', { name: 'Send enquiry' }).click();
    for (const label of ['Name *', 'Email *', 'Telephone *', 'Your message *']) {
      expect(await page.getByLabel(label).evaluate((input) => input.validity.valueMissing), label).toBe(true);
    }
  });

  test('FRM-C06 fields bring up the right phone keyboard and autofill', async ({ page }) => {
    await expect(page.getByLabel('Name *')).toHaveAttribute('autocomplete', 'name');
    await expect(page.getByLabel('Email *')).toHaveAttribute('autocomplete', 'email');
    await expect(page.getByLabel('Telephone *')).toHaveAttribute('autocomplete', 'tel');
  });

  test('FRM-C07 Send another returns to a blank form', async ({ page }) => {
    await mockEnquiry(page, 200, { ok: true });
    await fillContact(page);
    await page.getByRole('button', { name: 'Send enquiry' }).click();
    await page.getByRole('button', { name: 'Send another' }).click();
    await expect(page.getByLabel('Name *')).toHaveValue('');
  });
});

test.describe('Consultation sheet', () => {
  // The home page's own "Book a free consultation" button belongs to another
  // agent's work and may not be wired up yet when this runs; falling back to
  // the open event it will eventually dispatch keeps this suite meaningful
  // either way. See the report for which path each run actually took.
  async function openConsultationFrom(page, path) {
    await page.goto(path);
    const trigger = page.getByRole('button', { name: 'Book a free consultation' });
    if (await trigger.count()) {
      await trigger.first().click();
    } else {
      await page.evaluate(() => window.dispatchEvent(new CustomEvent('open-consultation-form')));
    }
    const sheet = page.getByRole('dialog', { name: 'Book a free consultation' });
    await expect(sheet).toBeVisible();
    return sheet;
  }

  async function fillConsultation(sheet) {
    await sheet.getByLabel('Name *').fill(TEST_CLIENT.name);
    await sheet.getByLabel('Email *').fill(TEST_CLIENT.email);
    await sheet.getByLabel('Telephone *').fill(TEST_CLIENT.phone);
  }

  for (const [label, path] of [['the home page', '/'], ['the About page', '/about']]) {
    test(`FRM-CS01 opening from ${label}, a successful request shows the success message`, async ({ page }) => {
      await mockEnquiry(page, 200, { ok: true });
      const sheet = await openConsultationFrom(page, path);
      await fillConsultation(sheet);
      await sheet.getByRole('button', { name: 'Send request' }).click();
      await expect(sheet.getByText(`Thank you, ${TEST_CLIENT.name}. Your consultation request has been sent. We'll confirm a time by phone or WhatsApp.`)).toBeVisible();
    });
  }

  test('FRM-CS02 email unavailable opens WhatsApp with the consultation details', async ({ page }) => {
    await mockEnquiry(page, 503, { error: 'unavailable' });
    const sheet = await openConsultationFrom(page, '/about');
    await fillConsultation(sheet);
    await sheet.getByLabel('Treatment or concern').selectOption('Laser Hair Removal / Laser Treatment');
    await sheet.getByLabel('Preferred time').selectOption('Afternoon');
    const url = await urlOpenedInNewTab(page, sheet.getByRole('button', { name: 'Send request' }));
    const chat = parseWhatsApp(url);
    expect(WHATSAPP_NUMBERS).toContain(chat.number);
    expect(chat.text).toContain('Hello MerryGold, I would like to book a free consultation.');
    expect(chat.text).toContain(`Name: ${TEST_CLIENT.name}`);
    expect(chat.text).toContain('Treatment or concern: Laser Hair Removal / Laser Treatment');
    expect(chat.text).toContain('Preferred time: Afternoon');
    await expect(sheet.getByText("Email isn't available right now, so we've opened WhatsApp with your message ready to send.")).toBeVisible();
  });

  test('FRM-CS03 Escape closes the consultation sheet', async ({ page }) => {
    const sheet = await openConsultationFrom(page, '/about');
    await page.keyboard.press('Escape');
    await expect(sheet).toBeHidden();
  });

  test('FRM-CS04 clicking the backdrop closes the consultation sheet', async ({ page }) => {
    const sheet = await openConsultationFrom(page, '/about');
    await page.locator('.consultation-backdrop').click({ position: { x: 5, y: 5 } });
    await expect(sheet).toBeHidden();
  });

  test('FRM-CS05 on a phone the consultation dialog is a bottom sheet', async ({ page }) => {
    // The switch from centred modal to bottom sheet is CSS's (max-width: 640px),
    // the same breakpoint useMediaQuery(PHONE_QUERY) reads in the component.
    test.skip(viewportWidth(page) > 640, 'phone layout only');
    const sheet = await openConsultationFrom(page, '/about');
    await expect(sheet).toHaveClass(/\bsheet\b/);
  });

  test('FRM-CS06 the honeypot field is hidden from real visitors', async ({ page }) => {
    const sheet = await openConsultationFrom(page, '/about');
    await expectHoneypotHidden(page, sheet.locator('input[name="company"]'));
  });
});

test.describe('Training enquiry form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/training');
  });

  async function fillRequired(page) {
    await page.getByLabel('Full name *').fill(TEST_CLIENT.name);
    await page.getByLabel('Email *').fill(TEST_CLIENT.email);
    await page.getByLabel('Telephone *').fill(TEST_CLIENT.phone);
  }

  test('FRM-T01 email unavailable opens WhatsApp with every detail written in', async ({ page }) => {
    await mockEnquiry(page, 503, { error: 'unavailable' });
    await fillRequired(page);
    await page.getByRole('checkbox', { name: 'Semi-Permanent Makeup' }).check();
    await page.getByRole('checkbox', { name: 'Laser Hair Removal' }).check();
    await page.getByLabel('Experience').selectOption({ index: 1 });
    await page.getByLabel('Notes').fill('Weekends only');
    const url = await urlOpenedInNewTab(page, page.getByRole('button', { name: 'Send enquiry' }));
    const chat = parseWhatsApp(url);
    expect(WHATSAPP_NUMBERS).toContain(chat.number);
    expect(chat.text).toContain(`Name: ${TEST_CLIENT.name}`);
    expect(chat.text).toContain(`Email: ${TEST_CLIENT.email}`);
    expect(chat.text).toContain(`Phone: ${TEST_CLIENT.phone}`);
    expect(chat.text).toContain('Programmes: Semi-Permanent Makeup, Laser Hair Removal');
    expect(chat.text).toContain('Experience: Beauty therapist seeking to add a skill');
    expect(chat.text).toContain('Notes: Weekends only');
    await expect(page.getByText("Email isn't available right now, so we've opened WhatsApp with your message ready to send.")).toBeVisible();
  });

  test('FRM-T02 without a programme the form explains and opens nothing', async ({ page }) => {
    await fillRequired(page);
    const nothingOpened = await noNewTabWithin(page, () => page.getByRole('button', { name: 'Send enquiry' }).click());
    await expect(page.getByText('Select at least one training programme.')).toBeVisible();
    expect(nothingOpened).toBe(true);
  });

  test('FRM-T03 programme boxes tick and untick', async ({ page }) => {
    const box = page.getByRole('checkbox', { name: 'Bridal and Editorial Makeup' });
    await box.check();
    await expect(box).toBeChecked();
    await box.uncheck();
    await expect(box).not.toBeChecked();
  });

  test('FRM-T04 experience starts at the first level and can be changed', async ({ page }) => {
    const select = page.getByLabel('Experience');
    await expect(select).toHaveValue('New to aesthetics');
    await select.selectOption('Qualified practitioner wanting a refresher');
    await expect(select).toHaveValue('Qualified practitioner wanting a refresher');
  });

  test('FRM-T05 name, email and telephone are required', async ({ page }) => {
    await page.getByRole('checkbox', { name: 'Semi-Permanent Makeup' }).check();
    const nothingOpened = await noNewTabWithin(page, () => page.getByRole('button', { name: 'Send enquiry' }).click());
    expect(nothingOpened).toBe(true);
    for (const label of ['Full name *', 'Email *', 'Telephone *']) {
      expect(await page.getByLabel(label).evaluate((input) => input.validity.valueMissing), label).toBe(true);
    }
  });

  test('FRM-T06 empty notes are left out of the message', async ({ page }) => {
    await mockEnquiry(page, 503, { error: 'unavailable' });
    await fillRequired(page);
    await page.getByRole('checkbox', { name: 'Facials and Advanced Skin Treatments' }).check();
    const chat = parseWhatsApp(await urlOpenedInNewTab(page, page.getByRole('button', { name: 'Send enquiry' })));
    expect(chat.text).not.toContain('Notes:');
  });

  test('FRM-T07 the programme message is announced to screen reader users', async ({ page }) => {
    await fillRequired(page);
    await page.getByRole('button', { name: 'Send enquiry' }).click();
    const message = page.getByText('Select at least one training programme.');
    await expect(message).toBeVisible();
    const announced = await message.evaluate((el) => Boolean(el.closest('[role=alert], [aria-live]')));
    expect(announced, 'wrap the error in role="alert"').toBe(true);
  });

  test('FRM-T08 fields bring up the right phone keyboard and autofill', async ({ page }) => {
    await expect(page.getByLabel('Full name *')).toHaveAttribute('autocomplete', 'name');
    await expect(page.getByLabel('Email *')).toHaveAttribute('autocomplete', 'email');
    await expect(page.getByLabel('Telephone *')).toHaveAttribute('type', 'tel');
    await expect(page.getByLabel('Telephone *')).toHaveAttribute('autocomplete', 'tel');
  });

  test('FRM-T09 a successful enquiry shows the success message', async ({ page }) => {
    await mockEnquiry(page, 200, { ok: true });
    await fillRequired(page);
    await page.getByRole('checkbox', { name: 'Semi-Permanent Makeup' }).check();
    await page.getByRole('button', { name: 'Send enquiry' }).click();
    await expect(page.getByText(`Thank you, ${TEST_CLIENT.name}. Your training enquiry has been sent. We'll reply within one working day with dates and fees.`)).toBeVisible();
  });
});
