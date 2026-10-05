import React, { useState } from 'react';
import { results } from '../../data/results';
import BeforeAfterSlider from '../gallery/BeforeAfterSlider';
import { Link } from 'react-router-dom';
import Reveal from '../common/Reveal';
import './ResultsSection.css';

export default function ResultsSection() {
  const [selectedCaseIndex, setSelectedCaseIndex] = useState(0);
  const currentCase = results[selectedCaseIndex] || results[0];

  return (
    <section className="results-section">
      <Reveal className="container">
        <div className="results-header-block">
          <h2 className="results-main-title">Real results</h2>
          <p className="results-intro">
            Authentic clinical outcomes photographed in clinic lighting without filter alteration.
          </p>
        </div>

        {/* Interactive Case Selector */}
        <div className="case-study-nav-strip">
          {results.map((c, i) => (
            <button
              key={c.id}
              type="button"
              className={`case-study-tab ${selectedCaseIndex === i ? 'active' : ''}`}
              onClick={() => setSelectedCaseIndex(i)}
            >
              <span className="case-tab-treatment">{c.treatmentName}</span>
              <span className="case-tab-client">{c.clientProfile}</span>
            </button>
          ))}
        </div>

        {/* Active Before / After Slider */}
        <div className="active-slider-shell">
          <BeforeAfterSlider
            beforeImage={currentCase.beforeImage}
            afterImage={currentCase.afterImage}
            title={currentCase.treatmentName}
            concern={currentCase.concern}
            timeframe={currentCase.timeline}
            clinicalNotes={currentCase.clinicalNotes}
            clientProfile={currentCase.clientProfile}
          />
        </div>

        <div className="results-bottom-actions">
          <Link to="/results" className="btn btn-secondary">
            <span>View Results</span>
          </Link>
        </div>
      </Reveal>
    </section>
  );
}