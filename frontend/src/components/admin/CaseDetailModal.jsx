import React, { useState } from 'react';
import { ShieldAlert, AlertTriangle, Monitor, User, Calendar, IndianRupee, ArrowRight, CheckCircle2 } from 'lucide-react';
import Modal from '../common/Modal';
import StatusBadge from '../common/StatusBadge';
import AiCopilotPanel from './AiCopilotPanel';
import ResolveCaseModal from './ResolveCaseModal';

const CaseDetailModal = ({ isOpen, onClose, transaction, onResolved }) => {
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);

  if (!transaction) return null;

  const isMedium = transaction.riskLevel === 'MEDIUM';
  const isHigh = transaction.riskLevel === 'HIGH';

  const formatINR = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(val || 0);
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Fraud Case Dossier" maxWidth="max-w-3xl">
        <div className="space-y-6">
          {/* Top Authoritative Risk Score Card (EC-M11-005, TC-M11-003) */}
          <div
            className={`p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              isHigh
                ? 'bg-rose-50/70 border-rose-200 text-rose-900'
                : isMedium
                ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                : 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
            }`}
          >
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                {isHigh ? (
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                )}
                <span>Deterministic Heuristic Evaluation</span>
              </div>
              <h3 className="text-2xl font-black mt-1">
                Composite Risk Score: {transaction.riskScore}/100
              </h3>
              <p className="text-xs opacity-90 mt-0.5">
                Deterministic ceiling capped at 100 • Tier: {transaction.riskLevel} RISK
              </p>
            </div>

            <div className="flex items-center gap-3">
              <StatusBadge status={transaction.status} />

              {transaction.status === 'FLAGGED_FOR_REVIEW' && (
                <button
                  onClick={() => setIsResolveModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all"
                >
                  Resolve Case
                </button>
              )}
            </div>
          </div>

          {/* Triggered Rules Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
              Triggered Heuristic Rules ({transaction.triggeredRules?.length || 0})
            </h4>

            {transaction.triggeredRules && transaction.triggeredRules.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                      <th className="py-2.5 px-3">Rule Code</th>
                      <th className="py-2.5 px-3">Weight</th>
                      <th className="py-2.5 px-3">Trigger Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {transaction.triggeredRules.map((rule, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-3 px-3 font-mono font-bold text-indigo-700">
                          {rule.ruleCode}
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-extrabold text-rose-600">+{rule.weight}</span>
                        </td>
                        <td className="py-3 px-3 text-slate-700 leading-relaxed font-medium">
                          {rule.reason}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No heuristic rules were triggered.</p>
            )}
          </div>

          {/* Transaction Metadata & Device Telemetry Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Parties Card */}
            <div className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-indigo-600" />
                Transaction Parties
              </h4>
              <div className="text-xs space-y-2">
                <div>
                  <span className="text-slate-400 block font-medium">Sender</span>
                  <span className="font-bold text-slate-900 block">
                    {transaction.senderId?.name || 'Customer'}
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {transaction.senderId?.email || transaction.senderId}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-200/60">
                  <span className="text-slate-400 block font-medium">Recipient</span>
                  <span className="font-bold text-slate-900 block">
                    {transaction.recipientId?.name || 'Beneficiary'}
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {transaction.recipientId?.email || transaction.recipientId}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                  <span className="text-slate-400 font-medium">Amount:</span>
                  <span className="font-extrabold text-slate-900 text-sm">
                    {formatINR(transaction.amount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Device Telemetry Card */}
            <div className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Monitor className="w-3.5 h-3.5 text-indigo-600" />
                Device & Telemetry Context
              </h4>
              <div className="text-xs space-y-2">
                <div>
                  <span className="text-slate-400 block font-medium">Application Device ID</span>
                  <span className="font-mono text-slate-700 text-[11px] break-all block">
                    {transaction.deviceContext?.deviceId || 'Unknown'}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-200/60">
                  <span className="text-slate-400 block font-medium">Client IP Address</span>
                  <span className="font-mono text-slate-700 text-xs block">
                    {transaction.deviceContext?.ipAddress || 'Unknown'}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-200/60">
                  <span className="text-slate-400 block font-medium">User-Agent Header</span>
                  <span className="font-mono text-[10px] text-slate-500 block truncate" title={transaction.deviceContext?.userAgent}>
                    {transaction.deviceContext?.userAgent || 'Unknown'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* On-Demand Gemini AI Co-Pilot Panel */}
          <AiCopilotPanel
            transactionId={transaction._id}
            existingAnalysis={transaction.aiInvestigation}
          />
        </div>
      </Modal>

      {/* Resolution Action Modal */}
      <ResolveCaseModal
        isOpen={isResolveModalOpen}
        onClose={() => setIsResolveModalOpen(false)}
        transaction={transaction}
        onResolved={(id, decision) => {
          setIsResolveModalOpen(false);
          onClose();
          if (onResolved) onResolved(id, decision);
        }}
      />
    </>
  );
};

export default CaseDetailModal;
