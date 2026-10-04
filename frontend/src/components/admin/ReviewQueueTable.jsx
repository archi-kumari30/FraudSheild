import React, { useState } from 'react';
import { ShieldAlert, ShieldCheck, Eye, Search, AlertTriangle } from 'lucide-react';
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
      maximumFractionDigits: 2
    }).format(val || 0);
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-200/80 space-y-4">
      {/* Header and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            Active Review Queue
            <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-rose-100 text-rose-700">
              {transactions.length} Pending
            </span>
          </h3>
          <p className="text-xs text-slate-400">
            Transactions flagged for potential fraud requiring human verification
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search ID, sender, email..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 text-xs font-medium"
          />
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            Loading review queue cases...
          </div>
        ) : filtered.length === 0 ? (
          /* Clean Empty State (EC-M11-006) */
          <div className="py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3 shadow-sm border border-emerald-100">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">All Clear! No Pending Reviews</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              There are currently zero transactions held in escrow awaiting analyst resolution.
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-3 px-3">Case ID</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Sender</th>
                <th className="py-3 px-3">Recipient</th>
                <th className="py-3 px-3">Amount</th>
                <th className="py-3 px-3">Risk Score</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((tx) => (
                <tr key={tx._id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-3 font-mono font-bold text-slate-800">
                    {tx._id?.toString().slice(-8)}
                  </td>
                  <td className="py-3.5 px-3 text-slate-500">
                    {new Date(tx.createdAt).toLocaleDateString()}{' '}
                    <span className="text-[10px] text-slate-400 block">
                      {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </td>
                  <td className="py-3.5 px-3">
                    <span className="font-bold text-slate-800 block">
                      {tx.senderId?.name || 'Customer'}
                    </span>
                    <span className="text-[10px] text-slate-400 truncate max-w-[120px] block">
                      {tx.senderId?.email || ''}
                    </span>
                  </td>
                  <td className="py-3.5 px-3">
                    <span className="font-bold text-slate-800 block">
                      {tx.recipientId?.name || 'Beneficiary'}
                    </span>
                    <span className="text-[10px] text-slate-400 truncate max-w-[120px] block">
                      {tx.recipientId?.email || ''}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 font-extrabold text-slate-900">
                    {formatINR(tx.amount)}
                  </td>
                  <td className="py-3.5 px-3">
                    <div className="flex items-center gap-1.5">
                      <span className="font-black text-amber-600 text-sm">{tx.riskScore}</span>
                      <span className="text-[10px] text-slate-400 font-semibold">/100</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-3">
                    <StatusBadge status={tx.status} />
                  </td>
                  <td className="py-3.5 px-3 text-right">
                    <button
                      onClick={() => onInspect(tx)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-xs transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Inspect</span>
                    </button>
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
