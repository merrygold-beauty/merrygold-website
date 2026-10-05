import React from 'react';
import { reviewsData } from '../../data/reviews';
import { clinicData } from '../../data/clinic';
import { Star } from 'lucide-react';
import Reveal from '../common/Reveal';
import GoogleMark from '../common/icons/GoogleMark';
import './ReviewsSection.css';

export default function ReviewsSection() {
  // Duplicate reviews to create a continuous right-to-left stream loop
  const streamReviews = [...reviewsData, ...reviewsData];

  return (
    <section className="reviews-section" aria-label="Client Feedback">
      <Reveal className="container">
        <div className="reviews-header-block">
          <div className="reviews-heading-group">
            <h2 className="reviews-main-title">Client Experiences</h2>
            <p className="reviews-subtitle">
              Authentic feedback from verified clients at MerryGold Clinic.
            </p>
          </div>
          <a
            className="btn btn-secondary btn-sm reviews-google-link"
            href={clinicData.google.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <GoogleMark size={20} />
            <span>See all on Google</span>
          </a>
        </div>
      </Reveal>

      <div className="marquee-wrapper" aria-live="off">
        <div className="marquee-track">
          {streamReviews.map((rev, idx) => (
            <div key={`${rev.id}-${idx}`} className="review-card">
              <div className="review-rating-stars">
                {[...Array(rev.rating)].map((_, i) => (
                  <Star key={i} size={14} className="star-filled" />
                ))}
              </div>

              <h3 className="review-headline">"{rev.headline}"</h3>
              <p className="review-body-text">{rev.review}</p>

              <div className="review-author-strip">
                <div className="author-avatar-frame">
                  {rev.avatar ? (
                    <img src={rev.avatar} alt={rev.clientName} loading="lazy" />
                  ) : (
                    <div className="author-avatar-initials">
                      {rev.clientName.split(' ').map((n) => n[0]).join('')}
                    </div>
                  )}
                </div>
                <div className="author-details">
                  <span className="author-name">{rev.clientName}</span>
                  <div className="author-badges">
                    <span className="treatment-tag">{rev.treatmentName}</span>
                    {rev.verified ? (
                      <span className="verified-tag">
                        <span>Verified Client</span>
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}