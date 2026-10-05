import { test, expect } from '../support/fixtures.js';
import { importAppData } from '../support/helpers.js';

test.describe('Blog', () => {
  let articles;

  test.beforeEach(async ({ page }) => {
    await page.goto('/blog');
    ({ blogArticles: articles } = await importAppData(page, '/src/data/blog.js'));
  });

  test('BLG-01 the list shows all five ported articles as cards', async ({ page }) => {
    expect(articles.length).toBe(5);
    await expect(page.locator('.blog-card')).toHaveCount(5);
  });

  test('BLG-02 each card title link opens that article with the matching h1', async ({ page }) => {
    // Five full navigations in one test; give it more room than the default
    // 45s, the same way 25-other-services.spec.js does for OTH-06.
    test.setTimeout(90_000);
    for (const article of articles) {
      await page.goto('/blog');
      await page.locator('.blog-card').filter({ hasText: article.title }).locator('.blog-card-title a').click();
      await expect(page.locator('h1')).toHaveText(article.title);
    }
  });

  test('BLG-03 "Read article" opens the same article as its title link', async ({ page }) => {
    const first = articles[0];
    await page.locator('.blog-card').filter({ hasText: first.title }).getByRole('link', { name: 'Read article' }).click();
    await expect(page.locator('h1')).toHaveText(first.title);
  });

  test('BLG-04 an unknown slug redirects back to the blog list', async ({ page }) => {
    await page.goto('/blog/not-a-real-article-slug');
    await expect(page).toHaveURL(/\/blog$/);
    await expect(page.locator('h1')).toHaveText('Blog');
  });

  test('BLG-05 "Back to blog" returns to the list', async ({ page }) => {
    await page.goto(`/blog/${articles[0].slug}`);
    await page.getByRole('link', { name: 'Back to blog' }).click();
    await expect(page).toHaveURL(/\/blog$/);
    await expect(page.locator('h1')).toHaveText('Blog');
  });

  test('BLG-06 the article page title contains the article title', async ({ page }) => {
    // Five full navigations in one test; give it more room than the default
    // 45s, the same way 25-other-services.spec.js does for OTH-06.
    test.setTimeout(90_000);
    for (const article of articles) {
      await page.goto(`/blog/${article.slug}`);
      await expect(page).toHaveTitle(new RegExp(article.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    }
  });

  test('BLG-07 "Book an appointment" on an article page leads to Treatments', async ({ page }) => {
    await page.goto(`/blog/${articles[0].slug}`);
    // Scoped to the article body: the header nav now carries its own "Book an
    // appointment" link too, so the unscoped role query matches both.
    await page.locator('.blog-article-actions').getByRole('link', { name: 'Book an appointment' }).click();
    await expect(page).toHaveURL(/\/treatments$/);
  });
});
