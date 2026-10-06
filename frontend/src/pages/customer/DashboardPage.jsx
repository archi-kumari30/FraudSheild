import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Wallet,
  Send,
  Users,
  History,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  PlusCircle,
  Clock,
  Bell
} from 'lucide-react';
import WalletCard from '../../components/customer/WalletCard';
import DepositModal from '../../components/customer/DepositModal';
import SendMoneyModal from '../../components/customer/SendMoneyModal';
import TransactionTable from '../../components/customer/TransactionTable';
import axiosClient from '../../api/axiosClient';
import { useAuth } from '../../context/AuthContext';
import { useAlerts } from '../../context/AlertContext';

const DashboardPage = () => {
  const { user, wallet } = useAuth();
  const { alerts } = useAlerts();

  const [transactions, setTransactions] = useState([]);
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isSendMoneyOpen, setIsSendMoneyOpen] = useState(false);
  const [prefilledRecipient, setPrefilledRecipient] = useState(null);

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const [txRes, benRes] = await Promise.all([
        axiosClient.get('/transactions'),
        axiosClient.get('/beneficiaries')
      ]);

      if (txRes.success && Array.isArray(txRes.data?.transactions)) {
        setTransactions(txRes.data.transactions);
      }
      if (benRes.success && Array.isArray(benRes.data?.beneficiaries)) {
        setBeneficiaries(benRes.data.beneficiaries);
      }
    } catch (err) {
      console.warn('Dashboard data fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const recentTransactions = transactions.slice(0, 5);
  const recentAlerts = alerts.slice(0, 3);
  const pendingActionCount = transactions.filter(
    (t) => t.status === 'CUSTOMER_VERIFICATION_REQUIRED' || t.status === 'FLAGGED_FOR_REVIEW'
  ).length;

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-[#17211D]">
            Welcome, {user?.name?.split(' ')[0] || 'Customer'}
          </h1>
          <p className="text-xs sm:text-sm text-[#5A6E65] mt-1">
            Simulated digital wallet with real-time transparent fraud evaluation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsDepositOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#FAFCFA] hover:bg-[#EDF6F1] text-[#17211D] font-medium text-xs border border-[#D4E2DC] shadow-xs transition-colors"
          >
            <PlusCircle className="w-4 h-4 text-[#285C4D]" />
            <span>Add Money</span>
          </button>
          <button
            onClick={() => {
              setPrefilledRecipient(null);
              setIsSendMoneyOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#285C4D] hover:bg-[#1d453a] text-white font-medium text-xs shadow-xs transition-colors"
          >
            <Send className="w-4 h-4" />
            <span>Send Money</span>
          </button>
        </div>
      </div>

      {/* Main Wallet Card */}
      <WalletCard
        onOpenDeposit={() => setIsDepositOpen(true)}
        onOpenSendMoney={() => {
          setPrefilledRecipient(null);
          setIsSendMoneyOpen(true);
        }}
      />

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          to="/transactions"
          className="bg-[#FAFCFA] border border-[#D4E2DC] hover:border-[#285C4D]/40 p-5 rounded-xl shadow-subtle flex items-center gap-4 transition-all"
        >
          <div className="w-10 h-10 rounded-lg bg-[#EDF6F1] text-[#285C4D] flex items-center justify-center shrink-0">
            <History className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-[#5A6E65] uppercase tracking-wider block">
              Transactions
            </span>
            <span className="text-2xl font-bold font-mono text-[#17211D]">
              {transactions.length}
            </span>
          </div>
        </Link>

        <Link
          to="/beneficiaries"
          className="bg-[#FAFCFA] border border-[#D4E2DC] hover:border-[#285C4D]/40 p-5 rounded-xl shadow-subtle flex items-center gap-4 transition-all"
        >
          <div className="w-10 h-10 rounded-lg bg-[#EDF6F1] text-[#285C4D] flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-[#5A6E65] uppercase tracking-wider block">
              Beneficiaries
            </span>
            <span className="text-2xl font-bold font-mono text-[#17211D]">
              {beneficiaries.length}
            </span>
          </div>
        </Link>

        <Link
          to="/wallet"
          className="bg-[#FAFCFA] border border-[#D4E2DC] hover:border-[#C89445]/40 p-5 rounded-xl shadow-subtle flex items-center gap-4 transition-all"
        >
          <div className="w-10 h-10 rounded-lg bg-[#FAF4EB] text-[#C89445] flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-[#5A6E65] uppercase tracking-wider block">
              Held in Escrow
            </span>
            <span className="text-2xl font-bold font-mono text-[#946625]">
              {pendingActionCount}
            </span>
          </div>
        </Link>

        <Link
          to="/security"
          className="bg-[#FAFCFA] border border-[#D4E2DC] hover:border-[#285C4D]/40 p-5 rounded-xl shadow-subtle flex items-center gap-4 transition-all"
        >
          <div className="w-10 h-10 rounded-lg bg-[#EAF3EF] text-[#285C4D] flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-[#5A6E65] uppercase tracking-wider block">
              Security Status
            </span>
            <span className="text-sm font-bold text-[#1E473B] block mt-1">
              Protected
            </span>
          </div>
        </Link>
      </div>

      {/* Security Alerts Section */}
      {recentAlerts.length > 0 && (
        <div className="bg-[#FAFCFA] border border-[#D4E2DC] rounded-xl p-5 shadow-subtle">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#C89445]" />
              <h2 className="text-sm font-semibold text-[#17211D]">Security Notices</h2>
            </div>
            <Link to="/alerts" className="text-xs text-[#285C4D] hover:underline flex items-center gap-1">
              <span>View all alerts</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2.5">
            {recentAlerts.map((alert) => (
              <div
                key={alert._id}
                className="p-3 rounded-lg bg-[#FAF4EB] border border-[#EAD7BA] flex items-start justify-between gap-3 text-xs"
              >
                <div>
                  <div className="font-semibold text-[#946625]">{alert.title}</div>
                  <div className="text-[#5A6E65] mt-0.5">{alert.message}</div>
                </div>
                <span className="text-[10px] text-[#5A6E65] shrink-0 font-mono">
                  {new Date(alert.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Transactions Section */}
      <div className="bg-[#FAFCFA] border border-[#D4E2DC] rounded-xl p-5 shadow-subtle">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-[#17211D]">Recent Transactions</h2>
          <Link to="/transactions" className="text-xs text-[#285C4D] hover:underline flex items-center gap-1">
            <span>View all transactions</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <TransactionTable
          transactions={recentTransactions}
          loading={loading}
          currentUserId={user?._id || user?.id}
          onRefresh={loadDashboardData}
        />
      </div>

      {/* Modals */}
      <DepositModal
        isOpen={isDepositOpen}
        onClose={() => {
          setIsDepositOpen(false);
          loadDashboardData();
        }}
      />

      <SendMoneyModal
        isOpen={isSendMoneyOpen}
        onClose={() => {
          setIsSendMoneyOpen(false);
          loadDashboardData();
        }}
        prefilledRecipient={prefilledRecipient}
      />
    </div>
  );
};

export default DashboardPage;
