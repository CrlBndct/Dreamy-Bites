import { createContext, useContext, useState, useEffect } from 'react';
import { api, getToken, setToken } from './api';

const AuthContext = createContext();
const USER_KEY = 'dreamybites-user';

function loadUser() {
  try {
    return getToken() ? JSON.parse(localStorage.getItem(USER_KEY)) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(loadUser);
  const [loading, setLoading] = useState(() => !!getToken());

  // Verify the saved session when the application starts.
  useEffect(() => {
    const token = getToken();

    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const verifySession = async () => {
      try {
        const verifiedUser = await api('/api/me');

        if (!cancelled) {
          setUser(verifiedUser);

          try {
            localStorage.setItem(USER_KEY, JSON.stringify(verifiedUser));
          } catch {}
        }
      } catch {
        if (!cancelled) {
          setToken(null);
          setUser(null);

          try {
            localStorage.removeItem(USER_KEY);
          } catch {}
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    verifySession();

    return () => {
      cancelled = true;
    };
  }, []);

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