import React, { useState, useEffect, useCallback } from 'react';
import {
  Wallet,
  PlusCircle,
  Send,
  Clock,
  ShieldCheck,
  ArrowUpRight,
  ArrowDownLeft,
  Info
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import axiosClient from '../../api/axiosClient';
import DepositModal from '../../components/customer/DepositModal';
import SendMoneyModal from '../../components/customer/SendMoneyModal';
import StatusBadge from '../../components/common/StatusBadge';

const WalletPage = () => {
  const { wallet, refreshWallet, user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isSendMoneyOpen, setIsSendMoneyOpen] = useState(false);

  const loadWalletData = useCallback(async () => {
    setLoading(true);
    try {
      await refreshWallet();
      const res = await axiosClient.get('/transactions');
      if (res.success && Array.isArray(res.data?.transactions)) {
        setTransactions(res.data.transactions);
      }
    } catch (err) {
      console.warn('Failed to refresh wallet activity:', err.message);
    } finally {
      setLoading(false);
    }
  }, [refreshWallet]);

  useEffect(() => {
    loadWalletData();
  }, [loadWalletData]);

  const formatINR = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(val || 0);
  };

  const availableBalance = wallet?.availableBalance ?? 0;
  const heldBalance = wallet?.heldBalance ?? 0;
  const totalBalance = availableBalance + heldBalance;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-[#17211D]">
            Digital Wallet
          </h1>
          <p className="text-xs sm:text-sm text-[#5A6E65] mt-1">
            Simulated INR balances, real-time escrow hold ledger, and instant deposit controls.
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
            onClick={() => setIsSendMoneyOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#285C4D] hover:bg-[#1d453a] text-white font-medium text-xs shadow-xs transition-colors"
          >
            <Send className="w-4 h-4" />
            <span>Send Payment</span>
          </button>
        </div>
      </div>

      {/* Balances Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Available Balance */}
        <div className="p-6 rounded-xl bg-[#FAFCFA] border border-[#D4E2DC] shadow-card space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#5A6E65]">
              Available Balance
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#EDF6F1] text-[#285C4D] flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold font-mono text-[#17211D]">
            {formatINR(availableBalance)}
          </div>
          <p className="text-[11px] text-[#5A6E65]">
            Unrestricted liquid balance ready for transfers.
          </p>
        </div>

        {/* Escrow Held Balance */}
        <div className="p-6 rounded-xl bg-[#FAF4EB] border border-[#EAD7BA] shadow-card space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#946625]">
              Escrow Held Balance
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#F3E7D3] text-[#C89445] flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold font-mono text-[#946625]">
            {formatINR(heldBalance)}
          </div>
          <p className="text-[11px] text-[#946625]/80">
            Quarantined in escrow pending security review.
          </p>
        </div>

        {/* Total Balance */}
        <div className="p-6 rounded-xl bg-[#EDF6F1] border border-[#D4E2DC] shadow-card space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#285C4D]">
              Total Account Value
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#DCEBE4] text-[#285C4D] flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold font-mono text-[#17211D]">
            {formatINR(totalBalance)}
          </div>
          <p className="text-[11px] text-[#5A6E65]">
            Simulated Internal Sandbox Ledger.
          </p>
        </div>
      </div>

      {/* Escrow Explanation Notice */}
      <div className="p-4 rounded-xl bg-[#FAFCFA] border border-[#D4E2DC] shadow-subtle flex items-start gap-3 text-xs">
        <Info className="w-4 h-4 text-[#285C4D] shrink-0 mt-0.5" />
        <div className="text-[#5A6E65] leading-relaxed">
          <strong className="text-[#17211D]">How Escrow Works: </strong>
          When a transfer scores between 31 and 70 (Medium Risk), funds are moved from your Available Balance to your Held Balance. The recipient is not credited. Once an analyst approves the transfer, the held funds settle to the recipient. If rejected, funds are immediately restored to your Available Balance.
        </div>
      </div>

      {/* Modals */}
      <DepositModal
        isOpen={isDepositOpen}
        onClose={() => {
          setIsDepositOpen(false);
          loadWalletData();
        }}
      />

      <SendMoneyModal
        isOpen={isSendMoneyOpen}
        onClose={() => {
          setIsSendMoneyOpen(false);
          loadWalletData();
        }}
      />
    </div>
  );
};

export default WalletPage;
