import React from 'react';
import SEO from '../components/common/SEO';
import HeroVideo from '../components/home/HeroVideo';
import Manifesto from '../components/home/Manifesto';
import TreatmentDiscovery from '../components/home/TreatmentDiscovery';
import ShopPreview from '../components/home/ShopPreview';
import ResultsSection from '../components/home/ResultsSection';
import ReviewsSection from '../components/home/ReviewsSection';
import GoogleReviewsStream from '../components/home/GoogleReviewsStream';
import BookingInvitation from '../components/home/BookingInvitation';

export default function Home() {
  const triggerFinder = () => {
    window.dispatchEvent(new CustomEvent('open-treatment-finder'));
  };

  return (
    <div className="page-home">
      <SEO
        title="MerryGold Beauty Clinic | Aesthetics in Barking, East London"
        description="MerryGold Beauty Clinic in Barking, East London. Facials, medical laser hair removal, microblading, lashes, and makeup. Two minutes from Barking station."
      />
      <HeroVideo onLaunchFinder={triggerFinder} />
      <Manifesto />
      <TreatmentDiscovery onLaunchFinder={triggerFinder} />
      <ShopPreview />
      <ResultsSection />
      <ReviewsSection />
      <GoogleReviewsStream />
      <BookingInvitation onLaunchFinder={triggerFinder} />
    </div>
  );
}