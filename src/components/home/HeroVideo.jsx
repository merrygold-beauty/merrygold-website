import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import HeroLogo from './HeroLogo';
import useMediaQuery, { PHONE_QUERY } from '../../hooks/useMediaQuery';
import { clinicData } from '../../data/clinic';
import { FINDER_LABEL, BOOK_LABEL } from '../../data/labels';
import './HeroVideo.css';

const DESKTOP_VIDEO_SRC = '/assets/hero-facial.mp4';
const PHONE_VIDEO_SRC = '/assets/hero-facial-portrait.mp4';
const DESKTOP_POSTER = '/assets/hero-poster.jpg';
const PHONE_POSTER = '/assets/hero-poster-portrait.jpg';

export default function HeroVideo({ onLaunchFinder }) {
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef(null);
  const sectionRef = useRef(null);
  const isPhone = useMediaQuery(PHONE_QUERY);
  const posterSrc = isPhone ? PHONE_POSTER : DESKTOP_POSTER;

  // The video has no src until the page has finished loading, and never gets
  // one at all on a reduced-motion or data-saver connection, so the poster
  // alone covers those visitors instead of a 4MB download nobody asked for.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isDataSaver = navigator.connection?.saveData === true;
    if (prefersReducedMotion || isDataSaver) return undefined;

    const loadVideo = () => {
      video.src = isPhone ? PHONE_VIDEO_SRC : DESKTOP_VIDEO_SRC;
      video.load();
      video.play().catch(() => {});
    };

    if (document.readyState === 'complete') {
      loadVideo();
      return undefined;
    }

    window.addEventListener('load', loadVideo, { once: true });
    return () => window.removeEventListener('load', loadVideo);
  }, [isPhone]);

  // Stop spending decode time on a video nobody is looking at.
  useEffect(() => {
    const video = videoRef.current;
    const section = sectionRef.current;
    if (!video || !section) return undefined;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    });
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="hero-video-section" ref={sectionRef}>
      {/* Background Media Container */}
      <div className="hero-media-wrapper">
        {!videoError ? (
          <video
            ref={videoRef}
            className="hero-video-element"
            muted
            loop
            playsInline
            preload="none"
            poster={posterSrc}
            onError={() => setVideoError(true)}
          />
        ) : null}
        <div
          className="hero-poster-fallback"
          style={{ backgroundImage: `url('${posterSrc}')` }}
        />
        <div className="hero-media-overlay" />
        <div className="hero-light" aria-hidden="true">
          <span className="hero-light-pool hero-light-pool--a" />
          <span className="hero-light-pool hero-light-pool--b" />
        </div>
      </div>

      {/* Hero Content */}
      <div className="container hero-content-container">
        <div className="hero-brand-masthead">
          <HeroLogo />
        </div>

        <motion.div
          className="hero-text-block"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        >
          <h1 className="hero-main-title">
            Your confidant for your best skin
          </h1>

          <p className="hero-narrative">
            Warm hospitality combined with personalised care to give premium, visible results.
          </p>

          <div className="hero-book-row">
            <Link to="/treatments" className="btn btn-primary hero-btn-book">
              <span>{BOOK_LABEL}</span>
            </Link>
            <a href={clinicData.contact.phoneHref} className="hero-phone">
              Call {clinicData.contact.phone}
            </a>
          </div>

          <div className="hero-actions-cluster">
            <Link to="/treatments" className="btn btn-primary hero-btn-action">
              <span>Treatments</span>
            </Link>

            <button
              type="button"
              className="btn btn-secondary hero-btn-action"
              onClick={onLaunchFinder}
            >
              <span>{FINDER_LABEL}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
