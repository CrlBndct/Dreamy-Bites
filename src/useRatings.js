import { useState } from 'react';

const KEY = 'dreamybites-ratings';

export function useRatings() {
  const [ratings, setRatings] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(KEY)) || {};
    } catch {
      return {};
    }
  });

  const rate = (foodId, stars) => {
    setRatings((prev) => {
      const next = { ...prev, [foodId]: stars };
      try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  };

  return { ratings, rate };
}