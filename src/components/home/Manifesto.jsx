import React from 'react';
import { Link } from 'react-router-dom';
import directorCircleImg from '../../assets/images/director_manifesto_circle.jpg';
import Reveal from '../common/Reveal';
import './Manifesto.css';

export default function Manifesto() {
  return (
    <section className="manifesto-section">
      <Reveal className="container">
        <div className="manifesto-inner">
          <blockquote className="manifesto-quote">
            "Beauty isn't one-size-fits-all. It is about understanding individual anatomy, keeping up with skin science, and most importantly, listening to what each client truly needs. We design every treatment to enhance your natural features, never to distort them, and to leave you with a real sense of wellbeing."
          </blockquote>

          <div className="manifesto-author-strip">
            <Link to="/about" className="manifesto-avatar-frame" aria-label="About Oluwakemi Okunniyi">
              <img
                src={directorCircleImg}
                alt="Oluwakemi Okunniyi"
                className="manifesto-avatar-img"
              />
            </Link>
            <span className="author-name">Oluwakemi Okunniyi</span>
            <span className="author-creds">Founder, Senior Aesthetic Practitioner &amp; Beauty Artist</span>
            <Link to="/about" className="manifesto-about-link link-editorial">About us</Link>
          </div>

          <h2 className="manifesto-pillars-heading">Why clients choose us</h2>

          <div className="manifesto-pillars-row">
            <div className="manifesto-pillar">
              <div className="pillar-index-box">
                <span>01</span>
              </div>
              <h3>Clinical Integrity</h3>
              <p>Every protocol adheres to rigorous clinical safety standards, sterile single-use tooling, and exhaustive pre-treatment patch testing.</p>
            </div>

            <div className="manifesto-pillar">
              <div className="pillar-index-box">
                <span>02</span>
              </div>
              <h3>All-Tone Calibration</h3>
              <p>Specialist calibration for all skin phototypes (Fitzpatrick I to VI), so treatment is calibrated safely for rich melanin and sensitive complexions.</p>
            </div>

            <div className="manifesto-pillar">
              <div className="pillar-index-box">
                <span>03</span>
              </div>
              <h3>Restrained Luxury</h3>
              <p>Natural, undetectable results that refresh your features without altering or distorting them.</p>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
