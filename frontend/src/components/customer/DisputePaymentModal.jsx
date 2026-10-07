import React, { useState } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Loader2, ShieldAlert } from 'lucide-react';
import Modal from '../common/Modal';
import axiosClient from '../../api/axiosClient';

const QUICK_REASONS = [
  'Sent to wrong recipient by mistake',
  'Incorrect transfer amount entered',
  'Duplicate transaction initiated',
  'Services/goods not provided as agreed'
];

const DisputePaymentModal = ({ isOpen, onClose, transaction, onDisputeCreated }) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  if (!transaction) return null;

  const formatINR = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(val || 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim() || reason.trim().length < 5) {
      setError('Please provide a dispute reason of at least 5 characters.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await axiosClient.post('/disputes', {
        transactionId: transaction._id,
        reason: reason.trim()
      });

      if (res.success) {
        setSuccess(true);
        setTimeout(() => {
          if (onDisputeCreated) {
            onDisputeCreated(res.data?.dispute || transaction._id);
          }
          handleClose();
        }, 1200);
      }
    } catch (err) {
      setError(err.message || 'Failed to submit payment dispute. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setReason('');
    setError(null);
    setSuccess(false);
    onClose();
  };

  const recipientName =
    transaction.recipientId?.name || transaction.recipientId?.email || 'Recipient';

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Raise Payment Dispute">
      <div className="space-y-4 text-xs text-[#17211D]">
        {/* Payment Summary Box */}
        <div className="p-3.5 rounded-xl bg-[#EDF6F1] border border-[#D4E2DC] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[#5A6E65]">Transaction Amount</span>
            <span className="text-base font-bold font-mono text-[#17211D]">
              {formatINR(transaction.amount)}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-[#5A6E65]">Recipient</span>
            <span className="font-semibold text-[#17211D]">{recipientName}</span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-[#5A6E65]">Date</span>
            <span className="font-mono text-[#5A6E65]">
              {new Date(transaction.createdAt).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Security / Policy Notice */}
        <div className="p-3 rounded-xl bg-[#FAF4EB] border border-[#EAD7BA] text-[#946625] flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#C89445]" />
          <div className="text-[11px] leading-relaxed">
            <span className="font-bold block text-[#17211D]">Fair Resolution Protocol</span>
            Disputing this payment will alert the recipient and open a case with FraudShield Security Operations. The recipient will be invited to respond before an admin adjudicates a refund or rejection.
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-[#FBF0EF] border border-[#E6BFBD] text-[#8C3E3A] flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="text-xs">{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3 rounded-xl bg-[#EAF3EF] border border-[#C8DCD2] text-[#1E473B] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#285C4D]" />
            <span className="text-xs font-semibold">
              Dispute successfully submitted! Redirecting...
            </span>
          </div>
        )}

        {!success && (
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Quick Reason Suggestions */}
            <div>
              <span className="block text-[11px] font-semibold text-[#5A6E65] mb-1.5">
                Common Reasons:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_REASONS.map((qr, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setReason(qr)}
                    className="text-[10px] px-2 py-1 rounded-md bg-[#FAFCFA] border border-[#D4E2DC] text-[#5A6E65] hover:text-[#17211D] hover:border-[#285C4D] transition-colors"
                  >
                    {qr}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Reason Textarea */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-[#17211D]">
                  Reason for Dispute <span className="text-[#8C3E3A]">*</span>
                </label>
                <span className="text-[10px] text-[#5A6E65]">{reason.length}/500</span>
              </div>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                maxLength={500}
                rows={3}
                placeholder="Explain why you are disputing this payment (e.g. sent by error, incorrect recipient, merchant disagreement)..."
                className="w-full p-2.5 rounded-lg border border-[#D4E2DC] bg-[#FAFCFA] text-xs text-[#17211D] focus:outline-none focus:border-[#285C4D] resize-none"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#D4E2DC]">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="px-3.5 py-1.5 rounded-lg border border-[#D4E2DC] text-xs font-medium text-[#5A6E65] hover:text-[#17211D] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || reason.trim().length < 5}
                className="px-4 py-1.5 rounded-lg bg-[#285C4D] text-white text-xs font-bold hover:bg-[#1f493d] transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <span>Submit Dispute</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};

export default DisputePaymentModal;
