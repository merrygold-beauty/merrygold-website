import React, { useState } from 'react';
import { products } from '../../data/products';
import ProductCard from '../shop/ProductCard';
import ProductModal from '../shop/ProductModal';
import { Link } from 'react-router-dom';
import Reveal from '../common/Reveal';
import './ShopPreview.css';

export default function ShopPreview() {
  const [selectedProduct, setSelectedProduct] = useState(null);

  return (
    <section className="shop-preview-section">
      <Reveal className="container">
        <div className="shop-preview-header">
          <h2 className="shop-preview-title">Shop the range</h2>
          <p className="shop-preview-desc">
            The MerryGold Flawless Glow range, plus Revive Your Radiance, Organic Golden Glow Body Oil, and 3D False Eyelashes.
          </p>
        </div>

        <div className="shop-products-grid">
          {products.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              onQuickView={setSelectedProduct}
            />
          ))}
        </div>

        <div className="shop-preview-footer">
          <Link to="/shop" className="btn btn-secondary">
            <span>View Shop</span>
          </Link>
          <div className="shop-delivery-note">
            <span>Complimentary UK Express Courier Delivery on orders over £80.</span>
          </div>
        </div>
      </Reveal>

      <ProductModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />
    </section>
  );
}