import { useSyncExternalStore } from "react";

const subscribeToNothing = () => () => {};

// False while the server pre-renders a page and during the first browser
// render that hydrates it, true from then on. Anything read from the browser
// (saved bag, cookie choice, URL hash) waits for it, so the first browser
// render matches the pre-rendered HTML and React keeps that HTML.
export default function useHydrated() {
  return useSyncExternalStore(subscribeToNothing, () => true, () => false);
}
