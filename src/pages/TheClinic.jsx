import React from 'react';
import SEO from '../components/common/SEO';
import { clinicData } from '../data/clinic';
import { clinicPhotographs, workGallery } from '../data/gallery';
import './TheClinic.css';

export default function TheClinic() {
  return (
    <div className="clinic-page-shell">
      <SEO
        title="The Clinic | MerryGold Beauty Clinic"
        description="Inside MerryGold Beauty Clinic in Barking, East London: the treatment rooms, the work and the warm space where your comfort comes first."
      />
      <section className="clinic-hero-header">
        <div className="container">
          <h1 className="clinic-page-title">The Clinic</h1>
          <p className="clinic-page-subtext">
            A cosy, warm London beauty space where your comfort, satisfaction, and confidence come first.
          </p>
        </div>
      </section>

      <section className="clinic-sanctuary-body">
        <div className="container">
          <div className="sanctuary-dual-showcase">
            {clinicPhotographs.slice(0, 2).map((photo) => (
              <div key={photo.id} className="sanctuary-media-card arch-frame">
                <img src={photo.src} alt={photo.alt} />
                <div className="sanctuary-caption">
                  <h2>{photo.caption}</h2>
                  <p>Suite C, Weller House, Longbridge Road, Barking.</p>
                </div>
              </div>
            ))}
          </div>

          <div className="clinic-bed-band">
            <img
              src={clinicPhotographs[2].src}
              alt={clinicPhotographs[2].alt}
            />
            <p>{clinicPhotographs[2].caption}. {clinicData.transport}</p>
          </div>

          <div className="clinic-about-block">
            {clinicData.venueAbout.map((para) => (
              <p key={para.slice(0, 24)}>{para}</p>
            ))}
          </div>

          <div className="clinic-values-grid">
            <div className="value-card">
              <span className="value-index">01</span>
              <h3>Easy to reach</h3>
              <p>{clinicData.transport} Parking around the corner.</p>
            </div>

            <div className="value-card">
              <span className="value-index">02</span>
              <h3>Payment</h3>
              <p>{clinicData.amenities.join(", ")}.</p>
            </div>

            <div className="value-card">
              <span className="value-index">03</span>
              <h3>Every skin tone</h3>
              <p>Specialist experience across all skin tones, fair to deep, including melanin-rich skin.</p>
            </div>
          </div>

          <div className="clinic-team-block">
            <h2 className="clinic-section-heading">The team</h2>
            <div className="clinic-team-grid">
              {clinicData.team.map((member) => (
                <div key={member.id} className="clinic-team-card">
                  <h3>{member.name}</h3>
                  <p className="clinic-team-title">{member.title}</p>
                  <p className="clinic-team-services">{member.services.join(", ")}</p>
                  {member.reviewCount > 0 ? (
                    <p className="clinic-team-reviews">
                      {member.reviewAverage} from {member.reviewCount} client reviews
                    </p>
                  ) : (
                    <p className="clinic-team-reviews">Specialist in face treatments</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="clinic-work-block">
            <h2 className="clinic-section-heading">Our work</h2>
            <p className="clinic-work-lead">
              Photographs of treatments delivered at MerryGold Beauty Clinic.
            </p>
            <div className="clinic-work-grid">
              {workGallery.map((item) => (
                <figure key={item.id} className="clinic-work-item">
                  <img src={item.src} alt={item.alt} loading="lazy" />
                  <figcaption>{item.caption}</figcaption>
                </figure>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
