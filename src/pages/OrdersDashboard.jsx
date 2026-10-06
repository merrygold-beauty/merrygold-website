import { useState, useEffect, useCallback } from "react";
import SEO from "../components/common/SEO";
import "./OrdersDashboard.css";

const TOKEN_KEY = "merrygold_orders_token";

function formatMoney(pence, currency) {
  const amount = (pence / 100).toFixed(2);
  return currency === "gbp" ? `£${amount}` : `${amount} ${String(currency).toUpperCase()}`;
}

function formatDate(createdUnixSeconds) {
  return new Date(createdUnixSeconds * 1000).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

// Fetches one page of orders, throwing an Error carrying the visitor-facing
// sentence and the response status (loadOrders below uses the status to tell
// a wrong password apart from any other failure).
async function fetchOrders(password, cursor) {
  const url = cursor ? `/api/orders?cursor=${encodeURIComponent(cursor)}` : "/api/orders";
  const response = await fetch(url, { headers: { Authorization: `Bearer ${password}` } });
  if (!response.ok) {
    const message =
      response.status === 401
        ? "Wrong password."
        : response.status === 503
          ? "The dashboard is not switched on yet."
          : (await response.json().catch(() => ({}))).error || "Something went wrong. Please try again.";
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }
  return response.json();
}

// "2026-12-08 at 11:30"; bookings paid before time slots carry a date only.
function appointmentText(order) {
  if (!order.appointmentDate) return null;
  return order.appointmentTime ? `${order.appointmentDate} at ${order.appointmentTime}` : order.appointmentDate;
}

function OrderCard({ order }) {
  const delivery = [order.deliveryAddress, order.deliveryPostcode].filter(Boolean).join(", ");
  return (
    <div className="order-card">
      <h3 className="list-row-title">{order.customerName || "No name given"}</h3>
      <p className="list-row-sub">
        {order.customerEmail}
        {order.phone ? ` · ${order.phone}` : ""}
      </p>
      <ul className="order-card-items">
        {order.items.map((item, index) => (
          <li key={index}>{item.name} x {item.quantity}</li>
        ))}
      </ul>
      <p className="list-row-meta price">{formatMoney(order.amountTotal, order.currency)}</p>
      <p className="order-card-detail">{order.appointmentDate ? `Appointment: ${appointmentText(order)}` : "No appointment"}</p>
      {delivery && <p className="order-card-detail">Delivery: {delivery}</p>}
      <a className="order-card-stripe" href={order.stripeUrl} target="_blank" rel="noopener noreferrer">View in Stripe</a>
    </div>
  );
}

// Orders already arrive newest-first from Stripe, so grouping only needs to
// notice when the date changes, not sort anything.
function groupByDate(orders) {
  const groups = [];
  for (const order of orders) {
    const label = formatDate(order.created);
    const currentGroup = groups[groups.length - 1];
    if (!currentGroup || currentGroup.label !== label) {
      groups.push({ label, orders: [order] });
    } else {
      currentGroup.orders.push(order);
    }
  }
  return groups;
}

function SignInForm({ password, onPasswordChange, onSubmit, submitting }) {
  return (
    <form className="orders-signin-form" onSubmit={onSubmit}>
      <div className="orders-input-field">
        <label htmlFor="orders-password">Dashboard password</label>
        <input
          id="orders-password"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(event) => onPasswordChange(event.target.value)}
        />
      </div>
      <button type="submit" className="btn btn-primary" disabled={submitting}>Sign in</button>
    </form>
  );
}

export default function OrdersDashboard() {
  const [password, setPassword] = useState(null); // the signed-in password, or null when signed out
  const [passwordInput, setPasswordInput] = useState("");
  const [orders, setOrders] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // The one place that talks to /api/orders: sign-in, refresh and load-more
  // all call this, so there is only one place that turns a failure into the
  // error state, and only one place that clears a password Stripe no longer
  // accepts.
  const loadOrders = useCallback(async (candidatePassword, cursor, { append = false } = {}) => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchOrders(candidatePassword, cursor);
      setOrders((prev) => (append ? [...prev, ...data.orders] : data.orders));
      setHasMore(data.hasMore);
      setNextCursor(data.nextCursor);
      return true;
    } catch (err) {
      setError(err.message);
      if (err.status === 401) {
        sessionStorage.removeItem(TOKEN_KEY);
        setPassword(null);
      }
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Signs back in automatically when a password is already saved, so a
  // refresh of the page does not ask again.
  useEffect(() => {
    const saved = sessionStorage.getItem(TOKEN_KEY);
    if (!saved) return;
    loadOrders(saved, null).then((ok) => {
      if (ok) setPassword(saved);
    });
  }, [loadOrders]);

  const handleSignIn = async (event) => {
    event.preventDefault();
    const ok = await loadOrders(passwordInput, null);
    if (ok) {
      sessionStorage.setItem(TOKEN_KEY, passwordInput);
      setPassword(passwordInput);
    }
  };

  const handleSignOut = () => {
    sessionStorage.removeItem(TOKEN_KEY);
    setPassword(null);
    setPasswordInput("");
    setOrders([]);
    setHasMore(false);
    setNextCursor(null);
    setError("");
  };

  return (
    <div className="orders-page-shell">
      <SEO title="Orders | MerryGold Beauty Clinic" description="Clinic orders dashboard." noindex />

      <header className="orders-header-band">
        <div className="container">
          <h1 className="orders-page-title">Orders</h1>
        </div>
      </header>

      <div className="container orders-body">
        {error && <p className="orders-error" role="alert">{error}</p>}

        {!password ? (
          <SignInForm password={passwordInput} onPasswordChange={setPasswordInput} onSubmit={handleSignIn} submitting={loading} />
        ) : (
          <>
            <div className="orders-toolbar">
              <p className="orders-summary">{orders.length} paid orders</p>
              <div className="orders-toolbar-actions">
                <button type="button" className="btn btn-secondary" onClick={() => loadOrders(password, null)} disabled={loading}>Refresh</button>
                <button type="button" className="btn btn-secondary" onClick={handleSignOut}>Sign out</button>
              </div>
            </div>

            <div className="orders-table-wrap">
              <table className="orders-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Customer</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Appointment</th>
                    <th>Delivery</th>
                    <th>Stripe</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td>{formatDate(order.created)}</td>
                      <td>
                        <div>{order.customerName || "No name given"}</div>
                        <div>{order.customerEmail}</div>
                        <div>{order.phone}</div>
                      </td>
                      <td>
                        {order.items.map((item, index) => (
                          <div key={index}>{item.name} x {item.quantity}</div>
                        ))}
                      </td>
                      <td>{formatMoney(order.amountTotal, order.currency)}</td>
                      <td>{appointmentText(order) || "No appointment"}</td>
                      <td>{[order.deliveryAddress, order.deliveryPostcode].filter(Boolean).join(", ") || "No delivery"}</td>
                      <td><a href={order.stripeUrl} target="_blank" rel="noopener noreferrer">View in Stripe</a></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="orders-cards">
              {groupByDate(orders).map((group) => (
                <section key={group.label}>
                  <h2 className="list-group-heading">{group.label}</h2>
                  {group.orders.map((order) => <OrderCard key={order.id} order={order} />)}
                </section>
              ))}
            </div>

            {hasMore && (
              <button
                type="button"
                className="btn btn-secondary orders-load-more"
                onClick={() => loadOrders(password, nextCursor, { append: true })}
                disabled={loading}
              >
                Load more
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
