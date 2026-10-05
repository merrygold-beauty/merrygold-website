import React, { useState, useRef, useCallback } from 'react';
import { ArrowLeftRight } from 'lucide-react';
import './BeforeAfterSlider.css';

export default function BeforeAfterSlider({
  beforeImage,
  afterImage,
  title,
  concern,
  timeframe,
  clinicalNotes,
  clientProfile,
  showMeta = true,
  // h2 where the slider sits straight under the page heading (the Results
  // page), h3 inside a section that has its own h2 (the home page).
  titleTag: TitleTag = 'h3'
}) {
  const [sliderPos, setSliderPos] = useState(50);
  const containerRef = useRef(null);
  const isDragging = useRef(false);

  const handleMove = useCallback((clientX) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const pos = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(pos);
  }, []);

  const onTouchMove = (e) => {
    if (!isDragging.current) return;
    handleMove(e.touches[0].clientX);
  };

  const onMouseMove = (e) => {
    if (!isDragging.current) return;
    handleMove(e.clientX);
  };

  const onStart = () => {
    isDragging.current = true;
  };

  const onEnd = () => {
    isDragging.current = false;
  };

  return (
    <div className="slider-card-wrapper">
      <div
        ref={containerRef}
        className="slider-viewport arch-soft-frame"
        onMouseDown={onStart}
        onMouseUp={onEnd}
        onMouseLeave={onEnd}
        onMouseMove={onMouseMove}
        onTouchStart={onStart}
        onTouchEnd={onEnd}
        onTouchMove={onTouchMove}
      >
        {/* After Image (Background) */}
        <img
          src={afterImage}
          alt={`After: ${title}`}
          className="slider-image-base"
          draggable={false}
        />

        {/* Before Image (Clipped Overlay) */}
        <div
          className="slider-image-clipped-container"
          style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
        >
          <img
            src={beforeImage}
            alt={`Before: ${title}`}
            className="slider-image-clipped"
            draggable={false}
          />
        </div>

        {/* Divider Handle */}
        <div
          className="slider-divider-line"
          style={{ left: `${sliderPos}%` }}
        >
          <div className="slider-handle-pill">
            <ArrowLeftRight size={14} />
          </div>
        </div>

        {/* Labels */}
        <span className="slider-tag-before">Before</span>
        <span className="slider-tag-after">After</span>
      </div>

      {/* Case Details Strip */}
      {showMeta && (
        <div className="slider-meta-strip">
          <div className="slider-header-info">
            <div className="slider-meta-badges">
              {concern && <span className="slider-concern-badge">{concern}</span>}
              {clientProfile && <span className="slider-profile-badge">{clientProfile}</span>}
            </div>
            <TitleTag className="slider-case-title">{title}</TitleTag>
            {clinicalNotes && <p className="slider-clinical-notes">{clinicalNotes}</p>}
          </div>
          {timeframe && (
            <div className="slider-timeframe-tag">
              <span>{timeframe}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}