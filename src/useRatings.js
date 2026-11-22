import { useEffect, useState } from 'react';
import { api } from './api';
import { useAuth } from './AuthContext';
import { useProducts } from './ProductsContext';

export function useRatings() {
  const { user } = useAuth();
  const { refresh } = useProducts();

  const [ratings, setRatings] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (!user) {
      setRatings({});
      setLoading(false);
      return;
    }

    const loadRatings = async () => {
      setLoading(true);

      try {
        const data = await api('/api/ratings/mine');

        if (!cancelled) {
          setRatings(data);
        }
      } catch {
        if (!cancelled) {
          setRatings({});
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadRatings();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const rate = async (foodId, stars) => {
    try {
      await api(`/api/products/${foodId}/rating`, {
        method: 'POST',
        body: { stars },
      });

      setRatings((prev) => ({
        ...prev,
        [foodId]: stars,
      }));

      await refresh();
    } catch (err) {
      alert(err.message);
    }
  };

  return { ratings, rate, loading };
}