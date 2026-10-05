import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

// One place for the home page's section-enter animation, so every section
// fades and lifts in by the same amount instead of six near-identical
// motion.div blocks quietly drifting apart over time.
const REVEAL_TRANSITION = { duration: 0.6, ease: [0.16, 1, 0.3, 1] };
// The trigger must not be a share of the section's own height. With
// `amount: 0.15` a section taller than about six and a half screens can never
// have 15% of itself on screen at once, so it stayed at opacity 0 for good:
// on a phone the home treatments section is over 5,000px tall and showed as
// a blank gap. "some" with a negative bottom margin fires once the first
// 80px of the section is on screen, whatever its height.
const REVEAL_VIEWPORT = { once: true, amount: 'some', margin: '0px 0px -80px 0px' };

export default function Reveal({ children, className }) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={prefersReducedMotion ? false : { opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={REVEAL_VIEWPORT}
      transition={REVEAL_TRANSITION}
    >
      {children}
    </motion.div>
  );
}
