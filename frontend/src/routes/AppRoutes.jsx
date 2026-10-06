import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from '../pages/public/LandingPage';
import SecurityTrustPage from '../pages/public/SecurityTrustPage';
import LoginPage from '../pages/customer/LoginPage';
import RegisterPage from '../pages/customer/RegisterPage';
import ForgotPasswordPage from '../pages/customer/ForgotPasswordPage';
import ResetPasswordPage from '../pages/customer/ResetPasswordPage';
import CustomerLayout from '../layouts/CustomerLayout';
import DashboardPage from '../pages/customer/DashboardPage';
import WalletPage from '../pages/customer/WalletPage';
import SendMoneyPage from '../pages/customer/SendMoneyPage';
import BeneficiariesPage from '../pages/customer/BeneficiariesPage';
import TransactionsPage from '../pages/customer/TransactionsPage';
import AlertsPage from '../pages/customer/AlertsPage';
import CustomerSettingsPage from '../pages/customer/SettingsPage';
import SecurityPage from '../pages/customer/SecurityPage';
import AdminLayout from '../layouts/AdminLayout';
import AdminOverviewPage from '../pages/admin/AdminOverviewPage';
import AdminDashboardPage from '../pages/admin/AdminDashboardPage';
import AdminTransactionsPage from '../pages/admin/AdminTransactionsPage';
import TransactionInvestigationPage from '../pages/admin/TransactionInvestigationPage';
import AdminAlertsPage from '../pages/admin/AdminAlertsPage';
import AuditLogsPage from '../pages/admin/AuditLogsPage';
import AdminHealthPage from '../pages/admin/AdminHealthPage';
import SecurityRulesPage from '../pages/admin/SecurityRulesPage';
import AiInvestigationPage from '../pages/admin/AiInvestigationPage';
import ProtectedRoute from './ProtectedRoute';
import AdminRoute from './AdminRoute';
import { useAuth } from '../context/AuthContext';

const AppRoutes = () => {
  const { isAuthenticated, isAdmin } = useAuth();

  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/security-trust" element={<SecurityTrustPage />} />

      {/* Authentication Pages */}
      <Route
        path="/login"
        element={
          isAuthenticated ? (
            <Navigate to={isAdmin ? '/admin/dashboard' : '/dashboard'} replace />
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
      <Route
        path="/forgot-password"
        element={
          isAuthenticated ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <ForgotPasswordPage />
          )
        }
      />
      <Route
        path="/reset-password"
        element={
          isAuthenticated ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <ResetPasswordPage />
          )
        }
      />

      {/* Customer Protected Layout & Subroutes */}
      <Route
        element={
          <ProtectedRoute requiredRole="customer">
            <CustomerLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/wallet" element={<WalletPage />} />
        <Route path="/send-money" element={<SendMoneyPage />} />
        <Route path="/beneficiaries" element={<BeneficiariesPage />} />
        <Route path="/transactions" element={<TransactionsPage />} />
        <Route path="/alerts" element={<AlertsPage />} />
        <Route path="/security" element={<SecurityPage />} />
        <Route path="/settings" element={<CustomerSettingsPage />} />
      </Route>

      {/* Admin Protected Layout & Subroutes */}
      <Route
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      >
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/admin/dashboard" element={<AdminOverviewPage />} />
        <Route path="/admin/reviews" element={<AdminDashboardPage />} />
        <Route path="/admin/transactions" element={<AdminTransactionsPage />} />
        <Route path="/admin/transactions/:id" element={<TransactionInvestigationPage />} />
        <Route path="/admin/investigation/:id" element={<TransactionInvestigationPage />} />
        <Route path="/admin/alerts" element={<AdminAlertsPage />} />
        <Route path="/admin/audit-logs" element={<AuditLogsPage />} />
        <Route path="/admin/health" element={<AdminHealthPage />} />
        <Route path="/admin/rules" element={<SecurityRulesPage />} />
        <Route path="/admin/settings" element={<SecurityRulesPage />} />
        <Route path="/admin/ai-investigation" element={<AiInvestigationPage />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
