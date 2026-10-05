import { test, expect } from '../support/fixtures.js';
import { ui, viewportWidth, boxesOverlap } from '../support/helpers.js';
import { STICKY_BAR_MAX } from '../support/site.js';

// Goldie is the internal name of the assistant; visitors see it as Ask Olu.
// The dialog's own accessible name stays "Goldie AI Concierge" (see the
// comment in GoldieChat.jsx), which is why ui.chat() still finds it by that
// name even though every visible string now reads Ask Olu.

// The local dev server has no OPENROUTER_API_KEY, so /api/goldie always
// answers 503 and Goldie falls back to its local knowledge, which is what a
// visitor gets whenever the live service is down. GLD-11 and GLD-12 mock
// /api/goldie directly to exercise the success and 503 paths on purpose.

const SUGGESTIONS = [
  { chip: 'Microblading consultation', reply: /Microblading at MerryGold is £\d+/ },
  { chip: 'Laser hair removal prices', reply: /Laser hair removal is booked by combo packages or by individual body area/ },
  { chip: 'Million Dollar Facial', reply: /£\d+ for the MerryGold Million Dollar Facial/ },
  { chip: 'Book a treatment', reply: /treatments/i },
  { chip: 'Opening hours & location', reply: /Monday to Saturday/ }
];

async function openChat(page, path = '/') {
  await page.goto(path);
  await ui.chatButton(page).click();
  await expect(ui.chat(page)).toBeVisible();
  return ui.chat(page);
}

async function ask(chat, question) {
  const before = await chat.locator('.msg-bot').count();
  await chat.getByPlaceholder(/ask about treatments/i).fill(question);
  await chat.getByRole('button', { name: 'Send message' }).click();
  await expect(chat.locator('.msg-bot')).toHaveCount(before + 1);
  return chat.locator('.msg-bot').last();
}

test.describe('Ask Olu chat', () => {
  test('GLD-01 the Ask Olu button opens and closes the chat', async ({ page }) => {
    const chat = await openChat(page);
    await expect(chat.locator('.msg-bot')).toHaveCount(1);
    // On phones the dock hides while the chat is open, so GLD-02's close
    // button is the only way out there.
    if (viewportWidth(page) <= STICKY_BAR_MAX) return;
    await ui.chatButton(page).click();
    await expect(chat).toBeHidden();
  });

  test('GLD-02 the close button in the chat closes it', async ({ page }) => {
    const chat = await openChat(page);
    await chat.getByRole('button', { name: 'Close chat' }).click();
    await expect(chat).toBeHidden();
  });

  for (const suggestion of SUGGESTIONS) {
    test(`GLD-03 suggestion "${suggestion.chip}" gets a relevant answer`, async ({ page }) => {
      const chat = await openChat(page);
      await chat.getByRole('button', { name: suggestion.chip }).click();
      await expect(chat.locator('.msg-user').last()).toHaveText(suggestion.chip);
      await expect(chat.locator('.msg-bot').last()).toHaveText(suggestion.reply);
    });
  }

  test('GLD-04 prices Goldie quotes are the bookable prices', async ({ page }) => {
    const chat = await openChat(page);
    const expected = await page.evaluate(async () => {
      const { treatments } = await import('/src/data/treatments.js');
      const microblading = treatments.find(t => t.name === 'Microblading Brows')?.priceDisplay;
      const million = treatments.find(t => t.id === 'facial-million-dollar')?.priceDisplay;
      return { microblading, million };
    });
    await chat.getByRole('button', { name: 'Microblading consultation' }).click();
    await expect(chat.locator('.msg-bot').last()).toContainText(`Microblading at MerryGold is ${expected.microblading}`);
    await chat.getByRole('button', { name: 'Million Dollar Facial' }).click();
    await expect(chat.locator('.msg-bot').last()).toContainText(`${expected.million} for the MerryGold Million Dollar Facial`);
  });

  test('GLD-05 send only works with a question typed, and a typed question is answered', async ({ page }) => {
    const chat = await openChat(page);
    await expect(chat.getByRole('button', { name: 'Send message' })).toBeDisabled();
    const reply = await ask(chat, 'Where are you and is there parking?');
    await expect(reply).toContainText('IG11 8RT');
  });

  test('GLD-06 web addresses in an answer become tappable links', async ({ page }) => {
    const chat = await openChat(page);
    const reply = await ask(chat, 'Can I contact you on WhatsApp?');
    const link = reply.getByRole('link', { name: /Open WhatsApp Chat/ });
    await expect(link).toHaveAttribute('href', /^https:\/\/wa\.me\/\d+$/);
    await expect(link).toHaveAttribute('target', '_blank');
  });

  test('GLD-07 the booking answer gives website booking advice', async ({ page }) => {
    const chat = await openChat(page);
    await chat.getByRole('button', { name: 'Book a treatment' }).click();
    await expect(chat.locator('.msg-bot').last()).toContainText('/treatments');
  });

  test('GLD-08 Goldie\'s opening hours match the hours in the footer', async ({ page }) => {
    const chat = await openChat(page);
    const reply = await ask(chat, 'What are your opening hours?');
    const replyTimes = (await reply.innerText()).match(/\d{2}:\d{2}/g);
    const footerTimes = (await page.locator('.footer-hours-card').innerText()).match(/\d{2}:\d{2}/g);
    expect(replyTimes).toEqual(footerTimes);
  });

  test('GLD-09 no Goldie answer contains an em dash or en dash', async ({ page }) => {
    const chat = await openChat(page);
    for (const suggestion of SUGGESTIONS) {
      await chat.getByRole('button', { name: suggestion.chip }).click();
      await expect(chat.locator('.msg-user').last()).toHaveText(suggestion.chip);
    }
    for (const question of ['Who is Olu?', 'Do you offer training?', 'How much is a facial?']) {
      await ask(chat, question);
    }
    expect(await chat.locator('.goldie-body').innerText()).not.toMatch(/[–—]/);
  });

  test('GLD-10 on a phone the open chat fits the screen and sits clear of the booking bar', async ({ page }) => {
    test.skip(viewportWidth(page) > STICKY_BAR_MAX, 'phone layout only');
    const chat = await openChat(page, '/treatments');
    const panel = await chat.boundingBox();
    const viewport = page.viewportSize();
    expect(panel.x).toBeGreaterThanOrEqual(0);
    expect(panel.x + panel.width).toBeLessThanOrEqual(viewport.width);
    expect(panel.y).toBeGreaterThanOrEqual(0);
    expect(boxesOverlap(panel, await ui.stickyBar(page).boundingBox()), 'chat panel overlaps the booking bar').toBe(false);
    await expect(chat.getByRole('button', { name: 'Send message' })).toBeInViewport();
  });

  test('GLD-11 a successful reply from the server function renders as the answer', async ({ page }) => {
    const chat = await openChat(page);
    await page.route('**/api/goldie', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ text: 'Our Hydra Facial is a wonderful choice for hydration.' }) })
    );
    const reply = await ask(chat, 'Tell me about the Hydra Facial');
    await expect(reply).toHaveText('Our Hydra Facial is a wonderful choice for hydration.');
  });

  test('GLD-12 a 503 from the server function (no key configured) still gets an answer from the local fallback', async ({ page }) => {
    const chat = await openChat(page);
    await page.route('**/api/goldie', (route) =>
      route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'unavailable' }) })
    );
    const reply = await ask(chat, 'What are your opening hours?');
    await expect(reply).toContainText('Monday to Saturday');
  });

  test('GLD-13 the Free consultation chip closes the chat and opens the consultation sheet', async ({ page }) => {
    const chat = await openChat(page);
    await chat.getByRole('button', { name: 'Free consultation' }).click();
    await expect(chat).toBeHidden();
    await expect(page.getByRole('dialog', { name: 'Book a free consultation' })).toBeVisible();
  });
});
