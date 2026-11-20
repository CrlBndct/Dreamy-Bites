import { createContext, useContext, useState } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);

  const addToCart = (food, qty) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.foodId === food.foodId);
      if (existing) {
        return prev.map((i) =>
          i.foodId === food.foodId ? { ...i, quantity: i.quantity + qty } : i
        );
      }
      return [...prev, { ...food, quantity: qty }];
    });
  };

  const updateQty = (id, qty) => {
    setCart((prev) =>
      prev
        .map((i) => (i.foodId === id ? { ...i, quantity: qty } : i))
        .filter((i) => i.quantity > 0) // removes item if it hits 0
    );
  };

  const removeItem = (id) => setCart((prev) => prev.filter((i) => i.foodId !== id));
  const clearCart = () => setCart([]);

  const totalItems = cart.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = cart.reduce((sum, i) => sum + i.quantity * i.price, 0);

  return (
    <CartContext.Provider
      value={{ cart, addToCart, updateQty, removeItem, clearCart, totalItems, totalPrice }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);