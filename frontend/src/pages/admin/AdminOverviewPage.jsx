import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  AlertTriangle,
  History,
  FileText,
  CheckCircle2,
  Users,
  Server,
  ArrowRight,
  ShieldCheck,
  Eye,
  ArrowUpRight
} from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import CaseDetailModal from '../../components/admin/CaseDetailModal';
import StatusBadge from '../../components/common/StatusBadge';

const AdminOverviewPage = () => {
  const [stats, setStats] = useState({
    pendingReviews: 0,
    totalTransactions: 0,
    approvedTransactions: 0,
    blockedTransactions: 0,
    totalAuditLogs: 0,
    totalCustomers: 0
  });
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [pendingReviews, setPendingReviews] = useState([]);
  const [systemHealth, setSystemHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  const [selectedCase, setSelectedCase] = useState(null);
  const [isCaseModalOpen, setIsCaseModalOpen] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, reviewsRes, txRes, healthRes] = await Promise.all([
        axiosClient.get('/admin/reviews/stats'),
        axiosClient.get('/admin/reviews'),
        axiosClient.get('/transactions'),
        axiosClient.get('/health')
      ]);

      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data);
      }
      if (reviewsRes.success && Array.isArray(reviewsRes.data?.reviews)) {
        setPendingReviews(reviewsRes.data.reviews);
      }
      if (txRes.success && Array.isArray(txRes.data?.transactions)) {
        setRecentTransactions(txRes.data.transactions.slice(0, 8));
      }
      if (healthRes.success && healthRes.data) {
        setSystemHealth(healthRes.data);
      }
    } catch (err) {
      console.warn('Failed to load operations console data:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
    setIsCaseModalOpen(true);
  };

  const handleResolved = () => {
    setIsCaseModalOpen(false);
    loadData();
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
      {/* Console Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#17211D]">
            Fraud Operations Console
          </h1>
          <p className="text-xs sm:text-sm text-[#5A6E65] mt-0.5">
            Real-time heuristic surveillance, risk tier distribution, and escrow telemetry.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/admin/reviews"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#285C4D] hover:bg-[#20493D] text-white font-semibold text-xs shadow-xs transition-colors"
          >
            <AlertTriangle className="w-4 h-4 text-[#C89445]" />
            <span>Review Queue ({stats.pendingReviews})</span>
          </Link>
        </div>
      </div>

      {/* Primary Dashboard Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Transactions */}
        <div className="p-5 rounded-2xl bg-[#FAFCFA] border border-[#D4E2DC] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[#5A6E65] text-[11px] font-bold uppercase tracking-wider">
            <span>Total Transactions</span>
            <History className="w-4 h-4 text-[#285C4D]" />
          </div>
          <div className="text-2xl font-extrabold text-[#17211D] mt-1">{stats.totalTransactions}</div>
          <p className="text-[11px] text-[#5A6E65]">Screened payment streams</p>
        </div>

        {/* Under Review */}
        <div className="p-5 rounded-2xl bg-[#FAFCFA] border border-[#EAD7BA] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[#946625] text-[11px] font-bold uppercase tracking-wider">
            <span>Under Review</span>
            <AlertTriangle className="w-4 h-4 text-[#C89445]" />
          </div>
          <div className="text-2xl font-extrabold text-[#946625] mt-1">{stats.pendingReviews}</div>
          <p className="text-[11px] text-[#5A6E65]">Quarantined in escrow</p>
        </div>

        {/* Blocked */}
        <div className="p-5 rounded-2xl bg-[#FAFCFA] border border-[#F2D6D3] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[#8C3E3A] text-[11px] font-bold uppercase tracking-wider">
            <span>Blocked</span>
            <ShieldAlert className="w-4 h-4 text-[#B65D59]" />
          </div>
          <div className="text-2xl font-extrabold text-[#8C3E3A] mt-1">{stats.blockedTransactions}</div>
          <p className="text-[11px] text-[#5A6E65]">High-risk halted transfers</p>
        </div>

        {/* Approved */}
        <div className="p-5 rounded-2xl bg-[#FAFCFA] border border-[#D4E2DC] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[#285C4D] text-[11px] font-bold uppercase tracking-wider">
            <span>Approved</span>
            <CheckCircle2 className="w-4 h-4 text-[#285C4D]" />
          </div>
          <div className="text-2xl font-extrabold text-[#285C4D] mt-1">{stats.approvedTransactions}</div>
          <p className="text-[11px] text-[#5A6E65]">Settled clean transfers</p>
        </div>
      </div>

      {/* Heuristic Engine Telemetry Bar */}
      <div className="p-4 rounded-xl bg-[#FAFCFA] border border-[#D4E2DC] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#EAF3EF] border border-[#D4E2DC] text-[#285C4D] flex items-center justify-center">
            <Server className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#17211D]">Deterministic Fraud Engine</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EAF3EF] text-[#285C4D] border border-[#D4E2DC] uppercase">
                {systemHealth?.status || 'Online'}
              </span>
            </div>
            <p className="text-[11px] text-[#5A6E65]">
              6 Heuristics Active • Storage: <strong className="text-[#17211D] font-mono">{systemHealth?.database || 'connected'}</strong> • Environment: <strong className="text-[#17211D] font-mono">{systemHealth?.environment || 'development'}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <Link
            to="/admin/rules"
            className="px-3.5 py-1.5 rounded-lg bg-[#EAF3EF] hover:bg-[#DCEBE4] text-[#285C4D] font-semibold transition-colors border border-[#D4E2DC]"
          >
            Rules Matrix
          </Link>
          <Link
            to="/admin/audit-logs"
            className="px-3.5 py-1.5 rounded-lg bg-[#EAF3EF] hover:bg-[#DCEBE4] text-[#285C4D] font-semibold transition-colors border border-[#D4E2DC]"
          >
            Audit Trail
          </Link>
        </div>
      </div>

      {/* Priority Review Queue Snapshot */}
      {pendingReviews.length > 0 && (
        <div className="bg-[#FAFCFA] rounded-2xl p-6 border border-[#EAD7BA] shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#EAD7BA]">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#C89445]" />
              <h3 className="text-sm font-bold text-[#946625]">
                Urgent Review Queue ({pendingReviews.length} Held)
              </h3>
            </div>
            <Link
              to="/admin/reviews"
              className="text-xs font-semibold text-[#285C4D] hover:underline flex items-center gap-1"
            >
              <span>Manage All Cases</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {pendingReviews.slice(0, 3).map((tx) => (
              <div
                key={tx._id}
                className="p-4 rounded-xl bg-white border border-[#D4E2DC] space-y-2 hover:border-[#285C4D] transition-colors"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-bold text-[#285C4D]">#{tx._id.slice(-6)}</span>
                  <span className="font-extrabold text-[#946625] bg-[#FAF4EB] px-2 py-0.5 rounded border border-[#EAD7BA]">
                    {tx.riskScore}/100
                  </span>
                </div>
                <div className="text-xs">
                  <span className="text-[#5A6E65] block">From: {tx.senderId?.name || 'Customer'}</span>
                  <span className="text-sm font-bold text-[#17211D]">{formatINR(tx.amount)}</span>
                </div>
                <div className="pt-2 border-t border-[#E4ECE8] flex items-center justify-between text-[11px]">
                  <span className="text-[#5A6E65]">{new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <Link
                    to={`/admin/investigation/${tx._id}`}
                    className="font-bold text-[#285C4D] hover:underline flex items-center gap-0.5"
                  >
                    <span>Investigate</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Risk Activity Table */}
      <div className="bg-[#FAFCFA] rounded-2xl p-6 border border-[#D4E2DC] shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#D4E2DC]">
          <div>
            <h3 className="text-base font-semibold text-[#17211D]">
              Recent Risk Activity
            </h3>
            <p className="text-xs text-[#5A6E65] mt-0.5">
              Live stream of transactions processed through the deterministic heuristic pipeline
            </p>
          </div>

          <Link
            to="/admin/transactions"
            className="text-xs font-semibold text-[#285C4D] hover:underline flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#5A6E65]">
            No transaction records found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#D4E2DC] text-[#5A6E65] font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-2.5 px-3">Transaction</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Risk Score</th>
                  <th className="py-2.5 px-3">Risk Level</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4ECE8]">
                {recentTransactions.map((tx) => (
                  <tr key={tx._id} className="hover:bg-[#F4F8F5] transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-[#285C4D]">
                      #{tx._id?.toString().slice(-8)}
                    </td>
                    <td className="py-3 px-3 font-bold text-[#17211D]">
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
                    <td className="py-3 px-3 font-semibold text-[#5A6E65] uppercase">
                      {tx.riskLevel}
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge status={tx.status} />
                    </td>
                    <td className="py-3 px-3 text-[#5A6E65]">
                      {new Date(tx.createdAt).toLocaleDateString()}{' '}
                      <span className="text-[10px] text-[#5A6E65]/70">
                        {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
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
          </div>
        )}
      </div>

      {/* Case Dossier Modal */}
      <CaseDetailModal
        isOpen={isCaseModalOpen}
        onClose={() => setIsCaseModalOpen(false)}
        transaction={selectedCase}
        onResolved={handleResolved}
      />
    </div>
  );
};

export default AdminOverviewPage;
