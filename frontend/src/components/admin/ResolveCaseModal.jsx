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
      // EC-M11-002: Concurrent Admin Resolution (409 Conflict)
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
    <Modal isOpen={isOpen} onClose={handleClose} title="Manual Review Decision" maxWidth="max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Transaction Summary Card */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-400 block font-medium">Transaction Amount</span>
            <span className="text-base font-extrabold text-slate-900">
              ₹{transaction.amount?.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="text-right">
            <span className="text-slate-400 block font-medium">Risk Score</span>
            <span className="text-base font-extrabold text-amber-600">
              {transaction.riskScore}/100
            </span>
          </div>
        </div>

        {/* Decision Toggle */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Action Decision
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setDecision('APPROVE')}
              disabled={isSubmitting}
              className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-bold text-xs transition-all ${
                decision === 'APPROVE'
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Approve (Settle Escrow)</span>
            </button>

            <button
              type="button"
              onClick={() => setDecision('REJECT')}
              disabled={isSubmitting}
              className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-bold text-xs transition-all ${
                decision === 'REJECT'
                  ? 'bg-rose-50 border-rose-500 text-rose-700 shadow-sm'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <XCircle className="w-4 h-4 text-rose-600" />
              <span>Reject (Refund Sender)</span>
            </button>
          </div>
        </div>

        {/* Mandatory Resolution Notes (EC-M11-004, TC-M11-006) */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Mandatory Resolution Notes
            </label>
            <span
              className={`text-[11px] font-semibold ${
                isValidNotes ? 'text-emerald-600' : 'text-slate-400'
              }`}
            >
              {notesTrimmed.length}/10 min characters
            </span>
          </div>
          <textarea
            rows="3"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Document reasoning (e.g. Identity verified via phone call, confirmed beneficiary relationship...)"
            disabled={isSubmitting}
            className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 text-xs font-medium text-slate-800"
            required
          />
        </div>

        {/* Submit Buttons */}
        <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold text-xs"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !isValidNotes}
            className={`inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-white font-semibold text-xs shadow-md transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
              decision === 'APPROVE'
                ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'
                : 'bg-rose-600 hover:bg-rose-700 shadow-rose-200'
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Executing Settlement...</span>
              </>
            ) : (
              <span>Confirm {decision === 'APPROVE' ? 'Approval' : 'Rejection'}</span>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ResolveCaseModal;
