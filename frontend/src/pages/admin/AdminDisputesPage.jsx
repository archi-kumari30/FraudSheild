import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Scale,
  Search,
  RefreshCw,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowUpRight,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';

const AdminDisputesPage = () => {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Resolution modal state
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [decision, setDecision] = useState('REFUND');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resolutionError, setResolutionError] = useState(null);
  const [resolutionSuccess, setResolutionSuccess] = useState(false);

  const fetchDisputes = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get('/admin/disputes');
      if (res.success && Array.isArray(res.data?.disputes)) {
        setDisputes(res.data.disputes);
      }
    } catch (err) {
      console.warn('Failed to load admin disputes:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisputes();
  }, []);

  const formatINR = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(val || 0);
  };

  const handleOpenResolutionModal = (dispute) => {
    setSelectedDispute(dispute);
    setDecision('REFUND');
    setResolutionNotes('');
    setResolutionError(null);
    setResolutionSuccess(false);
  };

  const handleResolve = async (e) => {
    e.preventDefault();
    if (!selectedDispute) return;

    if (!resolutionNotes.trim() || resolutionNotes.trim().length < 10) {
      setResolutionError('Resolution notes must be at least 10 characters long explaining your rationale.');
      return;
    }

    try {
      setSubmitting(true);
      setResolutionError(null);

      const res = await axiosClient.post(
        `/admin/disputes/${selectedDispute._id}/resolve`,
        {
          decision,
          resolutionNotes: resolutionNotes.trim()
        }
      );

      if (res.success) {
        setResolutionSuccess(true);
        setTimeout(() => {
          setSelectedDispute(null);
          fetchDisputes();
        }, 1200);
      }
    } catch (err) {
      setResolutionError(err.message || 'Failed to adjudicate dispute.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredDisputes = disputes.filter((d) => {
    if (filter !== 'ALL') {
      if (filter === 'PENDING' && !['OPEN', 'RECIPIENT_RESPONDED'].includes(d.status)) return false;
      if (filter === 'RESOLVED' && !['RESOLVED_REFUNDED', 'REJECTED'].includes(d.status)) return false;
      if (filter !== 'PENDING' && filter !== 'RESOLVED' && d.status !== filter) return false;
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const sName = (d.requesterId?.name || d.requesterId?.email || '').toLowerCase();
      const rName = (d.recipientId?.name || d.recipientId?.email || '').toLowerCase();
      const reason = (d.reason || '').toLowerCase();
      const txId = (d.transactionId?._id || d.transactionId || '').toString().toLowerCase();
      return sName.includes(term) || rName.includes(term) || reason.includes(term) || txId.includes(term);
    }

    return true;
  });

  const pendingCount = disputes.filter((d) => ['OPEN', 'RECIPIENT_RESPONDED'].includes(d.status)).length;

  return (
    <div className="space-y-6 text-[#17211D]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#285C4D] uppercase tracking-wider">
              Dispute Adjudication
            </span>
            {pendingCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FAF4EB] text-[#946625] border border-[#EAD7BA]">
                {pendingCount} Pending Resolution
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-[#17211D] mt-0.5">
            Payment Disputes & Claims Queue
          </h1>
          <p className="text-xs sm:text-sm text-[#5A6E65] mt-1">
            Review contested and accidental payments, verify evidence from both counterparties, and execute atomic refunds or rejections.
          </p>
        </div>

        <button
          onClick={fetchDisputes}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#D4E2DC] bg-[#FAFCFA] text-xs font-semibold text-[#5A6E65] hover:text-[#17211D] hover:bg-[#F4F8F5] transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FAFCFA] p-3.5 rounded-xl border border-[#D4E2DC]">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'ALL', label: 'All Cases' },
            { id: 'PENDING', label: `Pending (${pendingCount})` },
            { id: 'OPEN', label: 'Open' },
            { id: 'RECIPIENT_RESPONDED', label: 'Recipient Responded' },
            { id: 'RESOLVED_REFUNDED', label: 'Refunded' },
            { id: 'REJECTED', label: 'Rejected' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filter === tab.id
                  ? 'bg-[#285C4D] text-white shadow-xs'
                  : 'text-[#5A6E65] hover:text-[#17211D] hover:bg-[#EDF6F1]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-[#5A6E65] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search claimant, recipient, reason..."
            className="pl-8 pr-3 py-1.5 rounded-lg bg-[#FAFCFA] border border-[#D4E2DC] text-xs text-[#17211D] placeholder-[#5A6E65]/60 focus:outline-none focus:border-[#285C4D] w-full sm:w-60"
          />
        </div>
      </div>

      {/* Disputes Queue Table */}
      <div className="bg-[#FAFCFA] rounded-xl border border-[#D4E2DC] shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-xs text-[#5A6E65]">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#285C4D]" />
            Loading dispute records...
          </div>
        ) : filteredDisputes.length === 0 ? (
          <div className="py-20 text-center text-xs text-[#5A6E65] space-y-1">
            <Scale className="w-8 h-8 mx-auto text-[#285C4D] opacity-60 mb-2" />
            <p className="font-semibold text-sm text-[#17211D]">No Disputes Found</p>
            <p className="text-xs text-[#5A6E65]">No cases match your active filter criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#D4E2DC] bg-[#EDF6F1] text-[11px] font-bold text-[#5A6E65] uppercase tracking-wider">
                  <th className="py-3 px-4">Claimant (Sender)</th>
                  <th className="py-3 px-4">Recipient</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Recipient Evidence</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Created</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D4E2DC]">
                {filteredDisputes.map((dispute) => {
                  const txId = (dispute.transactionId?._id || dispute.transactionId)?.toString();
                  const isActionable = ['OPEN', 'RECIPIENT_RESPONDED'].includes(dispute.status);

                  return (
                    <tr key={dispute._id} className="hover:bg-[#F4F8F5] transition-colors">
                      {/* Claimant */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[#17211D]">
                          {dispute.requesterId?.name || 'Customer'}
                        </div>
                        <div className="text-[11px] text-[#5A6E65] font-mono">
                          {dispute.requesterId?.email || 'N/A'}
                        </div>
                        <div className="text-[10px] text-[#5A6E65] mt-1 italic max-w-xs truncate" title={dispute.reason}>
                          "{dispute.reason}"
                        </div>
                      </td>

                      {/* Recipient */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[#17211D]">
                          {dispute.recipientId?.name || 'Beneficiary'}
                        </div>
                        <div className="text-[11px] text-[#5A6E65] font-mono">
                          {dispute.recipientId?.email || 'N/A'}
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4">
                        <span className="font-bold font-mono text-[#17211D]">
                          {formatINR(dispute.amount)}
                        </span>
                      </td>

                      {/* Recipient Response Evidence */}
                      <td className="py-3.5 px-4">
                        {dispute.recipientResponse?.respondedAt ? (
                          <div className="space-y-0.5">
                            <span
                              className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                dispute.recipientResponse.agreesToReturn
                                  ? 'bg-[#EAF3EF] text-[#285C4D] border border-[#C8DCD2]'
                                  : 'bg-[#FBF0EF] text-[#8C3E3A] border border-[#E6BFBD]'
                              }`}
                            >
                              {dispute.recipientResponse.agreesToReturn
                                ? 'Agrees to Refund'
                                : 'Contests Refund'}
                            </span>
                            {dispute.recipientResponse.responseNote && (
                              <p className="text-[10px] text-[#5A6E65] truncate max-w-xs" title={dispute.recipientResponse.responseNote}>
                                {dispute.recipientResponse.responseNote}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-[11px] text-[#5A6E65] italic">
                            Awaiting response
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <StatusBadge status={dispute.status} />
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-[#5A6E65] font-mono text-[11px]">
                        {new Date(dispute.createdAt).toLocaleDateString()}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isActionable && (
                            <button
                              type="button"
                              onClick={() => handleOpenResolutionModal(dispute)}
                              className="px-3 py-1.5 rounded-lg bg-[#285C4D] text-white font-bold text-xs hover:bg-[#1f493d] transition-colors shadow-xs"
                            >
                              Adjudicate
                            </button>
                          )}
                          {txId && (
                            <Link
                              to={`/admin/investigation/${txId}`}
                              className="p-1.5 rounded-lg border border-[#D4E2DC] text-[#5A6E65] hover:text-[#17211D] hover:bg-[#EDF6F1] transition-colors"
                              title="Open Full Transaction Dossier"
                            >
                              <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Adjudication Modal */}
      {selectedDispute && (
        <Modal
          isOpen={!!selectedDispute}
          onClose={() => setSelectedDispute(null)}
          title="Adjudicate Payment Dispute"
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4 text-xs text-[#17211D]">
            {/* Case Overview Card */}
            <div className="p-4 rounded-xl bg-[#EDF6F1] border border-[#D4E2DC] space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[#5A6E65] text-[11px] block">Disputed Payment Amount</span>
                  <span className="text-xl font-bold font-mono text-[#17211D]">
                    {formatINR(selectedDispute.amount)}
                  </span>
                </div>
                <StatusBadge status={selectedDispute.status} />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#D4E2DC] text-[11px]">
                <div>
                  <span className="text-[#5A6E65] block font-medium">Claimant (Sender)</span>
                  <strong className="text-[#17211D]">
                    {selectedDispute.requesterId?.name} ({selectedDispute.requesterId?.email})
                  </strong>
                </div>
                <div>
                  <span className="text-[#5A6E65] block font-medium">Recipient</span>
                  <strong className="text-[#17211D]">
                    {selectedDispute.recipientId?.name} ({selectedDispute.recipientId?.email})
                  </strong>
                </div>
              </div>

              <div className="pt-2 border-t border-[#D4E2DC]">
                <span className="text-[#5A6E65] text-[11px] block font-medium">Claimant Reason:</span>
                <p className="text-xs text-[#17211D] font-medium leading-relaxed italic mt-0.5">
                  "{selectedDispute.reason}"
                </p>
              </div>

              {selectedDispute.recipientResponse?.respondedAt && (
                <div className="pt-2 border-t border-[#D4E2DC] space-y-1">
                  <span className="text-[#5A6E65] text-[11px] block font-medium">Recipient Response Evidence:</span>
                  <div className="flex items-center gap-4 text-[11px]">
                    <span>
                      Recognizes: <strong>{selectedDispute.recipientResponse.recognized ? 'Yes' : 'No'}</strong>
                    </span>
                    <span>
                      Agrees to return:{' '}
                      <strong
                        className={
                          selectedDispute.recipientResponse.agreesToReturn
                            ? 'text-[#285C4D]'
                            : 'text-[#8C3E3A]'
                        }
                      >
                        {selectedDispute.recipientResponse.agreesToReturn ? 'Yes, Agrees' : 'No, Contested'}
                      </strong>
                    </span>
                  </div>
                  {selectedDispute.recipientResponse.responseNote && (
                    <p className="text-[11px] text-[#5A6E65] italic">
                      "{selectedDispute.recipientResponse.responseNote}"
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Refund Financial Safety Notice */}
            <div className="p-3 rounded-xl bg-[#FAF4EB] border border-[#EAD7BA] text-[#946625] text-[11px] leading-relaxed flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-[#C89445]" />
              <div>
                <strong className="block text-[#17211D]">Atomic Balance Guarantee</strong>
                Executing a <strong>REFUND</strong> will atomically debit the recipient's available balance and credit the claimant. If the recipient does not have sufficient liquid funds to cover the refund, the system will abort to prevent an illegal negative balance.
              </div>
            </div>

            {resolutionError && (
              <div className="p-3 rounded-xl bg-[#FBF0EF] border border-[#E6BFBD] text-[#8C3E3A] flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{resolutionError}</span>
              </div>
            )}

            {resolutionSuccess ? (
              <div className="p-3 rounded-xl bg-[#EAF3EF] border border-[#C8DCD2] text-[#1E473B] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#285C4D]" />
                <span className="font-semibold">Dispute adjudication recorded successfully! Updating...</span>
              </div>
            ) : (
              <form onSubmit={handleResolve} className="space-y-4">
                {/* Decision Choice */}
                <div>
                  <label className="block text-[11px] font-semibold text-[#17211D] mb-2">
                    Adjudication Decision <span className="text-[#8C3E3A]">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setDecision('REFUND')}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        decision === 'REFUND'
                          ? 'border-[#285C4D] bg-[#EAF3EF] text-[#1E473B] ring-1 ring-[#285C4D]'
                          : 'border-[#D4E2DC] bg-[#FAFCFA] text-[#5A6E65] hover:border-[#285C4D]'
                      }`}
                    >
                      <div className="flex items-center gap-2 font-bold text-xs">
                        <CheckCircle2 className="w-4 h-4 text-[#285C4D]" />
                        <span>Approve Refund</span>
                      </div>
                      <p className="text-[10px] text-[#5A6E65] mt-1">
                        Debit recipient wallet & credit claimant. Mark transaction as REFUNDED.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDecision('REJECT')}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        decision === 'REJECT'
                          ? 'border-[#8C3E3A] bg-[#FBF0EF] text-[#8C3E3A] ring-1 ring-[#8C3E3A]'
                          : 'border-[#D4E2DC] bg-[#FAFCFA] text-[#5A6E65] hover:border-[#8C3E3A]'
                      }`}
                    >
                      <div className="flex items-center gap-2 font-bold text-xs">
                        <XCircle className="w-4 h-4 text-[#8C3E3A]" />
                        <span>Reject Dispute</span>
                      </div>
                      <p className="text-[10px] text-[#5A6E65] mt-1">
                        Dismiss claim. Original payment remains APPROVED and settled.
                      </p>
                    </button>
                  </div>
                </div>

                {/* Resolution Notes */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold text-[#17211D]">
                      Mandatory Analyst Rationale & Resolution Notes <span className="text-[#8C3E3A]">*</span>
                    </label>
                    <span className="text-[10px] text-[#5A6E65]">{resolutionNotes.length}/500</span>
                  </div>
                  <textarea
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    maxLength={500}
                    rows={3}
                    placeholder="Provide detailed justification for this adjudication (min 10 characters)..."
                    className="w-full p-2.5 rounded-lg border border-[#D4E2DC] bg-[#FAFCFA] text-xs text-[#17211D] focus:outline-none focus:border-[#285C4D] resize-none"
                    required
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#D4E2DC]">
                  <button
                    type="button"
                    onClick={() => setSelectedDispute(null)}
                    disabled={submitting}
                    className="px-3.5 py-1.5 rounded-lg border border-[#D4E2DC] text-xs font-medium text-[#5A6E65] hover:text-[#17211D]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || resolutionNotes.trim().length < 10}
                    className={`px-4 py-1.5 rounded-lg text-white text-xs font-bold transition-colors flex items-center gap-1.5 disabled:opacity-50 ${
                      decision === 'REFUND'
                        ? 'bg-[#285C4D] hover:bg-[#1f493d]'
                        : 'bg-[#8C3E3A] hover:bg-[#743330]'
                    }`}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <span>
                        Confirm {decision === 'REFUND' ? 'Refund Execution' : 'Dispute Rejection'}
                      </span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AdminDisputesPage;
