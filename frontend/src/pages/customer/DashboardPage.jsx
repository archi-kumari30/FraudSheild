import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../../components/common/Navbar';
import WalletCard from '../../components/customer/WalletCard';
import DepositModal from '../../components/customer/DepositModal';
import SendMoneyModal from '../../components/customer/SendMoneyModal';
import BeneficiaryList from '../../components/customer/BeneficiaryList';
import TransactionTable from '../../components/customer/TransactionTable';
import axiosClient from '../../api/axiosClient';
import { useAuth } from '../../context/AuthContext';
import { AlertCircle } from 'lucide-react';

const DashboardPage = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loadingTx, setLoadingTx] = useState(true);
  const [networkError, setNetworkError] = useState(false);

  // Modals state
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isSendMoneyOpen, setIsSendMoneyOpen] = useState(false);
  const [prefilledRecipient, setPrefilledRecipient] = useState(null);

  const fetchTransactions = useCallback(async () => {
    try {
      setLoadingTx(true);
      setNetworkError(false);
      const res = await axiosClient.get('/transactions');
      if (res.success && Array.isArray(res.data?.transactions)) {
        setTransactions(res.data.transactions);
      }
    } catch (err) {
      if (err.isNetworkError) {
        setNetworkError(true);
      }
      console.warn('Failed to load transactions:', err.message);
    } finally {
      setLoadingTx(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleSelectSendTo = (recipientId) => {
    setPrefilledRecipient(recipientId);
    setIsSendMoneyOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      {/* Network Alert Banner (EC-M10-006) */}
      {networkError && (
        <div className="bg-rose-500 text-white px-4 py-2.5 text-xs font-semibold flex items-center justify-center gap-2 shadow-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Unable to reach FraudShield servers. Please verify the backend service is running.</span>
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Welcome back, {user?.name?.split(' ')[0] || 'Customer'}! 👋
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Monitor your digital wallet, send simulated payments, and review transaction safety status.
            </p>
          </div>
        </div>

        {/* Wallet Balance Hero Card */}
        <WalletCard
          onOpenDeposit={() => setIsDepositOpen(true)}
          onOpenSendMoney={() => {
            setPrefilledRecipient(null);
            setIsSendMoneyOpen(true);
          }}
        />

        {/* Beneficiaries Section */}
        <BeneficiaryList onSelectSend={handleSelectSendTo} />

        {/* Transactions Table Section */}
        <TransactionTable
          transactions={transactions}
          loading={loadingTx}
        />
      </main>

      {/* Modals */}
      <DepositModal
        isOpen={isDepositOpen}
        onClose={() => setIsDepositOpen(false)}
      />

      <SendMoneyModal
        isOpen={isSendMoneyOpen}
        onClose={() => {
          setIsSendMoneyOpen(false);
          setPrefilledRecipient(null);
        }}
        initialRecipient={prefilledRecipient}
        onSuccess={fetchTransactions}
      />
    </div>
  );
};

export default DashboardPage;
