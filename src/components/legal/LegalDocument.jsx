import SEO from "../common/SEO";
import "./LegalDocument.css";

export default function LegalDocument({ heading, title, description, updated, noindex = false, children }) {
  return (
    <div className="legal-page-shell">
      <SEO title={title} description={description} noindex={noindex} />
      <section className="legal-hero">
        <div className="container">
          <h1 className="legal-page-title">{heading}</h1>
          {updated ? <p className="legal-updated">Last updated {updated}</p> : null}
        </div>
      </section>
      <article className="legal-article container">
        {children}
      </article>
    </div>
  );
}
