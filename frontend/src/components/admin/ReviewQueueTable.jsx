import React, { useState } from 'react';
import { ShieldCheck, Eye, Search, AlertTriangle, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import StatusBadge from '../common/StatusBadge';

const ReviewQueueTable = ({ transactions = [], loading = false, onInspect }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = transactions.filter((tx) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const id = tx._id?.toString().toLowerCase() || '';
    const sender = tx.senderId?.email?.toLowerCase() || tx.senderId?.name?.toLowerCase() || '';
    const recipient = tx.recipientId?.email?.toLowerCase() || tx.recipientId?.name?.toLowerCase() || '';
    return id.includes(term) || sender.includes(term) || recipient.includes(term);
  });

  const formatINR = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  return (
    <div className="bg-[#FAFCFA] rounded-2xl p-6 border border-[#D4E2DC] shadow-xs space-y-5">
      {/* Table Header and Search Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#D4E2DC]">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-[#17211D]">
              Flagged Escrow Review Queue
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FAF4EB] text-[#946625] border border-[#EAD7BA]">
              {transactions.length} Pending
            </span>
          </div>
          <p className="text-xs text-[#5A6E65] mt-0.5">
            Medium-risk transactions requiring mandatory analyst verification before settlement or refund
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-[#5A6E65] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by case ID, sender, recipient..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-white border border-[#D4E2DC] text-xs text-[#17211D] placeholder-[#5A6E65]/60 focus:outline-none focus:border-[#285C4D] focus:ring-1 focus:ring-[#285C4D]"
          />
        </div>
      </div>

      {/* Table Viewport */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="py-16 text-center text-[#5A6E65] text-xs">
            Loading pending review cases...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-14 text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#EAF3EF] border border-[#D4E2DC] text-[#285C4D] flex items-center justify-center mx-auto mb-3">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-semibold text-[#17211D]">Review Queue Clear</h4>
            <p className="text-xs text-[#5A6E65] mt-1 max-w-sm mx-auto">
              There are currently zero transactions held in escrow awaiting human analyst determination.
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#D4E2DC] text-[#5A6E65] font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3">Case ID</th>
                <th className="py-3 px-3">Timestamp</th>
                <th className="py-3 px-3">Sender</th>
                <th className="py-3 px-3">Recipient</th>
                <th className="py-3 px-3">Amount</th>
                <th className="py-3 px-3">Risk Score</th>
                <th className="py-3 px-3">Triggered Rules</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4ECE8]">
              {filtered.map((tx) => (
                <tr key={tx._id} className="hover:bg-[#F4F8F5] transition-colors">
                  <td className="py-3.5 px-3 font-mono font-bold text-[#285C4D]">
                    #{tx._id?.toString().slice(-8)}
                  </td>
                  <td className="py-3.5 px-3 text-[#5A6E65]">
                    <div>{new Date(tx.createdAt).toLocaleDateString()}</div>
                    <span className="text-[10px] text-[#5A6E65]/70 block">
                      {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </td>
                  <td className="py-3.5 px-3">
                    <span className="font-semibold text-[#17211D] block">
                      {tx.senderId?.name || 'Customer'}
                    </span>
                    <span className="text-[10px] text-[#5A6E65] truncate max-w-[130px] block">
                      {tx.senderId?.email || ''}
                    </span>
                  </td>
                  <td className="py-3.5 px-3">
                    <span className="font-semibold text-[#17211D] block">
                      {tx.recipientId?.name || 'Beneficiary'}
                    </span>
                    <span className="text-[10px] text-[#5A6E65] truncate max-w-[130px] block">
                      {tx.recipientId?.email || ''}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 font-bold text-[#17211D] text-sm">
                    {formatINR(tx.amount)}
                  </td>
                  <td className="py-3.5 px-3">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-[#946625] bg-[#FAF4EB] px-2 py-0.5 rounded border border-[#EAD7BA] text-xs">
                        {tx.riskScore}/100
                      </span>
                      <span className="text-[10px] font-semibold text-[#5A6E65] uppercase">
                        {tx.riskLevel}
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-3">
                    <div className="flex flex-wrap gap-1 max-w-[180px]">
                      {tx.triggeredRules?.length > 0 ? (
                        tx.triggeredRules.map((r, i) => (
                          <span
                            key={i}
                            className="px-1.5 py-0.5 text-[9px] font-mono font-semibold bg-[#EAF3EF] text-[#285C4D] rounded border border-[#D4E2DC]"
                            title={r.reason}
                          >
                            {r.ruleCode} (+{r.weight})
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] text-[#5A6E65] italic">None</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onInspect(tx)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#EAF3EF] hover:bg-[#DCEBE4] text-[#285C4D] font-semibold text-xs border border-[#D4E2DC] transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect</span>
                      </button>
                      <Link
                        to={`/admin/investigation/${tx._id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#285C4D] hover:bg-[#20493D] text-white font-semibold text-xs transition-colors shadow-xs"
                      >
                        <span>Dossier</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ReviewQueueTable;
