import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollManager() {
  const { pathname, hash, key, state } = useLocation();
  // Tells a path change from a query-only one: the effect now re-runs on
  // every navigation (it depends on `key`, which changes even when only the
  // query string does), so this ref does the job the old pathname/hash
  // dependency array used to do for free.
  const previousPathname = useRef(pathname);

  // A new path, or a link that explicitly opts in via `state.scrollToTop`,
  // moves the page to the top. A navigation carrying `state.keepScroll` (a
  // category chip tapped from inside the treatments list) or a bare
  // query-string change leaves the reader where they are, otherwise every
  // chip tap jumps above the list on phones. A hash always scrolls to its
  // target.
  useEffect(() => {
    const pathChanged = previousPathname.current !== pathname;
    previousPathname.current = pathname;

    if (!hash) {
      if ((pathChanged && !state?.keepScroll) || state?.scrollToTop) window.scrollTo(0, 0);
      return;
    }

    const id = decodeURIComponent(hash.startsWith("#") ? hash.slice(1) : hash);

    const scrollToTarget = () => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView();
        return true;
      }
      return false;
    };

    let retryId = 0;
    const frameId = requestAnimationFrame(() => {
      if (scrollToTarget()) return;
      retryId = window.setTimeout(() => {
        if (!scrollToTarget()) {
          window.scrollTo(0, 0);
        }
      }, 100);
    });

    return () => {
      cancelAnimationFrame(frameId);
      if (retryId) window.clearTimeout(retryId);
    };
    // pathname, hash and state are read from the same location `key` already
    // depends on, so adding them here would only make the effect re-run for
    // the same navigation twice, not catch anything this misses.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return null;
}
