import React, { useEffect, useState } from 'react';
import { DAYS_AHEAD, addDays, londonDateString } from '../../lib/bookingSlots';

// The date field and the free start times for one treatment. Used by the
// checkout (times from /api/availability) and by the orders page's Move
// dialog (times from /api/booking-times, which needs the dashboard password,
// passed as authorization). timesUrlFor(date) gives the address to ask.
//
// refreshCount is bumped by the caller when the server answers that a time
// has just been taken, so the list reloads without the date changing.
//
// Its styles (.form-field, .appointment-times) live in CheckoutModal.css,
// which every page loads, because Layout renders the checkout on all of them.
export default function AppointmentPicker({ timesUrlFor, authorization, date, time, refreshCount, onDateChange, onTimeChange }) {
  // Each answer remembers which request it belongs to, so the list is
  // "loading" whenever the latest request has not answered yet, with no
  // separate flag to keep in step.
  const timesUrl = date ? timesUrlFor(date) : null;
  const requestKey = timesUrl ? `${timesUrl}|${refreshCount}` : null;
  const [answer, setAnswer] = useState({ key: null, times: [], error: '' });
  const [today] = useState(() => londonDateString(Date.now()));

  useEffect(() => {
    if (!requestKey) return undefined;
    let cancelled = false;
    const headers = authorization ? { Authorization: `Bearer ${authorization}` } : {};
    fetch(timesUrl, { headers })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || 'Free times could not be loaded. Please try again, or call us to book.');
        if (!cancelled) setAnswer({ key: requestKey, times: data.times, error: '' });
      })
      .catch((err) => {
        if (!cancelled) setAnswer({ key: requestKey, times: [], error: err.message });
      });
    return () => { cancelled = true; };
  }, [requestKey, timesUrl, authorization]);

  const status = !requestKey ? 'idle' : answer.key !== requestKey ? 'loading' : answer.error ? 'error' : 'loaded';
  const { times, error: errorMessage } = answer;

  return (
    <>
      <div className="form-field">
        <label htmlFor="chk-date">Appointment Date *</label>
        <input
          id="chk-date"
          name="date"
          type="date"
          required
          min={today}
          max={addDays(today, DAYS_AHEAD)}
          value={date}
          onChange={(e) => onDateChange(e.target.value)}
        />
      </div>

      <div className="form-field full-width">
        <span className="form-field-label" id="chk-time-label">Start Time *</span>
        {status === 'idle' && <p className="appointment-times-note">Choose a date to see the free times.</p>}
        {status === 'loading' && <p className="appointment-times-note">Loading free times...</p>}
        {status === 'error' && <p className="checkout-error" role="alert">{errorMessage}</p>}
        {status === 'loaded' && times.length === 0 && (
          <p className="appointment-times-note">No free times on this day. Please choose another day.</p>
        )}
        {status === 'loaded' && times.length > 0 && (
          <div className="appointment-times" role="group" aria-labelledby="chk-time-label">
            {times.map((startTime) => (
              <button
                key={startTime}
                type="button"
                className="appointment-time"
                aria-pressed={startTime === time}
                onClick={() => onTimeChange(startTime)}
              >
                {startTime}
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
