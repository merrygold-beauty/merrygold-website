import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Phone, MessageCircle } from 'lucide-react';
import BagIcon from '../common/icons/BagIcon';
import InstagramIcon from '../common/icons/InstagramIcon';
import FacebookIcon from '../common/icons/FacebookIcon';
import TikTokIcon from '../common/icons/TikTokIcon';
import logoImg from '../../assets/brand/merrygold-monogram.webp';
import { useShop } from '../../context/ShopContext';
import { treatmentCategories } from '../../data/treatments';
import { clinicData } from '../../data/clinic';
import { FINDER_LABEL, BOOK_LABEL } from '../../data/labels';
import useSheetOpen from '../../hooks/useSheetOpen';
import './Navbar.css';

// TikTok + Instagram + Facebook (the owner's order) render in two places
// (pinned over the hero video before the header reveals, then inside the
// header beside the logo), so the markup lives once here. `hidden` marks
// whichever copy is not the visible one: aria-hidden plus tabIndex -1 so a
// keyboard user or the accessibility crawl never lands on two identical
// "MerryGold Instagram" links at once.
function SocialLinks({ className, hidden }) {
  // While the links are down (social.showLinks in clinic.js) the empty
  // wrapper still renders: it carries the logo-to-nav spacing in the header
  // and fills the first grid column of the hero bar.
  if (!clinicData.social.showLinks) return <div className={className} />;
  return (
    <div className={className} aria-hidden={hidden || undefined}>
      <a
        href={clinicData.social.tiktok}
        target="_blank"
        rel="noopener noreferrer"
        className="social-icon-link"
        aria-label="MerryGold TikTok"
        tabIndex={hidden ? -1 : undefined}
      >
        <TikTokIcon size={20} />
      </a>
      <a
        href={clinicData.social.instagram}
        target="_blank"
        rel="noopener noreferrer"
        className="social-icon-link"
        aria-label="MerryGold Instagram"
        tabIndex={hidden ? -1 : undefined}
      >
        <InstagramIcon size={20} />
      </a>
      <a
        href={clinicData.social.facebook}
        target="_blank"
        rel="noopener noreferrer"
        className="social-icon-link"
        aria-label="MerryGold Facebook"
        tabIndex={hidden ? -1 : undefined}
      >
        <FacebookIcon size={20} />
      </a>
    </div>
  );
}

// The single source for the desktop nav, the hero bar pinned over the video,
// and the phone drawer, so the three lists cannot drift apart. Treatments
// keeps its mega menu in the header only; every other renderer shows it as a
// plain link. `kind: 'book'` marks the one entry every renderer styles as a
// button instead of a text link, while the order still lives in one array.
const NAV_ITEMS = [
  { label: 'Home', to: '/' },
  { label: 'Treatments', to: '/treatments' },
  { label: FINDER_LABEL, action: 'launchFinder' },
  { label: 'Results', to: '/results' },
  { label: BOOK_LABEL, to: '/treatments', kind: 'book' },
  { label: 'Shop', to: '/shop' },
  { label: 'About us', to: '/about' },
  { label: 'Contact us', to: '/contact' },
];

// The header and hero bar both render Book as a standalone control at the
// right of their bar, not inside the link list (the drawer is the exception:
// it keeps Book inside the list), so both look this up once instead of
// filtering NAV_ITEMS twice.
const BOOK_ITEM = NAV_ITEMS.find((item) => item.kind === 'book');

export default function Navbar({ onLaunchFinder }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isTreatmentsHovered, setIsTreatmentsHovered] = useState(false);
  const { cartCount, openCart } = useShop();
  const location = useLocation();

  // The mobile drawer is an overlay like the cart or finder, so it hides the
  // floating dock and cookie strip the same way (body[data-sheets-open]).
  useSheetOpen(isMobileOpen);

  const isHome = location.pathname === '/';
  const isRevealed = !isHome || isScrolled;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 80);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileOpen(false);
    setIsTreatmentsHovered(false);
  }, [location.pathname]);

  return (
    <>
      <header className={`navbar-header ${isRevealed ? 'is-revealed' : 'is-hidden'} ${isScrolled ? 'is-scrolled' : ''}`}>
        <div className="container navbar-inner">
          <Link
            to="/"
            className="navbar-brand-left"
            aria-label="MerryGold Home"
            onClick={() => { if (location.pathname === '/') window.scrollTo(0, 0); }}
          >
            <img
              src={logoImg}
              alt="MerryGold"
              className="navbar-brand-logo"
            />
          </Link>

          {/* Visible once the header itself is revealed; the pinned copy
              over the hero video carries the link while the header is
              hidden. See the hero-bar wrapper below the header. */}
          <SocialLinks className="navbar-social" hidden={!isRevealed} />

          {/* Desktop Navigation Links, from NAV_ITEMS. While the header is
              hidden (pre-scroll home), the hero bar below carries the same
              links, so this copy drops out of the tab order rather than
              only fading visually. */}
          <nav className="nav-main-group" aria-label="Main Navigation" aria-hidden={!isRevealed || undefined}>
            {NAV_ITEMS.filter((item) => item.kind !== 'book').map((item) => {
              const tabIndex = isRevealed ? undefined : -1;

              if (item.to === '/treatments') {
                return (
                  <div
                    key={item.label}
                    className="nav-item-dropdown"
                    onMouseEnter={() => setIsTreatmentsHovered(true)}
                    onMouseLeave={() => setIsTreatmentsHovered(false)}
                  >
                    <Link
                      to={item.to}
                      className="nav-link dropdown-toggle"
                      tabIndex={tabIndex}
                      onClick={() => { if (location.pathname === item.to) window.scrollTo(0, 0); }}
                    >
                      <span>{item.label}</span>
                    </Link>

                    {/* Treatments Mega Menu */}
                    <AnimatePresence>
                      {isTreatmentsHovered && (
                        <motion.div
                          className="treatments-mega-menu"
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 8 }}
                          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                        >
                          <div className="mega-menu-grid">
                            <div className="mega-menu-categories">
                              <span className="mega-menu-label">Categories</span>
                              <div className="mega-links-list">
                                {treatmentCategories.map((cat) => (
                                  <Link
                                    key={cat.id}
                                    to={`/treatments/${cat.id}`}
                                    className="mega-category-item"
                                  >
                                    <span className="mega-cat-name">{cat.name}</span>
                                    <span className="mega-cat-desc">{cat.shortDescription}</span>
                                  </Link>
                                ))}
                              </div>
                            </div>

                            <div className="mega-menu-feature arch-soft-frame">
                              <h4>Not sure where to start?</h4>
                              <p>Answer three quick questions and we'll suggest the treatments that suit you.</p>
                              <button
                                type="button"
                                className="btn btn-primary btn-sm w-full"
                                onClick={() => {
                                  setIsTreatmentsHovered(false);
                                  if (onLaunchFinder) onLaunchFinder();
                                }}
                              >
                                <span>{FINDER_LABEL}</span>
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              }

              if (item.action === 'launchFinder') {
                return (
                  <button
                    key={item.label}
                    type="button"
                    className="nav-link nav-btn-inline"
                    tabIndex={tabIndex}
                    onClick={onLaunchFinder}
                  >
                    <span>{item.label}</span>
                  </button>
                );
              }

              // Shop keeps its extra hook class; the rest are plain nav links.
              const className = item.to === '/shop' ? 'nav-link nav-link-shop' : 'nav-link';
              return (
                <Link
                  key={item.label}
                  to={item.to}
                  className={className}
                  tabIndex={tabIndex}
                  onClick={() => { if (location.pathname === item.to) window.scrollTo(0, 0); }}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Action Group: Book + Bag + Mobile Toggle, in that order, Bag
              always last. WhatsApp lives in the dock, drawer footer and
              contact page instead of here; hidden below the collapse
              breakpoint, where the drawer carries Book inside its list. */}
          <div className="nav-actions-group">
            <Link
              to={BOOK_ITEM.to}
              className="btn btn-primary btn-sm nav-link-book"
              aria-hidden={!isRevealed || undefined}
              tabIndex={isRevealed ? undefined : -1}
              onClick={() => { if (location.pathname === BOOK_ITEM.to) window.scrollTo(0, 0); }}
            >
              <span>{BOOK_ITEM.label}</span>
            </Link>

            {/* Cart Drawer Trigger */}
            <button
              type="button"
              className="nav-cart-btn"
              onClick={openCart}
              aria-label={`Open bag with ${cartCount} items`}
            >
              <BagIcon size={22} className="nav-cart-icon" />
              {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
            </button>

            {/* Mobile Menu Button */}
            <button
              type="button"
              className="nav-mobile-toggle"
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              aria-label="Toggle navigation menu"
            >
              {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>

      {/* Pinned over the hero video while the header is hidden (home page,
          not yet scrolled): social icons, the same NAV_ITEMS links, and
          Book, so a desktop visitor is never looking at a hero with no
          menu. Fades out as the header takes over. Renders on every page,
          not just home, so it stays a single always-mounted block; is-hidden
          keeps it out of view and out of the tab order everywhere else. */}
      <div className={`hero-bar${isRevealed ? ' is-hidden' : ''}`} aria-hidden={isRevealed || undefined}>
        <div className="container hero-bar-inner">
          <SocialLinks className="hero-bar-social" hidden={isRevealed} />

          <nav className="hero-bar-links" aria-label="Main Navigation">
            {NAV_ITEMS.filter((item) => item.kind !== 'book').map((item) => {
              const tabIndex = isRevealed ? -1 : undefined;
              if (item.action === 'launchFinder') {
                return (
                  <button
                    key={item.label}
                    type="button"
                    className="hero-bar-link"
                    tabIndex={tabIndex}
                    onClick={onLaunchFinder}
                  >
                    {item.label}
                  </button>
                );
              }
              return (
                <Link key={item.label} to={item.to} className="hero-bar-link" tabIndex={tabIndex}>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* The right-most control, same as the revealed header's Book. */}
          <Link
            to={BOOK_ITEM.to}
            className="btn btn-primary btn-sm nav-link-book hero-bar-book"
            tabIndex={isRevealed ? -1 : undefined}
          >
            <span>{BOOK_ITEM.label}</span>
          </Link>

          {/* Phones get the hamburger instead of the link row: the drawer it opens
              carries every link plus Book, and the dock lower down has Book
              too. CSS swaps the two by breakpoint. */}
          <button
            type="button"
            className="hero-bar-menu"
            tabIndex={isRevealed ? -1 : undefined}
            onClick={() => setIsMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={24} />
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            className="mobile-nav-backdrop"
            onClick={() => setIsMobileOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="mobile-nav-panel"
              onClick={(e) => e.stopPropagation()}
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="mobile-nav-header">
                <img src={logoImg} alt="MerryGold" className="mobile-nav-logo" />
                <button
                  type="button"
                  className="mobile-nav-close"
                  onClick={() => setIsMobileOpen(false)}
                  aria-label="Close menu"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Same NAV_ITEMS as the header and hero bar, so the drawer can
                  never list a different set of pages or a different order. */}
              <div className="mobile-nav-links">
                {NAV_ITEMS.map((item) => {
                  if (item.action === 'launchFinder') {
                    return (
                      <button
                        key={item.label}
                        type="button"
                        className="mobile-nav-link"
                        onClick={() => {
                          setIsMobileOpen(false);
                          if (onLaunchFinder) onLaunchFinder();
                        }}
                      >
                        {item.label}
                      </button>
                    );
                  }
                  if (item.kind === 'book') {
                    return (
                      <Link
                        key={item.label}
                        to={item.to}
                        className="btn btn-primary w-full mobile-nav-book"
                        onClick={() => setIsMobileOpen(false)}
                      >
                        <span>{item.label}</span>
                      </Link>
                    );
                  }
                  return (
                    <Link
                      key={item.label}
                      to={item.to}
                      className="mobile-nav-link"
                      onClick={() => setIsMobileOpen(false)}
                    >
                      {item.label}
                    </Link>
                  );
                })}
                <button
                  type="button"
                  className="mobile-nav-link"
                  onClick={() => {
                    setIsMobileOpen(false);
                    openCart();
                  }}
                >
                  {`Bag${cartCount > 0 ? ` (${cartCount})` : ''}`}
                </button>
              </div>

              <div className="mobile-nav-footer">
                <a
                  href={clinicData.contact.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary btn-whatsapp w-full mb-3"
                  aria-label="Chat on WhatsApp"
                >
                  <MessageCircle size={16} color="#25D366" />
                  <span>WhatsApp</span>
                </a>

                <a
                  href={clinicData.contact.phoneHref}
                  className="mobile-call-link"
                >
                  <Phone size={14} />
                  <span>Direct Line: {clinicData.contact.phone}</span>
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
