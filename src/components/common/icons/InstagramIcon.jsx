// Instagram mark drawn in the site's own icon style (1.5 stroke, soft
// corners), with the flash dot picked out in gold like the bag rim and the
// book tick. Strokes take currentColor so it recolours with its surface.
export default function InstagramIcon({ size = 20, className = "" }) {
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
      <rect x="3.25" y="3.25" width="17.5" height="17.5" rx="5.25" />
      <circle cx="12" cy="12" r="3.9" />
      <circle cx="17.1" cy="6.9" r="1.15" fill="#C9A84C" stroke="none" />
    </svg>
  );
}
