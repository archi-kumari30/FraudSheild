import React, { useState, useEffect, useCallback } from 'react';
import { Search, Eye, ArrowUpRight, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import StatusBadge from '../../components/common/StatusBadge';
import CaseDetailModal from '../../components/admin/CaseDetailModal';

const AdminTransactionsPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const [selectedCase, setSelectedCase] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get('/transactions');
      if (res.success && Array.isArray(res.data?.transactions)) {
        setTransactions(res.data.transactions);
      }
    } catch (err) {
      console.warn('Failed to load transactions:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const filtered = transactions.filter((tx) => {
    if (filter !== 'ALL' && tx.status !== filter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const id = tx._id?.toString().toLowerCase() || '';
      const sender = tx.senderId?.email?.toLowerCase() || tx.senderId?.name?.toLowerCase() || '';
      const recipient = tx.recipientId?.email?.toLowerCase() || tx.recipientId?.name?.toLowerCase() || '';
      return id.includes(term) || sender.includes(term) || recipient.includes(term);
    }
    return true;
  });

  const handleInspect = async (tx) => {
    try {
      const res = await axiosClient.get(`/transactions/${tx._id}`);
      if (res.success && res.data?.transaction) {
        setSelectedCase(res.data.transaction);
      } else {
        setSelectedCase(tx);
      }
    } catch (e) {
      setSelectedCase(tx);
    }
    setIsModalOpen(true);
  };

  const formatINR = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#17211D]">
          All System Transactions
        </h1>
        <p className="text-xs sm:text-sm text-[#5A6E65] mt-0.5">
          Complete cross-account payment stream evaluated by FraudShield deterministic rules engine.
        </p>
      </div>

      <div className="bg-[#FAFCFA] rounded-2xl p-6 border border-[#D4E2DC] shadow-xs space-y-4">
        {/* Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#D4E2DC]">
          <div className="flex items-center gap-1 bg-[#F4F8F5] p-1 rounded-xl border border-[#D4E2DC]">
            {[
              { id: 'ALL', label: 'All Transfers' },
              { id: 'APPROVED', label: 'Approved' },
              { id: 'FLAGGED_FOR_REVIEW', label: 'Held in Escrow' },
              { id: 'BLOCKED', label: 'Blocked' }
            ].map((pill) => (
              <button
                key={pill.id}
                onClick={() => setFilter(pill.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  filter === pill.id
                    ? 'bg-white text-[#285C4D] shadow-xs border border-[#D4E2DC]'
                    : 'text-[#5A6E65] hover:text-[#17211D]'
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-[#5A6E65] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by ID, sender, recipient..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-white border border-[#D4E2DC] text-xs text-[#17211D] placeholder-[#5A6E65]/60 focus:outline-none focus:border-[#285C4D] focus:ring-1 focus:ring-[#285C4D]"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-16 text-center text-[#5A6E65] text-xs">
              Loading transactions stream...
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-12 h-12 rounded-2xl bg-[#EAF3EF] border border-[#D4E2DC] text-[#285C4D] flex items-center justify-center mx-auto mb-3">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-semibold text-[#17211D]">No Transactions Found</h4>
              <p className="text-xs text-[#5A6E65] mt-1">
                No transactions matched your search or status filter criteria.
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#D4E2DC] text-[#5A6E65] font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-2.5 px-3">Transaction ID</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Sender</th>
                  <th className="py-2.5 px-3">Recipient</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Risk Score</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4ECE8]">
                {filtered.map((tx) => (
                  <tr key={tx._id} className="hover:bg-[#F4F8F5] transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-[#285C4D]">
                      #{tx._id?.toString().slice(-8)}
                    </td>
                    <td className="py-3 px-3 text-[#5A6E65]">
                      <div>{new Date(tx.createdAt).toLocaleDateString()}</div>
                      <span className="text-[10px] text-[#5A6E65]/70 block">
                        {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-semibold text-[#17211D] block">
                        {tx.senderId?.name || 'Customer'}
                      </span>
                      <span className="text-[10px] text-[#5A6E65] truncate max-w-[130px] block">
                        {tx.senderId?.email || ''}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-semibold text-[#17211D] block">
                        {tx.recipientId?.name || 'Beneficiary'}
                      </span>
                      <span className="text-[10px] text-[#5A6E65] truncate max-w-[130px] block">
                        {tx.recipientId?.email || ''}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-bold text-[#17211D] text-sm">
                      {formatINR(tx.amount)}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`font-bold px-2 py-0.5 rounded text-xs ${
                          tx.riskScore > 70
                            ? 'text-[#8C3E3A] bg-[#FBF0EF] border border-[#F2D6D3]'
                            : tx.riskScore > 30
                            ? 'text-[#946625] bg-[#FAF4EB] border border-[#EAD7BA]'
                            : 'text-[#285C4D] bg-[#EAF3EF] border border-[#D4E2DC]'
                        }`}
                      >
                        {tx.riskScore ?? 0}/100
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div>
                        <StatusBadge status={tx.status} />
                        {tx.status === 'APPROVED' && (
                          <div className="text-[10px] text-[#1E473B] font-medium mt-1">
                            Payment completed
                          </div>
                        )}
                        {tx.status === 'FLAGGED_FOR_REVIEW' && (
                          <div className="text-[10px] text-[#946625] font-medium mt-1">
                            Funds held — awaiting review
                          </div>
                        )}
                        {tx.status === 'BLOCKED' && (
                          <div className="text-[10px] text-[#8C3E3A] font-medium mt-1">
                            Payment blocked — no funds deducted
                          </div>
                        )}
                        {tx.status === 'REJECTED' && (
                          <div className="text-[10px] text-[#8C3E3A] font-medium mt-1">
                            Rejected — refunded to sender
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleInspect(tx)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#EAF3EF] hover:bg-[#DCEBE4] text-[#285C4D] font-semibold text-xs border border-[#D4E2DC] transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspect</span>
                        </button>
                        <Link
                          to={`/admin/investigation/${tx._id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#285C4D] hover:bg-[#20493D] text-white font-semibold text-xs transition-colors shadow-xs"
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

      {/* Case Dossier Modal */}
      <CaseDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        transaction={selectedCase}
        onResolved={fetchTransactions}
      />
    </div>
  );
};

export default AdminTransactionsPage;
