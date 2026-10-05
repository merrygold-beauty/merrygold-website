import { useContext, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { SITE_ORIGIN } from "../../data/clinic";
import { describeHead, applyHead } from "../../lib/headTags";
import { PrerenderHeadContext } from "./prerenderHeadContext";

export default function SEO({
  title,
  description,
  ogImage = `${SITE_ORIGIN}/assets/hero-poster.jpg`,
  ogType,
  canonical,
  noindex = false,
  jsonLd = null
}) {
  const location = useLocation();
  const canonicalUrl = canonical || `${SITE_ORIGIN}${location.pathname}`;
  const head = useMemo(
    () => describeHead({ title, description, canonicalUrl, ogImage, ogType, noindex, jsonLd }),
    [title, description, canonicalUrl, ogImage, ogType, noindex, jsonLd]
  );

  const recordPrerenderHead = useContext(PrerenderHeadContext);
  if (recordPrerenderHead) recordPrerenderHead(head);

  useEffect(() => applyHead(head), [head]);

  return null;
}
