import { useEffect, useState } from 'react';

// The ids of products the clinic has marked sold out (/api/stock). Loaded
// once per page and shared by every product card and pop-up. Starts empty,
// on the server and in the browser alike, so the pre-rendered page and the
// first render match; checkout refuses a sold out product either way.
const NONE = new Set();
let soldOutRequest = null;

function loadSoldOut() {
  if (!soldOutRequest) {
    soldOutRequest = fetch('/api/stock')
      .then((response) => (response.ok ? response.json() : { soldOut: [] }))
      .then((data) => new Set(data.soldOut))
      .catch(() => NONE);
  }
  return soldOutRequest;
}

export default function useSoldOutProducts() {
  const [soldOut, setSoldOut] = useState(NONE);
  useEffect(() => {
    let active = true;
    loadSoldOut().then((ids) => {
      if (active) setSoldOut(ids);
    });
    return () => { active = false; };
  }, []);
  return soldOut;
}
