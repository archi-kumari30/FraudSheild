import React from 'react';
import { Wallet, Plus, Clock, ShieldCheck, Send } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const WalletCard = ({ onOpenDeposit, onOpenSendMoney }) => {
  const { wallet } = useAuth();

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
    <div className="rounded-xl bg-[#FAFCFA] text-[#17211D] p-6 sm:p-7 shadow-card border border-[#D4E2DC]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-[#285C4D] text-xs font-semibold tracking-wider uppercase">
            <Wallet className="w-4 h-4" />
            <span>Simulated Digital Wallet</span>
          </div>

          <div className="mt-3">
            <span className="text-xs text-[#5A6E65] font-medium">Available Balance</span>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight text-[#17211D] mt-0.5 font-mono">
              {formatINR(availableBalance)}
            </h2>
          </div>

          {/* Escrow Held Balance & Total Balance */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-[#FAF4EB] border border-[#EAD7BA] px-3.5 py-1.5 rounded-lg">
              <Clock className="w-3.5 h-3.5 text-[#C89445] shrink-0" />
              <span className="text-xs text-[#946625]">
                Held in Escrow: <strong className="font-semibold font-mono">{formatINR(heldBalance)}</strong>
              </span>
            </div>

            <div className="flex items-center gap-2 bg-[#EDF6F1] border border-[#D4E2DC] px-3.5 py-1.5 rounded-lg text-xs text-[#5A6E65]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#285C4D] shrink-0" />
              <span>Total Balance:</span>
              <span className="text-[#17211D] font-semibold font-mono">{formatINR(totalBalance)}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap sm:flex-nowrap gap-3 items-center">
          <button
            onClick={onOpenDeposit}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#EDF6F1] hover:bg-[#DCEBE4] text-[#285C4D] font-medium text-xs border border-[#D4E2DC] transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Money</span>
          </button>

          <button
            onClick={onOpenSendMoney}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#285C4D] hover:bg-[#1d453a] text-white font-medium text-xs shadow-xs transition-colors"
          >
            <Send className="w-4 h-4" />
            <span>Send Payment</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default WalletCard;
