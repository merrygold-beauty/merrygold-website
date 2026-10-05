import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Check } from 'lucide-react';
import { treatmentCategories } from '../../data/treatments';
import { submitEnquiry, OPEN_CONSULTATION_EVENT } from '../../services/enquiries';
import useMediaQuery, { PHONE_QUERY } from '../../hooks/useMediaQuery';
import useSheetOpen from '../../hooks/useSheetOpen';
import useEscapeKey from '../../hooks/useEscapeKey';
import HoneypotField from '../common/HoneypotField';
import './ConsultationSheet.css';

const NOT_SURE_YET = 'Not sure yet';
const TIME_OPTIONS = ['Morning', 'Afternoon', 'Evening', 'Any'];

const emptyForm = {
  name: '',
  email: '',
  phone: '',
  treatment: NOT_SURE_YET,
  preferredDate: '',
  preferredTime: 'Any',
  notes: '',
  company: ''
};

export default function ConsultationSheet() {
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [status, setStatus] = useState('idle'); // idle | sending | success | whatsapp
  const [error, setError] = useState('');
  const isPhone = useMediaQuery(PHONE_QUERY);

  useSheetOpen(isOpen);

  useEffect(() => {
    // openTreatmentEnquiry sends the treatment along; the plain opener sends
    // no detail and the form starts empty.
    const handleOpen = (event) => {
      const enquiry = event.detail;
      if (enquiry) {
        const isListedCategory = treatmentCategories.some((category) => category.name === enquiry.categoryName);
        setForm({
          ...emptyForm,
          treatment: isListedCategory ? enquiry.categoryName : NOT_SURE_YET,
          notes: `I would like to ask about ${enquiry.treatmentName}.`
        });
      }
      setIsOpen(true);
    };
    window.addEventListener(OPEN_CONSULTATION_EVENT, handleOpen);
    return () => window.removeEventListener(OPEN_CONSULTATION_EVENT, handleOpen);
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    setStatus('idle');
    setError('');
    setForm(emptyForm);
  };

  useEscapeKey(isOpen, handleClose);

  if (!isOpen) return null;

  const handleField = (field) => (event) => setForm({ ...form, [field]: event.target.value });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setStatus('sending');
    try {
      const result = await submitEnquiry({
        type: 'consultation',
        name: form.name,
        email: form.email,
        phone: form.phone,
        treatment: form.treatment,
        preferredDate: form.preferredDate,
        preferredTime: form.preferredTime,
        notes: form.notes,
        company: form.company
      });
      setStatus(result.delivered === 'email' ? 'success' : 'whatsapp');
    } catch (err) {
      setError(err.message);
      setStatus('idle');
    }
  };

  const isSending = status === 'sending';

  return (
    <div className="consultation-backdrop sheet-backdrop" onClick={handleClose}>
      <motion.div
        // stopPropagation: on phones the sheet sits inside a backdrop that
        // closes on click, and a phone keyboard's Enter key submits by
        // clicking the Send request button, which would otherwise bubble.
        className={`consultation-card overlay-shell${isPhone ? ' sheet' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="consultation-heading"
        onClick={(e) => e.stopPropagation()}
        initial={isPhone ? false : { opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      >
        <span className="sheet-handle" aria-hidden="true" />

        <div className="consultation-header">
          <button type="button" className="consultation-close" onClick={handleClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="overlay-shell-scroll">
          <div className="consultation-body">
            <h2 id="consultation-heading" className="consultation-heading">Book a free consultation</h2>

            {status === 'success' && (
              <div className="consultation-result">
                <Check size={28} className="consultation-result-icon" />
                <p>Thank you, {form.name}. Your consultation request has been sent. We&apos;ll confirm a time by phone or WhatsApp.</p>
                <button type="button" className="btn btn-secondary" onClick={handleClose}>
                  <span>Close</span>
                </button>
              </div>
            )}

            {status === 'whatsapp' && (
              <div className="consultation-result">
                <p>Email isn&apos;t available right now, so we&apos;ve opened WhatsApp with your message ready to send.</p>
                <button type="button" className="btn btn-secondary" onClick={handleClose}>
                  <span>Close</span>
                </button>
              </div>
            )}

            {(status === 'idle' || status === 'sending') && (
              <>
                <p className="consultation-intro">
                  Tell us what you&apos;d like to talk about and when suits you. We&apos;ll confirm your consultation by phone or WhatsApp.
                </p>

                <form onSubmit={handleSubmit} className="consultation-form">
                  <div className="consultation-field">
                    <label htmlFor="cons-name">Name *</label>
                    <input id="cons-name" type="text" required autoComplete="name" value={form.name} onChange={handleField('name')} />
                  </div>

                  <div className="consultation-field">
                    <label htmlFor="cons-email">Email *</label>
                    <input id="cons-email" type="email" required autoComplete="email" value={form.email} onChange={handleField('email')} />
                  </div>

                  <div className="consultation-field">
                    <label htmlFor="cons-phone">Telephone *</label>
                    <input id="cons-phone" type="tel" required autoComplete="tel" value={form.phone} onChange={handleField('phone')} />
                  </div>

                  <div className="consultation-field">
                    <label htmlFor="cons-treatment">Treatment or concern</label>
                    <select id="cons-treatment" value={form.treatment} onChange={handleField('treatment')}>
                      <option value={NOT_SURE_YET}>{NOT_SURE_YET}</option>
                      {treatmentCategories.map((category) => (
                        <option key={category.id} value={category.name}>{category.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="consultation-field">
                    <label htmlFor="cons-date">Preferred date</label>
                    <input
                      id="cons-date"
                      type="date"
                      min={new Date().toISOString().slice(0, 10)}
                      value={form.preferredDate}
                      onChange={handleField('preferredDate')}
                    />
                  </div>

                  <div className="consultation-field">
                    <label htmlFor="cons-time">Preferred time</label>
                    <select id="cons-time" value={form.preferredTime} onChange={handleField('preferredTime')}>
                      {TIME_OPTIONS.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>

                  <div className="consultation-field">
                    <label htmlFor="cons-notes">Anything you&apos;d like us to know</label>
                    <textarea id="cons-notes" rows={3} value={form.notes} onChange={handleField('notes')} />
                  </div>

                  <HoneypotField id="cons-company" value={form.company} onChange={handleField('company')} />

                  {error && <p className="consultation-error" role="alert">{error}</p>}

                  <button type="submit" className="btn btn-primary" disabled={isSending}>
                    <span>{isSending ? 'Sending' : 'Send request'}</span>
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
