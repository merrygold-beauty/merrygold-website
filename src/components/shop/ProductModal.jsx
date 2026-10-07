import React from 'react';
import { motion } from 'framer-motion';
import { X, ShoppingBag, Check } from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import useSheetOpen from '../../hooks/useSheetOpen';
import useEscapeKey from '../../hooks/useEscapeKey';
import useSoldOutProducts from '../../hooks/useSoldOutProducts';
import './ProductModal.css';

export default function ProductModal({ product, onClose }) {
  const { addToCart, openCheckout } = useShop();
  const soldOut = useSoldOutProducts();

  useSheetOpen(product != null);
  useEscapeKey(product != null, onClose);

  if (!product) return null;

  const handleAcquire = () => {
    openCheckout('product', product, 1);
    onClose();
  };

  const handleAddBag = () => {
    addToCart(product, 1);
  };

  return (
    <div className="product-modal-backdrop sheet-backdrop" onClick={onClose}>
      <motion.div
        className="product-modal-card sheet overlay-shell"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      >
        <span className="sheet-handle" aria-hidden="true" />
        <button
          type="button"
          className="product-modal-close"
          onClick={onClose}
          aria-label="Close product view"
        >
          <X size={20} />
        </button>

        <div className="overlay-shell-scroll">
        <div className="product-modal-grid">
          <div className="product-modal-vitrine">
            {product.badge && <span className="product-modal-badge">{product.badge}</span>}
            <div className="product-modal-pedestal">
              <div className="product-modal-image-wrap">
                <img src={product.image} alt={product.name} />
              </div>
              <div className="product-modal-stamp">
                <span>Bespoke Formulation • London Clinic</span>
              </div>
            </div>
          </div>

          <div className="product-modal-info">
            <div className="modal-meta-strip">
              <span className="modal-category-pill">{product.category}</span>
              {product.volume ? <span className="modal-volume-pill">{product.volume}</span> : null}
            </div>

            <h2 className="modal-product-name">{product.name}</h2>
            {product.subtitle ? <p className="modal-product-subtitle">{product.subtitle}</p> : null}

            <div className="modal-price-strip">
              <span className="modal-price">{product.priceDisplay}</span>
              <span className="modal-shipping-note">Complimentary UK shipping over £80</span>
            </div>

            {product.description ? <p className="modal-description">{product.description}</p> : null}

            {product.actives?.length > 0 ? (
              <div className="modal-actives-box">
                <div className="actives-header">
                  <h4>Key ingredients</h4>
                </div>
                <div className="actives-chips">
                  {product.actives.map(act => (
                    <span key={act} className="active-chip">{act}</span>
                  ))}
                </div>
              </div>
            ) : null}

            {product.benefits?.length > 0 ? (
              <div className="modal-benefits-box">
                <div className="benefits-header">
                  <h4>Benefits</h4>
                </div>
                <ul className="benefits-list">
                  {product.benefits.map(b => (
                    <li key={b}>
                      <Check size={14} />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {product.howToUse ? (
              <div className="modal-usage-box">
                <div className="usage-header">
                  <h4>How to use</h4>
                </div>
                <p>{product.howToUse}</p>
              </div>
            ) : null}

            {product.ingredients ? (
              <div className="modal-usage-box">
                <div className="usage-header">
                  <h4>Ingredients</h4>
                </div>
                <p>{product.ingredients}</p>
              </div>
            ) : null}

            {/* Actions */}
            <div className="modal-actions-strip">
              {soldOut.has(product.id) ? (
                <button type="button" className="btn btn-secondary flex-1" disabled>
                  <span>Sold out</span>
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    className="btn btn-secondary flex-1"
                    onClick={handleAddBag}
                  >
                    <ShoppingBag size={16} />
                    <span>Add</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary flex-1"
                    onClick={handleAcquire}
                  >
                    <span>Buy Now</span>
                  </button>
                </>
              )}
            </div>

            <div className="modal-guarantee-note">
              <span>Prepared freshly at the London laboratory. 30-day clinical return window.</span>
            </div>
          </div>
        </div>
        </div>
      </motion.div>
    </div>
  );
}