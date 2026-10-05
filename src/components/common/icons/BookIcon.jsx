// The booking mark: a calendar leaf with an arched top edge and two binding
// pegs, and a gold tick for the confirmed appointment. Strokes take
// currentColor; the tick stays gold so it reads on the dark dock and the
// gold button alike.
export default function BookIcon({ size = 20, className = "" }) {
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
      <path d="M4.75 9.75A5.25 5.25 0 0 1 10 4.5h4a5.25 5.25 0 0 1 5.25 5.25v8.5a1.75 1.75 0 0 1-1.75 1.75h-11a1.75 1.75 0 0 1-1.75-1.75v-8.5Z" />
      <path d="M8.5 3.25v3M15.5 3.25v3M4.75 10.25h14.5" />
      <path d="M9.25 15.1l1.9 1.9 3.6-3.8" stroke="#C9A84C" strokeWidth="1.7" />
    </svg>
  );
}
