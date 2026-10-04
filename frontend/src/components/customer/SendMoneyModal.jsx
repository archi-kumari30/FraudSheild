import React, { useState, useEffect } from 'react';
import { Send, CheckCircle2, AlertTriangle, ShieldAlert, Loader2, ArrowRight } from 'lucide-react';
import Modal from '../common/Modal';
import axiosClient from '../../api/axiosClient';
import { useAuth } from '../../context/AuthContext';
import { useAlerts } from '../../context/AlertContext';

const SendMoneyModal = ({ isOpen, onClose, initialRecipient = null, onSuccess }) => {
  const { wallet, refreshWallet } = useAuth();
  const { fetchAlerts } = useAlerts();

  const [beneficiaries, setBeneficiaries] = useState([]);
  const [recipientMode, setRecipientMode] = useState('saved'); // 'saved' or 'custom'
  const [selectedRecipientId, setSelectedRecipientId] = useState('');
  const [customRecipientInput, setCustomRecipientInput] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [outcome, setOutcome] = useState(null); // { status, message, transaction }

  // Load beneficiaries for quick selection
  useEffect(() => {
    if (isOpen) {
      axiosClient
        .get('/beneficiaries')
        .then((res) => {
          if (res.success && Array.isArray(res.data?.beneficiaries)) {
            setBeneficiaries(res.data.beneficiaries);
            if (initialRecipient) {
              const match = res.data.beneficiaries.find(
                (b) =>
                  b.recipientAccountId?._id === initialRecipient ||
                  b.recipientAccountId === initialRecipient
              );
              if (match) {
                setRecipientMode('saved');
                setSelectedRecipientId(match.recipientAccountId._id || match.recipientAccountId);
              } else {
                setRecipientMode('custom');
                setCustomRecipientInput(initialRecipient);
              }
            } else if (res.data.beneficiaries.length > 0) {
              const firstId =
                res.data.beneficiaries[0].recipientAccountId?._id ||
                res.data.beneficiaries[0].recipientAccountId;
              setSelectedRecipientId(firstId);
            }
          }
        })
        .catch((err) => console.warn('Could not fetch beneficiaries:', err.message));
    }
  }, [isOpen, initialRecipient]);

  const resetForm = () => {
    setAmount('');
    setNote('');
    setFormError('');
    setOutcome(null);
    setIsSubmitting(false);
  };

  const handleClose = () => {
    if (isSubmitting) return;
    resetForm();
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    // Prevent double submissions (EC-M10-003)
    if (isSubmitting) return;

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setFormError('Please enter a valid positive transfer amount');
      return;
    }

    if (wallet && numericAmount > wallet.availableBalance) {
      setFormError(`Insufficient available balance (₹${wallet.availableBalance.toLocaleString('en-IN')})`);
      return;
    }

    let targetRecipientId = selectedRecipientId;
    if (recipientMode === 'custom') {
      const trimmed = customRecipientInput.trim();
      if (!trimmed) {
        setFormError('Please enter recipient email or Account ID');
        return;
      }
      targetRecipientId = trimmed;
    }

    if (!targetRecipientId) {
      setFormError('Please select or specify a recipient');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await axiosClient.post('/transactions', {
        recipientId: targetRecipientId,
        amount: numericAmount,
        note: note.trim()
      });

      const txStatus = res.data?.status || res.data?.transaction?.status || 'APPROVED';
      const txData = res.data?.transaction || {};

      setOutcome({
        status: txStatus,
        transaction: txData
      });

      // Synchronize wallet and alerts
      await refreshWallet();
      await fetchAlerts();
      if (onSuccess) onSuccess();
    } catch (err) {
      if (err.data?.status === 'BLOCKED' || err.status === 'BLOCKED') {
        // High Risk Blocked
        setOutcome({
          status: 'BLOCKED',
          transaction: err.data?.transaction || null,
          message: err.message || 'Transaction blocked due to elevated security risk.'
        });
        await fetchAlerts();
      } else {
        setFormError(err.message || 'Failed to initiate transfer. Please check recipient details.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={outcome ? 'Transfer Receipt' : 'Send Money'}
      maxWidth="max-w-lg"
    >
      {outcome ? (
        /* Outcome View */
        <div className="py-2 space-y-5 text-center">
          {outcome.status === 'APPROVED' && (
            <div className="space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-bold text-slate-900">Payment Completed!</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Your transfer of <strong className="text-slate-800">₹{parseFloat(amount).toLocaleString('en-IN')}</strong> has been approved and credited instantly.
              </p>
            </div>
          )}

          {outcome.status === 'FLAGGED_FOR_REVIEW' && (
            <div className="space-y-3">
              <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-bold text-slate-900">Held in Security Escrow</h4>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-left">
                <p className="text-xs text-amber-900 leading-relaxed">
                  Your transfer of <strong>₹{parseFloat(amount).toLocaleString('en-IN')}</strong> is undergoing standard security review. Your funds have been temporarily reserved in escrow and will be settled upon verification.
                </p>
              </div>
            </div>
          )}

          {outcome.status === 'BLOCKED' && (
            <div className="space-y-3">
              <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-bold text-slate-900">Payment Blocked for Security</h4>
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-left">
                <p className="text-xs text-rose-900 leading-relaxed">
                  This transaction was halted to protect your account. No funds were debited from your wallet. If you believe this is in error, please contact FraudShield customer support.
                </p>
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 flex justify-center">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      ) : (
        /* Form View */
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              {formError}
            </div>
          )}

          {/* Recipient Selection Toggle */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Recipient
              </label>
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[11px] font-semibold text-slate-600">
                <button
                  type="button"
                  onClick={() => setRecipientMode('saved')}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    recipientMode === 'saved' ? 'bg-white text-indigo-600 shadow-sm' : ''
                  }`}
                >
                  Saved Contacts
                </button>
                <button
                  type="button"
                  onClick={() => setRecipientMode('custom')}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    recipientMode === 'custom' ? 'bg-white text-indigo-600 shadow-sm' : ''
                  }`}
                >
                  Enter Details
                </button>
              </div>
            </div>

            {recipientMode === 'saved' ? (
              beneficiaries.length > 0 ? (
                <select
                  value={selectedRecipientId}
                  onChange={(e) => setSelectedRecipientId(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium text-slate-800"
                >
                  {beneficiaries.map((b) => {
                    const id = b.recipientAccountId?._id || b.recipientAccountId;
                    const name = b.nickname || b.recipientAccountId?.name || 'Contact';
                    const email = b.recipientAccountId?.email ? ` (${b.recipientAccountId.email})` : '';
                    return (
                      <option key={b._id} value={id}>
                        {name} {email}
                      </option>
                    );
                  })}
                </select>
              ) : (
                <div className="p-3 rounded-xl border border-dashed border-slate-200 text-xs text-slate-500 text-center">
                  No saved beneficiaries yet.{' '}
                  <button
                    type="button"
                    onClick={() => setRecipientMode('custom')}
                    className="text-indigo-600 font-semibold underline"
                  >
                    Enter email directly
                  </button>
                </div>
              )
            ) : (
              <input
                type="text"
                value={customRecipientInput}
                onChange={(e) => setCustomRecipientInput(e.target.value)}
                placeholder="Recipient User ID or registered Email"
                disabled={isSubmitting}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium text-slate-800"
                required
              />
            )}
          </div>

          {/* Amount Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Amount (INR)
              </label>
              <span className="text-[11px] text-slate-400">
                Max:{' '}
                <strong className="text-slate-600">
                  ₹{wallet?.availableBalance?.toLocaleString('en-IN') || 0}
                </strong>
              </span>
            </div>
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
                placeholder="e.g. 2500"
                disabled={isSubmitting}
                className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold text-slate-900"
                required
              />
            </div>
          </div>

          {/* Note Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Transfer Note (Optional)
            </label>
            <input
              type="text"
              maxLength="100"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Project invoice settlement"
              disabled={isSubmitting}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-slate-700"
            />
          </div>

          {/* Submit Actions */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
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
                  <span>Evaluating Risk & Sending...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Send Payment</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};

export default SendMoneyModal;
