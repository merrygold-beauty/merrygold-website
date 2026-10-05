import { isBookableOnline } from '../../data/treatments';
import { openTreatmentEnquiry } from '../../services/enquiries';

// The one place that decides what a treatment's main button does. A priced
// treatment books through onBook (the bag or the checkout, the caller's
// choice). One the owner has not priced yet cannot be paid for, so its button
// opens the enquiry form with the treatment already named.
export default function TreatmentBookButton({ treatment, onBook, className }) {
  if (!isBookableOnline(treatment)) {
    return (
      <button type="button" className={className} onClick={() => openTreatmentEnquiry(treatment)}>
        <span>Enquire</span>
      </button>
    );
  }

  return (
    <button type="button" className={className} onClick={() => onBook(treatment)}>
      <span>Book</span>
    </button>
  );
}
