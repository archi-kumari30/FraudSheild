import React, { useState } from 'react';
import { KeyRound, Lock, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import Modal from '../common/Modal';
import axiosClient from '../../api/axiosClient';

const TransactionPinModal = ({ isOpen, onClose, onPinConfigured, hasExistingPin = false }) => {
  const [isResetMode, setIsResetMode] = useState(false);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleClose = () => {
    if (isSubmitting) return;
    setPin('');
    setConfirmPin('');
    setCurrentPassword('');
    setError('');
    setSuccessMsg('');
    setIsResetMode(false);
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!/^\d{6}$/.test(pin)) {
      setError('Transaction PIN must be exactly 6 digits.');
      return;
    }

    if (pin !== confirmPin) {
      setError('Confirmation PIN does not match.');
      return;
    }

    if (!currentPassword) {
      setError('Account password is required to verify your identity.');
      return;
    }

    setIsSubmitting(true);
    try {
      const endpoint = isResetMode ? '/auth/pin/reset' : '/auth/pin';
      const payload = isResetMode
        ? { password: currentPassword, newPin: pin }
        : { pin, currentPassword };

      const res = await axiosClient.post(endpoint, payload);

      if (res.success) {
        setSuccessMsg(
          isResetMode
            ? '6-digit transaction PIN reset successfully!'
            : '6-digit transaction PIN saved successfully!'
        );
        if (onPinConfigured) onPinConfigured();
        setTimeout(() => {
          handleClose();
        }, 1200);
      }
    } catch (err) {
      setError(err.message || 'Failed to configure transaction PIN.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isResetMode ? 'Reset Transaction PIN' : (hasExistingPin ? 'Change Transaction PIN' : 'Set Up Transaction PIN')}
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <p className="text-[#5A6E65] leading-relaxed">
          {isResetMode
            ? 'Reset your 6-digit transaction PIN by re-authenticating with your account password.'
            : 'Your 6-digit transaction PIN acts as mandatory authorization for outbound transfers.'}
        </p>

        {error && (
          <div className="p-3 rounded-xl bg-[#FAF4EB] border border-[#EAD7BA] text-[#946625] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-[#C89445]" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-xl bg-[#EAF3EF] border border-[#C8DCD2] text-[#1E473B] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-[#285C4D]" />
            <span>{successMsg}</span>
          </div>
        )}

        <div className="space-y-1">
          <label className="font-semibold text-[#17211D] block">
            {isResetMode ? 'New 6-Digit PIN' : '6-Digit PIN'}
          </label>
          <div className="relative">
            <input
              type="password"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              placeholder="••••••"
              className="w-full px-3 py-2.5 rounded-xl bg-white border border-[#D4E2DC] text-center font-mono text-lg tracking-widest text-[#17211D] focus:outline-none focus:border-[#285C4D]"
              required
            />
            <KeyRound className="w-4 h-4 text-[#5A6E65] absolute left-3 top-3 pointer-events-none" />
          </div>
        </div>

        <div className="space-y-1">
          <label className="font-semibold text-[#17211D] block">
            {isResetMode ? 'Confirm New 6-Digit PIN' : 'Confirm 6-Digit PIN'}
          </label>
          <input
            type="password"
            maxLength={6}
            value={confirmPin}
            onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
            placeholder="••••••"
            className="w-full px-3 py-2.5 rounded-xl bg-white border border-[#D4E2DC] text-center font-mono text-lg tracking-widest text-[#17211D] focus:outline-none focus:border-[#285C4D]"
            required
          />
        </div>

        <div className="space-y-1 pt-1">
          <label className="font-semibold text-[#17211D] block">
            Account Password (for identity verification)
          </label>
          <div className="relative">
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter account password"
              className="w-full px-3 py-2.5 rounded-xl bg-white border border-[#D4E2DC] text-xs text-[#17211D] focus:outline-none focus:border-[#285C4D]"
              required
            />
            <Lock className="w-4 h-4 text-[#5A6E65] absolute right-3 top-3 pointer-events-none" />
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-[#D4E2DC]">
          <div>
            {hasExistingPin && !isResetMode && (
              <button
                type="button"
                onClick={() => {
                  setIsResetMode(true);
                  setError('');
                }}
                className="text-[11px] text-[#285C4D] hover:underline font-semibold"
              >
                Forgot PIN?
              </button>
            )}
            {isResetMode && (
              <button
                type="button"
                onClick={() => {
                  setIsResetMode(false);
                  setError('');
                }}
                className="text-[11px] text-[#285C4D] hover:underline font-semibold"
              >
                Back to Change PIN
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-[#D4E2DC] text-[#5A6E65] hover:bg-[#F4F8F5]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || pin.length !== 6 || confirmPin.length !== 6 || !currentPassword}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-[#285C4D] text-white hover:bg-[#1d453a] transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <KeyRound className="w-3.5 h-3.5" />}
              <span>{isResetMode ? 'Reset PIN' : 'Save PIN'}</span>
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default TransactionPinModal;
