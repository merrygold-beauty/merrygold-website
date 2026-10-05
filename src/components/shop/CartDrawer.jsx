import React from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, Trash2 } from 'lucide-react';
import BagIcon from '../common/icons/BagIcon';
import { useShop } from '../../context/ShopContext';
import { isTreatmentItem } from '../../data/treatments';
import useMediaQuery, { PHONE_QUERY } from '../../hooks/useMediaQuery';
import useSheetOpen from '../../hooks/useSheetOpen';
import useEscapeKey from '../../hooks/useEscapeKey';
import './CartDrawer.css';

export default function CartDrawer() {
  const { isCartOpen, closeCart, bagNotice, cart,cartCount, cartTotal, updateQuantity, removeFromCart, openCheckout } = useShop();
  const isPhone = useMediaQuery(PHONE_QUERY);

  useSheetOpen(isCartOpen);
  useEscapeKey(isCartOpen, closeCart);

  const freeShippingThreshold = 80;
  const progress = Math.min(100, (cartTotal / freeShippingThreshold) * 100);
  const remainingForFree = Math.max(0, freeShippingThreshold - cartTotal);

  const handleCheckoutClick = () => {
    closeCart();
    openCheckout('cart', null);
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <div className="cart-drawer-backdrop sheet-backdrop" onClick={closeCart}>
          <motion.div
            className="cart-drawer-panel sheet"
            onClick={(e) => e.stopPropagation()}
            initial={isPhone ? { y: '100%' } : { x: '100%' }}
            animate={isPhone ? { y: 0 } : { x: 0 }}
            exit={isPhone ? { y: '100%' } : { x: '100%' }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="sheet-handle" aria-hidden="true" />
            <div className="cart-header">
              <div className="cart-title-row">
                <h3 className="cart-title">Your Skincare Bag ({cartCount})</h3>
              </div>
              <button
                type="button"
                className="cart-close-btn"
                onClick={closeCart}
                aria-label="Close cart drawer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Free shipping meter */}
            <div className="shipping-meter-box">
              <p className="shipping-meter-text">
                {cartTotal >= freeShippingThreshold ? (
                  <span>You qualify for <strong>Complimentary UK Express Delivery</strong></span>
                ) : (
                  <span>Add <strong>£{remainingForFree.toFixed(0)}</strong> more for complimentary delivery</span>
                )}
              </p>
              <div className="shipping-track">
                <div className="shipping-fill" style={{ width: `${progress}%` }} />
              </div>
            </div>

            {bagNotice && <p className="cart-notice" role="status">{bagNotice}</p>}

            {/* Items list */}
            {cart.length === 0 ? (
              <div className="cart-empty-state">
                <div className="empty-icon-circle">
                  <BagIcon size={28} />
                </div>
                <h4>Your formulation bag is empty</h4>
                <p>Explore our cold-pressed botanicals and clinical cellular elixirs.</p>
                <div className="cart-empty-actions">
                  <Link to="/shop" className="btn btn-secondary" onClick={closeCart}>
                    Products
                  </Link>
                  <Link to="/treatments" className="btn btn-secondary" onClick={closeCart}>
                    Treatments
                  </Link>
                </div>
              </div>
            ) : (
              <div className="cart-items-container">
                {cart.map(({ product, quantity }) => (
                  <div key={product.id} className="cart-item-card">
                    {product.image && (
                      <div className="cart-item-thumb">
                        <img src={product.image} alt={product.name} />
                      </div>
                    )}
                    <div className="cart-item-details">
                      {product.volume ? <span className="cart-item-volume">{product.volume}</span> : null}
                      <h4 className="cart-item-name">{product.name}</h4>
                      <span className="cart-item-price">£{product.price} each</span>

                      <div className="cart-item-controls">
                        {/* A treatment is booked once, so it has no quantity to change. */}
                        {!isTreatmentItem(product) && (
                          <div className="qty-stepper">
                            <button
                              type="button"
                              onClick={() => updateQuantity(product.id, quantity - 1)}
                              aria-label="Decrease quantity"
                            >
                              <Minus size={12} />
                            </button>
                            <span>{quantity}</span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(product.id, quantity + 1)}
                              aria-label="Increase quantity"
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                        )}

                        <button
                          type="button"
                          className="cart-remove-btn"
                          onClick={() => removeFromCart(product.id)}
                          aria-label="Remove item"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Footer summary */}
            {cart.length > 0 && (
              <div className="cart-footer">
                <div className="cart-total-strip">
                  <span className="subtotal-label">Subtotal</span>
                  <span className="subtotal-val">£{cartTotal}</span>
                </div>
                <p className="cart-tax-notice">Taxes and delivery calculated at Stripe checkout</p>
                <button
                  type="button"
                  className="btn btn-primary w-full cart-checkout-btn"
                  onClick={handleCheckoutClick}
                >
                  <span>Checkout</span>
                </button>
                <div className="cart-guarantee">
                  <span>Payment is taken on Stripe's secure page.</span>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}