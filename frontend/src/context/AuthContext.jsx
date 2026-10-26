import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => authService.getCurrentUser());
  const [token, setToken] = useState(() => authService.getToken());
  const [loading, setLoading] = useState(true);

  const clearSession = useCallback(() => {
    authService.logout();
    setUser(null);
    setToken(null);
  }, []);

  useEffect(() => {
    let active = true;

    const initAuth = async () => {
      const currentToken = authService.getToken();
      if (currentToken === 'sportiq-demo-session' && import.meta.env.VITE_DEMO_MODE === 'true') {
        if (active) {
          setUser(authService.getCurrentUser());
          setToken(currentToken);
          setLoading(false);
        }
        return;
      }
      if (!currentToken) {
        if (active) {
          setUser(null);
          setToken(null);
          setLoading(false);
        }
        return;
      }

      try {
        const freshUser = await authService.getMe();
        if (active) {
          setUser(freshUser);
          setToken(currentToken);
        }
      } catch (error) {
        console.warn('Session validation failed; signing out.', error);
        authService.logout();
        if (active) {
          setUser(null);
          setToken(null);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    initAuth();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const onUnauthorized = () => {
      setUser(null);
      setToken(null);
    };
    window.addEventListener('sportiq:unauthorized', onUnauthorized);
    return () => window.removeEventListener('sportiq:unauthorized', onUnauthorized);
  }, []);

  const login = async (identifier, password, displayName = '') => {
    if (import.meta.env.VITE_DEMO_MODE === 'true') {
      const normalizedEmail = identifier.trim().toLowerCase();
      const previousUser = authService.getCurrentUser();
      const enteredName = displayName.trim();
      const inferredName = normalizedEmail.split('@')[0]
        .replace(/[._-]+/g, ' ')
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
      const data = {
        access_token: 'sportiq-demo-session',
        user: {
          id: 'demo-player',
          name: enteredName || previousUser?.name || inferredName || 'Player',
          email: normalizedEmail,
          role: 'PLAYER',
        },
      };
      localStorage.setItem('sportiq_token', data.access_token);
      localStorage.setItem('sportiq_user', JSON.stringify(data.user));
      setUser(data.user);
      setToken(data.access_token);
      setLoading(false);
      return data;
    }
    const data = await authService.login({
      username: identifier,
      email: identifier,
      password
    });
    setUser(data.user);
    setToken(data.access_token);
    setLoading(false);
    return data;
  };

  const register = async (registerData) => authService.register(registerData);

  const logout = () => {
    clearSession();
  };

  const refreshUser = async () => {
    const freshUser = await authService.getMe();
    setUser(freshUser);
    return freshUser;
  };

  const value = {
    user,
    token,
    role: user?.role || null,
    isAuthenticated: Boolean(token && user),
    loading,
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export default AuthContext;
