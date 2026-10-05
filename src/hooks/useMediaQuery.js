import { useCallback, useSyncExternalStore } from "react";

// The phone breakpoint every layout decision in this codebase keys off.
// Keep it equal to the (max-width: 640px) media queries in the CSS.
export const PHONE_QUERY = "(max-width: 640px)";

// The pre-rendered HTML is the desktop layout (the server snapshot is false),
// so a phone hydrates that first and switches to its own layout straight after.
export default function useMediaQuery(query) {
  const subscribe = useCallback((onChange) => {
    const list = window.matchMedia(query);
    list.addEventListener("change", onChange);
    return () => list.removeEventListener("change", onChange);
  }, [query]);

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false
  );
}
