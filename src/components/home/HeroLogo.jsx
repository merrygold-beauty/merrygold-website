import React from 'react';
import heroLogo from '../../assets/brand/merrygold-logo-full.webp';
import './HeroLogo.css';

export default function HeroLogo() {
  return (
    <div
      className="hero-logo"
      style={{ '--hero-logo-mask': `url(${heroLogo})` }}
    >
      <img
        src={heroLogo}
        alt="MerryGold Beauty & Aesthetics Clinics"
        className="hero-brand-logo-centered"
      />
      <span className="hero-logo-sheen" aria-hidden="true" />
    </div>
  );
}
