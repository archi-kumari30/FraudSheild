import React, { useState } from 'react';
import { ShieldAlert, AlertTriangle, Monitor, User, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
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
        <div className="space-y-5">
          {/* Top Risk Score Header Card */}
          <div
            className={`p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              isHigh
                ? 'bg-[#FBF0EF] border-[#F2D6D3] text-[#8C3E3A]'
                : isMedium
                ? 'bg-[#FAF4EB] border-[#EAD7BA] text-[#946625]'
                : 'bg-[#EAF3EF] border-[#D4E2DC] text-[#285C4D]'
            }`}
          >
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                {isHigh ? (
                  <ShieldAlert className="w-4 h-4 text-[#B65D59]" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-[#C89445]" />
                )}
                <span>Deterministic Heuristic Evaluation</span>
              </div>
              <h3 className="text-2xl font-black mt-1 text-[#17211D]">
                Composite Risk Score: {transaction.riskScore}/100
              </h3>
              <p className="text-xs text-[#5A6E65] mt-0.5">
                Calculated by 6 parallel heuristic rules • Classification: {transaction.riskLevel} RISK
              </p>
            </div>

            <div className="flex items-center gap-3">
              <StatusBadge status={transaction.status} />

              {transaction.status === 'FLAGGED_FOR_REVIEW' && (
                <button
                  onClick={() => setIsResolveModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-[#285C4D] hover:bg-[#20493D] text-white font-bold text-xs shadow-xs transition-colors"
                >
                  Resolve Case
                </button>
              )}
            </div>
          </div>

          {/* Triggered Rules Breakdown Table */}
          <div className="bg-[#FAFCFA] rounded-2xl border border-[#D4E2DC] p-5">
            <h4 className="text-xs font-bold text-[#17211D] uppercase tracking-wider mb-3">
              Triggered Heuristic Rules ({transaction.triggeredRules?.length || 0})
            </h4>

            {transaction.triggeredRules && transaction.triggeredRules.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#D4E2DC] text-[#5A6E65] font-bold uppercase tracking-wider text-[11px]">
                      <th className="py-2.5 px-3">Rule Code</th>
                      <th className="py-2.5 px-3">Weight Added</th>
                      <th className="py-2.5 px-3">Trigger Rationale</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E4ECE8]">
                    {transaction.triggeredRules.map((rule, idx) => (
                      <tr key={idx} className="hover:bg-[#F4F8F5]">
                        <td className="py-3 px-3 font-mono font-bold text-[#285C4D]">
                          {rule.ruleCode}
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-extrabold text-[#8C3E3A] bg-[#FBF0EF] px-2 py-0.5 rounded border border-[#F2D6D3]">
                            +{rule.weight}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-[#17211D] leading-relaxed font-medium">
                          {rule.reason}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-[#5A6E65] italic">No fraud rules were triggered by this transaction.</p>
            )}
          </div>

          {/* Transaction Metadata & Device Telemetry Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Parties Card */}
            <div className="p-4 rounded-2xl border border-[#D4E2DC] bg-[#FAFCFA] space-y-3">
              <h4 className="text-xs font-bold text-[#17211D] uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#285C4D]" />
                Transaction Parties
              </h4>
              <div className="text-xs space-y-2">
                <div>
                  <span className="text-[#5A6E65] block font-medium">Sender</span>
                  <span className="font-bold text-[#17211D] block">
                    {transaction.senderId?.name || 'Customer'}
                  </span>
                  <span className="text-[11px] text-[#5A6E65] font-mono">
                    {transaction.senderId?.email || transaction.senderId}
                  </span>
                </div>
                <div className="pt-2 border-t border-[#D4E2DC]">
                  <span className="text-[#5A6E65] block font-medium">Recipient</span>
                  <span className="font-bold text-[#17211D] block">
                    {transaction.recipientId?.name || 'Beneficiary'}
                  </span>
                  <span className="text-[11px] text-[#5A6E65] font-mono">
                    {transaction.recipientId?.email || transaction.recipientId}
                  </span>
                </div>
                <div className="pt-2 border-t border-[#D4E2DC] flex items-center justify-between">
                  <span className="text-[#5A6E65] font-medium">Transfer Amount:</span>
                  <span className="font-extrabold text-[#17211D] text-sm">
                    {formatINR(transaction.amount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Device Telemetry Card */}
            <div className="p-4 rounded-2xl border border-[#D4E2DC] bg-[#FAFCFA] space-y-3">
              <h4 className="text-xs font-bold text-[#17211D] uppercase tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Monitor className="w-3.5 h-3.5 text-[#285C4D]" />
                  Device & Telemetry Context
                </span>
                {transaction.deviceContext?.isKnownDevice ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-[#EAF3EF] text-[#285C4D] border border-[#C8DCD2]">
                    Known Device
                  </span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-[#FAF4EB] text-[#946625] border border-[#EAD7BA]">
                    Unrecognized Device
                  </span>
                )}
              </h4>
              <div className="text-xs space-y-2">
                <div>
                  <span className="text-[#5A6E65] block font-medium">Application Device ID</span>
                  <span className="font-mono text-[#17211D] text-[11px] break-all block">
                    {transaction.deviceContext?.deviceId || 'Unknown'}
                  </span>
                </div>
                <div className="pt-2 border-t border-[#D4E2DC] flex items-center justify-between">
                  <div>
                    <span className="text-[#5A6E65] block font-medium">Client IP Address</span>
                    <span className="font-mono text-[#17211D] text-xs block">
                      {transaction.deviceContext?.ipAddress || 'Unknown'}
                    </span>
                  </div>
                  <div>
                    {transaction.deviceContext?.isKnownIp ? (
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-[#EAF3EF] text-[#285C4D]">
                        Recognized IP
                      </span>
                    ) : (
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-[#FAF4EB] text-[#946625]">
                        New IP
                      </span>
                    )}
                  </div>
                </div>
                <div className="pt-2 border-t border-[#D4E2DC]">
                  <span className="text-[#5A6E65] block font-medium">User-Agent Header</span>
                  <span className="font-mono text-[10px] text-[#5A6E65] block truncate" title={transaction.deviceContext?.userAgent}>
                    {transaction.deviceContext?.userAgent || 'Unknown'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Deep link to Full Investigation Page */}
          <div className="flex justify-end">
            <Link
              to={`/admin/investigation/${transaction._id}`}
              onClick={onClose}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#285C4D] hover:underline"
            >
              <span>Open Complete Investigation Dossier</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>

          {/* On-Demand Gemini AI Advisory Co-Pilot Panel */}
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
