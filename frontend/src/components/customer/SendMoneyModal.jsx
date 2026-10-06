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
  const [outcome, setOutcome] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState('');

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
                  b.recipientAccountId === initialRecipient ||
                  b._id === initialRecipient
              );
              if (match) {
                setRecipientMode('saved');
                setSelectedRecipientId(match.recipientAccountId?._id || match.recipientAccountId);
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
    setIsVerifying(false);
    setVerificationError('');
  };

  const handleClose = () => {
    if (isSubmitting || isVerifying) return;
    resetForm();
    onClose();
  };

  const handleConfirmPayment = async () => {
    if (!outcome?.transaction?._id) return;
    setIsVerifying(true);
    setVerificationError('');
    try {
      const res = await axiosClient.post(`/transactions/${outcome.transaction._id}/confirm`);
      if (res.success && res.data) {
        setOutcome((prev) => ({
          ...prev,
          status: res.data.status || 'APPROVED',
          transaction: res.data.transaction
        }));
        await refreshWallet();
        await fetchAlerts();
        if (onSuccess) onSuccess();
      }
    } catch (err) {
      if (err.data?.status === 'BLOCKED' || err.status === 'BLOCKED') {
        setOutcome((prev) => ({
          ...prev,
          status: 'BLOCKED',
          transaction: err.data?.transaction || prev.transaction
        }));
        await refreshWallet();
        await fetchAlerts();
      } else {
        setVerificationError(err.message || 'Verification failed. Please try again.');
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

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

      await refreshWallet();
      await fetchAlerts();
      if (onSuccess) onSuccess();
    } catch (err) {
      if (err.data?.status === 'BLOCKED' || err.status === 'BLOCKED') {
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
      title={outcome ? 'Transfer Outcome Receipt' : 'Send Payment'}
      maxWidth="max-w-lg"
    >
      {outcome ? (
        <div className="py-2 space-y-5 text-center text-[#17211D]">
          {outcome.status === 'APPROVED' && (
            <div className="space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-[#EAF3EF] border border-[#C8DCD2] text-[#285C4D] flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-bold text-[#17211D]">Payment Approved</h4>
              <p className="text-xs text-[#5A6E65] max-w-sm mx-auto leading-relaxed">
                Your transfer of <strong className="text-[#285C4D] font-mono font-bold">₹{parseFloat(amount).toLocaleString('en-IN')}</strong> has cleared with low risk and settled immediately.
              </p>
            </div>
          )}

          {outcome.status === 'CUSTOMER_VERIFICATION_REQUIRED' && (
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-[#FAF4EB] border border-[#EAD7BA] text-[#C89445] flex items-center justify-center mx-auto">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-bold text-[#946625]">Additional Verification Required</h4>
              <div className="bg-[#FAF4EB] border border-[#EAD7BA] rounded-xl p-3.5 text-left text-xs text-[#946625] leading-relaxed space-y-2">
                <p className="font-semibold text-[#17211D]">
                  Your payment is temporarily on hold while we verify that you initiated this transaction.
                </p>
                <p className="text-[#5A6E65]">
                  FraudShield detected unusual activity. Please confirm that you initiated this payment.
                </p>
                <div className="text-[11px] text-[#5A6E65] space-y-0.5 pt-1 border-t border-[#EAD7BA]/60">
                  <div>• Amount: <strong className="text-[#17211D] font-mono">₹{parseFloat(amount).toLocaleString('en-IN')}</strong> (held in escrow).</div>
                  <div>• Recipient has received ₹0 until you confirm.</div>
                </div>
              </div>

              {verificationError && (
                <div className="p-2.5 rounded-lg bg-[#FBF0EF] border border-[#E6BFBD] text-[#8C3E3A] text-xs font-semibold">
                  {verificationError}
                </div>
              )}

              <div className="pt-2 flex justify-center">
                <button
                  type="button"
                  onClick={handleConfirmPayment}
                  disabled={isVerifying}
                  className="px-6 py-2.5 rounded-lg bg-[#285C4D] hover:bg-[#1d453a] text-white font-medium text-xs transition-colors shadow-xs flex items-center gap-2 disabled:opacity-50"
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Verifying & Settling...</span>
                    </>
                  ) : (
                    <span>Confirm Payment</span>
                  )}
                </button>
              </div>
            </div>
          )}

          {outcome.status === 'FLAGGED_FOR_REVIEW' && (
            <div className="space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-[#FAF4EB] border border-[#EAD7BA] text-[#C89445] flex items-center justify-center mx-auto">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-bold text-[#946625]">Held in Escrow for Review</h4>
              <div className="bg-[#FAF4EB] border border-[#EAD7BA] rounded-xl p-3.5 text-left text-xs text-[#946625] leading-relaxed">
                Your transfer of <strong className="font-semibold text-[#17211D]">₹{parseFloat(amount).toLocaleString('en-IN')}</strong> triggered security heuristics and is undergoing verification. Funds have been temporarily moved to your held balance in escrow and have not left your account.
              </div>
            </div>
          )}

          {outcome.status === 'BLOCKED' && (
            <div className="space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-[#FBF0EF] border border-[#E6BFBD] text-[#B65D59] flex items-center justify-center mx-auto">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-bold text-[#8C3E3A]">Transaction Blocked</h4>
              <div className="bg-[#FBF0EF] border border-[#E6BFBD] rounded-xl p-3.5 text-left text-xs text-[#8C3E3A] leading-relaxed">
                This transaction was blocked by FraudShield security controls due to elevated risk. No funds were debited from your wallet.
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-[#D4E2DC] flex justify-center">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-2.5 rounded-lg bg-[#285C4D] hover:bg-[#1d453a] text-white font-medium text-xs transition-colors shadow-xs"
            >
              Done
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 text-[#17211D]">
          {formError && (
            <div className="p-3 rounded-lg bg-[#FBF0EF] border border-[#E6BFBD] text-[#8C3E3A] text-xs font-semibold">
              {formError}
            </div>
          )}

          {/* Recipient Selection Toggle */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-[#17211D]">
                Choose Beneficiary
              </label>
              <div className="flex items-center gap-1 bg-[#EDF6F1] p-0.5 rounded-lg border border-[#D4E2DC] text-[11px] font-semibold text-[#5A6E65]">
                <button
                  type="button"
                  onClick={() => setRecipientMode('saved')}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    recipientMode === 'saved' ? 'bg-[#FAFCFA] text-[#285C4D] shadow-xs font-bold' : ''
                  }`}
                >
                  Saved Beneficiaries
                </button>
                <button
                  type="button"
                  onClick={() => setRecipientMode('custom')}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    recipientMode === 'custom' ? 'bg-[#FAFCFA] text-[#285C4D] shadow-xs font-bold' : ''
                  }`}
                >
                  Enter ID / Email
                </button>
              </div>
            </div>

            {recipientMode === 'saved' ? (
              beneficiaries.length > 0 ? (
                <select
                  value={selectedRecipientId}
                  onChange={(e) => setSelectedRecipientId(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#FAFCFA] border border-[#D4E2DC] text-[#17211D] focus:border-[#285C4D] focus:ring-1 focus:ring-[#285C4D] text-sm font-medium"
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
                <div className="p-3.5 rounded-lg border border-dashed border-[#D4E2DC] text-xs text-[#5A6E65] text-center bg-[#F4F8F5]">
                  No saved contacts yet.{' '}
                  <button
                    type="button"
                    onClick={() => setRecipientMode('custom')}
                    className="text-[#285C4D] font-semibold underline"
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
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#FAFCFA] border border-[#D4E2DC] text-[#17211D] placeholder-[#5A6E65]/50 focus:border-[#285C4D] focus:ring-1 focus:ring-[#285C4D] text-sm font-medium"
                required
              />
            )}
          </div>

          {/* Amount Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-[#17211D]">
                Amount (INR)
              </label>
              <span className="text-[11px] text-[#5A6E65]">
                Available:{' '}
                <strong className="text-[#17211D] font-mono">
                  ₹{wallet?.availableBalance?.toLocaleString('en-IN') || 0}
                </strong>
              </span>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5A6E65] font-bold text-sm">
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
                className="w-full pl-8 pr-4 py-2.5 rounded-lg bg-[#FAFCFA] border border-[#D4E2DC] text-[#17211D] placeholder-[#5A6E65]/50 focus:border-[#285C4D] focus:ring-1 focus:ring-[#285C4D] text-sm font-semibold"
                required
              />
            </div>
          </div>

          {/* Note Input */}
          <div>
            <label className="block text-xs font-semibold text-[#17211D] mb-1.5">
              Transfer Note (Optional)
            </label>
            <input
              type="text"
              maxLength="100"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Project invoice or rent"
              disabled={isSubmitting}
              className="w-full px-3.5 py-2 rounded-lg bg-[#FAFCFA] border border-[#D4E2DC] text-[#17211D] placeholder-[#5A6E65]/50 focus:border-[#285C4D] focus:ring-1 focus:ring-[#285C4D] text-sm"
            />
          </div>

          {/* Submit Actions */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-[#D4E2DC]">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg border border-[#D4E2DC] text-[#5A6E65] hover:bg-[#EDF6F1] font-medium text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#285C4D] hover:bg-[#1d453a] text-white font-medium text-xs shadow-xs disabled:opacity-50 transition-all"
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
