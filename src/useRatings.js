import { useEffect, useState } from 'react';
import { api } from './api';
import { useAuth } from './AuthContext';
import { useProducts } from './ProductsContext';

export function useRatings() {
  const { user } = useAuth();
  const { refresh } = useProducts();
  const [ratings, setRatings] = useState({});

  useEffect(() => {
    if (!user) {
      setRatings({});
      return;
    }
    api('/api/ratings/mine').then(setRatings).catch(() => {});
  }, [user]);

  const rate = async (foodId, stars) => {
    try {
      await api(`/api/products/${foodId}/rating`, { method: 'POST', body: { stars } });
      setRatings((prev) => ({ ...prev, [foodId]: stars }));
      await refresh(); // the server recalculates the average
    } catch (err) {
      alert(err.message);
    }
  };

  return { ratings, rate };
}