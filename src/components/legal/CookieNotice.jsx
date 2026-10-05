import { useState } from "react";
import { Link } from "react-router-dom";
import { X } from "lucide-react";
import useHydrated from "../../hooks/useHydrated";
import "./CookieNotice.css";

const STORAGE_KEY = "merrygold_cookie_notice";

function shouldShowNotice() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) !== "dismissed";
  } catch {
    return true;
  }
}

export default function CookieNotice() {
  const isHydrated = useHydrated();
  const [isDismissed, setIsDismissed] = useState(false);

  const dismiss = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, "dismissed");
    } catch {
      // Storage may be blocked; hide for this visit anyway.
    }
    setIsDismissed(true);
  };

  if (!isHydrated || isDismissed || !shouldShowNotice()) return null;

  return (
    <div className="cookie-notice" role="region" aria-label="Cookie notice">
      <button
        type="button"
        className="cookie-notice-close"
        onClick={dismiss}
        aria-label="Close cookie notice"
      >
        <X size={18} />
      </button>
      <p className="cookie-notice-copy">
        Essential cookies only, nothing for ads or analytics.{" "}
        <Link to="/cookies">Cookie Notice</Link>
        {" · "}
        <Link to="/privacy">Privacy</Link>
      </p>
    </div>
  );
}
