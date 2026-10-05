import React from 'react';
import { Phone } from 'lucide-react';
import { clinicData } from '../../data/clinic';
import { openConsultationForm } from '../../services/enquiries';
import { FINDER_LABEL, FREE_CONSULTATION_LABEL } from '../../data/labels';
import Reveal from '../common/Reveal';
import './BookingInvitation.css';

export default function BookingInvitation({ onLaunchFinder }) {
  return (
    <section className="invitation-section">
      <Reveal className="container">
        <div className="invitation-card">
          <div className="invitation-content">
            <h2 className="invitation-title">Book your appointment</h2>
            <p className="invitation-narrative">
              Every appointment starts with a free consultation in our Barking clinic, so the treatment is chosen for your skin, not sold off a menu.
            </p>

            <div className="invitation-actions">
              <button
                type="button"
                className="btn btn-primary"
                onClick={openConsultationForm}
              >
                <span>{FREE_CONSULTATION_LABEL}</span>
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={onLaunchFinder}
              >
                <span>{FINDER_LABEL}</span>
              </button>
            </div>

            <div className="invitation-meta-strip">
              <div className="invitation-phone">
                <Phone size={14} />
                <span>Direct telephone: <a href={clinicData.contact.phoneHref}>{clinicData.contact.phone}</a></span>
              </div>
              <div className="invitation-assurance">
                <span>The consultation is free. Treatments booked online are paid on Stripe's secure page.</span>
              </div>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
