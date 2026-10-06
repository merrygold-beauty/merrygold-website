import React, { useEffect, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { useShop } from '../context/ShopContext';
import SEO from '../components/common/SEO';
import { formatAppointment } from '../lib/enquiryEmail';
import './CheckoutResult.css';

function formatTotal(pence, currency) {
  const amount = (pence / 100).toFixed(2);
  return currency === 'gbp' ? `£${amount}` : `${amount} ${String(currency).toUpperCase()}`;
}

function CancelledView() {
  const { openCart } = useShop();
  return (
    <>
      <h1 className="checkout-result-title">Payment cancelled</h1>
      <p className="checkout-result-text">Your bag is still here.</p>
      <div className="checkout-result-actions">
        <button type="button" className="btn btn-primary" onClick={openCart}>Open your bag</button>
        <Link to="/" className="btn btn-secondary">Back to home</Link>
      </div>
    </>
  );
}

// Stripe redirects here with ?session_id=..., which is the only proof of
// payment the page gets; the actual payment_status always comes from a
// fresh call to /api/checkout-status, never from the URL itself.
function SuccessView() {
  const { openCart, clearCart } = useShop();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  // sessionId is known from the URL on first render, so its two starting
  // states are set directly here instead of via a setState-in-effect.
  const [status, setStatus] = useState(sessionId ? 'loading' : 'error'); // 'loading' | 'error' | 'loaded'
  const [errorMessage, setErrorMessage] = useState(sessionId ? '' : 'No payment session was found.');
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!sessionId) return undefined;
    let cancelled = false;
    fetch(`/api/checkout-status?session_id=${encodeURIComponent(sessionId)}`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data?.error || `Could not check the payment (status ${response.status}).`);
        if (!cancelled) {
          setResult(data);
          setStatus('loaded');
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setErrorMessage(err.message);
          setStatus('error');
        }
      });
    return () => { cancelled = true; };
  }, [sessionId]);

  const isPaid = result?.status === 'paid';

  // Runs once the session comes back paid. clearCart() is idempotent (it
  // just sets the cart to []), so a duplicate effect run in dev is harmless.
  useEffect(() => {
    if (isPaid) clearCart();
  }, [isPaid, clearCart]);

  if (status === 'loading') {
    return <h1 className="checkout-result-title">Checking your payment</h1>;
  }

  if (status === 'error') {
    return (
      <>
        <h1 className="checkout-result-title">Payment not completed</h1>
        <p className="checkout-result-text">{errorMessage}</p>
        <div className="checkout-result-actions">
          <button type="button" className="btn btn-primary" onClick={openCart}>Open your bag</button>
          <Link to="/treatments" className="btn btn-secondary">Browse treatments</Link>
        </div>
      </>
    );
  }

  if (!isPaid) {
    return (
      <>
        <h1 className="checkout-result-title">Payment not completed</h1>
        <p className="checkout-result-text">Stripe has not confirmed this payment.</p>
        <div className="checkout-result-actions">
          <button type="button" className="btn btn-primary" onClick={openCart}>Open your bag</button>
          <Link to="/treatments" className="btn btn-secondary">Browse treatments</Link>
        </div>
      </>
    );
  }

  // A booking always carries an appointment date in metadata; a product-only
  // order never does, so this is how the page knows to show the phone line.
  const hasTreatment = Boolean(result.appointmentDate);

  return (
    <>
      <h1 className="checkout-result-title">Payment received</h1>
      <p className="checkout-result-reference">Reference: {result.reference}</p>
      <ul className="checkout-result-items">
        {result.items.map((line, index) => (
          <li key={index}>
            <span>{line.name}</span>
            <span>x{line.quantity}</span>
          </li>
        ))}
      </ul>
      <p className="checkout-result-total">Total: {formatTotal(result.amountTotal, result.currency)}</p>
      {/* True once Stripe customer receipts are switched on for the live account (go-live item G5). */}
      <p className="checkout-result-text">Your receipt will be emailed to {result.customerEmail}.</p>
      {hasTreatment && (
        <p className="checkout-result-text">
          {result.appointmentTime
            ? `Appointment: ${formatAppointment(result.appointmentDate, result.appointmentTime)}. We will contact you by phone or WhatsApp to confirm it.`
            : "We'll confirm your appointment time by phone or WhatsApp."}
        </p>
      )}
      <div className="checkout-result-actions">
        <Link to="/" className="btn btn-primary">Back to home</Link>
      </div>
    </>
  );
}

export default function CheckoutResult() {
  const isCancelled = useLocation().pathname === '/checkout/cancelled';

  return (
    <div className="checkout-result-shell">
      <SEO
        title={isCancelled ? 'Payment Cancelled | MerryGold Beauty Clinic' : 'Payment | MerryGold Beauty Clinic'}
        description="MerryGold Beauty Clinic checkout result page."
        noindex
      />
      <div className="container checkout-result-container">
        {isCancelled ? <CancelledView /> : <SuccessView />}
      </div>
    </div>
  );
}
