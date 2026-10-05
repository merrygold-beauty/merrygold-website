import React from 'react';
import { useShop } from '../../context/ShopContext';
import './ProductCard.css';

export default function ProductCard({ product, onQuickView }) {
  const { addToCart, openCheckout } = useShop();

  const handleBuyNow = (e) => {
    e.stopPropagation();
    openCheckout('product', product, 1);
  };

  const handleAddBag = (e) => {
    e.stopPropagation();
    addToCart(product, 1);
  };

  return (
    <div className="product-card" onClick={() => { if (onQuickView) onQuickView(product); }}>
      <div className="product-card-vitrine">
        {product.badge && <span className="product-badge">{product.badge}</span>}
        <div className="product-card-pedestal">
          <div className="product-image-wrap">
            <img src={product.image} alt={product.name} loading="lazy" />
          </div>
          <div className="product-card-overlay">
            <button
              type="button"
              className="product-quickview-btn"
              onClick={(e) => {
                e.stopPropagation();
                if (onQuickView) onQuickView(product);
              }}
              aria-label={`Quick view ${product.name}`}
            >
              <span>Examine</span>
            </button>
          </div>
        </div>
      </div>

      <div className="product-card-body">
        <div className="product-card-meta">
          {product.volume ? <span className="product-volume">{product.volume}</span> : null}
          <span className="product-category">{product.category}</span>
        </div>
        <h3 className="product-card-title">{product.name}</h3>
        {product.subtitle ? <p className="product-card-subtitle">{product.subtitle}</p> : null}
        <div className="product-card-footer">
          <span className="product-price">{product.priceDisplay}</span>
          <div className="product-card-actions">
            <button
              type="button"
              className="btn btn-secondary btn-sm product-add"
              onClick={handleAddBag}
              aria-label="Add to formulation bag"
            >
              <span>Add</span>
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm product-buy"
              onClick={handleBuyNow}
            >
              <span>Buy</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}