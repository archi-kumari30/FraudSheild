import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Shield,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Monitor,
  User,
  History,
  Calendar,
  Clock,
  ArrowLeft,
  FileText,
  Sparkles,
  Bot,
  Loader2,
  CheckSquare,
  HelpCircle,
  ShieldQuestion,
  Lock,
  TrendingUp
} from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import StatusBadge from '../../components/common/StatusBadge';
import ResolveCaseModal from '../../components/admin/ResolveCaseModal';

const TransactionInvestigationPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [transaction, setTransaction] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [senderHistory, setSenderHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // AI Brief State
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [checkedChecklist, setCheckedChecklist] = useState({});

  // Resolve Modal State
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [resolutionSuccessMsg, setResolutionSuccessMsg] = useState('');

  const fetchCaseData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Fetch transaction details (try review details or general tx endpoint)
      let txData = null;
      try {
        const reviewRes = await axiosClient.get(`/admin/reviews/${id}`);
        if (reviewRes.success && reviewRes.data?.review) {
          txData = reviewRes.data.review;
        }
      } catch (err) {
        // Not in review queue or already resolved, fallback to general tx endpoint
      }

      if (!txData) {
        const txRes = await axiosClient.get(`/transactions/${id}`);
        if (txRes.success && txRes.data?.transaction) {
          txData = txRes.data.transaction;
        }
      }

      if (!txData) {
        throw new Error('Transaction record not found.');
      }

      setTransaction(txData);
      if (txData.aiInvestigation) {
        setAiAnalysis(txData.aiInvestigation);
      }

      // 2. Fetch transaction specific audit logs
      try {
        const auditRes = await axiosClient.get(`/admin/audit-logs`, {
          params: { entityId: id, limit: 10 }
        });
        if (auditRes.success && Array.isArray(auditRes.data?.logs)) {
          setAuditLogs(auditRes.data.logs);
        }
      } catch (aErr) {
        console.warn('Could not load transaction audit trail:', aErr.message);
      }

      // 3. Fetch sender's recent transaction history
      try {
        const senderId = txData.senderId?._id || txData.senderId;
        const allTxRes = await axiosClient.get('/transactions');
        if (allTxRes.success && Array.isArray(allTxRes.data?.transactions)) {
          const userTxs = allTxRes.data.transactions
            .filter((t) => (t.senderId?._id || t.senderId) === senderId && t._id !== id)
            .slice(0, 5);
          setSenderHistory(userTxs);
        }
      } catch (sErr) {
        console.warn('Could not load sender history:', sErr.message);
      }
    } catch (err) {
      setError(err.message || 'Failed to load transaction investigation dossier.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCaseData();
  }, [fetchCaseData]);

  // Handle Gemini Advisory Invocation
  const handleGenerateAiBrief = async () => {
    setAiLoading(true);
    setAiError('');
    try {
      const res = await axiosClient.post(`/admin/reviews/${id}/ai-analyze`);
      if (res.success && res.data?.aiInvestigation) {
        setAiAnalysis(res.data.aiInvestigation);
      }
    } catch (err) {
      setAiError(err.message || 'Failed to generate advisory brief.');
    } finally {
      setAiLoading(false);
    }
  };

  const toggleChecklistItem = (idx) => {
    setCheckedChecklist((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleResolved = (txId, decision) => {
    setResolutionSuccessMsg(
      decision === 'APPROVE'
        ? 'Transaction successfully approved. Escrow funds transferred to recipient.'
        : 'Transaction successfully rejected. Escrow funds refunded to sender.'
    );
    fetchCaseData();
  };

  const formatINR = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  if (loading) {
    return (
      <div className="py-24 text-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#285C4D] mx-auto" />
        <p className="text-sm font-semibold text-[#17211D]">Loading Investigation Dossier...</p>
        <p className="text-xs text-[#5A6E65]">Compiling heuristic telemetry, audit records, and behavioral context</p>
      </div>
    );
  }

  if (error || !transaction) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-[#FBF0EF] border border-[#F2D6D3] text-[#8C3E3A] flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6 text-[#B65D59]" />
        </div>
        <h3 className="text-base font-bold text-[#17211D]">Investigation Dossier Unavailable</h3>
        <p className="text-xs text-[#5A6E65]">{error || 'Unable to retrieve transaction metadata.'}</p>
        <Link
          to="/admin/reviews"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#285C4D] text-white font-semibold text-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Review Queue</span>
        </Link>
      </div>
    );
  }

  const isMedium = transaction.riskLevel === 'MEDIUM';
  const isHigh = transaction.riskLevel === 'HIGH';
  const isPending = transaction.status === 'FLAGGED_FOR_REVIEW';

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation & Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl bg-white border border-[#D4E2DC] text-[#5A6E65] hover:text-[#17211D] hover:bg-[#F4F8F5] transition-colors"
            title="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#5A6E65] uppercase tracking-wider">
                Transaction Investigation
              </span>
              <span className="font-mono text-xs font-bold text-[#285C4D]">
                #{transaction._id}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#17211D] mt-0.5">
              Case Dossier & Rule Breakdown
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <StatusBadge status={transaction.status} />
          {isPending && (
            <button
              onClick={() => setIsResolveModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#285C4D] hover:bg-[#20493D] text-white font-bold text-xs shadow-xs transition-colors"
            >
              <span>Review Case</span>
            </button>
          )}
        </div>
      </div>

      {/* Resolution Success Banner */}
      {resolutionSuccessMsg && (
        <div className="p-4 rounded-xl bg-[#EAF3EF] border border-[#D4E2DC] text-[#285C4D] text-xs font-semibold flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-[#285C4D] shrink-0" />
          <span>{resolutionSuccessMsg}</span>
        </div>
      )}

      {/* Primary Key Metrics Banner */}
      <div
        className={`p-6 rounded-2xl border shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6 ${
          isHigh
            ? 'bg-[#FBF0EF] border-[#F2D6D3]'
            : isMedium
            ? 'bg-[#FAF4EB] border-[#EAD7BA]'
            : 'bg-[#EAF3EF] border-[#D4E2DC]'
        }`}
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
            {isHigh ? (
              <ShieldAlert className="w-4 h-4 text-[#B65D59]" />
            ) : isMedium ? (
              <AlertTriangle className="w-4 h-4 text-[#C89445]" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-[#285C4D]" />
            )}
            <span
              className={
                isHigh
                  ? 'text-[#8C3E3A]'
                  : isMedium
                  ? 'text-[#946625]'
                  : 'text-[#285C4D]'
              }
            >
              Deterministic Evaluation • Tier: {transaction.riskLevel}
            </span>
          </div>

          <div className="flex items-baseline gap-3 mt-1">
            <span className="text-3xl font-extrabold text-[#17211D]">
              {formatINR(transaction.amount)}
            </span>
            <span className="text-xs text-[#5A6E65]">
              evaluated on {new Date(transaction.createdAt).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Composite Score Pill */}
        <div className="flex items-center gap-6">
          <div className="text-right">
            <span className="text-xs text-[#5A6E65] block font-semibold uppercase">
              Composite Risk Score
            </span>
            <div className="flex items-baseline justify-end gap-1 mt-0.5">
              <span
                className={`text-3xl font-black ${
                  isHigh
                    ? 'text-[#8C3E3A]'
                    : isMedium
                    ? 'text-[#946625]'
                    : 'text-[#285C4D]'
                }`}
              >
                {transaction.riskScore}
              </span>
              <span className="text-sm font-bold text-[#5A6E65]">/ 100</span>
            </div>
            <span className="text-[10px] text-[#5A6E65] block">
              Formula: min(totalRuleScore, 100)
            </span>
          </div>
        </div>
      </div>

      {/* Triggered Rule Breakdown Card (Section 13 Requirement) */}
      <div className="bg-[#FAFCFA] rounded-2xl p-6 border border-[#D4E2DC] shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#D4E2DC]">
          <div>
            <h3 className="text-base font-semibold text-[#17211D]">
              Deterministic Rule Breakdown
            </h3>
            <p className="text-xs text-[#5A6E65] mt-0.5">
              Individual score contributions that formulated this transaction's composite score
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-[#285C4D] bg-[#EAF3EF] px-2.5 py-1 rounded-lg border border-[#D4E2DC]">
            {transaction.triggeredRules?.length || 0} Rules Triggered
          </span>
        </div>

        {transaction.triggeredRules && transaction.triggeredRules.length > 0 ? (
          <div className="space-y-3">
            <div className="divide-y divide-[#E4ECE8]">
              {transaction.triggeredRules.map((rule, idx) => (
                <div key={idx} className="py-3 flex items-start justify-between gap-4">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#285C4D]">
                        {rule.ruleCode}
                      </span>
                    </div>
                    <p className="text-xs text-[#17211D] font-medium leading-relaxed">
                      {rule.reason}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="inline-block px-2.5 py-1 rounded-lg font-mono font-bold text-xs bg-[#FBF0EF] text-[#8C3E3A] border border-[#F2D6D3]">
                      +{rule.weight}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Total Math Breakdown Bar */}
            <div className="pt-3 border-t border-[#D4E2DC] flex items-center justify-between text-xs font-bold bg-[#F4F8F5] p-3 rounded-xl">
              <span className="text-[#5A6E65] uppercase tracking-wider">
                Cumulative Evaluation Total
              </span>
              <span className="text-[#17211D] font-mono text-sm">
                Score: {transaction.riskScore} / 100
              </span>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-[#5A6E65]">
            <CheckCircle2 className="w-8 h-8 text-[#285C4D] mx-auto mb-2" />
            <p className="font-semibold text-[#17211D]">Zero Rules Triggered</p>
            <p>This transaction passed all 6 security heuristics with a 0/100 risk score.</p>
          </div>
        )}
      </div>

      {/* Behavioral Amount Analysis Card */}
      {(() => {
        const amountRule = transaction.triggeredRules?.find(
          (r) => r.ruleCode === 'RULE_AMOUNT_ANOMALY' || r.ruleCode === 'RULE_AMT_EXTREME'
        );
        const historyAvg = transaction.behaviorContext?.historyAvg || 0;
        const historyCount = transaction.behaviorContext?.historyCount || 0;
        const ratio = transaction.behaviorContext?.amountRatio || (historyAvg > 0 ? (transaction.amount / historyAvg).toFixed(2) : 0);

        return (
          <div className="bg-[#FAFCFA] rounded-2xl p-6 border border-[#D4E2DC] shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#D4E2DC]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#EAF3EF] border border-[#D4E2DC] flex items-center justify-center text-[#285C4D]">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[#17211D]">
                    Behavioral Amount Analysis
                  </h3>
                  <p className="text-xs text-[#5A6E65]">
                    Deterministic evaluation comparing transfer amount against user's 30-day settled average
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-[#285C4D] bg-[#EAF3EF] px-2.5 py-1 rounded-lg border border-[#D4E2DC]">
                RULE_AMOUNT_ANOMALY
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="p-4 rounded-xl bg-white border border-[#D4E2DC]">
                <span className="text-[11px] font-semibold text-[#5A6E65] uppercase tracking-wider block">
                  Current Amount
                </span>
                <span className="text-xl font-bold text-[#17211D] mt-1 block">
                  {formatINR(transaction.amount)}
                </span>
                <span className="text-[10px] text-[#5A6E65]">Payment under evaluation</span>
              </div>

              <div className="p-4 rounded-xl bg-white border border-[#D4E2DC]">
                <span className="text-[11px] font-semibold text-[#5A6E65] uppercase tracking-wider block">
                  30-Day Historical Avg
                </span>
                <span className="text-xl font-bold text-[#17211D] mt-1 block">
                  {historyAvg > 0 ? formatINR(historyAvg) : 'Cold Start'}
                </span>
                <span className="text-[10px] text-[#5A6E65]">
                  {historyAvg > 0 ? `From ${historyCount} settled payment${historyCount === 1 ? '' : 's'}` : 'No 30-day settled history'}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-white border border-[#D4E2DC]">
                <span className="text-[11px] font-semibold text-[#5A6E65] uppercase tracking-wider block">
                  Amount / Average Ratio
                </span>
                <span className={`text-xl font-bold mt-1 block ${
                  amountRule ? 'text-[#8C3E3A]' : 'text-[#285C4D]'
                }`}>
                  {historyAvg > 0 ? `${Number(ratio).toFixed(1)}×` : '1.0× (Baseline)'}
                </span>
                <span className="text-[10px] text-[#5A6E65]">
                  {historyAvg > 0 ? (Number(ratio) > 3 ? '> 3.0× threshold (+35)' : Number(ratio) > 2 ? '> 2.0× threshold (+20)' : '≤ 2.0× normal baseline (+0)') : 'Cold-start fallback: +0'}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-white border border-[#D4E2DC]">
                <span className="text-[11px] font-semibold text-[#5A6E65] uppercase tracking-wider block">
                  Triggered Amount Rule
                </span>
                <span className="text-sm font-bold font-mono text-[#17211D] mt-1 block truncate" title={amountRule ? amountRule.ruleCode : 'None'}>
                  {amountRule ? amountRule.ruleCode : 'None (Within Baseline)'}
                </span>
                <span className="text-[10px] text-[#5A6E65] block truncate" title={amountRule ? amountRule.reason : 'Within 2× average or no history'}>
                  {amountRule ? amountRule.reason : 'Amount is within expected spending pattern'}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-white border border-[#D4E2DC]">
                <span className="text-[11px] font-semibold text-[#5A6E65] uppercase tracking-wider block">
                  Amount Rule Score
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className={`text-xl font-bold font-mono ${
                    amountRule ? 'text-[#8C3E3A]' : 'text-[#285C4D]'
                  }`}>
                    {amountRule ? `+${amountRule.weight}` : '+0'}
                  </span>
                  <span className="text-xs text-[#5A6E65]">pts</span>
                </div>
                <span className="text-[10px] text-[#5A6E65]">
                  {amountRule ? 'Heuristic risk contribution' : 'No penalty assessed'}
                </span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Grid: Customer Profile, Beneficiary Info, Device Telemetry */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Customer Profile Card */}
        <div className="bg-[#FAFCFA] rounded-2xl p-5 border border-[#D4E2DC] shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-[#17211D] uppercase tracking-wider pb-2 border-b border-[#D4E2DC]">
            <User className="w-4 h-4 text-[#285C4D]" />
            <span>Customer Profile</span>
          </div>

          <div className="space-y-2 text-xs">
            <div>
              <span className="text-[#5A6E65] block">Account Name</span>
              <span className="font-bold text-[#17211D]">
                {transaction.senderId?.name || 'Customer'}
              </span>
            </div>
            <div>
              <span className="text-[#5A6E65] block">Email Identifier</span>
              <span className="font-mono text-[#17211D]">
                {transaction.senderId?.email || 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-[#5A6E65] block">Internal User ID</span>
              <span className="font-mono text-[#5A6E65] text-[11px]">
                {transaction.senderId?._id || transaction.senderId}
              </span>
            </div>
          </div>
        </div>

        {/* Beneficiary Information Card */}
        <div className="bg-[#FAFCFA] rounded-2xl p-5 border border-[#D4E2DC] shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-[#17211D] uppercase tracking-wider pb-2 border-b border-[#D4E2DC]">
            <User className="w-4 h-4 text-[#285C4D]" />
            <span>Beneficiary Information</span>
          </div>

          <div className="space-y-2 text-xs">
            <div>
              <span className="text-[#5A6E65] block">Recipient Name</span>
              <span className="font-bold text-[#17211D]">
                {transaction.recipientId?.name || 'Beneficiary'}
              </span>
            </div>
            <div>
              <span className="text-[#5A6E65] block">Recipient Email</span>
              <span className="font-mono text-[#17211D]">
                {transaction.recipientId?.email || 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-[#5A6E65] block">Recipient User ID</span>
              <span className="font-mono text-[#5A6E65] text-[11px]">
                {transaction.recipientId?._id || transaction.recipientId}
              </span>
            </div>
          </div>
        </div>

        {/* Device Telemetry Card */}
        <div className="bg-[#FAFCFA] rounded-2xl p-5 border border-[#D4E2DC] shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-[#17211D] uppercase tracking-wider pb-2 border-b border-[#D4E2DC]">
            <Monitor className="w-4 h-4 text-[#285C4D]" />
            <span>Device Metadata</span>
          </div>

          <div className="space-y-2 text-xs">
            <div>
              <span className="text-[#5A6E65] block">Device Identifier</span>
              <span className="font-mono text-[#17211D] break-all text-[11px]">
                {transaction.deviceContext?.deviceId || 'Unknown'}
              </span>
            </div>
            <div>
              <span className="text-[#5A6E65] block">Originating IP Address</span>
              <span className="font-mono text-[#17211D]">
                {transaction.deviceContext?.ipAddress || 'Unknown'}
              </span>
            </div>
            <div>
              <span className="text-[#5A6E65] block">User Agent</span>
              <span
                className="font-mono text-[10px] text-[#5A6E65] block truncate"
                title={transaction.deviceContext?.userAgent}
              >
                {transaction.deviceContext?.userAgent || 'Unknown'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Recent Transaction History & Forensic Audit Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transaction History */}
        <div className="bg-[#FAFCFA] rounded-2xl p-5 border border-[#D4E2DC] shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#D4E2DC]">
            <div className="flex items-center gap-2 text-xs font-bold text-[#17211D] uppercase tracking-wider">
              <History className="w-4 h-4 text-[#285C4D]" />
              <span>Sender's Recent Transfers</span>
            </div>
            <span className="text-[11px] text-[#5A6E65]">{senderHistory.length} records</span>
          </div>

          {senderHistory.length === 0 ? (
            <p className="text-xs text-[#5A6E65] italic py-6 text-center">
              No previous transfers recorded for this sender account.
            </p>
          ) : (
            <div className="divide-y divide-[#E4ECE8]">
              {senderHistory.map((hTx) => (
                <div key={hTx._id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-[#17211D] block">{formatINR(hTx.amount)}</span>
                    <span className="text-[10px] text-[#5A6E65]">
                      {new Date(hTx.createdAt).toLocaleDateString()} • {hTx.recipientId?.name || 'Recipient'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-[#5A6E65]">
                      Score: {hTx.riskScore}/100
                    </span>
                    <StatusBadge status={hTx.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Audit Timeline */}
        <div className="bg-[#FAFCFA] rounded-2xl p-5 border border-[#D4E2DC] shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#D4E2DC]">
            <div className="flex items-center gap-2 text-xs font-bold text-[#17211D] uppercase tracking-wider">
              <FileText className="w-4 h-4 text-[#285C4D]" />
              <span>Immutable Forensic Audit Trail</span>
            </div>
            <span className="text-[11px] text-[#5A6E65]">{auditLogs.length} events</span>
          </div>

          {auditLogs.length === 0 ? (
            <p className="text-xs text-[#5A6E65] italic py-6 text-center">
              No audit trail events recorded specifically for this transaction ID.
            </p>
          ) : (
            <div className="space-y-3">
              {auditLogs.map((log) => (
                <div key={log._id} className="p-3 rounded-xl bg-white border border-[#D4E2DC] text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-[#285C4D]">{log.eventType}</span>
                    <span className="text-[10px] text-[#5A6E65]">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#5A6E65]">
                    Actor: <strong className="text-[#17211D]">{log.actorRole}</strong> (
                    {log.actorId?.name || log.actorId?.email || 'System'}) • IP: {log.ipAddress}
                  </div>
                  {log.metadata && Object.keys(log.metadata).length > 0 && (
                    <div className="text-[10px] font-mono text-[#5A6E65] truncate">
                      {JSON.stringify(log.metadata)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Resolution Dossier Section (if already determined) */}
      {transaction.resolvedBy && (
        <div className="bg-[#FAFCFA] rounded-2xl p-6 border border-[#D4E2DC] shadow-xs space-y-3">
          <h4 className="text-xs font-bold text-[#17211D] uppercase tracking-wider">
            Analyst Determination Record
          </h4>
          <div className="p-4 rounded-xl bg-[#F4F8F5] border border-[#D4E2DC] space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[#5A6E65] block">Determined By</span>
                <span className="font-bold text-[#17211D]">
                  {transaction.resolvedBy?.name || 'Verified Administrator'} (
                  {transaction.resolvedBy?.email || ''})
                </span>
              </div>
              <div className="text-right">
                <span className="text-[#5A6E65] block">Resolution Timestamp</span>
                <span className="text-[#17211D] font-mono">
                  {new Date(transaction.resolvedAt).toLocaleString()}
                </span>
              </div>
            </div>
            <div className="pt-2 border-t border-[#D4E2DC]">
              <span className="text-[#5A6E65] block font-semibold mb-1">Mandatory Resolution Notes</span>
              <p className="text-[#17211D] bg-white p-3 rounded-lg border border-[#D4E2DC] italic">
                "{transaction.resolutionNotes}"
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Gemini AI Advisory Co-Pilot Section (Section 8 & 13 Requirement) */}
      <div className="bg-[#FAFCFA] rounded-2xl p-6 border border-[#D4E2DC] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#D4E2DC]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EAF3EF] border border-[#D4E2DC] text-[#285C4D] flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#17211D]">
                  Gemini Investigation Assistant
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EAF3EF] text-[#285C4D] border border-[#D4E2DC] uppercase">
                  Advisory Only
                </span>
              </div>
              <p className="text-xs text-[#5A6E65] mt-0.5">
                Privacy-scrubbed context synthesis to assist human investigator decision-making (No decision authority)
              </p>
            </div>
          </div>

          <button
            onClick={handleGenerateAiBrief}
            disabled={aiLoading}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#285C4D] hover:bg-[#20493D] text-white font-semibold text-xs shadow-xs transition-colors disabled:opacity-50"
          >
            {aiLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Synthesizing Brief...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Investigation Brief</span>
              </>
            )}
          </button>
        </div>

        {/* Warning or Offline Fallback Banner */}
        {(aiError || aiAnalysis?.isFallback) && (
          <div className="p-3.5 rounded-xl bg-[#FAF4EB] border border-[#EAD7BA] text-[#946625] text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-[#C89445] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Advisory Service Status</span>
              <p className="text-[11px] text-[#946625]/90 mt-0.5">
                {aiError
                  ? 'Gemini external co-pilot is currently offline or unreachable. The primary rule engine and manual review functions remain fully operational.'
                  : 'Deterministic heuristic summary active: Gemini co-pilot timed out. Standard review checklist presented.'}
              </p>
            </div>
          </div>
        )}

        {/* AI Brief Content */}
        {aiAnalysis ? (
          <div className="space-y-4 pt-1">
            {/* Case Summary Narrative */}
            <div className="p-4 rounded-xl bg-[#F4F8F5] border border-[#D4E2DC] space-y-1">
              <h5 className="text-xs font-bold text-[#285C4D] uppercase tracking-wider flex items-center gap-1.5">
                <ShieldQuestion className="w-4 h-4 text-[#285C4D]" />
                Case Summary Narrative
              </h5>
              <p className="text-xs text-[#17211D] leading-relaxed">
                {aiAnalysis.caseSummary}
              </p>
            </div>

            {/* Synthesized Risk Patterns */}
            {aiAnalysis.riskPatterns && aiAnalysis.riskPatterns.length > 0 && (
              <div className="p-4 rounded-xl bg-[#F4F8F5] border border-[#D4E2DC] space-y-2">
                <h5 className="text-xs font-bold text-[#17211D] uppercase tracking-wider flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-[#285C4D]" />
                  Synthesized Risk Patterns
                </h5>
                <ul className="space-y-1.5">
                  {aiAnalysis.riskPatterns.map((pattern, idx) => (
                    <li key={idx} className="text-xs text-[#17211D] flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#285C4D] shrink-0 mt-1.5" />
                      <span>{pattern}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Analyst Verification Checklist */}
            {aiAnalysis.investigationChecklist && aiAnalysis.investigationChecklist.length > 0 && (
              <div className="p-4 rounded-xl bg-[#F4F8F5] border border-[#D4E2DC] space-y-2">
                <h5 className="text-xs font-bold text-[#285C4D] uppercase tracking-wider flex items-center gap-1.5">
                  <CheckSquare className="w-4 h-4 text-[#285C4D]" />
                  Analyst Verification Checklist
                </h5>
                <div className="space-y-2">
                  {aiAnalysis.investigationChecklist.map((item, idx) => {
                    const isChecked = !!checkedChecklist[idx];
                    return (
                      <label
                        key={idx}
                        className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                          isChecked
                            ? 'bg-white border-[#D4E2DC] text-[#5A6E65] line-through'
                            : 'bg-white border-[#D4E2DC] text-[#17211D] hover:border-[#285C4D]'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleChecklistItem(idx)}
                          className="rounded border-[#D4E2DC] text-[#285C4D] focus:ring-[#285C4D] mt-0.5"
                        />
                        <span className="leading-snug">{item}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="text-[10px] text-[#5A6E65] text-right">
              Generated {new Date(aiAnalysis.analyzedAt || Date.now()).toLocaleTimeString()} • Read-Only Advisory Brief
            </div>
          </div>
        ) : (
          <div className="p-6 rounded-xl bg-[#F4F8F5] border border-[#D4E2DC] text-center space-y-2">
            <Sparkles className="w-6 h-6 text-[#285C4D] mx-auto" />
            <h4 className="text-xs font-bold text-[#17211D]">On-Demand Advisory Briefing</h4>
            <p className="text-xs text-[#5A6E65] max-w-md mx-auto">
              Click "Generate Investigation Brief" above to synthesize transactional context, behavioral anomalies, and verification steps using Gemini.
            </p>
          </div>
        )}
      </div>

      {/* Determination Modal */}
      <ResolveCaseModal
        isOpen={isResolveModalOpen}
        onClose={() => setIsResolveModalOpen(false)}
        transaction={transaction}
        onResolved={handleResolved}
      />
    </div>
  );
};

export default TransactionInvestigationPage;
