import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail } from 'lucide-react';
import logoImg from '../../assets/brand/merrygold-monogram.webp';
import { clinicData, formatClinicAddress } from '../../data/clinic';
import { treatmentCategories } from '../../data/treatments';
import { FINDER_LABEL } from '../../data/labels';
import InstagramIcon from '../common/icons/InstagramIcon';
import FacebookIcon from '../common/icons/FacebookIcon';
import TikTokIcon from '../common/icons/TikTokIcon';
import './Footer.css';

export default function Footer({ onLaunchFinder }) {
  return (
    <footer className="clinic-footer">
      <div className="container footer-main-grid">
        {/* Column 1: Brand & Manifesto */}
        <div className="footer-col brand-col">
          <Link to="/" state={{ scrollToTop: true }} className="footer-logo-link">
            <img src={logoImg} alt="MerryGold Beauty & Aesthetics Clinics" className="footer-brand-logo" />
          </Link>
          <p className="footer-tagline">{clinicData.tagline}</p>
          <p className="footer-bio-snippet">
            Treatments, skincare, and makeup from the London clinic.
          </p>
          {clinicData.social.showLinks && (
            <div className="footer-social-strip">
              <a
                href={clinicData.social.tiktok}
                target="_blank"
                rel="noopener noreferrer"
                className="footer-social-link"
                aria-label="MerryGold TikTok"
              >
                <TikTokIcon size={18} />
                <span>TikTok</span>
              </a>
              <a
                href={clinicData.social.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="footer-social-link"
                aria-label="MerryGold Instagram"
              >
                <InstagramIcon size={18} />
                <span>Instagram</span>
              </a>
              <a
                href={clinicData.social.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="footer-social-link"
                aria-label="MerryGold Facebook"
              >
                <FacebookIcon size={18} />
                <span>Facebook</span>
              </a>
            </div>
          )}
        </div>

        {/* Column 2: Treatments */}
        <div className="footer-col">
          <h4 className="footer-col-title">Treatments</h4>
          <ul className="footer-links-list">
            {treatmentCategories.map(cat => (
              <li key={cat.id}>
                <Link to={`/treatments/${cat.id}`}>{cat.name}</Link>
              </li>
            ))}
            <li><Link to="/pricing">Pricing</Link></li>
            <li><Link to="/training">Clinic Training</Link></li>
            <li>
              <button type="button" className="footer-btn-link" onClick={onLaunchFinder}>
                {FINDER_LABEL}
              </button>
            </li>
          </ul>
        </div>

        {/* Column 3: Shop */}
        <div className="footer-col">
          <h4 className="footer-col-title">Shop</h4>
          <ul className="footer-links-list">
            <li><Link to="/shop?product=flawless-glow-extra-brightening-serum">Flawless Glow Extra Brightening Serum</Link></li>
            <li><Link to="/shop?product=flawless-glow-extra-brightening-cream">Flawless Glow Extra Brightening Cream</Link></li>
            <li><Link to="/shop?product=revive-your-radiance">Revive Your Radiance</Link></li>
            <li><Link to="/shop?product=organic-golden-glow-body-oil">Organic Golden Glow Body Oil</Link></li>
            <li><Link to="/shop">All skincare</Link></li>
          </ul>
        </div>

        {/* Column 4: Clinic */}
        <div className="footer-col">
          <h4 className="footer-col-title">Clinic</h4>
          <ul className="footer-links-list">
            <li><Link to="/about">About us</Link></li>
            <li><Link to="/the-clinic">The clinic</Link></li>
            <li><Link to="/results">Results</Link></li>
            <li><Link to="/blog">Blog</Link></li>
            <li><Link to="/contact">Contact us</Link></li>
          </ul>
        </div>

        {/* Column 5: Find us */}
        <div className="footer-col">
          <h4 className="footer-col-title">Find us</h4>
          <div className="footer-contact-details">
            <div className="contact-item">
              <MapPin size={16} />
              <span>{formatClinicAddress()}</span>
            </div>
            <div className="contact-item">
              <Phone size={16} />
              <a href={clinicData.contact.phoneHref}>{clinicData.contact.phone}</a>
            </div>
            <div className="contact-item">
              <Mail size={16} />
              <a href={clinicData.contact.emailHref}>{clinicData.contact.email}</a>
            </div>
          </div>

          <a
            href={clinicData.contact.treatwellBookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-gold-outline btn-sm footer-treatwell-btn"
          >
            Book on Treatwell
          </a>

          <div className="footer-hours-card">
            <div className="hours-title">
              <span>Opening Hours</span>
            </div>
            {clinicData.contact.openingHours.map((h, i) => (
              <div key={i} className="hours-row">
                <span className="days">{h.days}</span>
                <span className="time">{h.hours}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Statutory Regulatory & Copyright Strip */}
      <div className="footer-bottom-strip">
        <div className="container bottom-inner">
          <p className="copyright-text">
            © {new Date().getFullYear()} MerryGold Beauty Clinic. All rights reserved.
          </p>
          <p className="statutory-text">
            {clinicData.legalName} (Company No. {clinicData.companyNumber}). Registered in {clinicData.jurisdiction}.
          </p>
          <div className="footer-legal-links">
            <Link to="/privacy" className="footer-legal-link">Privacy Policy</Link>
            <Link to="/cookies" className="footer-legal-link">Cookie Notice</Link>
            <Link to="/terms" className="footer-legal-link">Terms and policies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
