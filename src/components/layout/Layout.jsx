import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import CartDrawer from '../shop/CartDrawer';
import CheckoutModal from '../checkout/CheckoutModal';
import TreatmentFinder from '../finder/TreatmentFinder';
import GoldieChat from '../chat/GoldieChat';
import GoldieMark from '../chat/GoldieMark';
import ConsultationSheet from '../consultation/ConsultationSheet';
import BookIcon from '../common/icons/BookIcon';
import CookieNotice from '../legal/CookieNotice';
import { clinicData } from '../../data/clinic';
import { ASSISTANT_NAME } from '../../data/labels';
import { Phone, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Layout({ children }) {
  const [isFinderOpen, setIsFinderOpen] = useState(false);

  useEffect(() => {
    const handleFinderEvent = () => setIsFinderOpen(true);
    const handleHashChange = () => {
      if (window.location.hash === '#finder') {
        setIsFinderOpen(true);
      }
    };

    // A /#finder link opens the finder. Read here, after hydration, so the first
    // render matches the pre-rendered page, which has the finder closed.
    handleHashChange();

    window.addEventListener('open-treatment-finder', handleFinderEvent);
    window.addEventListener('hashchange', handleHashChange);

    return () => {
      window.removeEventListener('open-treatment-finder', handleFinderEvent);
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  return (
    <div className="site-wrapper">
      <Navbar onLaunchFinder={() => setIsFinderOpen(true)} />
      
      <main id="main-content">
        {children}
      </main>

      <Footer onLaunchFinder={() => setIsFinderOpen(true)} />

      {/* Global Modals & Drawers */}
      <CartDrawer />
      <CheckoutModal />
      <TreatmentFinder
        isOpen={isFinderOpen}
        onClose={() => setIsFinderOpen(false)}
      />

      {/* Goldie AI Concierge, visitor-facing as Ask Olu */}
      <GoldieChat />
      <ConsultationSheet />

      {/* Phone Floating Dock */}
      <div className="mobile-sticky-bar">
        <a
          href={clinicData.contact.phoneHref}
          className="dock-item"
          aria-label="Call MerryGold Clinic"
        >
          <Phone size={22} />
          <span>Call</span>
        </a>
        <a
          href={clinicData.contact.whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="dock-item btn-whatsapp"
          aria-label="Chat on WhatsApp"
        >
          <MessageCircle size={22} color="#25D366" />
          <span>WhatsApp</span>
        </a>
        <button
          type="button"
          className="dock-item"
          aria-label={`Open ${ASSISTANT_NAME} chat`}
          onClick={() => window.dispatchEvent(new CustomEvent('open-goldie-chat'))}
        >
          <GoldieMark size={24} />
          <span>{ASSISTANT_NAME}</span>
        </button>
        <Link
          to="/treatments"
          className="btn btn-primary dock-book"
        >
          <BookIcon size={16} />
          <span>Book</span>
        </Link>
      </div>

      <CookieNotice />
    </div>
  );
}