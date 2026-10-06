import React, { useState } from 'react';
import { CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import Modal from '../common/Modal';
import axiosClient from '../../api/axiosClient';

const ResolveCaseModal = ({ isOpen, onClose, transaction, onResolved }) => {
  const [decision, setDecision] = useState('APPROVE');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!transaction) return null;

  const notesTrimmed = notes.trim();
  const isValidNotes = notesTrimmed.length >= 10;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!isValidNotes) {
      setError('Resolution notes must be at least 10 characters long.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await axiosClient.post(`/admin/reviews/${transaction._id}/resolve`, {
        decision,
        resolutionNotes: notesTrimmed
      });

      if (res.success) {
        onResolved(transaction._id, decision);
        onClose();
      }
    } catch (err) {
      if (err.status === 409 || err.code === 'ALREADY_RESOLVED') {
        setError('This transaction has already been resolved by another administrator.');
        setTimeout(() => {
          onResolved(transaction._id, 'CONFLICT');
          onClose();
        }, 2000);
      } else {
        setError(err.message || 'Failed to submit resolution decision.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setNotes('');
    setError('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Review Case — Escrow Determination" maxWidth="max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-3.5 rounded-xl bg-[#FBF0EF] border border-[#F2D6D3] text-[#8C3E3A] text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-[#B65D59]" />
            <span>{error}</span>
          </div>
        )}

        {/* Transaction Summary Card */}
        <div className="p-4 rounded-xl bg-[#F4F8F5] border border-[#D4E2DC] flex items-center justify-between text-xs">
          <div>
            <span className="text-[#5A6E65] block font-medium">Transaction Amount</span>
            <span className="text-base font-extrabold text-[#17211D]">
              ₹{transaction.amount?.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[#5A6E65] block font-medium">Risk Score</span>
            <span className="text-base font-extrabold text-[#946625]">
              {transaction.riskScore}/100
            </span>
          </div>
        </div>

        {/* Decision Toggle */}
        <div>
          <label className="block text-xs font-semibold text-[#17211D] uppercase tracking-wider mb-2">
            Determination Decision
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setDecision('APPROVE')}
              disabled={isSubmitting}
              className={`p-3.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 font-bold text-xs transition-colors ${
                decision === 'APPROVE'
                  ? 'bg-[#EAF3EF] border-[#285C4D] text-[#285C4D] shadow-xs'
                  : 'bg-white border-[#D4E2DC] text-[#5A6E65] hover:bg-[#F4F8F5]'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#285C4D]" />
                <span>Approve Payment</span>
              </div>
              <span className="text-[10px] font-normal text-[#5A6E65]">Release escrow to recipient</span>
            </button>

            <button
              type="button"
              onClick={() => setDecision('REJECT')}
              disabled={isSubmitting}
              className={`p-3.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 font-bold text-xs transition-colors ${
                decision === 'REJECT'
                  ? 'bg-[#FBF0EF] border-[#B65D59] text-[#8C3E3A] shadow-xs'
                  : 'bg-white border-[#D4E2DC] text-[#5A6E65] hover:bg-[#F4F8F5]'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <XCircle className="w-4 h-4 text-[#B65D59]" />
                <span>Reject Payment</span>
              </div>
              <span className="text-[10px] font-normal text-[#5A6E65]">Refund held funds to sender</span>
            </button>
          </div>
        </div>

        {/* Mandatory Resolution Notes */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-[#17211D] uppercase tracking-wider">
              Mandatory Resolution Notes
            </label>
            <span
              className={`text-[11px] font-semibold ${
                isValidNotes ? 'text-[#285C4D]' : 'text-[#8C3E3A]'
              }`}
            >
              {notesTrimmed.length}/10 min characters
            </span>
          </div>
          <textarea
            rows="3"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Document detailed rationale for audit trail (e.g. Identity verified via telephonic check with sender, confirmed beneficiary invoice...)"
            disabled={isSubmitting}
            className="w-full p-3 rounded-xl bg-white border border-[#D4E2DC] text-xs text-[#17211D] placeholder-[#5A6E65]/60 focus:outline-none focus:border-[#285C4D] focus:ring-1 focus:ring-[#285C4D] font-medium"
            required
          />
        </div>

        {/* Action Buttons */}
        <div className="pt-3 flex items-center justify-end gap-3 border-t border-[#D4E2DC]">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-4 py-2.5 rounded-xl border border-[#D4E2DC] text-[#5A6E65] hover:bg-[#F4F8F5] font-semibold text-xs transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !isValidNotes}
            className={`inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl font-bold text-xs shadow-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
              decision === 'APPROVE'
                ? 'bg-[#285C4D] hover:bg-[#20493D] text-white'
                : 'bg-[#B65D59] hover:bg-[#9B4E4A] text-white'
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Executing Settlement...</span>
              </>
            ) : (
              <span>{decision === 'APPROVE' ? 'Confirm Approve Payment' : 'Confirm Reject Payment'}</span>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ResolveCaseModal;
