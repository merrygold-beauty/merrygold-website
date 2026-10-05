import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, RotateCcw, Clock, MessageCircle } from 'lucide-react';
import { treatments } from '../../data/treatments';
import { clinicData } from '../../data/clinic';
import { TREATMENT_INFO_LABEL } from '../../data/labels';
import { useShop } from '../../context/ShopContext';
import { Link } from 'react-router-dom';
import { QUESTIONS, rankTreatments, buildRationale } from './finderMatching';
import useSheetOpen from '../../hooks/useSheetOpen';
import useEscapeKey from '../../hooks/useEscapeKey';
import TreatmentBookButton from '../treatments/TreatmentBookButton';
import './TreatmentFinder.css';

export default function TreatmentFinder({ isOpen, onClose }) {
  const { openCheckout } = useShop();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [matchedTreatments, setMatchedTreatments] = useState([]);
  const [rationale, setRationale] = useState('');

  useSheetOpen(isOpen);
  useEscapeKey(isOpen, onClose);

  if (!isOpen) return null;

  const handleSelectOption = (questionId, option) => {
    const updatedAnswers = { ...answers, [questionId]: option };
    setAnswers(updatedAnswers);

    if (currentStep < QUESTIONS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Calculate clinical match
      calculateResults(updatedAnswers);
    }
  };

  const calculateResults = (finalAnswers) => {
    const matches = rankTreatments(treatments, finalAnswers);
    setMatchedTreatments(matches);
    setRationale(buildRationale(finalAnswers, matches));
    setCurrentStep(QUESTIONS.length);
  };

  const handleReset = () => {
    setAnswers({});
    setMatchedTreatments([]);
    setRationale('');
    setCurrentStep(0);
  };

  const handleAskGoldie = (treatmentName) => {
    onClose();
    const event = new CustomEvent('open-goldie-chat', {
      detail: {
        prompt: `I just completed the treatment finder and was recommended ${treatmentName}. Can you tell me more about what to expect during this treatment, how to prepare, and what the recovery is like?`
      }
    });
    window.dispatchEvent(event);
  };

  const isCompleted = currentStep >= QUESTIONS.length;

  return (
    <div className="finder-backdrop sheet-backdrop" onClick={onClose}>
      <motion.div
        className="finder-card sheet overlay-shell"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, y: 35, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      >
        <span className="sheet-handle" aria-hidden="true" />
        <div className="overlay-shell-scroll">
        <div className="finder-header">
          <button
            type="button"
            className="finder-close-btn"
            onClick={onClose}
            aria-label="Close Treatment Finder"
          >
            <X size={20} />
          </button>
        </div>

        {/* Progress track */}
        {!isCompleted && (
          <div className="finder-progress-bar">
            <div
              className="finder-progress-fill"
              style={{ width: `${((currentStep + 1) / QUESTIONS.length) * 100}%` }}
            />
          </div>
        )}

        {!isCompleted ? (
          <div className="finder-question-body">
            <div className="question-meta-strip">
              <span className="question-step-number">Step {QUESTIONS[currentStep].step} of 03</span>
              <span className="question-step-label">{QUESTIONS[currentStep].label}</span>
            </div>

            <h2 className="question-title">{QUESTIONS[currentStep].subtext}</h2>

            <div className="finder-options-stack">
              {QUESTIONS[currentStep].options.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  className="finder-option-btn"
                  onClick={() => handleSelectOption(QUESTIONS[currentStep].id, opt)}
                >
                  <span className="option-text">{opt.label}</span>
                </button>
              ))}
            </div>

            {currentStep > 0 && (
              <button
                type="button"
                className="finder-back-btn"
                onClick={() => setCurrentStep(currentStep - 1)}
              >
                Back
              </button>
            )}
          </div>
        ) : (
          <div className="finder-results-view">
            <div className="results-header-block">
              <span className="results-badge">Done</span>
              <h2 className="results-title">Your matches</h2>
              <p className="results-rationale">{rationale}</p>
            </div>

            <div className="results-cards-list">
              {matchedTreatments.map((t) => (
                <div key={t.id} className="matched-treatment-card">
                  {t.image && (
                    <div className="matched-thumb arch-soft-frame">
                      <img src={t.image} alt={t.name} />
                    </div>
                  )}
                  <div className="matched-details">
                    <span className="matched-category">{t.categoryName}</span>
                    <h3 className="matched-name">{t.name}</h3>
                    <p className="matched-tagline">{t.tagline}</p>
                    <div className="matched-specs">
                      <span><Clock size={12} /> {t.duration}</span>
                      <strong className="matched-price">{t.priceDisplay}</strong>
                    </div>

                    <div className="matched-actions">
                      <TreatmentBookButton
                        treatment={t}
                        className="btn btn-primary btn-sm"
                        onBook={(treatment) => {
                          onClose();
                          openCheckout('treatment', treatment, 1);
                        }}
                      />
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleAskGoldie(t.name)}
                      >
                        Ask Olu
                      </button>
                      <Link
                        to={`/treatments/${t.slug}`}
                        className="btn btn-secondary btn-sm"
                        onClick={onClose}
                      >
                        {TREATMENT_INFO_LABEL}
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="results-footer-bar">
              <button
                type="button"
                className="btn-restart"
                onClick={handleReset}
              >
                <RotateCcw size={14} />
                <span>Restart</span>
              </button>
              <a
                href={clinicData.contact.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary btn-sm btn-whatsapp"
                aria-label="Chat on WhatsApp"
              >
                <MessageCircle size={16} color="#25D366" />
                <span>WhatsApp</span>
              </a>
              <div className="results-guarantee">
                <span>All treatments include a clinical diagnostic skin assessment.</span>
              </div>
            </div>
          </div>
        )}
        </div>
      </motion.div>
    </div>
  );
}