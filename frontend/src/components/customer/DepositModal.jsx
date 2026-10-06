import React, { useState } from 'react';
import { PlusCircle, Loader2 } from 'lucide-react';
import Modal from '../common/Modal';
import axiosClient from '../../api/axiosClient';
import { useAuth } from '../../context/AuthContext';

const DepositModal = ({ isOpen, onClose, onSuccess }) => {
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
        setSuccessMsg(`Successfully credited ₹${numeric.toLocaleString('en-IN')} to your Simulated Wallet.`);
        await refreshWallet();
        if (typeof onSuccess === 'function') {
          onSuccess(numeric);
        }
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
    <Modal isOpen={isOpen} onClose={handleClose} title="Add Funds to Simulated Wallet">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3 rounded-lg bg-[#EAF3EF] border border-[#C8DCD2] text-[#1E473B] text-xs">
          <strong className="font-semibold block mb-0.5">Simulated Wallet (Demo Balance)</strong>
          <span>
            This is a simulated internal balance used to test transfers and fraud rules. No real money or bank accounts are debited.
          </span>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-[#FBF0EF] border border-[#E6BFBD] text-[#8C3E3A] text-xs font-medium">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-lg bg-[#EAF3EF] border border-[#C8DCD2] text-[#1E473B] text-xs font-medium flex items-center gap-2">
            <span>{successMsg}</span>
          </div>
        )}

        {/* Amount Input */}
        <div>
          <label className="block text-xs font-semibold text-[#17211D] mb-1.5">
            Deposit Amount (INR)
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5A6E65] font-semibold text-sm">
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
              className="w-full pl-8 pr-4 py-2.5 rounded-lg bg-[#FAFCFA] border border-[#D4E2DC] focus:border-[#285C4D] focus:outline-none focus:ring-1 focus:ring-[#285C4D] text-sm font-semibold text-[#17211D] placeholder-[#5A6E65]/60"
              required
            />
          </div>
        </div>

        {/* Quick Amount Buttons */}
        <div>
          <label className="block text-[11px] font-semibold text-[#5A6E65] uppercase tracking-wider mb-2">
            Quick Select
          </label>
          <div className="grid grid-cols-4 gap-2">
            {quickAmounts.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setAmount(preset.toString())}
                disabled={isSubmitting}
                className="py-2 px-2 rounded-lg bg-[#FAFCFA] border border-[#D4E2DC] hover:border-[#285C4D] hover:bg-[#DCEBE4] text-[#17211D] text-xs font-semibold transition-all"
              >
                +₹{preset >= 1000 ? `${preset / 1000}k` : preset}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-3 flex items-center justify-end gap-3 border-t border-[#D4E2DC]">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg border border-[#D4E2DC] text-[#5A6E65] hover:text-[#17211D] hover:bg-[#EDF6F1] font-medium text-xs transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-[#285C4D] hover:bg-[#1d453a] text-white font-medium text-xs shadow-sm disabled:opacity-50 transition-all"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <PlusCircle className="w-4 h-4" />
                <span>Add to Simulated Wallet</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default DepositModal;
