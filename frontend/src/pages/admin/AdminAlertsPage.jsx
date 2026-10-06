import React, { useState, useEffect, useCallback } from 'react';
import { Bell, ShieldAlert, AlertTriangle, CheckCircle2, Search, ArrowUpRight, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';

const AdminAlertsPage = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get('/alerts');
      if (res.success && Array.isArray(res.data?.alerts)) {
        setAlerts(res.data.alerts);
      }
    } catch (err) {
      console.warn('Failed to load system fraud alerts:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const handleMarkAsRead = async (alertId) => {
    try {
      await axiosClient.patch(`/alerts/${alertId}/read`);
      setAlerts((prev) =>
        prev.map((a) => (a._id === alertId ? { ...a, isRead: true } : a))
      );
    } catch (err) {
      console.warn('Failed to mark alert as read:', err.message);
    }
  };

  const filtered = alerts.filter((a) => {
    if (filter === 'HIGH' && a.severity !== 'HIGH') return false;
    if (filter === 'MEDIUM' && a.severity !== 'MEDIUM') return false;
    if (filter === 'UNREAD' && a.isRead) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const title = a.title?.toLowerCase() || '';
      const msg = a.message?.toLowerCase() || '';
      const email = a.userId?.email?.toLowerCase() || '';
      const id = a.transactionId?._id?.toString() || a.transactionId?.toString() || '';
      return title.includes(term) || msg.includes(term) || email.includes(term) || id.includes(term);
    }
    return true;
  });

  const highCount = alerts.filter((a) => a.severity === 'HIGH').length;
  const mediumCount = alerts.filter((a) => a.severity === 'MEDIUM').length;
  const unreadCount = alerts.filter((a) => !a.isRead).length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#17211D]">
          Fraud Security Alerts
        </h1>
        <p className="text-xs sm:text-sm text-[#5A6E65] mt-0.5">
          System-wide security anomalies, flagged payments, and blocked transaction alerts.
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-[#FAFCFA] border border-[#D4E2DC] shadow-xs">
          <span className="text-xs font-semibold text-[#5A6E65] block uppercase">Total Alerts</span>
          <span className="text-2xl font-extrabold text-[#17211D] mt-1 block">{alerts.length}</span>
          <span className="text-[11px] text-[#5A6E65]">Lifetime security events</span>
        </div>
        <div className="p-4 rounded-2xl bg-[#FAFCFA] border border-[#F2D6D3] shadow-xs">
          <span className="text-xs font-semibold text-[#8C3E3A] block uppercase">High Severity (Blocked)</span>
          <span className="text-2xl font-extrabold text-[#8C3E3A] mt-1 block">{highCount}</span>
          <span className="text-[11px] text-[#5A6E65]">Score 71–100 halt triggers</span>
        </div>
        <div className="p-4 rounded-2xl bg-[#FAFCFA] border border-[#EAD7BA] shadow-xs">
          <span className="text-xs font-semibold text-[#946625] block uppercase">Medium Severity (Escrow)</span>
          <span className="text-2xl font-extrabold text-[#946625] mt-1 block">{mediumCount}</span>
          <span className="text-[11px] text-[#5A6E65]">Score 31–70 quarantine triggers</span>
        </div>
      </div>

      {/* Main Filterable Card */}
      <div className="bg-[#FAFCFA] rounded-2xl p-6 border border-[#D4E2DC] shadow-xs space-y-4">
        {/* Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#D4E2DC]">
          <div className="flex items-center gap-1 bg-[#F4F8F5] p-1 rounded-xl border border-[#D4E2DC]">
            {[
              { id: 'ALL', label: 'All Alerts' },
              { id: 'HIGH', label: 'High Risk' },
              { id: 'MEDIUM', label: 'Medium Risk' },
              { id: 'UNREAD', label: `Unread (${unreadCount})` }
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
              placeholder="Search alert title, user, tx ID..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-white border border-[#D4E2DC] text-xs text-[#17211D] placeholder-[#5A6E65]/60 focus:outline-none focus:border-[#285C4D] focus:ring-1 focus:ring-[#285C4D]"
            />
          </div>
        </div>

        {/* Alerts List */}
        {loading ? (
          <div className="py-16 text-center text-[#5A6E65] text-xs">
            Loading fraud alerts...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-14 text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#EAF3EF] border border-[#D4E2DC] text-[#285C4D] flex items-center justify-center mx-auto mb-3">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-semibold text-[#17211D]">No Alerts Found</h4>
            <p className="text-xs text-[#5A6E65] mt-1">
              No security alerts match the selected criteria.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#E4ECE8]">
            {filtered.map((alert) => {
              const isHighSev = alert.severity === 'HIGH';
              const targetTxId = alert.transactionId?._id || alert.transactionId;

              return (
                <div
                  key={alert._id}
                  className={`py-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4 transition-colors ${
                    !alert.isRead ? 'bg-[#FAFCFA]' : 'opacity-85'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                        isHighSev
                          ? 'bg-[#FBF0EF] border-[#F2D6D3] text-[#8C3E3A]'
                          : 'bg-[#FAF4EB] border-[#EAD7BA] text-[#946625]'
                      }`}
                    >
                      {isHighSev ? (
                        <ShieldAlert className="w-4 h-4 text-[#B65D59]" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-[#C89445]" />
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                            isHighSev
                              ? 'bg-[#FBF0EF] border-[#F2D6D3] text-[#8C3E3A]'
                              : 'bg-[#FAF4EB] border-[#EAD7BA] text-[#946625]'
                          }`}
                        >
                          {alert.severity} RISK
                        </span>
                        {!alert.isRead && (
                          <span className="w-2 h-2 rounded-full bg-[#285C4D]" title="Unread" />
                        )}
                        <h4 className="text-xs font-bold text-[#17211D]">
                          {alert.title}
                        </h4>
                      </div>

                      <p className="text-xs text-[#5A6E65] max-w-2xl leading-relaxed">
                        {alert.message}
                      </p>

                      <div className="flex items-center gap-4 text-[11px] text-[#5A6E65] pt-1">
                        <span>
                          Account:{' '}
                          <strong className="text-[#17211D]">
                            {alert.userId?.name || alert.userId?.email || 'Customer'}
                          </strong>
                        </span>
                        <span>•</span>
                        <span>{new Date(alert.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    {targetTxId && (
                      <Link
                        to={`/admin/investigation/${targetTxId}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#EAF3EF] hover:bg-[#DCEBE4] text-[#285C4D] font-semibold text-xs border border-[#D4E2DC] transition-colors"
                      >
                        <span>Investigate</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                    )}

                    {!alert.isRead && (
                      <button
                        onClick={() => handleMarkAsRead(alert._id)}
                        className="p-1.5 rounded-lg border border-[#D4E2DC] text-[#5A6E65] hover:text-[#17211D] hover:bg-[#F4F8F5] transition-colors text-xs"
                        title="Mark as read"
                      >
                        <CheckCircle2 className="w-4 h-4 text-[#285C4D]" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAlertsPage;
