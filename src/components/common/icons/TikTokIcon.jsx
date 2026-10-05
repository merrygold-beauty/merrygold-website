// TikTok note glyph as a single filled silhouette so it sits at the same
// visual weight as the stroked Instagram mark beside it. A small gold
// highlight on the note head ties it to the other icons' gold detail.
export default function TikTokIcon({ size = 20, className = "" }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M13.9 2.5h3.05c.2 1.55.9 2.7 2.05 3.55.9.65 1.9.98 3 1.02v3.1a8.2 8.2 0 0 1-4.85-1.6v6.83c0 3.5-2.75 6.1-6.2 6.1-3.4 0-6.2-2.6-6.2-6.05 0-3.55 2.95-6.3 6.6-6.05v3.15a2.9 2.9 0 0 0-.6-.05c-1.6 0-2.9 1.3-2.9 2.95 0 1.6 1.3 2.9 2.9 2.9 1.65 0 3.15-1.2 3.15-3.05V2.5Z" />
      <circle cx="9.05" cy="15.4" r="1.05" fill="#C9A84C" />
    </svg>
  );
}
