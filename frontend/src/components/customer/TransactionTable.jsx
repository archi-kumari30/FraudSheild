import React, { useState } from 'react';
import { ArrowUpRight, ArrowDownLeft, History, Filter } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';
import { useAuth } from '../../context/AuthContext';

const TransactionTable = ({ transactions = [], loading = false }) => {
  const { user } = useAuth();
  const [filter, setFilter] = useState('ALL');

  const filteredTransactions = transactions.filter((tx) => {
    if (filter === 'ALL') return true;
    return tx.status === filter;
  });

  const formatINR = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(val || 0);
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-200/80">
      {/* Header and Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Transaction History</h3>
            <p className="text-xs text-slate-400">All transfers and incoming payments</p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'ALL', label: 'All' },
            { id: 'APPROVED', label: 'Approved' },
            { id: 'FLAGGED_FOR_REVIEW', label: 'Held' },
            { id: 'BLOCKED', label: 'Blocked' }
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => setFilter(pill.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                filter === pill.id
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table Content */}
      <div className="mt-4 overflow-x-auto">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            Loading transaction history...
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <History className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-700">No transactions found</p>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
              {filter === 'ALL'
                ? 'Your transfer activity will appear here once you initiate payments.'
                : `No transactions matching filter "${filter.toLowerCase()}".`}
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-3">Party</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Amount</th>
                <th className="py-3 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredTransactions.map((tx) => {
                const isSender =
                  tx.senderId?._id === user?._id ||
                  tx.senderId === user?._id ||
                  tx.senderId?.email === user?.email;

                const partyName = isSender
                  ? tx.recipientId?.name || tx.recipientId?.email || 'Recipient'
                  : tx.senderId?.name || tx.senderId?.email || 'Sender';

                return (
                  <tr key={tx._id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Direction Icon */}
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                            isSender
                              ? 'bg-rose-50 text-rose-600'
                              : 'bg-emerald-50 text-emerald-600'
                          }`}
                        >
                          {isSender ? (
                            <ArrowUpRight className="w-4 h-4" />
                          ) : (
                            <ArrowDownLeft className="w-4 h-4" />
                          )}
                        </div>
                        <span className="font-semibold text-slate-700">
                          {isSender ? 'Sent' : 'Received'}
                        </span>
                      </div>
                    </td>

                    {/* Party */}
                    <td className="py-3.5 px-3">
                      <div>
                        <span className="font-bold text-slate-900 block">{partyName}</span>
                        {tx.note && (
                          <span className="text-[10px] text-slate-400 italic truncate max-w-[140px] block">
                            "{tx.note}"
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-3 text-slate-500">
                      {new Date(tx.createdAt).toLocaleDateString()}{' '}
                      <span className="text-[10px] text-slate-400 block">
                        {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>

                    {/* Amount */}
                    <td className="py-3.5 px-3">
                      <span
                        className={`font-extrabold ${
                          isSender ? 'text-slate-900' : 'text-emerald-600'
                        }`}
                      >
                        {isSender ? '-' : '+'}
                        {formatINR(tx.amount)}
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-3">
                      <StatusBadge status={tx.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default TransactionTable;
