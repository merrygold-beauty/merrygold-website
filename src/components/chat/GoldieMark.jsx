// Goldie's mark: a single gold filigree butterfly, echoing the ones flanking
// the clinic's wall sign. Used on the launcher, the chat header and beside
// every reply so Goldie reads as one character everywhere.
//
// Solid fills only, no <defs>/gradient: the launcher instance is display:
// none on phones, and a hidden element still holds its <defs>, so every
// other instance referencing that gradient by id painted nothing.
export default function GoldieMark({ size = 24, className = "" }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      {/* Upper wings */}
      <path
        d="M31 33C26 24 16 14 9 15c-6 1-6 10-2 16 3 5 12 8 24 4Z"
        fill="#D4AC54"
      />
      <path
        d="M31 33C26 24 16 14 9 15c-6 1-6 10-2 16 3 5 12 8 24 4Z"
        fill="#F3E1B2"
        opacity="0.35"
        transform="scale(0.82)"
        style={{ transformOrigin: "31px 33px" }}
      />
      <path
        d="M33 33c5-9 15-19 22-18 6 1 6 10 2 16-3 5-12 8-24 4Z"
        fill="#D4AC54"
      />
      <path
        d="M33 33c5-9 15-19 22-18 6 1 6 10 2 16-3 5-12 8-24 4Z"
        fill="#F3E1B2"
        opacity="0.35"
        transform="scale(0.82)"
        style={{ transformOrigin: "33px 33px" }}
      />
      {/* Lower wings */}
      <path
        d="M31 35c-6 2-14 7-15 14-1 6 6 8 11 4 4-3 5-11 4-18Z"
        fill="#D4AC54"
        opacity="0.92"
      />
      <path
        d="M33 35c6 2 14 7 15 14 1 6-6 8-11 4-4-3-5-11-4-18Z"
        fill="#D4AC54"
        opacity="0.92"
      />
      {/* Filigree cut-outs */}
      <g fill="#140C07" opacity="0.28">
        <ellipse cx="18" cy="24" rx="3.2" ry="2" transform="rotate(-25 18 24)" />
        <ellipse cx="46" cy="24" rx="3.2" ry="2" transform="rotate(25 46 24)" />
        <ellipse cx="23" cy="44" rx="2.2" ry="1.4" transform="rotate(35 23 44)" />
        <ellipse cx="41" cy="44" rx="2.2" ry="1.4" transform="rotate(-35 41 44)" />
      </g>
      {/* Body and antennae */}
      <rect x="30.4" y="22" width="3.2" height="24" rx="1.6" fill="#F3E1B2" />
      <path d="M31 22c-2-4-5-6-8-7M33 22c2-4 5-6 8-7" stroke="#DFCA8C" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}
