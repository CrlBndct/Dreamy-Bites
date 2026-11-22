const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const TOKEN_KEY = 'dreamybites-token';
const USER_KEY = 'dreamybites-user';

export const getToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setToken = (token) => {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {}
};

export async function api(path, { method = 'GET', body } = {}) {
  const headers = {};
  const token = getToken();

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let res;

  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error('Cannot reach the server. Is it running?');
  }

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    // Clear authentication if the token has expired or is invalid.
    // Do not log out the user for incorrect login credentials.
    if (res.status === 401 && token && !path.startsWith('/api/login')) {
      setToken(null);

      try {
        localStorage.removeItem(USER_KEY);
      } catch {}

      window.location.href = '/';
    }

    throw new Error(data?.error || `Request failed (${res.status})`);
  }

  return data;
}