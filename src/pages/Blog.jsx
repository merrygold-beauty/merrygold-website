import { Link } from "react-router-dom";
import SEO from "../components/common/SEO";
import { blogArticles } from "../data/blog";
import "./Blog.css";

export default function Blog() {
  return (
    <div className="blog-page-shell">
      <SEO
        title="Blog | MerryGold Beauty Clinic"
        description="Skin health, laser hair removal and clinic guides from MerryGold Beauty Clinic in Barking, East London."
      />

      <section className="blog-hero">
        <div className="container">
          <h1 className="blog-page-title">Blog</h1>
          <p className="blog-page-subtext">
            Skin health, laser hair removal and clinic guides from MerryGold Beauty Clinic.
          </p>
        </div>
      </section>

      <section className="blog-list-section">
        <div className="container">
          <div className="blog-cards-grid">
            {blogArticles.map((article) => (
              <article key={article.slug} className="blog-card card-luxury">
                <div className="blog-card-meta">
                  <span className="data-chip">{article.category}</span>
                  <span className="data-chip">{article.readingTime}</span>
                </div>
                <h2 className="blog-card-title">
                  <Link to={`/blog/${article.slug}`}>{article.title}</Link>
                </h2>
                <p className="blog-card-date">{article.displayDate}</p>
                <p className="blog-card-excerpt">{article.excerpt}</p>
                <Link className="link-editorial" to={`/blog/${article.slug}`}>
                  Read article
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
