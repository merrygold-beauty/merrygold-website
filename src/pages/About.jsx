import React from 'react';
import { Link } from 'react-router-dom';
import { Check, MessageCircle } from 'lucide-react';
import { clinicData, formatClinicAddress } from '../data/clinic';
import { FREE_CONSULTATION_LABEL, BOOK_LABEL } from '../data/labels';
import { openConsultationForm } from '../services/enquiries';
import SEO from '../components/common/SEO';
import directorPhoto from '../assets/images/director_olu_portrait.webp';
import './About.css';

export default function About() {
  const { director, team } = clinicData;

  return (
    <div className="about-page-shell">
      <SEO
        title="About us | MerryGold Beauty Clinic"
        description="MerryGold Beauty Clinic in Barking, East London, led by founder Olu: the clinic, her background, and the team."
      />

      <section className="about-header-band">
        <div className="container">
          <h1 className="about-header-title">About us</h1>
          <p className="about-header-subtext">The clinic, the founder behind it, and the team who deliver your treatment.</p>
        </div>
      </section>

      <section className="about-section">
        <div className="container container-narrow">
          <h2 className="about-section-heading">The clinic</h2>
          <div className="about-clinic-paragraphs">
            {clinicData.venueAbout.map((para) => (
              <p key={para.slice(0, 24)}>{para}</p>
            ))}
          </div>

          <div className="about-facts-grid">
            <div className="about-fact">
              <span className="about-fact-label">Address</span>
              <p>{formatClinicAddress()}</p>
            </div>
            <div className="about-fact">
              <span className="about-fact-label">Getting here</span>
              <p>{clinicData.transport}</p>
            </div>
            <div className="about-fact">
              <span className="about-fact-label">Opening hours</span>
              {clinicData.contact.openingHours.map((h, idx) => (
                <p key={idx}>{h.days}: {h.hours}</p>
              ))}
            </div>
            <div className="about-fact">
              <span className="about-fact-label">Payment</span>
              <p>{clinicData.amenities.join(', ')}.</p>
            </div>
          </div>

          <div className="about-facts-links">
            <Link to="/the-clinic" className="link-editorial">
              <span>See the clinic</span>
            </Link>
            <Link to="/contact" className="link-editorial">
              <span>Contact us</span>
            </Link>
          </div>
        </div>
      </section>

      <section className="about-section about-section--tint">
        <div className="container container-narrow">
          <h2 className="about-section-heading">Olu, the founder</h2>
          <div className="about-founder-grid">
            <div className="about-founder-photo-col">
              <div className="about-photo-frame arch-frame">
                <img src={directorPhoto} alt={`${director.name} - ${director.title}`} />
              </div>
              <div className="about-accreditation-pill">
                <span>VTCT Accredited · London Aesthetic Clinic</span>
              </div>
            </div>

            <div className="about-founder-content">
              <h3 className="about-founder-name">{director.name}</h3>
              <p className="about-founder-title">{director.title}</p>
              <span className="about-founder-credentials">{director.credentials}</span>

              <blockquote className="about-founder-quote">
                "{director.philosophy}"
              </blockquote>

              <div className="about-founder-bio">
                <p>{director.bio}</p>
                <p>
                  With specialist certifications spanning London Aesthetic Clinic and EVLISS Aesthetic Clinic, Olu combines high clinical rigour with a warmth that puts even the most apprehensive clients at ease.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="about-section">
        <div className="container container-narrow">
          <h2 className="about-section-heading">Experience</h2>
          <ul className="about-list-grid">
            {director.pastExperience.map((exp, i) => (
              <li key={i}>{exp}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="about-section about-section--tint">
        <div className="container container-narrow">
          <h2 className="about-section-heading">Our standards</h2>
          <ul className="about-list-grid about-list-grid--checked">
            {director.standards.map((standard, i) => (
              <li key={i}>
                <Check size={15} className="about-check-icon" />
                <span>{standard}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="about-section">
        <div className="container container-narrow">
          <h2 className="about-section-heading">The team</h2>
          <div className="about-team-grid">
            {team.map((member) => (
              <div key={member.id} className="about-team-card">
                <h3>{member.name}</h3>
                <p className="about-team-preferred-name">{member.preferredName}</p>
                <p className="about-team-title">{member.title}</p>
                <p className="about-team-services">{member.services.join(', ')}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="about-section about-section--tint">
        <div className="container container-narrow about-action-strip">
          <button type="button" className="btn btn-primary" onClick={openConsultationForm}>
            <span>{FREE_CONSULTATION_LABEL}</span>
          </button>
          <Link to="/treatments" className="btn btn-secondary">
            <span>{BOOK_LABEL}</span>
          </Link>
          <a
            href={clinicData.contact.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-whatsapp"
          >
            <MessageCircle size={16} />
            <span>WhatsApp</span>
          </a>
        </div>
      </section>
    </div>
  );
}
