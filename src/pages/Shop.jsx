import React, { useState, useMemo, useEffect } from 'react';
import SEO from '../components/common/SEO';
import { useSearchParams } from 'react-router-dom';
import { products } from '../data/products';
import ProductCard from '../components/shop/ProductCard';
import ProductModal from '../components/shop/ProductModal';
import useMediaQuery, { PHONE_QUERY } from '../hooks/useMediaQuery';
import rangeBannerImage from '../assets/images/shop_range_illuminated_sign.jpg';
import './Shop.css';

export default function Shop() {
  const [searchParams] = useSearchParams();
  const productParam = searchParams.get('product');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const isPhone = useMediaQuery(PHONE_QUERY);

  useEffect(() => {
    if (productParam) {
      const found = products.find(p => p.id === productParam || p.slug === productParam || p.name.toLowerCase().includes(productParam.toLowerCase()));
      if (found) setSelectedProduct(found);
    }
  }, [productParam]);

  const categories = ['all', 'Serums', 'Moisturisers', 'Exfoliators', 'Body', 'Lashes'];

  const filteredProducts = useMemo(() => {
    if (selectedCategory === 'all') return products;
    return products.filter(p => p.category === selectedCategory);
  }, [selectedCategory]);

  return (
    <div className="shop-page-shell">
      <SEO
        title="Shop Skincare | MerryGold Beauty Clinic"
        description="The MerryGold Flawless Glow skincare range, Revive Your Radiance, Organic Golden Glow Body Oil and 3D False Eyelashes, from MerryGold Beauty Clinic."
      />
      {/* Header */}
      <section className="shop-hero-header">
        <div className="container">
          <h1 className="shop-main-heading">Shop</h1>
          <p className="shop-main-subtext">
            The MerryGold Flawless Glow range, plus Revive Your Radiance, Organic Golden Glow Body Oil, and 3D False Eyelashes.
          </p>

          {/* Filter Pills */}
          <div className={`shop-category-bar chip-rail${isPhone ? '' : ' chip-rail--wrap'}`}>
            {categories.map(cat => (
              <button
                key={cat}
                type="button"
                className={`shop-filter-pill chip ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat === 'all' ? 'All' : cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Banner */}
      <div className="container">
        <div className="shop-trust-strip">
          <div className="trust-item">
            <span className="trust-index">01</span>
            <div>
              <strong>Collect in clinic</strong>
              <p>Or ask about UK delivery when ordering</p>
            </div>
          </div>
          <div className="trust-item">
            <span className="trust-index">02</span>
            <div>
              <strong>From the clinic</strong>
              <p>The same products used in treatments</p>
            </div>
          </div>
          <div className="trust-item">
            <span className="trust-index">03</span>
            <div>
              <strong>Simple ordering</strong>
              <p>Pay securely when your order is confirmed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Dispensary Highlight Banner */}
      <div className="container">
        <div className="shop-dispensary-banner arch-soft-frame">
          <div className="dispensary-banner-image-wrap">
            <img src={rangeBannerImage} alt="The MerryGold illuminated sign on a marble wall" className="dispensary-banner-image" />
          </div>
          <div className="dispensary-banner-content">
            <h2 className="dispensary-banner-title">The MerryGold range</h2>
            <p className="dispensary-banner-desc">
              Skincare and lashes from the clinic, available to take home.
            </p>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <section className="shop-catalog-section">
        <div className="container">
          <div className="shop-grid">
            {filteredProducts.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onQuickView={setSelectedProduct}
              />
            ))}
          </div>
        </div>
      </section>

      <ProductModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />
    </div>
  );
}