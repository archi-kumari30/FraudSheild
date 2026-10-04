import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from '../pages/customer/LoginPage';
import RegisterPage from '../pages/customer/RegisterPage';
import DashboardPage from '../pages/customer/DashboardPage';
import BeneficiariesPage from '../pages/customer/BeneficiariesPage';
import TransactionsPage from '../pages/customer/TransactionsPage';
import ProtectedRoute from './ProtectedRoute';
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

      {/* Default redirect */}
      <Route
        path="/"
        element={
          <Navigate
            to={isAuthenticated ? (isAdmin ? '/admin/reviews' : '/dashboard') : '/login'}
            replace
          />
        }
      />

      {/* 404 fallback */}
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
