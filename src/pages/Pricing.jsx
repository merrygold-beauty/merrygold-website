import { Link } from 'react-router-dom';
import SEO from '../components/common/SEO';
import { treatmentCategories, isBookableOnline, listingsInCategory } from '../data/treatments';
import { TREATMENT_INFO_LABEL } from '../data/labels';
import { formatPounds } from '../lib/formatPounds';
import './Pricing.css';

// "From £x" for a category, read from its cheapest priced treatment so the
// badge can never disagree with the rows below it.
function leadPrice(categoryTreatments) {
  const prices = categoryTreatments.filter(isBookableOnline).map(t => t.price);
  if (prices.length === 0) return 'Price on consultation';
  return `From ${formatPounds(Math.min(...prices))}`;
}

export default function Pricing() {
  const categories = treatmentCategories;

  return (
    <div className="section pricing-page">
      <SEO
        title="Treatment Pricing Guide | MerryGold Beauty Clinic"
        description="Transparent pricing for MerryGold in Barking, East London: facials, laser hair removal, microblading, lashes, massage, and waxing."
      />
      <div className="container" style={{ maxWidth: '1000px' }}>
        <header className="section-header pricing-hero-header">
          <h1 className="section-title">Pricing Guide</h1>
          <p className="section-subtitle">
            Book direct on our website with bespoke care and transparent pricing. A free patch test is required before laser and some peels.
          </p>
        </header>

        <div className="pricing-content">
          {categories.map((category) => {
            const categoryTreatments = listingsInCategory(category.id);
            if (categoryTreatments.length === 0) return null;

            return (
              <div key={category.id} className="pricing-category-group">
                <div className="pricing-category-header">
                  <h2 className="pricing-category-title">{category.name}</h2>
                  <span className="pricing-category-badge">{leadPrice(categoryTreatments)}</span>
                </div>

                <div className="pricing-table">
                  {categoryTreatments.map((treatment) => (
                    <div key={treatment.id} className="pricing-row">
                      <div className="pricing-row-info">
                        <h3 className="pricing-row-name">{treatment.name}</h3>
                        <span className="pricing-row-meta">
                          {treatment.duration ? `Duration: ${treatment.duration}` : 'Duration on request'}
                          {treatment.subcategory && treatment.subcategory !== category.name ? ` · ${treatment.subcategory}` : ''}
                        </span>
                        <Link to={`/treatments/${treatment.slug}`} className="treatment-info-label">
                          {TREATMENT_INFO_LABEL}
                        </Link>
                      </div>

                      <div className="pricing-row-action">
                        <span className="pricing-row-price">{treatment.priceDisplay}</span>
                        <Link
                          to={`/treatments/${treatment.slug}`}
                          className="pricing-row-book"
                          aria-label={`${isBookableOnline(treatment) ? 'Book' : 'Enquire about'} ${treatment.name}`}
                        >
                          <span>{isBookableOnline(treatment) ? 'Book' : 'Enquire'}</span>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
