import { useParams, Link } from "react-router-dom";
import NotFound from "./NotFound";
import SEO from "../components/common/SEO";
import { blogArticles } from "../data/blog";
import { BOOK_LABEL } from "../data/labels";
import { SITE_ORIGIN } from "../data/clinic";
import "./Blog.css";

// Renders one block from an article's `body` array. Blocks are plain data
// (see src/data/blog.js), so this stays a simple type switch, not a
// registry: there are only four shapes and none is likely to grow.
function ArticleBlock({ block }) {
  if (block.type === "h2") return <h2>{block.text}</h2>;
  if (block.type === "h3") return <h3>{block.text}</h3>;
  if (block.type === "ul") {
    return (
      <ul>
        {block.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    );
  }
  return <p>{block.text}</p>;
}

export default function BlogArticle() {
  const { slug } = useParams();
  const article = blogArticles.find((a) => a.slug === slug);

  // A mistyped address, or a post since removed.
  if (!article) return <NotFound />;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: article.title,
    datePublished: article.date,
    author: { "@type": "Organization", name: "MerryGold Beauty Clinic" },
    mainEntityOfPage: `${SITE_ORIGIN}/blog/${article.slug}`
  };

  return (
    <div className="blog-page-shell">
      <SEO
        title={`${article.title} | MerryGold Beauty Clinic`}
        description={article.excerpt}
        jsonLd={jsonLd}
      />

      <section className="blog-hero">
        <div className="container">
          <h1 className="blog-page-title blog-article-title">{article.title}</h1>
          <p className="blog-article-meta">
            {article.displayDate} <span aria-hidden="true">·</span> {article.category}{" "}
            <span aria-hidden="true">·</span> {article.readingTime}
          </p>
        </div>
      </section>

      <article className="blog-article-body">
        {article.body.map((block, index) => (
          <ArticleBlock key={index} block={block} />
        ))}

        <div className="blog-article-actions">
          <Link to="/blog" className="link-editorial">
            Back to blog
          </Link>
          <Link to="/treatments" className="btn btn-primary">
            <span>{BOOK_LABEL}</span>
          </Link>
        </div>
      </article>
    </div>
  );
}
