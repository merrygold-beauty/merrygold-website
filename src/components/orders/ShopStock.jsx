import React, { useEffect, useState } from 'react';
import { products } from '../../data/products';

// The Shop stock list on the orders page: one Sold out switch per product,
// saved through /api/stock. A product marked sold out shows "Sold out" in
// the shop and checkout refuses it.
export default function ShopStock({ password }) {
  const [soldOut, setSoldOut] = useState(null); // a Set of ids, or null until loaded
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    fetch('/api/stock')
      .then((response) => response.json())
      .then((data) => { if (active) setSoldOut(new Set(data.soldOut)); })
      .catch(() => { if (active) setError('The sold out list could not be loaded. Please refresh the page.'); });
    return () => { active = false; };
  }, []);

  const switchProduct = async (id, makeSoldOut) => {
    setSavingId(id);
    setError('');
    try {
      const response = await fetch('/api/stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${password}` },
        body: JSON.stringify({ id, soldOut: makeSoldOut })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'The change could not be saved. Please try again.');
      setSoldOut(new Set(data.soldOut));
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <section className="shop-stock" aria-labelledby="shop-stock-heading">
      <h2 id="shop-stock-heading" className="list-group-heading">Shop stock</h2>
      <p className="shop-stock-intro">A product marked sold out cannot be added to the bag or bought until you untick it.</p>
      {error && <p className="orders-error" role="alert">{error}</p>}
      <ul className="shop-stock-list">
        {products.map((product) => (
          <li key={product.id}>
            <span>{product.name}</span>
            <label>
              <input
                type="checkbox"
                checked={Boolean(soldOut?.has(product.id))}
                disabled={!soldOut || savingId === product.id}
                onChange={(event) => switchProduct(product.id, event.target.checked)}
              />
              Sold out
            </label>
          </li>
        ))}
      </ul>
    </section>
  );
}
