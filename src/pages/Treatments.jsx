import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams, Link, Navigate } from 'react-router-dom';
import { treatments, treatmentCategories, isListedInCategory, listingsInCategory } from '../data/treatments';
import { useShop } from '../context/ShopContext';
import { FINDER_LABEL, TREATMENT_INFO_LABEL } from '../data/labels';
import { Search, Check, ChevronRight } from 'lucide-react';
import useMediaQuery, { PHONE_QUERY } from '../hooks/useMediaQuery';
import TreatmentDetail from '../components/treatments/TreatmentDetail';
import ServiceRow from '../components/treatments/ServiceRow';
import TreatmentBookButton from '../components/treatments/TreatmentBookButton';
import SEO from '../components/common/SEO';
import { pickDescription } from '../lib/headTags';
import { SITE_ORIGIN } from '../data/clinic';
import NotFound from './NotFound';
import './Treatments.css';

const CLINIC_PLACE = 'MerryGold Beauty Clinic in Barking, East London';

const breadcrumbItem = (position, name, path) => ({
  '@type': 'ListItem',
  position,
  name,
  item: `${SITE_ORIGIN}${path}`
});

// The page's own title, description and structured data: the full list, one
// category (/treatments/<category id>), or one treatment (/treatments/<slug>).
// The meta description is written for search results only; the visible
// descriptions on the page are the clinic's own words and are not shortened.
function treatmentsPageHead(category, treatment) {
  if (treatment) {
    const service = {
      '@type': 'Service',
      name: treatment.name,
      serviceType: treatment.categoryName,
      provider: { '@id': SITE_ORIGIN },
      ...(treatment.tagline ? { description: treatment.tagline } : {}),
      ...(treatment.price !== null ? { offers: { '@type': 'Offer', price: treatment.price, priceCurrency: 'GBP' } } : {})
    };
    return {
      title: `${treatment.name} | MerryGold Beauty Clinic`,
      description: pickDescription([
        treatment.tagline && treatment.about && `${treatment.tagline} ${treatment.about}`,
        treatment.tagline && `${treatment.tagline} At ${CLINIC_PLACE}.`,
        treatment.tagline,
        `${treatment.name} at ${CLINIC_PLACE}. ${treatment.duration}, ${treatment.priceDisplay}.`
      ]),
      jsonLd: {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              breadcrumbItem(1, 'Treatments', '/treatments'),
              breadcrumbItem(2, treatment.categoryName, `/treatments/${treatment.category}`),
              breadcrumbItem(3, treatment.name, `/treatments/${treatment.slug}`)
            ]
          },
          service
        ]
      }
    };
  }
  if (category) {
    return {
      title: `${category.name} | MerryGold Beauty Clinic`,
      description: pickDescription([
        `${category.shortDescription} At ${CLINIC_PLACE}.`,
        category.shortDescription
      ]),
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          breadcrumbItem(1, 'Treatments', '/treatments'),
          breadcrumbItem(2, category.name, `/treatments/${category.id}`)
        ]
      }
    };
  }
  return {
    title: 'Treatments | MerryGold Beauty Clinic',
    description: `Facials, laser hair removal, semi-permanent makeup, brows, lashes, waxing, massage and bridal makeup at ${CLINIC_PLACE}.`,
    jsonLd: null
  };
}

function parseDurationMinutes(durationStr) {
  if (!durationStr) return 0;
  const str = durationStr.toLowerCase();
  let mins = 0;
  const hourMatch = str.match(/(\d+)\s*(?:hour|hr)/);
  if (hourMatch) mins += parseInt(hourMatch[1], 10) * 60;
  const minMatch = str.match(/(\d+)\s*min/);
  if (minMatch) mins += parseInt(minMatch[1], 10);
  return mins;
}

// A treatment with no price yet sorts after every priced one in both price
// orders, so "low to high" never opens on a row that shows no price.
function priceForSort(treatment, whenUnpriced = Infinity) {
  return treatment.price === null ? whenUnpriced : treatment.price;
}

// Words dropped from the search index because they carry no meaning on their
// own: too short to disambiguate, or common enough to match almost anything.
const SEARCH_STOP_WORDS = new Set(['and', 'the', 'for', 'with', 'your', 'from', 'that', 'this', 'our']);

// Lowercases and splits each field into words, keeping only ones long enough
// and specific enough to be useful search keywords. A field may be a string
// (tagline) or an array of strings (concerns, benefits).
function extractKeywords(fields) {
  const keywords = new Set();
  for (const field of fields) {
    if (!field) continue;
    for (const value of Array.isArray(field) ? field : [field]) {
      for (const word of value.toLowerCase().split(/[^a-z0-9]+/)) {
        if (word.length >= 3 && !SEARCH_STOP_WORDS.has(word)) keywords.add(word);
      }
    }
  }
  return [...keywords];
}

function splitQueryWords(query) {
  return query.trim().toLowerCase().split(/\s+/).filter(Boolean);
}

// An entry matches when every query word is a prefix of at least one of its
// keywords, so "make" finds "makeup" and "lash lift" finds "Lash Lift & Tint".
function wordsMatchKeywords(queryWords, keywords) {
  return queryWords.every(word => keywords.some(k => k.startsWith(word)));
}

// A single row in the phone list: thumbnail, name, tagline, duration and
// price, chevron. Tapping the whole row opens the treatment's detail sheet.
function TreatmentRow({ t }) {
  return (
    <Link className="list-row" to={`/treatments/${t.slug}`}>
      <div className="list-row-thumb">
        <img src={t.image} alt={t.name} loading="lazy" />
      </div>
      <div>
        <h3 className="list-row-title">{t.name}</h3>
        <p className="list-row-sub">{t.tagline}</p>
        <p className="list-row-meta">
          {t.duration} <span aria-hidden="true">·</span> <span className="price">{t.priceDisplay}</span>
        </p>
        <span className="treatment-info-label">{TREATMENT_INFO_LABEL}</span>
      </div>
      <ChevronRight size={18} className="list-row-chevron" />
    </Link>
  );
}

function TreatmentCard({ t, onBook }) {
  return (
    <div className="treatment-directory-card">
      <div className="treatment-dir-thumb arch-soft-frame">
        <img src={t.image} alt={t.name} loading="lazy" />
        <span className="dir-price-badge">{t.priceDisplay}</span>
      </div>

      <div className="treatment-dir-body">
        <div className="dir-meta-row">
          <span className="dir-category">{t.categoryName}</span>
          <span className="dir-duration">{t.duration}</span>
        </div>

        <h3 className="dir-title">{t.name}</h3>
        <p className="dir-tagline">{t.tagline}</p>

        {t.benefits && t.benefits.length > 0 && (
          <div className="dir-benefits-box">
            <span className="dir-benefits-title">Key Clinical Outcomes:</span>
            <ul className="dir-benefits-list">
              {t.benefits.slice(0, 3).map((b, idx) => (
                <li key={idx}>
                  <Check size={12} />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {t.concerns && t.concerns.length > 0 && (
          <div className="dir-concerns-strip">
            {t.concerns.map(con => (
              <span key={con} className="dir-concern-tag">{con}</span>
            ))}
          </div>
        )}

        <div className="dir-footer-actions">
          <TreatmentBookButton treatment={t} onBook={onBook} className="btn btn-primary" />
          <Link to={`/treatments/${t.slug}`} className="btn btn-secondary">
            <span>{TREATMENT_INFO_LABEL}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

// The text-only treatments of one category split by subcategory, in the order
// they first appear in the data, so a long list reads in short sections.
function groupBySubcategory(rows) {
  const groups = new Map();
  for (const t of rows) {
    if (!groups.has(t.subcategory)) groups.set(t.subcategory, []);
    groups.get(t.subcategory).push(t);
  }
  return [...groups.entries()];
}

// The treatments of a category that have no photograph, listed under the ones
// that do as "Other <category> services" (the owner's layout, 2026-09-24),
// with a small label per subcategory when there is more than one.
function OtherServicesList({ category, rows, onBook }) {
  const groups = groupBySubcategory(rows);
  return (
    <div className="other-services">
      <h3 className="other-services-heading">Other {category.name} services</h3>
      {groups.map(([subcategory, items]) => (
        <div key={subcategory}>
          {groups.length > 1 && <h4 className="other-services-subheading">{subcategory}</h4>}
          <div className="service-list">
            {items.map(t => <ServiceRow key={t.id} t={t} onBook={onBook} />)}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Treatments() {
  const { slug } = useParams();
  // /treatments/<slug> is either a category page or one treatment's page.
  const category = treatmentCategories.find(c => c.id === slug) || null;
  const selectedCat = category ? category.id : 'all';
  // Links from before category pages existed used /treatments?category=<id>.
  const [searchParams] = useSearchParams();
  const legacyCategoryId = treatmentCategories.find(c => c.id === searchParams.get('category'))?.id;

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('featured');
  const [isSuggestOpen, setIsSuggestOpen] = useState(false);
  const [activeSuggestIndex, setActiveSuggestIndex] = useState(-1);
  const searchBoxRef = useRef(null);
  const { addToCart } = useShop();
  const handleBook = (item) => addToCart(item, 1);
  const navigate = useNavigate();
  const isPhone = useMediaQuery(PHONE_QUERY);

  useEffect(() => {
    window.__navigate = navigate;
    return () => {
      delete window.__navigate;
    };
  }, [navigate]);

  const categoryPath = (catId) => (catId === 'all' ? '/treatments' : `/treatments/${catId}`);
  // keepScroll: moving between categories inside the list leaves the reader
  // where they are (see ScrollManager), otherwise every chip tap on a phone
  // jumps back above the list.
  const showCategory = (catId) => navigate(categoryPath(catId), { state: { keepScroll: true } });

  // Keyword index over every category and treatment, built once from the
  // catalogue. The suggestions panel and the page filter below both match
  // against it, so the two can never disagree.
  const searchIndex = useMemo(() => {
    const categories = treatmentCategories.map(cat => {
      const keywords = extractKeywords([cat.name]);
      return { kind: 'category', id: cat.id, name: cat.name, nameKeywords: keywords, allKeywords: keywords };
    });

    const items = treatments.map(t => {
      const nameKeywords = extractKeywords([t.name]);
      const otherKeywords = extractKeywords([t.categoryName, t.subcategory, t.tagline, t.concerns, t.benefits]);
      const allKeywords = [...new Set([...nameKeywords, ...otherKeywords])];
      return {
        kind: 'treatment',
        id: t.id,
        slug: t.slug,
        name: t.name,
        duration: t.duration,
        priceDisplay: t.priceDisplay,
        nameKeywords,
        allKeywords
      };
    });

    return { categories, items, itemsById: new Map(items.map(it => [it.id, it])) };
  }, []);

  const suggestions = useMemo(() => {
    if (searchQuery.trim().length < 2) return [];
    const queryWords = splitQueryWords(searchQuery);

    const matchedCategories = searchIndex.categories
      .filter(cat => wordsMatchKeywords(queryWords, cat.allKeywords))
      .map(cat => ({ kind: 'category', id: cat.id, name: cat.name }));

    // Name matches rank above matches found only in another field; catalogue
    // order is kept within each rank because Array#sort is stable.
    const matchedTreatments = searchIndex.items
      .filter(t => wordsMatchKeywords(queryWords, t.allKeywords))
      .map(t => ({ t, isNameMatch: wordsMatchKeywords(queryWords, t.nameKeywords) }))
      .sort((a, b) => Number(b.isNameMatch) - Number(a.isNameMatch))
      .map(({ t }) => ({ kind: 'treatment', id: t.id, slug: t.slug, name: t.name, duration: t.duration, priceDisplay: t.priceDisplay }));

    return [...matchedCategories, ...matchedTreatments].slice(0, 8);
  }, [searchQuery, searchIndex]);

  const isSuggestPanelVisible = isSuggestOpen && suggestions.length > 0;

  // Closes the panel on a click anywhere outside the search box. Only
  // attached while the panel is open, and detached the moment it is not.
  useEffect(() => {
    if (!isSuggestPanelVisible) return undefined;
    const handleOutsideClick = (e) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target)) {
        setIsSuggestOpen(false);
        setActiveSuggestIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isSuggestPanelVisible]);

  const selectSuggestion = (item) => {
    if (item.kind === 'category') {
      showCategory(item.id);
    } else {
      navigate(`/treatments/${item.slug}`);
    }
    setSearchQuery('');
    setIsSuggestOpen(false);
    setActiveSuggestIndex(-1);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setIsSuggestOpen(true);
    setActiveSuggestIndex(-1);
  };

  const handleSearchKeyDown = (e) => {
    if (!isSuggestPanelVisible) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSuggestIndex(i => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSuggestIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      if (activeSuggestIndex >= 0 && activeSuggestIndex < suggestions.length) {
        e.preventDefault();
        selectSuggestion(suggestions[activeSuggestIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsSuggestOpen(false);
      setActiveSuggestIndex(-1);
    }
  };

  const sortedAndFiltered = useMemo(() => {
    const queryWords = splitQueryWords(searchQuery);
    let result = treatments.filter(t => {
      const matchCat = selectedCat === 'all' || isListedInCategory(t, selectedCat);
      const indexEntry = searchIndex.itemsById.get(t.id);
      const matchSearch = queryWords.length === 0 ||
        (indexEntry ? wordsMatchKeywords(queryWords, indexEntry.allKeywords) : false);
      return matchCat && matchSearch;
    });

    if (sortBy === 'name-asc') {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'price-asc') {
      result = [...result].sort((a, b) => priceForSort(a) - priceForSort(b));
    } else if (sortBy === 'price-desc') {
      result = [...result].sort((a, b) => priceForSort(b, -Infinity) - priceForSort(a, -Infinity));
    } else if (sortBy === 'duration') {
      result = [...result].sort((a, b) => parseDurationMinutes(a.duration) - parseDurationMinutes(b.duration));
    }

    return result;
  }, [selectedCat, searchQuery, sortBy, searchIndex]);

  const activeTreatment = useMemo(
    () => (slug && !category ? treatments.find(t => t.slug === slug) || null : null),
    [slug, category]
  );
  const pageHead = useMemo(() => treatmentsPageHead(category, activeTreatment), [category, activeTreatment]);

  const triggerFinder = () => {
    window.dispatchEvent(new CustomEvent('open-treatment-finder'));
  };

  const isDefaultOrder = sortBy === 'featured' && !searchQuery;

  const categoryPills = (
    <div className={`treatments-cat-pills chip-rail ${isPhone ? '' : 'chip-rail--wrap'}`}>
      <Link
        to={categoryPath('all')}
        state={{ keepScroll: true }}
        className={`cat-filter-btn chip ${selectedCat === 'all' ? 'active' : ''}`}
      >
        All ({treatments.length})
      </Link>
      {treatmentCategories.map(c => (
        <Link
          key={c.id}
          to={categoryPath(c.id)}
          state={{ keepScroll: true }}
          className={`cat-filter-btn chip ${selectedCat === c.id ? 'active' : ''}`}
        >
          {c.name}
        </Link>
      ))}
    </div>
  );

  const finderBanner = (
    <div className="finder-banner-strip">
      <div className="finder-banner-content">
        <h2>Not sure where to start?</h2>
        <p>Answer three quick questions and we will point you to the right treatments.</p>
      </div>
      <button
        type="button"
        className="btn btn-primary"
        onClick={triggerFinder}
      >
        <span>{FINDER_LABEL}</span>
      </button>
    </div>
  );

  const noResults = sortedAndFiltered.length === 0 && (
    <div className="no-results-box">
      <p>No treatments matched your query. Please adjust your search criteria or category filter.</p>
      <button
        type="button"
        className="btn btn-secondary"
        onClick={() => { showCategory('all'); setSearchQuery(''); setSortBy('featured'); }}
      >
        Reset
      </button>
    </div>
  );

  // A treatment with a photo renders as TreatmentRow (phone) or TreatmentCard
  // (desktop); one without renders as ServiceRow, which has no image slot.
  const renderPhotographed = (items) => (
    isPhone
      ? items.map(t => <TreatmentRow key={t.id} t={t} />)
      : (
        <div className="treatments-full-grid">
          {items.map(t => <TreatmentCard key={t.id} t={t} onBook={handleBook} />)}
        </div>
      )
  );

  // In the default order every category is its own section: its photographed
  // treatments, then its other services. The data is already in display
  // order (see treatments.js), so nothing is sorted here.
  const renderCategorySections = () => {
    const sectionCategories = selectedCat === 'all'
      ? treatmentCategories
      : treatmentCategories.filter(c => c.id === selectedCat);

    return sectionCategories.map(cat => {
      const rows = listingsInCategory(cat.id, sortedAndFiltered);
      if (rows.length === 0) return null;
      const withImage = rows.filter(t => t.image);
      const textOnly = rows.filter(t => !t.image);
      return (
        <section key={cat.id} className="treatment-category-section">
          <h2 className={isPhone ? 'list-group-heading' : 'treatment-category-heading'}>{cat.name}</h2>
          {withImage.length > 0 && renderPhotographed(withImage)}
          {textOnly.length > 0 && <OtherServicesList category={cat} rows={textOnly} onBook={handleBook} />}
        </section>
      );
    });
  };

  // A search or a sort flattens the list so the results read in the order
  // asked for: photographed first, then the rest.
  const renderFlatList = () => {
    if (isPhone) {
      return sortedAndFiltered.map(t => (
        t.image
          ? <TreatmentRow key={t.id} t={t} />
          : <ServiceRow key={t.id} t={t} onBook={handleBook} />
      ));
    }
    const withImage = sortedAndFiltered.filter(t => t.image);
    const textOnly = sortedAndFiltered.filter(t => !t.image);
    return (
      <>
        {withImage.length > 0 && renderPhotographed(withImage)}
        {textOnly.length > 0 && (
          <>
            {withImage.length > 0 && <h2 className="other-services-heading">Other services</h2>}
            <div className="service-list">
              {textOnly.map(t => <ServiceRow key={t.id} t={t} onBook={handleBook} />)}
            </div>
          </>
        )}
      </>
    );
  };

  const renderTreatments = () => (isDefaultOrder ? renderCategorySections() : renderFlatList());

  if (legacyCategoryId && !slug) return <Navigate to={categoryPath(legacyCategoryId)} replace />;
  if (slug && !category && !activeTreatment) return <NotFound />;

  return (
    <div className="treatments-page-shell">
      <SEO title={pageHead.title} description={pageHead.description} jsonLd={pageHead.jsonLd} />
      {/* Header */}
      <section className="treatments-hero-header">
        <div className="container">
          <h1 className="treatments-main-heading">{category ? category.name : 'Treatments'}</h1>
          <p className="treatments-main-subtext">
            Facials and advanced skin treatments, laser hair removal, semi-permanent makeup, brows, lashes, waxing, threading, massage, event makeup and bridal hair.
          </p>

          {/* Search, Sort & Category Filter Bar */}
          <div className="treatments-filter-toolbar">
            <div className="treatments-controls-row">
              <div className="treatments-search-box" ref={searchBoxRef}>
                <Search size={16} className="search-icon" />
                <input
                  type="text"
                  placeholder="Search treatments..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onKeyDown={handleSearchKeyDown}
                  aria-label="Search treatments"
                  role="combobox"
                  aria-expanded={isSuggestPanelVisible}
                  aria-controls="treatments-search-suggestions"
                  aria-autocomplete="list"
                  aria-activedescendant={
                    activeSuggestIndex >= 0 && suggestions[activeSuggestIndex]
                      ? `search-suggestion-${suggestions[activeSuggestIndex].kind}-${suggestions[activeSuggestIndex].id}`
                      : undefined
                  }
                />
                {isSuggestPanelVisible && (
                  <div className="search-suggestions" role="listbox" id="treatments-search-suggestions">
                    {suggestions.map((item, idx) => {
                      const optionId = `search-suggestion-${item.kind}-${item.id}`;
                      return (
                        <button
                          key={optionId}
                          type="button"
                          id={optionId}
                          role="option"
                          aria-selected={idx === activeSuggestIndex}
                          className={`search-suggestion ${idx === activeSuggestIndex ? 'active' : ''}`}
                          onClick={() => selectSuggestion(item)}
                        >
                          <span className="search-suggestion-name">{item.name}</span>
                          {item.kind === 'category' ? (
                            <span className="search-suggestion-kind">Category</span>
                          ) : (
                            <span className="search-suggestion-meta">
                              {item.duration} <span aria-hidden="true">·</span> {item.priceDisplay}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="treatments-sort-box">
                <select
                  aria-label="Sort"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="treatments-sort-select"
                >
                  <option value="featured">Featured</option>
                  <option value="name-asc">Name A to Z</option>
                  <option value="price-asc">Price low to high</option>
                  <option value="price-desc">Price high to low</option>
                  <option value="duration">Duration</option>
                </select>
              </div>
            </div>

            {!isPhone && categoryPills}
          </div>
        </div>
      </section>

      {isPhone ? (
        <div className="treatments-sticky-region container">
          <div className="treatments-sticky-rails">
            {categoryPills}
          </div>
          {finderBanner}
          <section className="treatments-directory-section">
            <div className="treatments-phone-list">
              {renderTreatments()}
            </div>
            {noResults}
          </section>
        </div>
      ) : (
        <>
          <div className="container">{finderBanner}</div>
          <section className="treatments-directory-section">
            <div className="container">
              {renderTreatments()}
              {noResults}
            </div>
          </section>
        </>
      )}

      {activeTreatment && (
        <TreatmentDetail treatment={activeTreatment} onClose={() => navigate('/treatments')} />
      )}
    </div>
  );
}
