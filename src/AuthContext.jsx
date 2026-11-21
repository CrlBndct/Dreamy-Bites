import { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

// DEMO ONLY: anyone can read these in the browser. Use a real backend later.
const BAKER = { email: 'baker@dreamybites.com', password: 'baker123' };

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('dreamybites-user')) || null;
    } catch {
      return null;
    }
  });

  const login = (rawEmail, password) => {
    const email = rawEmail.trim().toLowerCase();
    let next;

    if (email === BAKER.email) {
      if (password !== BAKER.password) return null; // wrong baker password
      next = { email, role: 'baker' };
    } else {
      next = { email, role: 'customer' };
    }

    setUser(next);
    try { localStorage.setItem('dreamybites-user', JSON.stringify(next)); } catch {}
    return next;
  };

  const logout = () => {
    setUser(null);
    try { localStorage.removeItem('dreamybites-user'); } catch {}
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);