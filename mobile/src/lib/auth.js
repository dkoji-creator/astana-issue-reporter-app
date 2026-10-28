// Keeps the logged-in user and token; the token is stored securely on the phone
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, setAuthToken, setUnauthorizedHandler } from './api';
import { getItem, setItem } from './storage';

const TOKEN_KEY = 'authToken';
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(async () => {
    setAuthToken(null);
    setUser(null);
    await setItem(TOKEN_KEY, null);
  }, []);

  // On start: if a token is saved, check it with the server
  useEffect(() => {
    setUnauthorizedHandler(logout);
    (async () => {
      const token = await getItem(TOKEN_KEY);
      if (token) {
        setAuthToken(token);
        try {
          const { user: me } = await api.me();
          setUser(me);
        } catch (err) {
          // Expired token: forget it. No internet: also show the login screen.
          if (err.status === 401) await setItem(TOKEN_KEY, null);
          setAuthToken(null);
        }
      }
      setLoading(false);
    })();
  }, [logout]);

  const finishLogin = useCallback(async ({ token, user: u }) => {
    setAuthToken(token);
    await setItem(TOKEN_KEY, token);
    setUser(u);
  }, []);

  const value = useMemo(() => ({
    user,
    loading,
    isAdmin: user?.role === 'admin',
    login: async (email, password) => finishLogin(await api.login(email.trim(), password)),
    register: async (data) => finishLogin(await api.register(data)),
    logout,
  }), [user, loading, finishLogin, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
