import React from 'react';
import SEO from '../components/common/SEO';
import { results } from '../data/results';
import BeforeAfterSlider from '../components/gallery/BeforeAfterSlider';
import './Results.css';

export default function Results() {
  return (
    <div className="results-page-shell">
      <SEO
        title="Results | MerryGold Beauty Clinic"
        description="Before and after photographs of facial, skin, brow and body treatments at MerryGold Beauty Clinic in Barking, East London."
      />
      <section className="results-page-header">
        <div className="container">
          <h1 className="results-page-title">Results</h1>
          <p className="results-page-subtext">
            Clinical photography showing treatment progression. All cases photographed in clinic lighting with client consent. No filters or digital retouching.
          </p>
        </div>
      </section>

      <section className="results-gallery-section">
        <div className="container">
          <div className="results-gallery-grid">
            {results.map((c) => (
              <BeforeAfterSlider
                key={c.id}
                beforeImage={c.beforeImage}
                afterImage={c.afterImage}
                title={c.treatmentName}
                concern={c.concern}
                timeframe={c.timeline}
                clinicalNotes={c.clinicalNotes}
                clientProfile={c.clientProfile}
                titleTag="h2"
              />
            ))}
          </div>

          <div className="results-ethics-notice">
            <div className="ethics-card arch-soft-frame">
              <h2>Standardized Clinical Protocol</h2>
              <p>
                Individual biological outcomes vary depending on tissue density, hormonal health, and homecare compliance. A thorough diagnostic assessment is conducted prior to every treatment to set honest clinical benchmarks.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}