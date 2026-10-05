import { createContext } from "react";

// Set only while scripts/prerender.mjs renders a page on the server: a
// function the SEO component calls with the page's head, because effects (and
// so applyHead) never run there. Null in the browser.
export const PrerenderHeadContext = createContext(null);
