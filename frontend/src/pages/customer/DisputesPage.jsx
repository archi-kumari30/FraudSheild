import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  Loader2,
  RefreshCw,
  MessageSquare,
  ShieldCheck,
  ShieldAlert,
  HelpCircle
} from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';

const DisputesPage = () => {
  const { user, refreshWallet } = useAuth();
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('requester'); // 'requester' | 'recipient'
  const [respondingDispute, setRespondingDispute] = useState(null);

  // Response modal form state
  const [recognized, setRecognized] = useState(false);
  const [agreesToReturn, setAgreesToReturn] = useState(true);
  const [responseNote, setResponseNote] = useState('');
  const [submittingResponse, setSubmittingResponse] = useState(false);
  const [responseError, setResponseError] = useState(null);
  const [responseSuccess, setResponseSuccess] = useState(false);

  const fetchDisputes = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get('/disputes');
      if (res.success && Array.isArray(res.data?.disputes)) {
        setDisputes(res.data.disputes);
      }
    } catch (err) {
      console.warn('Failed to fetch disputes:', err.message);
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

  const currentUserId = (user?._id || user?.id)?.toString();

  const myRaisedDisputes = disputes.filter(
    (d) => (d.requesterId?._id || d.requesterId)?.toString() === currentUserId
  );

  const receivedDisputes = disputes.filter(
    (d) => (d.recipientId?._id || d.recipientId)?.toString() === currentUserId
  );

  const handleOpenResponseModal = (dispute) => {
    setRespondingDispute(dispute);
    setRecognized(false);
    setAgreesToReturn(true);
    setResponseNote('');
    setResponseError(null);
    setResponseSuccess(false);
  };

  const handleSubmitRecipientResponse = async (e) => {
    e.preventDefault();
    if (!respondingDispute) return;

    try {
      setSubmittingResponse(true);
      setResponseError(null);

      const res = await axiosClient.post(
        `/disputes/${respondingDispute._id}/recipient-response`,
        {
          recognized: Boolean(recognized),
          agreesToReturn: Boolean(agreesToReturn),
          responseNote: responseNote.trim()
        }
      );

      if (res.success) {
        setResponseSuccess(true);
        refreshWallet();
        setTimeout(() => {
          setRespondingDispute(null);
          fetchDisputes();
        }, 1200);
      }
    } catch (err) {
      setResponseError(err.message || 'Failed to submit response. Please try again.');
    } finally {
      setSubmittingResponse(false);
    }
  };

  const displayedList = activeTab === 'requester' ? myRaisedDisputes : receivedDisputes;
  const pendingReceivedCount = receivedDisputes.filter((d) => d.status === 'OPEN').length;

  return (
    <div className="space-y-6 text-[#17211D]">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-[#17211D]">
            Payment Disputes & Claims
          </h1>
          <p className="text-xs sm:text-sm text-[#5A6E65] mt-1">
            Track claims raised on accidental transfers and respond to disputes on payments you received.
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

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#D4E2DC] pb-2">
        <button
          onClick={() => setActiveTab('requester')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
            activeTab === 'requester'
              ? 'bg-[#285C4D] text-white shadow-xs'
              : 'text-[#5A6E65] hover:text-[#17211D] hover:bg-[#FAFCFA]'
          }`}
        >
          <ArrowUpRight className="w-3.5 h-3.5" />
          <span>Claims Raised by Me ({myRaisedDisputes.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('recipient')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
            activeTab === 'recipient'
              ? 'bg-[#285C4D] text-white shadow-xs'
              : 'text-[#5A6E65] hover:text-[#17211D] hover:bg-[#FAFCFA]'
          }`}
        >
          <ArrowDownLeft className="w-3.5 h-3.5" />
          <span>Disputes on Payments Received ({receivedDisputes.length})</span>
          {pendingReceivedCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[#8C3E3A] text-white">
              {pendingReceivedCount} Action Needed
            </span>
          )}
        </button>
      </div>

      {/* Disputes Content */}
      {loading ? (
        <div className="py-16 text-center text-xs text-[#5A6E65]">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#285C4D]" />
          Loading dispute records...
        </div>
      ) : displayedList.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-[#FAFCFA] border border-[#D4E2DC] p-6 space-y-2">
          <ShieldCheck className="w-8 h-8 text-[#285C4D] mx-auto opacity-70" />
          <h3 className="text-sm font-semibold text-[#17211D]">
            {activeTab === 'requester'
              ? 'No Payment Claims Raised'
              : 'No Disputes Filed on Your Account'}
          </h3>
          <p className="text-xs text-[#5A6E65] max-w-md mx-auto">
            {activeTab === 'requester'
              ? 'If you ever make an accidental transfer to an incorrect account, you can raise a dispute directly from your Transactions page.'
              : 'You have not received any disputed payments. When a sender reports an accidental transfer, it will appear here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayedList.map((dispute) => {
            const isRequester =
              (dispute.requesterId?._id || dispute.requesterId)?.toString() === currentUserId;
            const counterparty = isRequester ? dispute.recipientId : dispute.requesterId;
            const counterpartyLabel = isRequester ? 'Recipient' : 'Sender (Claimant)';

            return (
              <div
                key={dispute._id}
                className="bg-[#FAFCFA] rounded-xl border border-[#D4E2DC] p-5 shadow-xs space-y-4 hover:border-[#285C4D]/40 transition-colors"
              >
                {/* Top Row: Meta & Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#D4E2DC]">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isRequester
                          ? 'bg-[#FBF0EF] text-[#8C3E3A]'
                          : 'bg-[#EAF3EF] text-[#285C4D]'
                      }`}
                    >
                      {isRequester ? (
                        <ArrowUpRight className="w-4 h-4" />
                      ) : (
                        <ArrowDownLeft className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#17211D]">
                          {formatINR(dispute.amount)}
                        </span>
                        <span className="text-[11px] text-[#5A6E65] font-mono">
                          • Ref: #{dispute._id.slice(-6)}
                        </span>
                      </div>
                      <span className="text-[11px] text-[#5A6E65]">
                        {counterpartyLabel}:{' '}
                        <strong className="text-[#17211D]">
                          {counterparty?.name || counterparty?.email || 'User'}
                        </strong>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <StatusBadge status={dispute.status} />
                    <span className="text-[11px] text-[#5A6E65] font-mono">
                      {new Date(dispute.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Dispute Claim Reason */}
                <div className="p-3 rounded-lg bg-[#EDF6F1] border border-[#D4E2DC]">
                  <span className="text-[11px] font-semibold text-[#5A6E65] block mb-1">
                    Dispute Reason / Claim:
                  </span>
                  <p className="text-xs text-[#17211D] leading-relaxed font-medium">
                    "{dispute.reason}"
                  </p>
                </div>

                {/* Recipient Response Section */}
                {dispute.recipientResponse?.respondedAt ? (
                  <div className="p-3 rounded-lg bg-[#EFF6FF] border border-[#DBEAFE] space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#1E40AF]">
                        Recipient Response Evidence
                      </span>
                      <span className="text-[10px] text-[#60A5FA]">
                        {new Date(dispute.recipientResponse.respondedAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                      <div>
                        <span className="text-[#64748B]">Recognizes Transfer: </span>
                        <strong className="text-[#1E293B]">
                          {dispute.recipientResponse.recognized ? 'Yes' : 'No / Unrecognized'}
                        </strong>
                      </div>
                      <div>
                        <span className="text-[#64748B]">Agrees to Return Funds: </span>
                        <strong
                          className={
                            dispute.recipientResponse.agreesToReturn
                              ? 'text-[#285C4D]'
                              : 'text-[#8C3E3A]'
                          }
                        >
                          {dispute.recipientResponse.agreesToReturn ? 'Yes, Agrees' : 'No / Contested'}
                        </strong>
                      </div>
                    </div>
                    {dispute.recipientResponse.responseNote && (
                      <p className="text-[11px] text-[#334155] italic pt-1">
                        "{dispute.recipientResponse.responseNote}"
                      </p>
                    )}
                  </div>
                ) : !isRequester && dispute.status === 'OPEN' ? (
                  <div className="p-3.5 rounded-lg bg-[#FAF4EB] border border-[#EAD7BA] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-[#946625] flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-[#C89445]" />
                        Response Requested
                      </span>
                      <p className="text-[11px] text-[#5A6E65]">
                        The sender reported this payment as an error. Please indicate whether you recognize it and agree to return the funds.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleOpenResponseModal(dispute)}
                      className="px-3 py-1.5 rounded-lg bg-[#285C4D] text-white text-xs font-bold hover:bg-[#1f493d] transition-colors shrink-0 shadow-xs"
                    >
                      Submit Response
                    </button>
                  </div>
                ) : null}

                {/* Admin Decision Section */}
                {dispute.adminDecision?.decidedAt && (
                  <div
                    className={`p-3 rounded-lg border text-xs space-y-1 ${
                      dispute.adminDecision.decision === 'REFUND'
                        ? 'bg-[#EAF3EF] border-[#C8DCD2] text-[#1E473B]'
                        : 'bg-[#FBF0EF] border-[#E6BFBD] text-[#8C3E3A]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold flex items-center gap-1.5">
                        {dispute.adminDecision.decision === 'REFUND' ? (
                          <CheckCircle2 className="w-4 h-4 text-[#285C4D]" />
                        ) : (
                          <XCircle className="w-4 h-4 text-[#8C3E3A]" />
                        )}
                        Admin Decision:{' '}
                        {dispute.adminDecision.decision === 'REFUND'
                          ? 'Refund Approved & Processed'
                          : 'Dispute Claim Rejected'}
                      </span>
                      <span className="text-[10px] text-[#5A6E65] font-mono">
                        {new Date(dispute.adminDecision.decidedAt).toLocaleString()}
                      </span>
                    </div>
                    {dispute.adminDecision.resolutionNotes && (
                      <p className="text-[11px] text-[#17211D] leading-relaxed pt-1">
                        <strong>Analyst Notes:</strong> {dispute.adminDecision.resolutionNotes}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Recipient Response Modal */}
      {respondingDispute && (
        <Modal
          isOpen={!!respondingDispute}
          onClose={() => setRespondingDispute(null)}
          title="Respond to Payment Dispute"
        >
          <div className="space-y-4 text-xs text-[#17211D]">
            <div className="p-3 rounded-xl bg-[#EDF6F1] border border-[#D4E2DC] space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[#5A6E65]">Disputed Amount</span>
                <span className="font-bold font-mono text-base text-[#17211D]">
                  {formatINR(respondingDispute.amount)}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[#5A6E65]">Claimant Reason</span>
                <span className="italic text-[#17211D]">"{respondingDispute.reason}"</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#FAF4EB] border border-[#EAD7BA] text-[#946625] text-[11px] leading-relaxed">
              <strong className="block text-[#17211D] mb-0.5">Adjudication Notice</strong>
              Your response is provided as verified evidence for FraudShield security operations. The final decision to execute a refund or maintain the transaction is made by an authorized security administrator.
            </div>

            {responseError && (
              <div className="p-3 rounded-xl bg-[#FBF0EF] border border-[#E6BFBD] text-[#8C3E3A] flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{responseError}</span>
              </div>
            )}

            {responseSuccess ? (
              <div className="p-3 rounded-xl bg-[#EAF3EF] border border-[#C8DCD2] text-[#1E473B] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#285C4D]" />
                <span className="font-semibold">Response recorded successfully! Updating...</span>
              </div>
            ) : (
              <form onSubmit={handleSubmitRecipientResponse} className="space-y-3.5">
                {/* Recognition Question */}
                <div>
                  <label className="block text-[11px] font-semibold text-[#17211D] mb-1.5">
                    Do you recognize this payment and the sender?
                  </label>
                  <div className="flex items-center gap-4">
                    <label className="inline-flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="recognized"
                        checked={recognized === true}
                        onChange={() => setRecognized(true)}
                        className="text-[#285C4D] focus:ring-[#285C4D]"
                      />
                      <span>Yes, I recognize it</span>
                    </label>
                    <label className="inline-flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="recognized"
                        checked={recognized === false}
                        onChange={() => setRecognized(false)}
                        className="text-[#285C4D] focus:ring-[#285C4D]"
                      />
                      <span>No, unrecognized</span>
                    </label>
                  </div>
                </div>

                {/* Return Agreement Question */}
                <div>
                  <label className="block text-[11px] font-semibold text-[#17211D] mb-1.5">
                    Do you agree to return this payment to the sender if accidentally transferred?
                  </label>
                  <div className="flex items-center gap-4">
                    <label className="inline-flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="agreesToReturn"
                        checked={agreesToReturn === true}
                        onChange={() => setAgreesToReturn(true)}
                        className="text-[#285C4D] focus:ring-[#285C4D]"
                      />
                      <span className="text-[#285C4D] font-semibold">Yes, I agree to refund</span>
                    </label>
                    <label className="inline-flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="agreesToReturn"
                        checked={agreesToReturn === false}
                        onChange={() => setAgreesToReturn(false)}
                        className="text-[#8C3E3A] focus:ring-[#8C3E3A]"
                      />
                      <span>No, legitimate payment</span>
                    </label>
                  </div>
                </div>

                {/* Optional Note */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold text-[#17211D]">
                      Additional Statement / Evidence Notes (Optional)
                    </label>
                    <span className="text-[10px] text-[#5A6E65]">{responseNote.length}/500</span>
                  </div>
                  <textarea
                    value={responseNote}
                    onChange={(e) => setResponseNote(e.target.value)}
                    maxLength={500}
                    rows={3}
                    placeholder="Provide any context regarding this transaction for the security analyst..."
                    className="w-full p-2.5 rounded-lg border border-[#D4E2DC] bg-[#FAFCFA] text-xs text-[#17211D] focus:outline-none focus:border-[#285C4D] resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#D4E2DC]">
                  <button
                    type="button"
                    onClick={() => setRespondingDispute(null)}
                    disabled={submittingResponse}
                    className="px-3.5 py-1.5 rounded-lg border border-[#D4E2DC] text-xs font-medium text-[#5A6E65] hover:text-[#17211D]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingResponse}
                    className="px-4 py-1.5 rounded-lg bg-[#285C4D] text-white text-xs font-bold hover:bg-[#1f493d] transition-colors flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {submittingResponse ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <span>Submit Official Response</span>
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

export default DisputesPage;
