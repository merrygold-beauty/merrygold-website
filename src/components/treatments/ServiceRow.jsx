import { Link } from 'react-router-dom';
import { TREATMENT_INFO_LABEL } from '../../data/labels';
import TreatmentBookButton from './TreatmentBookButton';
import './ServiceRow.css';

// Text-only row for a treatment with no photograph: name, duration and price,
// the link to its guide, and a Book button. Never wrapped in an image-shaped
// box (see ServiceRow.css). The name, meta and guide label are one link, so a
// screen reader meets one destination per row, not three.
export default function ServiceRow({ t, onBook }) {
  return (
    <div className="service-row">
      <Link className="service-row-link" to={`/treatments/${t.slug}`}>
        <span className="service-row-name">{t.name}</span>
        <span className="service-row-meta">
          {t.duration} <span aria-hidden="true">·</span> <span className="price">{t.priceDisplay}</span>
        </span>
        <span className="treatment-info-label">{TREATMENT_INFO_LABEL}</span>
      </Link>
      <TreatmentBookButton treatment={t} onBook={onBook} className="btn btn-secondary btn-sm" />
    </div>
  );
}
