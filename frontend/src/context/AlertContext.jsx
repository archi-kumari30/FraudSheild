import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axiosClient from '../api/axiosClient';
import { useAuth } from './AuthContext';

const AlertContext = createContext(null);

export const AlertProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchAlerts = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const res = await axiosClient.get('/alerts');
      if (res.success && Array.isArray(res.data?.alerts)) {
        setAlerts(res.data.alerts);
        setUnreadCount(res.data.unreadCount || res.data.alerts.filter((a) => !a.isRead).length);
      }
    } catch (err) {
      console.warn('Failed to load alerts:', err.message);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchAlerts();
    } else {
      setAlerts([]);
      setUnreadCount(0);
    }
  }, [isAuthenticated, fetchAlerts]);

  const markAsRead = async (alertId) => {
    try {
      const res = await axiosClient.patch(`/alerts/${alertId}/read`);
      if (res.success) {
        setAlerts((prev) =>
          prev.map((a) => (a._id === alertId ? { ...a, isRead: true } : a))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.warn('Failed to mark alert as read:', err.message);
    }
  };

  const value = {
    alerts,
    unreadCount,
    loading,
    fetchAlerts,
    markAsRead
  };

  return <AlertContext.Provider value={value}>{children}</AlertContext.Provider>;
};

export const useAlerts = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlerts must be used within an AlertProvider');
  }
  return context;
};
