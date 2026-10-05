// Facebook mark in the site's own icon style (1.5 stroke, soft corners),
// matching Instagram and TikTok beside it: a rounded square holding the
// lowercase "f", with the flag picked out in gold like their own accents.
export default function FacebookIcon({ size = 20, className = "" }) {
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
      <path
        d="M13.6 20v-6.55h2.2l.33-2.55h-2.53V9.15c0-.74.2-1.24 1.26-1.24h1.35V5.63c-.23-.03-1.03-.1-1.96-.1-1.94 0-3.27 1.18-3.27 3.36v1.87H8.77v2.55h2.21V20Z"
        fill="#C9A84C"
        stroke="none"
      />
    </svg>
  );
}
