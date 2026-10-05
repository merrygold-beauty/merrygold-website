import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { treatments, treatmentCategories, listingsInCategory } from '../../data/treatments';
import { useShop } from '../../context/ShopContext';
import { FINDER_LABEL, TREATMENT_INFO_LABEL } from '../../data/labels';
import Reveal from '../common/Reveal';
import TreatmentBookButton from '../treatments/TreatmentBookButton';
import './TreatmentDiscovery.css';

// This showcase is photographic, so a category with no photographed
// treatment yet (a newly added category before its gallery is shot) gets no
// tab here.
const discoveryCategories = treatmentCategories.filter((cat) =>
  treatments.some((t) => t.category === cat.id && t.image)
);

export default function TreatmentDiscovery({ onLaunchFinder }) {
  const [activeCategory, setActiveCategory] = useState('all');
  const { openCheckout } = useShop();

  const categoryTreatments = activeCategory === 'all'
    ? treatments
    : listingsInCategory(activeCategory);
  const filteredTreatments = categoryTreatments.filter(t => t.image).slice(0, 6);

  return (
    <section className="discovery-section">
      <Reveal className="container">
        <div className="discovery-header-row">
          <div className="discovery-titles">
            <h2 className="discovery-title">Treatments</h2>
            <p className="discovery-desc">
              Every appointment is designed around your anatomical landmarks and dermal health objectives.
            </p>
          </div>

          <button
            type="button"
            className="btn btn-secondary discovery-finder-trigger"
            onClick={onLaunchFinder}
          >
            <span>{FINDER_LABEL}</span>
          </button>
        </div>

        {/* Category Tabs */}
        <div className="category-tabs-scroll chip-rail">
          <button
            type="button"
            className={`category-tab-pill chip ${activeCategory === 'all' ? 'active' : ''}`}
            onClick={() => setActiveCategory('all')}
          >
            All Protocols
          </button>
          {discoveryCategories.map(cat => (
            <button
              key={cat.id}
              type="button"
              className={`category-tab-pill chip ${activeCategory === cat.id ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat.id)}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Treatment Cards Grid */}
        <div className="treatments-cards-grid">
          {filteredTreatments.map(t => (
            <div key={t.id} className="treatment-card">
              <div className="treatment-thumb-box arch-soft-frame">
                <img src={t.image} alt={t.name} loading="lazy" />
                <span className="treatment-price-badge">{t.priceDisplay}</span>
              </div>

              <div className="treatment-card-content">
                <span className="treatment-category-label">{t.categoryName}</span>
                <h3 className="treatment-name">{t.name}</h3>
                <p className="treatment-tagline">{t.tagline}</p>

                <div className="treatment-specs-strip">
                  <span className="spec-duration">{t.duration}</span>
                  <span className="spec-practitioner">{t.practitioner}</span>
                </div>

                <div className="treatment-actions">
                  <TreatmentBookButton
                    treatment={t}
                    onBook={(treatment) => openCheckout('treatment', treatment, 1)}
                    className="btn btn-primary btn-sm flex-1"
                  />
                  <Link to={`/treatments/${t.slug}`} className="btn btn-secondary btn-sm">
                    {TREATMENT_INFO_LABEL}
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="discovery-footer-strip">
          <Link to="/treatments" className="btn btn-secondary">
            <span>All Treatments</span>
          </Link>
        </div>
      </Reveal>
    </section>
  );
}