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

  // Keep React state in sync when the API rejects an expired/invalid token.
  useEffect(() => {
    const onUnauthorized = () => {
      setUser(null);
      setToken(null);
    };
    window.addEventListener('sportiq:unauthorized', onUnauthorized);
    return () => window.removeEventListener('sportiq:unauthorized', onUnauthorized);
  }, []);

  const login = async (identifier, password) => {
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

  const register = async (registerData) => {
    const data = await authService.register(registerData);
    setUser(data.user);
    setToken(data.access_token);
    setLoading(false);
    return data;
  };

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
