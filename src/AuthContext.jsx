import { createContext, useContext, useState } from 'react';
import { api, getToken, setToken } from './api';

const AuthContext = createContext();
const USER_KEY = 'dreamybites-user';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return getToken() ? JSON.parse(localStorage.getItem(USER_KEY)) : null;
    } catch {
      return null;
    }
  });

  const [loading] = useState(false);

  const save = ({ token, user }) => {
    setToken(token);
    setUser(user);

    try {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch {}

    return user;
  };

  const login = async (email, password) =>
    save(await api('/api/login', { method: 'POST', body: { email, password } }));

  const register = async (email, password) =>
    save(await api('/api/register', { method: 'POST', body: { email, password } }));

  const logout = () => {
    setToken(null);
    setUser(null);

    try {
      localStorage.removeItem(USER_KEY);
    } catch {}
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);