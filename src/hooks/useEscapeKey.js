import { useEffect } from "react";

// Shared by every overlay (cart, checkout, finder, product view) so Escape
// closes whichever one is open, without each component wiring its own
// window listener.
export default function useEscapeKey(isActive, onEscape) {
  useEffect(() => {
    if (!isActive) return undefined;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") onEscape();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isActive, onEscape]);
}
