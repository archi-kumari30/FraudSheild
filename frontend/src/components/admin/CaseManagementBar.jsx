import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  UserX,
  FileText,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Send,
  Loader2,
  CheckCircle2,
  Lock,
  MessageSquare
} from 'lucide-react';
import axiosClient from '../../api/axiosClient';

const CaseManagementBar = ({
  transaction,
  currentUserId,
  onCaseUpdated,
  onOpenResolveModal
}) => {
  if (!transaction) return null;

  const [isClaiming, setIsClaiming] = useState(false);
  const [isReleasing, setIsReleasing] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [actionError, setActionError] = useState('');

  // Audit Integrity State
  const [auditStatus, setAuditStatus] = useState(null);
  const [isVerifyingAudit, setIsVerifyingAudit] = useState(false);

  useEffect(() => {
    // Automatically verify audit chain integrity for SOC case
    setIsVerifyingAudit(true);
    axiosClient
      .get('/admin/audit-logs/verify')
      .then((res) => {
        if (res.success && res.data) {
          setAuditStatus(res.data);
        }
      })
      .catch((err) => {
        console.warn('Audit verification warning:', err.message);
      })
      .finally(() => {
        setIsVerifyingAudit(false);
      });
  }, [transaction._id]);

  const caseStatus = transaction.caseStatus || 'UNASSIGNED';
  const assignedAnalyst = transaction.assignedAnalyst;
  const isAssignedToMe = assignedAnalyst && (assignedAnalyst._id === currentUserId || assignedAnalyst === currentUserId);
  const isClaimedByOther = assignedAnalyst && !isAssignedToMe;
  const isResolved = transaction.status !== 'FLAGGED_FOR_REVIEW' && transaction.status !== 'RESOLVING';

  const handleClaim = async () => {
    setIsClaiming(true);
    setActionError('');
    try {
      const res = await axiosClient.post(`/admin/reviews/${transaction._id}/claim`);
      if (res.success) {
        onCaseUpdated(res.data.transaction);
      }
    } catch (err) {
      setActionError(err.message || 'Failed to claim case.');
    } finally {
      setIsClaiming(false);
    }
  };

  const handleRelease = async () => {
    setIsReleasing(true);
    setActionError('');
    try {
      const res = await axiosClient.post(`/admin/reviews/${transaction._id}/release`);
      if (res.success) {
        onCaseUpdated(res.data.transaction);
      }
    } catch (err) {
      setActionError(err.message || 'Failed to release case.');
    } finally {
      setIsReleasing(false);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!noteText.trim()) return;

    setIsAddingNote(true);
    setActionError('');
    try {
      const res = await axiosClient.post(`/admin/reviews/${transaction._id}/notes`, {
        note: noteText.trim()
      });
      if (res.success) {
        setNoteText('');
        onCaseUpdated(res.data.transaction);
      }
    } catch (err) {
      setActionError(err.message || 'Failed to record case note.');
    } finally {
      setIsAddingNote(false);
    }
  };

  const statusBadgeStyles = {
    UNASSIGNED: 'bg-[#FAF4EB] text-[#946625] border-[#EAD7BA]',
    CLAIMED: 'bg-[#EAF3EF] text-[#285C4D] border-[#C8DCD2]',
    UNDER_INVESTIGATION: 'bg-[#EDF6F1] text-[#1E473B] border-[#B8CEC4]',
    RESOLVED_APPROVED: 'bg-[#EAF3EF] text-[#1E473B] border-[#C8DCD2]',
    RESOLVED_REJECTED: 'bg-[#FBF0EF] text-[#8C3E3A] border-[#E6BFBD]',
    CLOSED: 'bg-[#F4F8F5] text-[#5A6E65] border-[#D4E2DC]'
  };

  return (
    <div className="bg-[#FAFCFA] rounded-2xl p-6 border border-[#D4E2DC] shadow-xs space-y-6">
      {/* Top Header: Case Status & Analyst Workflow */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#D4E2DC]">
        <div>
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border uppercase tracking-wider ${statusBadgeStyles[caseStatus] || statusBadgeStyles.UNASSIGNED}`}>
              Case: {caseStatus.replace(/_/g, ' ')}
            </span>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-[#F4F8F5] text-[#5A6E65] border border-[#D4E2DC]">
              Priority: {transaction.casePriority || 'P3_MEDIUM'}
            </span>
          </div>

          <p className="text-xs text-[#5A6E65] mt-1.5">
            {assignedAnalyst ? (
              <span>
                Assigned to analyst: <strong className="text-[#17211D]">{assignedAnalyst.name || assignedAnalyst.email || 'Analyst'}</strong>
              </span>
            ) : (
              <span>Unclaimed case in triage queue. Claim this incident to begin formal SOC review.</span>
            )}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {!isResolved && (
            <>
              {!assignedAnalyst && (
                <button
                  type="button"
                  onClick={handleClaim}
                  disabled={isClaiming}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#285C4D] text-white hover:bg-[#1d453a] transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  {isClaiming ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserCheck className="w-3.5 h-3.5" />}
                  <span>Claim Case</span>
                </button>
              )}

              {isAssignedToMe && (
                <button
                  type="button"
                  onClick={handleRelease}
                  disabled={isReleasing}
                  className="px-3 py-2 rounded-xl text-xs font-semibold bg-white border border-[#D4E2DC] text-[#5A6E65] hover:text-[#17211D] hover:bg-[#F4F8F5] transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isReleasing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserX className="w-3.5 h-3.5" />}
                  <span>Release Case</span>
                </button>
              )}

              <button
                type="button"
                onClick={onOpenResolveModal}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#17211D] text-white hover:bg-[#285C4D] transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Resolve Escrow</span>
              </button>
            </>
          )}

          {/* Cryptographic Ledger Health Pill */}
          <div className="px-3 py-1.5 rounded-xl bg-white border border-[#D4E2DC] flex items-center gap-2 text-[11px]">
            {isVerifyingAudit ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#285C4D]" />
            ) : auditStatus?.isValid ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-[#285C4D]" />
            ) : (
              <AlertTriangle className="w-3.5 h-3.5 text-[#C89445]" />
            )}
            <span className="font-mono text-[#5A6E65]">
              {auditStatus?.isValid ? `Audit Ledger Verified (${auditStatus.totalVerified} blocks)` : 'Verifying Ledger...'}
            </span>
          </div>
        </div>
      </div>

      {actionError && (
        <div className="p-3 rounded-xl bg-[#FAF4EB] border border-[#EAD7BA] text-xs text-[#946625]">
          {actionError}
        </div>
      )}

      {/* Investigation Notes Panel */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-[#285C4D]" />
            <h3 className="text-xs font-bold text-[#17211D] uppercase tracking-wider">
              Analyst Investigation Notes ({(transaction.investigationNotes || []).length})
            </h3>
          </div>
        </div>

        {/* Existing Notes List */}
        {(transaction.investigationNotes || []).length > 0 ? (
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {transaction.investigationNotes.map((noteItem, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-white border border-[#D4E2DC] text-xs space-y-1"
              >
                <div className="flex items-center justify-between text-[11px] text-[#5A6E65]">
                  <span className="font-bold text-[#17211D]">
                    {noteItem.authorName || 'Analyst'}
                  </span>
                  <span className="font-mono text-[10px]">
                    {new Date(noteItem.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-[#17211D] leading-relaxed">{noteItem.note}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-[#5A6E65] italic bg-white p-3 rounded-xl border border-[#D4E2DC]">
            No investigation notes logged yet. Use the prompt below to log phone verifications, telemetry checks, or evidence.
          </p>
        )}

        {/* Add Note Form */}
        {!isResolved && (
          <form onSubmit={handleAddNote} className="flex gap-2">
            <input
              type="text"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Add an analyst investigation note (e.g. Spoke with customer, IP geolocated to corporate VPN)..."
              disabled={isAddingNote}
              className="flex-1 px-3 py-2 rounded-xl text-xs bg-white border border-[#D4E2DC] focus:outline-none focus:border-[#285C4D] text-[#17211D]"
            />
            <button
              type="submit"
              disabled={isAddingNote || !noteText.trim()}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#285C4D] text-white hover:bg-[#1d453a] transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              {isAddingNote ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
              <span>Post Note</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default CaseManagementBar;
