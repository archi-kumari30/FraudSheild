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
    { value: 'AI_ASSISTANT_ACCESSED', label: 'AI Invocations' },
    { value: 'WALLET_DEPOSIT_COMPLETED', label: 'Wallet Deposits' },
    { value: 'BENEFICIARY_ADDED', label: 'Beneficiary Added' },
    { value: 'BENEFICIARY_REMOVED', label: 'Beneficiary Removed' }
  ];

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-200/80 space-y-4">
      {/* Header and Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Immutable Audit Trail</h3>
            <p className="text-xs text-slate-400">
              Append-only security log for forensic tracking and compliance non-repudiation
            </p>
          </div>
        </div>

        <div>
          <select
            value={selectedEventType}
            onChange={(e) => onSelectEventType(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 text-xs font-semibold text-slate-700 bg-white"
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
          <div className="py-16 text-center text-slate-400 text-xs">Loading audit records...</div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            No audit records found matching selected filter.
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-3 px-3">Timestamp</th>
                <th className="py-3 px-3">Event Type</th>
                <th className="py-3 px-3">Actor</th>
                <th className="py-3 px-3">Target Entity</th>
                <th className="py-3 px-3">Client IP</th>
                <th className="py-3 px-3">Metadata</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 font-mono text-[11px]">
              {logs.map((log) => {
                const actorName = log.actorId?.name || log.actorRole || 'SYSTEM';
                const actorEmail = log.actorId?.email ? ` (${log.actorId.email})` : '';

                return (
                  <tr key={log._id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Timestamp */}
                    <td className="py-3 px-3 text-slate-500 font-sans">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>

                    {/* Event Type */}
                    <td className="py-3 px-3 font-bold text-slate-900">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200">
                        {log.eventType}
                      </span>
                    </td>

                    {/* Actor */}
                    <td className="py-3 px-3 font-sans">
                      <span className="font-semibold text-slate-800">{actorName}</span>
                      <span className="text-[10px] text-slate-400 block">{actorEmail}</span>
                    </td>

                    {/* Target Entity */}
                    <td className="py-3 px-3 text-slate-600">
                      {log.targetEntity?.entityType ? (
                        <span>
                          {log.targetEntity.entityType}:{' '}
                          {log.targetEntity.entityId?.toString().slice(-6) || '-'}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>

                    {/* IP */}
                    <td className="py-3 px-3 text-slate-500 font-mono">{log.ipAddress}</td>

                    {/* Metadata */}
                    <td className="py-3 px-3 text-slate-600 max-w-xs truncate" title={JSON.stringify(log.metadata)}>
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
      <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <div>
          Showing page <strong className="text-slate-800">{pagination.currentPage || 1}</strong> of{' '}
          <strong className="text-slate-800">{pagination.totalPages || 1}</strong> (
          {pagination.totalCount || logs.length} records)
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(Math.max(1, (pagination.currentPage || 1) - 1))}
            disabled={(pagination.currentPage || 1) <= 1 || loading}
            className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => onPageChange((pagination.currentPage || 1) + 1)}
            disabled={(pagination.currentPage || 1) >= (pagination.totalPages || 1) || loading}
            className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuditLogTable;
