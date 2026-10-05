import { test, expect } from '../support/fixtures.js';

const MOCK_DATA = {
  reviews: [
    {
      id: 'g-ada',
      name: 'Ada O',
      photo: null,
      rating: 5,
      text: 'Amazing facial, the team is so professional and the results speak for themselves.',
      date: '2026-08-01T10:00:00.000Z'
    },
    {
      id: 'g-priya',
      name: 'Priya S',
      photo: null,
      rating: 5,
      text: 'Best laser hair removal in Barking, always on time and so friendly.',
      date: '2026-07-15T10:00:00.000Z'
    }
  ],
  aggregate: { averageRating: 4.9, totalReviewCount: 87 },
  placeUrl: 'https://www.google.com/maps/place/?q=place_id:test-clinic',
  fetchedAt: '2026-09-16T00:00:00.000Z'
};

test.describe('Google reviews band on the home page', () => {
  test('GRV-01 the band does not render when the Google feed is unavailable', async ({ page }) => {
    // Without live Google credentials this is a 503 today, and there is no
    // local fallback: the curated Google reviews already show in
    // ReviewsSection above, so an unavailable feed should render nothing
    // rather than repeat them.
    await page.route('**/api/google-reviews', (route) =>
      route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'unavailable' }) })
    );
    await page.goto('/');
    await expect(page.getByRole('region', { name: 'Google Reviews' })).toHaveCount(0);
  });

  test('GRV-02 mocked Google data renders the aggregate and both reviews', async ({ page }) => {
    await page.route('**/api/google-reviews', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_DATA) })
    );
    await page.goto('/');
    const band = page.getByRole('region', { name: 'Google Reviews' });

    await expect(band.getByRole('heading', { name: 'Google reviews' })).toBeVisible();
    await expect(band.getByText('4.9 from 87 reviews')).toBeVisible();

    // The track duplicates its reviews for a seamless loop, so each of the
    // two mocked reviews appears twice.
    await expect(band.getByText(MOCK_DATA.reviews[0].name)).toHaveCount(2);
    await expect(band.getByText(MOCK_DATA.reviews[1].name)).toHaveCount(2);

    const link = band.getByRole('link', { name: 'See all on Google' });
    await expect(link).toHaveAttribute('href', MOCK_DATA.placeUrl);
  });
});

test.describe('Curated reviews section on the home page', () => {
  test('GRV-03 its "See all on Google" link points at the clinic Google listing', async ({ page }) => {
    await page.goto('/');
    const section = page.getByRole('region', { name: 'Client Feedback' });
    const link = section.getByRole('link', { name: 'See all on Google' });
    await expect(link).toHaveAttribute('href', /maps\.google\.com\/\?cid=/);
  });
});
