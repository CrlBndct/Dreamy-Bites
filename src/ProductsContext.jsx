import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from './api';

const ProductsContext = createContext();

export function ProductsProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setProducts(await api('/api/products'));
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const run = async (fn) => {
    try {
      await fn();
      await load();
    } catch (err) {
      alert(err.message);
    }
  };

  const addProduct = (p) => run(() => api('/api/products', { method: 'POST', body: p }));
  const updateProduct = (id, changes) =>
    run(() => api(`/api/products/${id}`, { method: 'PUT', body: changes }));
  const deleteProduct = (id) => run(() => api(`/api/products/${id}`, { method: 'DELETE' }));

  return (
    <ProductsContext.Provider
      value={{ products, loading, error, refresh: load, addProduct, updateProduct, deleteProduct }}
    >
      {children}
    </ProductsContext.Provider>
  );
}

export const useProducts = () => useContext(ProductsContext);