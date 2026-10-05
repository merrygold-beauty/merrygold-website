// An upright boutique carrier bag: a clean rectangle with softly rounded
// bottom corners, one ribbon-arc handle, and a soft gold body fill so it
// reads as filled at 20px beside the champagne primary button. Strokes
// take currentColor; only the body fill and the fold line carry gold.
export default function BagIcon({ size = 20, className = "" }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M5 8H19V19.5A1.5 1.5 0 0 1 17.5 21H6.5A1.5 1.5 0 0 1 5 19.5Z"
        fill="#C9A84C"
        fillOpacity="0.18"
      />
      <path d="M9 8C9 4.5 10.5 3.5 12 3.5C13.5 3.5 15 4.5 15 8" />
      <path d="M6.5 9.6h11" stroke="#C9A84C" strokeWidth="1" />
    </svg>
  );
}
