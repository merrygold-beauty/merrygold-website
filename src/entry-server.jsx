import React from "react";
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom";
import App from "./App";
import { PrerenderHeadContext } from "./components/common/prerenderHeadContext";
import { headToHtml } from "./lib/headTags";

// Built by `vite build --ssr` and called by scripts/prerender.mjs once per
// page. Returns the page's markup and its <head> tags as HTML strings.
export function render(path) {
  let head = null;
  const appHtml = renderToString(
    <React.StrictMode>
      <PrerenderHeadContext.Provider value={(pageHead) => { head = pageHead; }}>
        <StaticRouter location={path}>
          <App />
        </StaticRouter>
      </PrerenderHeadContext.Provider>
    </React.StrictMode>
  );
  if (!head) throw new Error(`${path} rendered no SEO component, so it has no title or description`);
  return { appHtml, headHtml: headToHtml(head), noindex: head.canonicalUrl === null };
}
