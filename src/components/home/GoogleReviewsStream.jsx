import React, { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import GoogleMark from '../common/icons/GoogleMark';
import './GoogleReviewsStream.css';

function relativeDate(value) {
  const date = new Date(value);
  const elapsedMs = Date.now() - date.getTime();
  if (Number.isNaN(date.getTime()) || elapsedMs < 0) return null;

  const days = Math.floor(elapsedMs / 86_400_000);
  if (days < 1) return 'today';
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
  if (days < 30) {
    const weeks = Math.floor(days / 7);
    return `${weeks} week${weeks === 1 ? '' : 's'} ago`;
  }
  if (days < 365) {
    const months = Math.floor(days / 30);
    return `${months} month${months === 1 ? '' : 's'} ago`;
  }
  const years = Math.floor(days / 365);
  return `${years} year${years === 1 ? '' : 's'} ago`;
}

export default function GoogleReviewsStream() {
  const [source, setSource] = useState(null);

  useEffect(() => {
    let cancelled = false;

    fetch('/api/google-reviews')
      .then((res) => {
        if (!res.ok) throw new Error('unavailable');
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        if (!Array.isArray(data.reviews) || data.reviews.length === 0) throw new Error('no reviews');
        setSource({ reviews: data.reviews, aggregate: data.aggregate || null, placeUrl: data.placeUrl || null });
      })
      .catch(() => {
        // No fallback: this band exists only for the live Google feed, since
        // the curated Google reviews already appear in ReviewsSection above.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!source || source.reviews.length === 0) return null;

  const { reviews, aggregate, placeUrl } = source;
  const streamReviews = [...reviews, ...reviews];
  const aggregateText =
    aggregate && typeof aggregate.averageRating === 'number' && typeof aggregate.totalReviewCount === 'number'
      ? `${aggregate.averageRating.toFixed(1)} from ${aggregate.totalReviewCount} reviews`
      : null;

  return (
    <section className="google-reviews-band" aria-label="Google Reviews">
      <div className="container google-reviews-header">
        <div className="google-reviews-heading-group">
          <GoogleMark size={20} />
          <h2 className="google-reviews-title">Google reviews</h2>
          {aggregateText ? <span className="google-reviews-aggregate">&middot; {aggregateText}</span> : null}
        </div>
        {placeUrl ? (
          <a className="btn btn-secondary btn-sm" href={placeUrl} target="_blank" rel="noopener noreferrer">
            See all on Google
          </a>
        ) : null}
      </div>

      <div className="marquee-wrapper google-reviews-stream" aria-live="off">
        <div className="marquee-track">
          {streamReviews.map((review, idx) => {
            const date = relativeDate(review.date);
            return (
              <div key={`${review.id}-${idx}`} className="google-review-card">
                <div className="google-review-stars">
                  {[...Array(5)].map((_, starIdx) => (
                    <Star key={starIdx} size={14} className="google-review-star" />
                  ))}
                </div>

                <p className="google-review-text">{review.text}</p>

                <div className="google-review-footer">
                  <span className="google-review-name">{review.name}</span>
                  {date ? <span className="google-review-date">{date}</span> : null}
                  <GoogleMark size={14} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
