import React from 'react';
import { History, ChevronLeft, ChevronRight, ShieldCheck } from 'lucide-react';

const AuditLogTable = ({
  logs = [],
  pagination = {},
  selectedEventType = '',
  onSelectEventType,
  onPageChange,
  loading = false
}) => {
  const eventTypes = [
    { value: '', label: 'All Event Types' },
    { value: 'ADMIN_REVIEW_APPROVED', label: 'Review Approved' },
    { value: 'ADMIN_REVIEW_REJECTED', label: 'Review Rejected' },
    { value: 'AUTH_LOGIN_SUCCESS', label: 'Login Success' },
    { value: 'AUTH_LOGIN_FAILURE', label: 'Login Failure' },
    { value: 'TRANSACTION_INITIATED', label: 'Transfer Initiated' },
    { value: 'FRAUD_EVALUATION_COMPLETED', label: 'Fraud Evaluated' },
    { value: 'AI_ASSISTANT_ACCESSED', label: 'AI Advisory Invocations' },
    { value: 'WALLET_DEPOSIT_COMPLETED', label: 'Wallet Deposits' },
    { value: 'BENEFICIARY_ADDED', label: 'Beneficiary Added' },
    { value: 'BENEFICIARY_REMOVED', label: 'Beneficiary Removed' }
  ];

  return (
    <div className="bg-[#FAFCFA] rounded-2xl p-6 border border-[#D4E2DC] shadow-xs space-y-4 text-[#17211D]">
      {/* Header and Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#D4E2DC]">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#EAF3EF] text-[#285C4D] flex items-center justify-center border border-[#D4E2DC]">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-[#17211D]">Immutable Forensic Audit Trail</h3>
            <p className="text-xs text-[#5A6E65]">
              Append-only security log for forensic tracking and regulatory non-repudiation
            </p>
          </div>
        </div>

        <div>
          <select
            value={selectedEventType}
            onChange={(e) => onSelectEventType(e.target.value)}
            className="px-3 py-2 rounded-xl bg-white border border-[#D4E2DC] text-xs font-semibold text-[#17211D] focus:outline-none focus:border-[#285C4D] focus:ring-1 focus:ring-[#285C4D]"
          >
            {eventTypes.map((et) => (
              <option key={et.value} value={et.value}>
                {et.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="py-16 text-center text-[#5A6E65] text-xs">Loading audit records...</div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center text-[#5A6E65] text-xs">
            No audit records found matching selected filter.
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#D4E2DC] text-[#5A6E65] font-bold uppercase tracking-wider text-[11px]">
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Event Type</th>
                <th className="py-2.5 px-3">Actor</th>
                <th className="py-2.5 px-3">Target Entity</th>
                <th className="py-2.5 px-3">Client IP</th>
                <th className="py-2.5 px-3">Metadata</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4ECE8] font-mono text-[11px]">
              {logs.map((log) => {
                const actorName = log.actorId?.name || log.actorRole || 'SYSTEM';
                const actorEmail = log.actorId?.email ? ` (${log.actorId.email})` : '';

                return (
                  <tr key={log._id} className="hover:bg-[#F4F8F5] transition-colors">
                    {/* Timestamp */}
                    <td className="py-3 px-3 text-[#5A6E65] font-sans whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>

                    {/* Event Type */}
                    <td className="py-3 px-3 font-bold text-[#17211D]">
                      <span className="px-2 py-0.5 rounded-md bg-[#EAF3EF] border border-[#D4E2DC] text-[#285C4D]">
                        {log.eventType}
                      </span>
                    </td>

                    {/* Actor */}
                    <td className="py-3 px-3 font-sans">
                      <span className="font-semibold text-[#17211D]">{actorName}</span>
                      <span className="text-[10px] text-[#5A6E65] block font-mono">{actorEmail}</span>
                    </td>

                    {/* Target Entity */}
                    <td className="py-3 px-3 text-[#17211D]">
                      {log.targetEntity?.entityType ? (
                        <span>
                          {log.targetEntity.entityType}:{' '}
                          {log.targetEntity.entityId?.toString().slice(-8) || '-'}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>

                    {/* IP */}
                    <td className="py-3 px-3 text-[#5A6E65]">{log.ipAddress}</td>

                    {/* Metadata */}
                    <td className="py-3 px-3 text-[#5A6E65] max-w-xs truncate" title={JSON.stringify(log.metadata)}>
                      {JSON.stringify(log.metadata)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Controls */}
      <div className="pt-4 border-t border-[#D4E2DC] flex items-center justify-between text-xs text-[#5A6E65]">
        <div>
          Showing page <strong className="text-[#17211D]">{pagination.currentPage || 1}</strong> of{' '}
          <strong className="text-[#17211D]">{pagination.totalPages || 1}</strong> (
          {pagination.totalCount || logs.length} records)
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(Math.max(1, (pagination.currentPage || 1) - 1))}
            disabled={(pagination.currentPage || 1) <= 1 || loading}
            className="p-1.5 rounded-lg border border-[#D4E2DC] disabled:opacity-30 hover:bg-[#F4F8F5] text-[#17211D] transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => onPageChange((pagination.currentPage || 1) + 1)}
            disabled={(pagination.currentPage || 1) >= (pagination.totalPages || 1) || loading}
            className="p-1.5 rounded-lg border border-[#D4E2DC] disabled:opacity-30 hover:bg-[#F4F8F5] text-[#17211D] transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuditLogTable;
