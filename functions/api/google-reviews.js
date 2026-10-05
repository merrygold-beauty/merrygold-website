// Cloudflare Pages Function: GET /api/google-reviews
//
// Serves the clinic's five-star Google Business Profile reviews to the home
// page stream. Google is only ever called once a day per edge location: the
// Cache API (caches.default) stores the response under the request's own
// Cache-Control, so every other request within that day is served from cache.

// unavailableResponse says nothing beyond "unavailable" on purpose: the cause
// could be a bad token, a Google outage or a config mistake, and none of that
// is something the client needs or should see.
import { unavailableResponse } from '../../src/lib/functionsShared.js';

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const REVIEWS_PAGE_SIZE = 50;
const MAX_PAGES = 4;
const MAX_REVIEWS = 12;

const REQUIRED_ENV_NAMES = [
  'GOOGLE_OAUTH_CLIENT_ID',
  'GOOGLE_OAUTH_CLIENT_SECRET',
  'GOOGLE_BUSINESS_REFRESH_TOKEN',
  'GOOGLE_BUSINESS_ACCOUNT_ID',
  'GOOGLE_BUSINESS_LOCATION_ID',
  'GOOGLE_MAPS_PLACE_URL'
];


async function exchangeRefreshToken(env) {
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: env.GOOGLE_OAUTH_CLIENT_ID,
      client_secret: env.GOOGLE_OAUTH_CLIENT_SECRET,
      refresh_token: env.GOOGLE_BUSINESS_REFRESH_TOKEN,
      grant_type: 'refresh_token'
    })
  });
  if (!response.ok) throw new Error('token exchange failed');
  const data = await response.json();
  if (!data.access_token) throw new Error('token exchange returned no access token');
  return data.access_token;
}

// Walks every page of the location's reviews (bounded to MAX_PAGES so a
// misbehaving nextPageToken chain cannot loop forever), and returns them
// alongside the location's aggregate rating, which the v4 list response
// repeats on every page.
async function fetchAllReviews(env, accessToken) {
  const base = `https://mybusiness.googleapis.com/v4/accounts/${env.GOOGLE_BUSINESS_ACCOUNT_ID}/locations/${env.GOOGLE_BUSINESS_LOCATION_ID}/reviews`;
  const allReviews = [];
  const aggregate = { averageRating: null, totalReviewCount: null };
  let pageToken;

  for (let page = 0; page < MAX_PAGES; page++) {
    const url = new URL(base);
    url.searchParams.set('pageSize', String(REVIEWS_PAGE_SIZE));
    if (pageToken) url.searchParams.set('pageToken', pageToken);

    const response = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
    if (!response.ok) throw new Error('reviews list failed');
    const data = await response.json();

    if (Array.isArray(data.reviews)) allReviews.push(...data.reviews);
    if (typeof data.averageRating === 'number') aggregate.averageRating = data.averageRating;
    if (typeof data.totalReviewCount === 'number') aggregate.totalReviewCount = data.totalReviewCount;

    pageToken = data.nextPageToken;
    if (!pageToken) break;
  }

  return { allReviews, aggregate };
}

function toStreamReview(review) {
  return {
    id: review.reviewId,
    name: review.reviewer?.displayName || 'Google user',
    photo: review.reviewer?.profilePhotoUrl || null,
    rating: 5,
    text: review.comment,
    date: review.updateTime
  };
}

export async function onRequestGet(context) {
  const { request, env, waitUntil } = context;
  const cache = caches.default;
  const cacheKey = new Request(new URL(request.url).toString(), request);

  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  if (REQUIRED_ENV_NAMES.some((name) => !env[name])) {
    return unavailableResponse();
  }

  let payload;
  try {
    const accessToken = await exchangeRefreshToken(env);
    const { allReviews, aggregate } = await fetchAllReviews(env, accessToken);

    const reviews = allReviews
      .filter((review) => review.starRating === 'FIVE' && review.comment && review.comment.trim().length > 0)
      .sort((a, b) => new Date(b.updateTime) - new Date(a.updateTime))
      .slice(0, MAX_REVIEWS)
      .map(toStreamReview);

    payload = {
      reviews,
      aggregate,
      placeUrl: env.GOOGLE_MAPS_PLACE_URL || 'https://maps.google.com/?cid=4154085419101479058',
      fetchedAt: new Date().toISOString()
    };
  } catch {
    return unavailableResponse();
  }

  const response = new Response(JSON.stringify(payload), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=86400'
    }
  });

  waitUntil(cache.put(cacheKey, response.clone()));
  return response;
}
