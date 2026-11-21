import { createContext, useContext, useState, useEffect } from 'react';
import { foodArray } from './foods';

const ProductsContext = createContext();
const KEY = 'dreamybites-products';

export function ProductsProvider({ children }) {
  const [products, setProducts] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY));
      return Array.isArray(saved) && saved.length ? saved : foodArray;
    } catch {
      return foodArray;
    }
  });

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(products)); } catch {}
  }, [products]);

  const addProduct = (p) =>
    setProducts((prev) => [
      ...prev,
      { rating: 0, ratingCount: 0, available: true, ...p, foodId: Date.now() },
    ]);

  const updateProduct = (id, changes) =>
    setProducts((prev) => prev.map((p) => (p.foodId === id ? { ...p, ...changes } : p)));

  const deleteProduct = (id) =>
    setProducts((prev) => prev.filter((p) => p.foodId !== id));

  return (
    <ProductsContext.Provider value={{ products, addProduct, updateProduct, deleteProduct }}>
      {children}
    </ProductsContext.Provider>
  );
}

export const useProducts = () => useContext(ProductsContext);