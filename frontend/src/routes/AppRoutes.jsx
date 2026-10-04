import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from '../pages/customer/LoginPage';
import RegisterPage from '../pages/customer/RegisterPage';
import DashboardPage from '../pages/customer/DashboardPage';
import BeneficiariesPage from '../pages/customer/BeneficiariesPage';
import TransactionsPage from '../pages/customer/TransactionsPage';
import AdminDashboardPage from '../pages/admin/AdminDashboardPage';
import AuditLogsPage from '../pages/admin/AuditLogsPage';
import ProtectedRoute from './ProtectedRoute';
import AdminRoute from './AdminRoute';
import { useAuth } from '../context/AuthContext';

const AppRoutes = () => {
  const { isAuthenticated, isAdmin } = useAuth();

  return (
    <Routes>
      {/* Public Authentication Routes */}
      <Route
        path="/login"
        element={
          isAuthenticated ? (
            <Navigate to={isAdmin ? '/admin/reviews' : '/dashboard'} replace />
          ) : (
            <LoginPage />
          )
        }
      />
      <Route
        path="/register"
        element={
          isAuthenticated ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <RegisterPage />
          )
        }
      />

      {/* Customer Protected Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute requiredRole="customer">
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/beneficiaries"
        element={
          <ProtectedRoute requiredRole="customer">
            <BeneficiariesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/transactions"
        element={
          <ProtectedRoute requiredRole="customer">
            <TransactionsPage />
          </ProtectedRoute>
        }
      />

      {/* Admin Protected Routes */}
      <Route
        path="/admin/reviews"
        element={
          <AdminRoute>
            <AdminDashboardPage />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/dashboard"
        element={<Navigate to="/admin/reviews" replace />}
      />
      <Route
        path="/admin/audit-logs"
        element={
          <AdminRoute>
            <AuditLogsPage />
          </AdminRoute>
        }
      />

      {/* Default route redirect */}
      <Route
        path="/"
        element={
          <Navigate
            to={isAuthenticated ? (isAdmin ? '/admin/reviews' : '/dashboard') : '/login'}
            replace
          />
        }
      />

      {/* Catch-all 404 */}
      <Route
        path="*"
        element={
          <Navigate
            to={isAuthenticated ? (isAdmin ? '/admin/reviews' : '/dashboard') : '/login'}
            replace
          />
        }
      />
    </Routes>
  );
};

export default AppRoutes;
