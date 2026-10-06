import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axiosClient from '../api/axiosClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('fraudshield_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('fraudshield_token') || null);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshWallet = useCallback(async () => {
    if (!token) return;
    try {
      const res = await axiosClient.get('/wallet');
      if (res.success && res.data) {
        const walletData = res.data.wallet || res.data;
        setWallet(walletData);
        return walletData;
      }
    } catch (err) {
      console.warn('Failed to refresh wallet:', err.message);
    }
  }, [token]);

  // Initial user and wallet hydration
  useEffect(() => {
    const initializeAuth = async () => {
      if (token) {
        try {
          const profileRes = await axiosClient.get('/auth/me');
          if (profileRes.success && profileRes.data?.user) {
            setUser(profileRes.data.user);
            localStorage.setItem('fraudshield_user', JSON.stringify(profileRes.data.user));
          }
          await refreshWallet();
        } catch (err) {
          console.warn('Authentication validation failed:', err.message);
          localStorage.removeItem('fraudshield_token');
          localStorage.removeItem('fraudshield_user');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, [token, refreshWallet]);

  const login = async (email, password) => {
    const res = await axiosClient.post('/auth/login', { email, password });
    if (res.success && res.data) {
      const { token: newToken, user: userData } = res.data;
      localStorage.setItem('fraudshield_token', newToken);
      localStorage.setItem('fraudshield_user', JSON.stringify(userData));
      setToken(newToken);
      setUser(userData);
      // Fetch wallet right after login
      try {
        const walletRes = await axiosClient.get('/wallet');
        if (walletRes.success && walletRes.data) {
          const walletData = walletRes.data.wallet || walletRes.data;
          setWallet(walletData);
        }
      } catch (e) {
        // wallet will refresh on mount
      }
      return userData;
    }
    throw new Error(res.message || 'Login failed');
  };

  const register = async (name, email, password) => {
    const res = await axiosClient.post('/auth/register', { name, email, password });
    return res;
  };

  const forgotPassword = async (email) => {
    return await axiosClient.post('/auth/forgot-password', { email });
  };

  const resetPassword = async (email, resetToken, newPassword) => {
    return await axiosClient.post('/auth/reset-password', { email, resetToken, newPassword });
  };

  const logout = () => {
    localStorage.removeItem('fraudshield_token');
    localStorage.removeItem('fraudshield_user');
    setToken(null);
    setUser(null);
    setWallet(null);
  };

  const updateBalances = (available, held) => {
    setWallet((prev) => {
      if (!prev) return { availableBalance: available, heldBalance: held, currency: 'INR' };
      return {
        ...prev,
        availableBalance: typeof available === 'number' ? available : prev.availableBalance,
        heldBalance: typeof held === 'number' ? held : prev.heldBalance
      };
    });
  };

  const value = {
    user,
    token,
    wallet,
    loading,
    isAuthenticated: !!token && !!user,
    isAdmin: user?.role === 'admin',
    login,
    register,
    forgotPassword,
    resetPassword,
    logout,
    refreshWallet,
    updateBalances
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
