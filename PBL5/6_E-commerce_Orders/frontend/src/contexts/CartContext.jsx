import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { cartApi } from '../lib/api';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart] = useState(null);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [itemCount, setItemCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch cart data
  const fetchCart = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await cartApi.get();
      setCart(data.cart || {});
      setItems(data.items || []);
      setTotal(data.total || 0);
      setItemCount(data.itemCount || 0);
    } catch (err) {
      setError(err.message || 'Failed to fetch cart');
      console.error('Cart fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Add item to cart
  const addToCart = useCallback(async (productId, quantity = 1) => {
    try {
      setLoading(true);
      setError(null);
      await cartApi.add(productId, quantity);
      await fetchCart(); // Refresh cart
      return { success: true };
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to add item to cart';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, [fetchCart]);

  // Update cart item quantity
  const updateQuantity = useCallback(async (productId, quantity) => {
    try {
      setLoading(true);
      setError(null);
      await cartApi.update(productId, quantity);
      await fetchCart(); // Refresh cart
      return { success: true };
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to update cart';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, [fetchCart]);

  // Remove item from cart
  const removeFromCart = useCallback(async (productId) => {
    try {
      setLoading(true);
      setError(null);
      await cartApi.remove(productId);
      await fetchCart(); // Refresh cart
      return { success: true };
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to remove item';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, [fetchCart]);

  // Clear cart
  const clearCart = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      await cartApi.clear();
      await fetchCart(); // Refresh cart
      return { success: true };
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to clear cart';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, [fetchCart]);

  // Load cart on mount
  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const value = {
    cart,
    items,
    total,
    itemCount,
    loading,
    error,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    refreshCart: fetchCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}

