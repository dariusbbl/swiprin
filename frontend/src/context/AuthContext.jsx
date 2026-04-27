import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { login as apiLogin } from '../api/auth';
import client from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]   = useState(null);   // { id, email, role, fullName, ... }
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(false);

  // Keep token in memory (window var for axios interceptor)
  const applyToken = (t) => {
    window.__swiprin_token = t;
    setToken(t);
  };

  const logout = useCallback(() => {
    window.__swiprin_token = null;
    setToken(null);
    setUser(null);
  }, []);

  // Listen for 401 auto-logout
  useEffect(() => {
    window.addEventListener('swiprin:logout', logout);
    return () => window.removeEventListener('swiprin:logout', logout);
  }, [logout]);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const { data } = await apiLogin({ email, password });
      applyToken(data.token);
      // Fetch own profile to populate user object
      const me = await client.get('/users/me');
      setUser(me.data);
      return me.data;
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    const me = await client.get('/users/me');
    setUser(me.data);
    return me.data;
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
