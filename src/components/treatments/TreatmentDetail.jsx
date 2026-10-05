import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Check, ChevronDown } from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import { getTreatmentGuide } from '../../lib/treatmentGuide';
import { TREATMENT_INFO_LABEL } from '../../data/labels';
import useMediaQuery, { PHONE_QUERY } from '../../hooks/useMediaQuery';
import useSheetOpen from '../../hooks/useSheetOpen';
import useEscapeKey from '../../hooks/useEscapeKey';
import TreatmentBookButton from './TreatmentBookButton';
import './TreatmentDetail.css';

// A headed paragraph. Renders nothing when the treatment has no such text,
// because most fields are optional and differ from treatment to treatment.
function GuideParagraph({ heading, text }) {
  if (!text) return null;
  return (
    <div className="treatment-detail-section">
      <h3>{heading}</h3>
      <p className="treatment-detail-text">{text}</p>
    </div>
  );
}

// The long practical lists (preparation, aftercare, good to know) fold away
// so the sheet opens on what the treatment is and who it suits. `lead` is the
// treatment's own sentence; `points` are the ones its whole family shares.
function GuideFold({ heading, lead, points }) {
  if (!lead && points.length === 0) return null;
  return (
    <details className="treatment-detail-fold">
      <summary>
        <span>{heading}</span>
        <ChevronDown size={16} className="treatment-detail-fold-icon" aria-hidden="true" />
      </summary>
      {lead && <p className="treatment-detail-text">{lead}</p>}
      {points.length > 0 && (
        <ul className="treatment-detail-points">
          {points.map((point) => <li key={point}>{point}</li>)}
        </ul>
      )}
    </details>
  );
}

export default function TreatmentDetail({ treatment, onClose }) {
  const { addToCart } = useShop();
  const isPhone = useMediaQuery(PHONE_QUERY);
  const guide = getTreatmentGuide(treatment);

  useSheetOpen(true);
  useEscapeKey(true, onClose);

  // The SEO component only sets a title on route change; this overlay stays
  // on the same route, so it sets and restores the title itself.
  useEffect(() => {
    const previousTitle = document.title;
    document.title = `${treatment.name} | MerryGold Beauty Clinic`;
    return () => {
      document.title = previousTitle;
    };
  }, [treatment.name]);

  // Adding opens the bag, so the panel closes too or it would sit on top of it.
  const handleBook = () => {
    addToCart(treatment, 1);
    onClose();
  };

  return (
    <div className="treatment-detail-backdrop sheet-backdrop" onClick={onClose}>
      <motion.div
        className="treatment-detail-card overlay-shell sheet"
        role="dialog"
        aria-label={treatment.name}
        onClick={(e) => e.stopPropagation()}
        initial={isPhone ? false : { opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      >
        <span className="sheet-handle" aria-hidden="true" />

        <button
          type="button"
          className="treatment-detail-close"
          onClick={onClose}
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <div className="overlay-shell-scroll">
          {treatment.image && (
            <div className="treatment-detail-image-wrap">
              <img src={treatment.image} alt={treatment.name} />
            </div>
          )}

          <div className="treatment-detail-body">
            <span className="treatment-detail-category">{treatment.categoryName}</span>
            <h2 className="treatment-detail-name">{treatment.name}</h2>
            <p className="treatment-detail-tagline">{treatment.tagline}</p>

            <GuideParagraph heading={TREATMENT_INFO_LABEL} text={guide.about} />

            {treatment.benefits?.length > 0 && (
              <div className="treatment-detail-section">
                <h3>Benefits</h3>
                <ul className="treatment-detail-benefits">
                  {treatment.benefits.map((b, idx) => (
                    <li key={idx}>
                      <Check size={14} />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {treatment.concerns?.length > 0 && (
              <div className="treatment-detail-section">
                <h3>Good for</h3>
                <div className="treatment-detail-concerns">
                  {treatment.concerns.map(con => (
                    <span key={con} className="dir-concern-tag">{con}</span>
                  ))}
                </div>
              </div>
            )}

            <GuideParagraph heading="Who it is for" text={guide.suitableFor} />
            <GuideParagraph heading="Who should check first" text={guide.notSuitableFor} />
            <GuideParagraph heading="What happens" text={treatment.whatHappens} />
            <GuideParagraph heading="Results" text={treatment.resultsTimeline} />

            <GuideFold heading="Before your appointment" lead={treatment.preparation} points={guide.before} />
            <GuideFold heading="Aftercare" lead={treatment.aftercare} points={guide.aftercare} />
            <GuideFold heading="Good to know" points={guide.goodToKnow} />

            {guide.notice && <p className="treatment-detail-notice">{guide.notice}</p>}
          </div>
        </div>

        <div className="treatment-detail-footer">
          <p className="treatment-detail-meta">
            {treatment.duration} <span aria-hidden="true">·</span> <span className="price">{treatment.priceDisplay}</span>
          </p>
          <TreatmentBookButton treatment={treatment} onBook={handleBook} className="btn btn-primary" />
        </div>
      </motion.div>
    </div>
  );
}
