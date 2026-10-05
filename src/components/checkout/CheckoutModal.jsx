import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Calendar, Clock } from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import { isTreatmentItem } from '../../data/treatments';
import useSheetOpen from '../../hooks/useSheetOpen';
import useEscapeKey from '../../hooks/useEscapeKey';
import './CheckoutModal.css';

const CHECKOUT_SUBTEXT = "You'll pay on Stripe's secure page and get a receipt by email.";

export default function CheckoutModal() {
  const { checkoutModal, closeCheckout, cart, cartTotal } = useShop();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    date: '',
    notes: '',
    address: '',
    postcode: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleClose = () => {
    setIsSubmitting(false);
    setErrorMessage('');
    closeCheckout();
  };

  useSheetOpen(checkoutModal.isOpen);
  useEscapeKey(checkoutModal.isOpen, handleClose);

  if (!checkoutModal.isOpen) return null;

  const { mode, item, quantity } = checkoutModal;
  const isTreatment = mode === 'treatment';
  const isSingleProduct = mode === 'product';
  const isCart = mode === 'cart';

  // A bag can hold treatments and products together, so the form follows
  // what is in it: a date for any treatment, a delivery address for any
  // product.
  const bagLines = isCart ? cart : [{ product: item, quantity }];
  const hasTreatment = bagLines.some((line) => isTreatmentItem(line.product));
  const hasProduct = bagLines.some((line) => !isTreatmentItem(line.product));

  const heading = isTreatment ? 'Book treatment' : isSingleProduct ? 'Buy product' : 'Your order';

  const amount = isTreatment || isSingleProduct ? item?.price * quantity : cartTotal;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    const items = isCart
      ? cart.map((line) => ({ id: line.product.id, quantity: line.quantity }))
      : [{ id: item.id, quantity }];

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          customer: { name: formData.name, email: formData.email, phone: formData.phone },
          booking: hasTreatment ? { date: formData.date, notes: formData.notes } : null,
          delivery: hasProduct ? { address: formData.address, postcode: formData.postcode } : null
        })
      });
      const data = await response.json();
      if (!response.ok || !data.url) {
        setErrorMessage(data?.error || 'The payment could not be started. Please try again.');
        setIsSubmitting(false);
        return;
      }
      window.location.assign(data.url);
    } catch (err) {
      setErrorMessage(err.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="checkout-modal-backdrop sheet-backdrop" onClick={handleClose}>
      <motion.div
        className="checkout-modal-card sheet overlay-shell"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      >
        <span className="sheet-handle" aria-hidden="true" />
        <div className="overlay-shell-scroll">
        <div className="checkout-header">
          <button
            type="button"
            className="checkout-close-btn"
            onClick={handleClose}
            aria-label="Close checkout"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="checkout-form">
          <div className="checkout-title-strip">
            <h2 className="checkout-heading">{heading}</h2>
            <p className="checkout-subtext">{CHECKOUT_SUBTEXT}</p>
          </div>

          {/* Selected item summary */}
          <div className="checkout-summary-box">
            {isTreatment && (
              <div className="summary-treatment-row">
                <div>
                  <span className="summary-category">{item?.categoryName || 'Treatment'}</span>
                  <h4 className="summary-name">{item?.name}</h4>
                  <div className="summary-specs">
                    <span><Clock size={12} /> {item?.duration}</span>
                    <span><Calendar size={12} /> Flexible Scheduling</span>
                  </div>
                </div>
                <div className="summary-price-tag">
                  <span className="price-label">Total</span>
                  <span className="price-val">£{amount}</span>
                </div>
              </div>
            )}

            {isSingleProduct && (
              <div className="summary-product-row">
                {item?.image && <img src={item.image} alt={item.name} className="summary-thumb" />}
                <div className="summary-info">
                  <span className="summary-category">{item?.volume}</span>
                  <h4 className="summary-name">{item?.name}</h4>
                  <span className="summary-qty">Qty: {quantity}</span>
                </div>
                <div className="summary-price-tag">
                  <span className="price-label">Total</span>
                  <span className="price-val">£{amount}</span>
                </div>
              </div>
            )}

            {isCart && (
              <div className="summary-cart-list">
                {cart.map(i => (
                  <div key={i.product.id} className="summary-cart-item">
                    <span>{i.product.name} (x{i.quantity})</span>
                    <strong>£{i.product.price * i.quantity}</strong>
                  </div>
                ))}
                <div className="summary-cart-total">
                  <span>Total:</span>
                  <strong>£{cartTotal}</strong>
                </div>
              </div>
            )}
          </div>

          {/* Form fields */}
          <div className="form-fields-grid">
            <div className="form-field">
              <label htmlFor="chk-name">Full Name *</label>
              <input
                id="chk-name"
                name="name"
                type="text"
                required
                autoComplete="name"
                placeholder="Your name"
                value={formData.name}
                onChange={handleChange}
              />
            </div>

            <div className="form-field">
              <label htmlFor="chk-email">Email Address *</label>
              <input
                id="chk-email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="name@domain.com"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div className="form-field">
              <label htmlFor="chk-phone">Telephone Number *</label>
              <input
                id="chk-phone"
                name="phone"
                type="tel"
                required
                autoComplete="tel"
                placeholder="07700 900123"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>

            {hasTreatment && (
              <>
                <div className="form-field">
                  <label htmlFor="chk-date">Preferred Appointment Date *</label>
                  <input
                    id="chk-date"
                    name="date"
                    type="date"
                    required
                    min={new Date().toISOString().slice(0, 10)}
                    value={formData.date}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-field full-width">
                  <label htmlFor="chk-notes">Anything we should know? (optional)</label>
                  <textarea
                    id="chk-notes"
                    name="notes"
                    rows={2}
                    placeholder="Preferred times, questions"
                    value={formData.notes}
                    onChange={handleChange}
                  />
                </div>
              </>
            )}

            {hasProduct && (
              <>
                <div className="form-field">
                  <label htmlFor="chk-address">Delivery Address *</label>
                  <input
                    id="chk-address"
                    name="address"
                    type="text"
                    required
                    autoComplete="street-address"
                    placeholder="Street, Flat/Building"
                    value={formData.address}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="chk-postcode">Postal Code (UK) *</label>
                  <input
                    id="chk-postcode"
                    name="postcode"
                    type="text"
                    required
                    autoComplete="postal-code"
                    placeholder="SW1X 7XL"
                    value={formData.postcode}
                    onChange={handleChange}
                  />
                </div>
              </>
            )}
          </div>

          <div className="stripe-notice-bar">
            <p>
              Powered by Stripe. Payment details are entered directly on Stripe's verified checkout infrastructure.
            </p>
          </div>

          {errorMessage && (
            <p className="checkout-error" role="alert">{errorMessage}</p>
          )}

          <div className="checkout-actions">
            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Opening Stripe...' : <span>Continue to payment</span>}
            </button>
          </div>
        </form>
        </div>
      </motion.div>
    </div>
  );
}
