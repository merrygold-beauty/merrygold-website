import React, { useState } from 'react';
import { clinicData, formatClinicAddress } from '../data/clinic';
import { submitEnquiry } from '../services/enquiries';
import { MapPin, Phone, Mail, MessageCircle, Check } from 'lucide-react';
import SEO from '../components/common/SEO';
import HoneypotField from '../components/common/HoneypotField';
import './Contact.css';

const emptyForm = { name: '', email: '', phone: '', message: '', company: '' };

export default function Contact() {
  const [form, setForm] = useState(emptyForm);
  const [status, setStatus] = useState('idle'); // idle | sending | success | whatsapp
  const [error, setError] = useState('');

  const handleField = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setStatus('sending');
    try {
      const result = await submitEnquiry({ type: 'contact', ...form });
      setStatus(result.delivered === 'email' ? 'success' : 'whatsapp');
    } catch (err) {
      setError(err.message);
      setStatus('idle');
    }
  };

  const resetForm = () => {
    setForm(emptyForm);
    setStatus('idle');
  };

  const isSending = status === 'sending';

  return (
    <div className="contact-page-shell">
      <SEO
        title="Contact us | MerryGold Beauty Clinic"
        description="Call, message or write to MerryGold Beauty Clinic in Barking, East London, for appointments, treatment questions or skincare orders."
      />

      <section className="contact-hero-header">
        <div className="container">
          <h1 className="contact-page-title">Contact us</h1>
          <p className="contact-page-subtext">
            Write, call, or message our London clinic for appointments, treatment questions, or skincare orders.
          </p>
        </div>
      </section>

      <section className="contact-body-section">
        <div className="container">
          <div className="contact-grid">
            {/* Info Column */}
            <div className="contact-info-col">
              <div className="contact-card">
                <h2>Find us</h2>
                <div className="contact-entry">
                  <MapPin size={18} className="contact-entry-icon" />
                  <div>
                    <strong>MerryGold Beauty Clinic</strong>
                    <p>{formatClinicAddress()}</p>
                  </div>
                </div>

                <div className="contact-entry">
                  <Phone size={18} className="contact-entry-icon" />
                  <div>
                    <strong>Telephone</strong>
                    <a href={clinicData.contact.phoneHref}>{clinicData.contact.phone}</a>
                  </div>
                </div>

                <div className="contact-entry">
                  <Mail size={18} className="contact-entry-icon" />
                  <div>
                    <strong>Email</strong>
                    <a href={clinicData.contact.emailHref}>{clinicData.contact.email}</a>
                  </div>
                </div>

                <div className="contact-hours-block">
                  <div className="hours-head">
                    <span>Opening hours</span>
                  </div>
                  {clinicData.contact.openingHours.map((h, idx) => (
                    <div key={idx} className="hours-entry">
                      <span>{h.days}</span>
                      <strong>{h.hours}</strong>
                    </div>
                  ))}
                </div>

                <div className="contact-card-actions">
                  <a
                    href={clinicData.contact.whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-whatsapp"
                  >
                    <MessageCircle size={16} />
                    <span>WhatsApp</span>
                  </a>
                  <a
                    href={clinicData.google.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link-editorial"
                  >
                    <span>Open in Google Maps</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Form Column */}
            <div className="contact-form-col">
              <div className="form-card">
                <h2>Send an enquiry</h2>

                {status === 'success' && (
                  <div className="contact-success-box">
                    <Check size={28} className="contact-result-icon" />
                    <p>Thank you, {form.name}. We've received your enquiry and will reply within one working day.</p>
                    <button type="button" className="btn btn-secondary" onClick={resetForm}>
                      <span>Send another</span>
                    </button>
                  </div>
                )}

                {status === 'whatsapp' && (
                  <div className="contact-success-box">
                    <p>Email isn't available right now, so we've opened WhatsApp with your message ready to send.</p>
                    <button type="button" className="btn btn-secondary" onClick={resetForm}>
                      <span>Send another</span>
                    </button>
                  </div>
                )}

                {(status === 'idle' || status === 'sending') && (
                  <form onSubmit={handleSubmit} className="contact-enquiry-form">
                    <div className="contact-input-field">
                      <label htmlFor="c-name">Name *</label>
                      <input
                        id="c-name"
                        type="text"
                        required
                        autoComplete="name"
                        placeholder="Your full name"
                        value={form.name}
                        onChange={handleField('name')}
                      />
                    </div>

                    <div className="contact-input-field">
                      <label htmlFor="c-email">Email *</label>
                      <input
                        id="c-email"
                        type="email"
                        required
                        autoComplete="email"
                        placeholder="name@domain.com"
                        value={form.email}
                        onChange={handleField('email')}
                      />
                    </div>

                    <div className="contact-input-field">
                      <label htmlFor="c-phone">Telephone *</label>
                      <input
                        id="c-phone"
                        type="tel"
                        required
                        autoComplete="tel"
                        placeholder="07700 900123"
                        value={form.phone}
                        onChange={handleField('phone')}
                      />
                    </div>

                    <div className="contact-input-field">
                      <label htmlFor="c-message">Your message *</label>
                      <textarea
                        id="c-message"
                        rows={4}
                        required
                        placeholder="How can we help?"
                        value={form.message}
                        onChange={handleField('message')}
                      />
                    </div>

                    <HoneypotField id="c-company" value={form.company} onChange={handleField('company')} />

                    {error && <p className="contact-error" role="alert">{error}</p>}

                    <button type="submit" className="btn btn-primary" disabled={isSending}>
                      <span>{isSending ? 'Sending' : 'Send enquiry'}</span>
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
