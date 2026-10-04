import React from 'react';
import { Wallet, ArrowUpRight, Plus, ShieldCheck, Lock } from 'lucide-react';
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

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 shadow-xl border border-indigo-900/50">
      {/* Background Decorative Rings */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-indigo-500/10 blur-2xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full bg-blue-500/10 blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-indigo-300 text-xs font-semibold tracking-wider uppercase">
            <Wallet className="w-4 h-4" />
            <span>Simulated INR Digital Wallet</span>
          </div>

          <div className="mt-4">
            <span className="text-xs text-slate-400 font-medium">Available Balance</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mt-1">
              {formatINR(availableBalance)}
            </h2>
          </div>

          {/* Escrow Held Balance Notice */}
          <div className="mt-4 flex items-center gap-2 bg-slate-800/80 border border-slate-700/60 px-3.5 py-1.5 rounded-xl w-fit">
            <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-xs text-slate-300">
              Reserved in Escrow: <strong className="text-amber-400 font-semibold">{formatINR(heldBalance)}</strong>
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap sm:flex-nowrap gap-3 items-center">
          <button
            onClick={onOpenDeposit}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm backdrop-blur-sm border border-white/10 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4 text-indigo-300" />
            <span>Add Funds</span>
          </button>

          <button
            onClick={onOpenSendMoney}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Send Money</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default WalletCard;
