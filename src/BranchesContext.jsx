import { createContext, useContext, useState, useEffect } from 'react';
import { branches as defaultBranches } from './branches';

const BranchesContext = createContext();
const KEY = 'dreamybites-branches';

export function BranchesProvider({ children }) {
  const [branches, setBranches] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY));
      return Array.isArray(saved) && saved.length ? saved : defaultBranches;
    } catch {
      return defaultBranches;
    }
  });

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(branches)); } catch {}
  }, [branches]);

  const addBranch = (b) =>
    setBranches((prev) => [...prev, { available: true, ...b, id: Date.now() }]);

  const updateBranch = (id, changes) =>
    setBranches((prev) => prev.map((b) => (b.id === id ? { ...b, ...changes } : b)));

  const deleteBranch = (id) =>
    setBranches((prev) => prev.filter((b) => b.id !== id));

  return (
    <BranchesContext.Provider value={{ branches, addBranch, updateBranch, deleteBranch }}>
      {children}
    </BranchesContext.Provider>
  );
}

export const useBranches = () => useContext(BranchesContext);