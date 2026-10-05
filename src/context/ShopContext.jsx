import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import useHydrated from '../hooks/useHydrated';
import { isTreatmentItem } from '../data/treatments';

const ShopContext = createContext();

const BAG_STORAGE_KEY = 'merrygold_cart';
// A saved bag line is dropped after this long, so something left in the bag
// on an earlier visit does not turn up weeks later.
const BAG_LINE_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;
const EMPTY_BAG = [];

// A checkout books one treatment, once, so each paid booking is exactly one
// calendar entry; products can sit beside it in any number.
function keepOneTreatment(lines) {
  let hasTreatment = false;
  return lines.flatMap((line) => {
    if (!isTreatmentItem(line.product)) return [line];
    if (hasTreatment) return [];
    hasTreatment = true;
    return [{ ...line, quantity: 1 }];
  });
}

// Lines saved before addedAt existed count from today.
function loadSavedBag() {
  try {
    const saved = JSON.parse(localStorage.getItem(BAG_STORAGE_KEY) || '[]');
    const now = Date.now();
    return keepOneTreatment(saved
      .map((line) => ({ ...line, addedAt: line.addedAt ?? now }))
      .filter((line) => now - line.addedAt < BAG_LINE_LIFETIME_MS));
  } catch {
    return [];
  }
}

export function ShopProvider({ children }) {
  const [bag, setBag] = useState(loadSavedBag);
  // The pre-rendered page shows an empty bag, so the first browser render
  // does too; the saved bag appears straight after hydration.
  const cart = useHydrated() ? bag : EMPTY_BAG;
  // Shown in the bag when booking a treatment swapped out the one already there.
  const [bagNotice, setBagNotice] = useState(null);

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [checkoutModal, setCheckoutModal] = useState({
    isOpen: false,
    mode: 'product', // 'treatment' | 'product' | 'cart'
    item: null,
    quantity: 1
  });

  useEffect(() => {
    try {
      localStorage.setItem(BAG_STORAGE_KEY, JSON.stringify(bag));
    } catch {
      // Storage unavailable or quota exceeded
    }
  }, [bag]);

  const addTreatment = (treatment) => {
    const replaced = cart.find(i => isTreatmentItem(i.product) && i.product.id !== treatment.id);
    setBagNotice(replaced
      ? `${treatment.name} replaced ${replaced.product.name}. Each booking is for one treatment.`
      : null);
    setBag(prev => {
      if (prev.some(i => i.product.id === treatment.id)) return prev;
      const products = prev.filter(i => !isTreatmentItem(i.product));
      return [...products, { product: treatment, quantity: 1, addedAt: Date.now() }];
    });
  };

  const addProduct = (product, quantity) => {
    setBagNotice(null);
    setBag(prev => {
      const existing = prev.find(i => i.product.id === product.id);
      if (existing) {
        return prev.map(i =>
          i.product.id === product.id
            ? { ...i, quantity: i.quantity + quantity }
            : i
        );
      }
      return [...prev, { product, quantity, addedAt: Date.now() }];
    });
  };

  const addToCart = (product, quantity = 1) => {
    if (isTreatmentItem(product)) addTreatment(product);
    else addProduct(product, quantity);
    setIsCartOpen(true);
  };

  const removeFromCart = (productId) => {
    setBag(prev => prev.filter(i => i.product.id !== productId));
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setBag(prev =>
      prev.map(i =>
        i.product.id === productId
          ? { ...i, quantity: isTreatmentItem(i.product) ? 1 : quantity }
          : i
      )
    );
  };

  // Stable identity (useCallback) and a no-op when already empty (prev
  // returned as-is): CheckoutResult depends on clearCart in a useEffect, and
  // a fresh function plus a fresh [] on every call was re-triggering that
  // effect forever ("Maximum update depth exceeded").
  const clearCart = useCallback(() => {
    setBag(prev => (prev.length === 0 ? prev : []));
  }, []);

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => {
    setIsCartOpen(false);
    setBagNotice(null);
  };

  const openCheckout = (mode, item, quantity = 1) => {
    setCheckoutModal({
      isOpen: true,
      mode,
      item,
      quantity
    });
  };

  const closeCheckout = () => {
    setCheckoutModal({
      isOpen: false,
      mode: 'product',
      item: null,
      quantity: 1
    });
  };

  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);
  const cartTotal = cart.reduce((sum, i) => sum + (i.product.price * i.quantity), 0);

  return (
    <ShopContext.Provider
      value={{
        cart,
        cartCount,
        cartTotal,
        isCartOpen,
        bagNotice,
        openCart,
        closeCart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        checkoutModal,
        openCheckout,
        closeCheckout
      }}
    >
      {children}
    </ShopContext.Provider>
  );
}

export function useShop() {
  const context = useContext(ShopContext);
  if (!context) {
    throw new Error('useShop must be used within a ShopProvider');
  }
  return context;
}