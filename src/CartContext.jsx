import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

const CART_KEY = 'dreamybites-cart';

function loadCart() {
  try {
    const savedCart = localStorage.getItem(CART_KEY);
    const parsed = savedCart ? JSON.parse(savedCart) : [];

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [cart, setCart] = useState(loadCart);

  // Save cart whenever it changes.
  useEffect(() => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch (err) {
      console.error('Could not save cart:', err);
    }
  }, [cart]);

  const addToCart = (food, qty) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.foodId === food.foodId);

      if (existing) {
        return prev.map((i) =>
          i.foodId === food.foodId
            ? { ...i, quantity: i.quantity + qty }
            : i
        );
      }

      return [...prev, { ...food, quantity: qty }];
    });
  };

  const updateQty = (id, qty) => {
    setCart((prev) =>
      prev
        .map((i) => (i.foodId === id ? { ...i, quantity: qty } : i))
        .filter((i) => i.quantity > 0)
    );
  };

  const removeItem = (id) => {
    setCart((prev) => prev.filter((i) => i.foodId !== id));
  };

  const clearCart = () => setCart([]);

  const totalItems = cart.reduce((sum, i) => sum + i.quantity, 0);

  const totalPrice = cart.reduce(
    (sum, i) => sum + i.quantity * i.price,
    0
  );

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        updateQty,
        removeItem,
        clearCart,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);