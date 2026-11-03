import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  CART_STORAGE_KEY,
  addToCart,
  cartTotals,
  normalizeStoredItems,
  removeFromCart,
  toCheckoutItems,
  updateCartQuantity,
} from '../utils/cart.js';

const CartContext = createContext(null);

function loadStoredCart() {
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    return normalizeStoredItems(JSON.parse(raw));
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(loadStoredCart);
  const [recentlyAdded, setRecentlyAdded] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Storage can be unavailable in private mode; the in-memory cart still works.
    }
  }, [items]);

  const openDrawer = useCallback(() => setIsDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);
  const toggleDrawer = useCallback(() => setIsDrawerOpen((prev) => !prev), []);

  const addProduct = useCallback((product, quantity = 1, showDrawer = true) => {
    let result = { added: 0 };
    setItems((current) => {
      result = addToCart(current, product, quantity);
      return result.items;
    });
    if (result.added > 0) {
      setRecentlyAdded({ productId: product.id, quantity: result.added, at: Date.now() });
      if (showDrawer) setIsDrawerOpen(true);
    }
    return result;
  }, []);

  const updateQuantity = useCallback((productId, quantity) => {
    setItems((current) => updateCartQuantity(current, productId, quantity));
  }, []);

  const removeProduct = useCallback((productId) => {
    setItems((current) => removeFromCart(current, productId));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setRecentlyAdded(null);
  }, []);

  const totals = useMemo(() => cartTotals(items), [items]);
  const checkoutItems = useMemo(() => toCheckoutItems(items), [items]);

  const value = useMemo(
    () => ({
      items,
      ...totals,
      recentlyAdded,
      addProduct,
      updateQuantity,
      removeProduct,
      clearCart,
      checkoutItems,
      isDrawerOpen,
      openDrawer,
      closeDrawer,
      toggleDrawer,
    }),
    [
      items,
      totals,
      recentlyAdded,
      addProduct,
      updateQuantity,
      removeProduct,
      clearCart,
      checkoutItems,
      isDrawerOpen,
      openDrawer,
      closeDrawer,
      toggleDrawer,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used inside CartProvider.');
  return context;
}
