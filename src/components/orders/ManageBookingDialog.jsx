import React, { useState } from 'react';
import AppointmentPicker from '../checkout/AppointmentPicker';
import useEscapeKey from '../../hooks/useEscapeKey';
import { formatPence } from '../../lib/enquiryEmail';

// The Move and Cancel dialog on the orders page (src/pages/OrdersDashboard.jsx).
// action is 'move' or 'cancel'. onDone(order, message) receives the order as
// the server now describes it and a sentence saying what happened.
export default function ManageBookingDialog({ order, action, password, onClose, onDone }) {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [refund, setRefund] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [timesRefreshCount, setTimesRefreshCount] = useState(0);
  useEscapeKey(true, onClose);

  const isMove = action === 'move';
  const treatment = order.items[0]?.name || 'Treatment';
  const current = `${order.appointmentDate} at ${order.appointmentTime}`;

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const response = await fetch(isMove ? '/api/booking-move' : '/api/booking-cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${password}` },
        body: JSON.stringify(isMove ? { session: order.id, date, time } : { session: order.id, refund })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error || 'Something went wrong. Please try again.');
        // 409 on a move: the time was taken meanwhile, so show what is free now.
        if (isMove && response.status === 409) {
          setTime('');
          setTimesRefreshCount((count) => count + 1);
        }
        setSubmitting(false);
        return;
      }
      onDone(data.order, resultMessage(action, data));
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
        <h2 id="booking-dialog-heading" className="booking-dialog-heading">{isMove ? 'Move booking' : 'Cancel booking'}</h2>
        <p className="booking-dialog-summary">
          {order.customerName || 'No name given'} · {treatment} · {current}
        </p>

        {isMove ? (
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
        ) : (
          <fieldset className="booking-dialog-choices">
            <legend>Refund</legend>
            <label>
              <input type="radio" name="refund" checked={refund} onChange={() => setRefund(true)} />
              Refund {formatPence(order.amountTotal)} in full (the whole payment, including any products in the same order)
            </label>
            <label>
              <input type="radio" name="refund" checked={!refund} onChange={() => setRefund(false)} />
              Do not refund, for example a cancellation inside the 24 hour notice period
            </label>
          </fieldset>
        )}

        <p className="booking-dialog-note">
          {isMove
            ? 'The calendar event moves and the customer is emailed the new time.'
            : 'The calendar event is removed so the time can be booked again, and the customer is emailed.'}
        </p>

        {error && <p className="orders-error" role="alert">{error}</p>}

        <div className="booking-dialog-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
            {isMove ? 'Close' : 'Keep booking'}
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting || (isMove && !time)}>
            {submitting ? 'Working...' : isMove ? 'Move booking' : 'Cancel booking'}
          </button>
        </div>
      </form>
    </div>
  );
}

// What the orders page says once the server has answered: the change, then
// anything the clinic still has to do by hand.
function resultMessage(action, data) {
  const sentences = [action === 'move' ? 'Booking moved.' : 'Booking cancelled.'];
  if (data.calendarFreed === false) sentences.push('The calendar event could not be removed: delete it in Google Calendar.');
  if (data.recordUpdated === false) sentences.push('The change was not saved in Stripe, so this page may show the old details after a refresh.');
  sentences.push(data.customerEmailed ? 'The customer has been emailed.' : 'The customer was not emailed: please let them know.');
  return sentences.join(' ');
}
