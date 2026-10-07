import React, { useState } from 'react';
import AppointmentPicker from '../checkout/AppointmentPicker';
import useEscapeKey from '../../hooks/useEscapeKey';
import { formatPence } from '../../lib/enquiryEmail';

// What each action is called on screen and which endpoint carries it out.
// Cancelling a booking and cancelling a product order are one endpoint with
// different words.
const LABELS = {
  move: { endpoint: '/api/booking-move', heading: 'Move booking', confirm: 'Move booking', close: 'Close', done: 'Booking moved.' },
  cancelBooking: { endpoint: '/api/order-cancel', heading: 'Cancel booking', confirm: 'Cancel booking', close: 'Keep booking', done: 'Booking cancelled.' },
  cancelOrder: { endpoint: '/api/order-cancel', heading: 'Cancel order', confirm: 'Cancel order', close: 'Keep order', done: 'Order cancelled.' },
  sent: { endpoint: '/api/order-sent', heading: 'Mark as sent', confirm: 'Mark as sent', close: 'Close', done: 'Order marked as sent.' }
};

// The Move, Cancel and Mark as sent dialog on the orders page
// (src/pages/OrdersDashboard.jsx). onDone(order, message) receives the order
// as the server now describes it and a sentence saying what happened.
export default function ManageOrderDialog({ order, action, password, onClose, onDone }) {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [refund, setRefund] = useState(true);
  const [tracking, setTracking] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [timesRefreshCount, setTimesRefreshCount] = useState(0);
  useEscapeKey(true, onClose);

  const isBooking = Boolean(order.appointmentTime);
  const labels = action === 'cancel' ? LABELS[isBooking ? 'cancelBooking' : 'cancelOrder'] : LABELS[action];
  const summary = [order.customerName || 'No name given', order.items.map((item) => item.name).join(', '), isBooking ? `${order.appointmentDate} at ${order.appointmentTime}` : null]
    .filter(Boolean)
    .join(' · ');

  const requestBody = () => {
    if (action === 'move') return { session: order.id, date, time };
    if (action === 'cancel') return { session: order.id, refund };
    return { session: order.id, tracking };
  };

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const response = await fetch(labels.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${password}` },
        body: JSON.stringify(requestBody())
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error || 'Something went wrong. Please try again.');
        // 409 on a move: the time was taken meanwhile, so show what is free now.
        if (action === 'move' && response.status === 409) {
          setTime('');
          setTimesRefreshCount((count) => count + 1);
        }
        setSubmitting(false);
        return;
      }
      onDone(data.order, resultMessage(labels.done, data));
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <div className="booking-dialog-backdrop" onClick={onClose}>
      <form
        className="booking-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-dialog-heading"
        onClick={(event) => event.stopPropagation()}
        onSubmit={submit}
      >
        <h2 id="booking-dialog-heading" className="booking-dialog-heading">{labels.heading}</h2>
        <p className="booking-dialog-summary">{summary}</p>

        {action === 'move' && (
          <div className="form-fields-grid">
            <AppointmentPicker
              timesUrlFor={(day) => `/api/booking-times?${new URLSearchParams({ session: order.id, date: day })}`}
              authorization={password}
              date={date}
              time={time}
              refreshCount={timesRefreshCount}
              onDateChange={(day) => { setDate(day); setTime(''); }}
              onTimeChange={setTime}
            />
          </div>
        )}

        {action === 'cancel' && (
          <fieldset className="booking-dialog-choices">
            <legend>Refund</legend>
            <label>
              <input type="radio" name="refund" checked={refund} onChange={() => setRefund(true)} />
              Refund {formatPence(order.amountTotal)} in full (the whole payment, including everything in the same order)
            </label>
            <label>
              <input type="radio" name="refund" checked={!refund} onChange={() => setRefund(false)} />
              {isBooking ? 'Do not refund, for example a cancellation inside the 24 hour notice period' : 'Do not refund'}
            </label>
          </fieldset>
        )}

        {action === 'sent' && (
          <div className="booking-dialog-field">
            <label htmlFor="order-tracking">Tracking number (optional)</label>
            <input id="order-tracking" type="text" maxLength={100} value={tracking} onChange={(event) => setTracking(event.target.value)} />
          </div>
        )}

        <p className="booking-dialog-note">{noteFor(action, isBooking)}</p>

        {error && <p className="orders-error" role="alert">{error}</p>}

        <div className="booking-dialog-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
            {labels.close}
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting || (action === 'move' && !time)}>
            {submitting ? 'Working...' : labels.confirm}
          </button>
        </div>
      </form>
    </div>
  );
}

function noteFor(action, isBooking) {
  if (action === 'move') return 'The calendar event moves and the customer is emailed the new time.';
  if (action === 'sent') return 'The customer is emailed that the order is on its way, with the tracking number if you add one.';
  return isBooking
    ? 'The calendar event is removed so the time can be booked again, and the customer is emailed.'
    : 'The customer is emailed that the order is cancelled.';
}

// What the orders page says once the server has answered: the change, then
// anything the clinic still has to do by hand.
function resultMessage(done, data) {
  const sentences = [done];
  if (data.calendarFreed === false) sentences.push('The calendar event could not be removed: delete it in Google Calendar.');
  if (data.recordUpdated === false) sentences.push('The change was not saved in Stripe, so this page may show the old details after a refresh.');
  sentences.push(data.customerEmailed ? 'The customer has been emailed.' : 'The customer was not emailed: please let them know.');
  return sentences.join(' ');
}
