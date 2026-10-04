import React, { useState } from 'react';
import { PlusCircle, Loader2 } from 'lucide-react';
import Modal from '../common/Modal';
import axiosClient from '../../api/axiosClient';
import { useAuth } from '../../context/AuthContext';

const DepositModal = ({ isOpen, onClose }) => {
  const { refreshWallet } = useAuth();
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const quickAmounts = [1000, 5000, 10000, 25000];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const numeric = parseFloat(amount);
    if (isNaN(numeric) || numeric <= 0) {
      setError('Please enter a valid positive deposit amount');
      return;
    }

    if (numeric > 10000000) {
      setError('Deposit amount exceeds maximum allowable limit of ₹10,000,000');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await axiosClient.post('/wallet/deposit', { amount: numeric });
      if (res.success) {
        setSuccessMsg(`Successfully added ₹${numeric.toLocaleString('en-IN')} to your wallet.`);
        await refreshWallet();
        setTimeout(() => {
          setAmount('');
          setSuccessMsg('');
          onClose();
        }, 1200);
      }
    } catch (err) {
      setError(err.message || 'Deposit failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setAmount('');
    setError('');
    setSuccessMsg('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add Test Funds">
      <form onSubmit={handleSubmit} className="space-y-5">
        <p className="text-xs text-slate-500">
          FraudShield operates on simulated INR funds. Add test funds directly into your account to test payment flows and fraud detection rules.
        </p>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
            {successMsg}
          </div>
        )}

        {/* Amount Input */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Deposit Amount (INR)
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
              ₹
            </span>
            <input
              type="number"
              min="1"
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 5000"
              disabled={isSubmitting}
              className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm font-semibold text-slate-900"
              required
            />
          </div>
        </div>

        {/* Quick Amount Buttons */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Quick Select
          </label>
          <div className="grid grid-cols-4 gap-2">
            {quickAmounts.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setAmount(preset.toString())}
                disabled={isSubmitting}
                className="py-2 px-2.5 rounded-xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/50 text-slate-700 hover:text-indigo-700 text-xs font-semibold transition-all"
              >
                +₹{preset >= 1000 ? `${preset / 1000}k` : preset}
              </button>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-2 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold text-xs transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-200 disabled:opacity-50 transition-all"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <PlusCircle className="w-4 h-4" />
                <span>Confirm Deposit</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default DepositModal;
