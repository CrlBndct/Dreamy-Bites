
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { api } from './api';

const BranchesContext = createContext();

export function BranchesProvider({ children }) {
  const [branches, setBranches] = useState([]);

  const load = useCallback(async () => {
    try {
      const data = await api('/api/branches');
      setBranches(data);
      return data;
    } catch (err) {
      console.error('Failed to load branches:', err.message);
      throw err;
    }
  }, []);

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  const run = async (fn) => {
    await fn();
    await load();
  };

  const addBranch = (b) =>
    run(() =>
      api('/api/branches', {
        method: 'POST',
        body: b,
      })
    );

  const updateBranch = (id, changes) =>
    run(() =>
      api(`/api/branches/${id}`, {
        method: 'PUT',
        body: changes,
      })
    );

  const deleteBranch = (id) =>
    run(() =>
      api(`/api/branches/${id}`, {
        method: 'DELETE',
      })
    );

  return (
    <BranchesContext.Provider
      value={{
        branches,
        addBranch,
        updateBranch,
        deleteBranch,
      }}
    >
      {children}
    </BranchesContext.Provider>
  );
}

export const useBranches = () => useContext(BranchesContext);
