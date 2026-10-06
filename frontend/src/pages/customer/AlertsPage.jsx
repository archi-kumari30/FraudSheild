import React, { useState } from 'react';
import { ShieldAlert, AlertTriangle, Check, BellOff, CheckCheck, Bell } from 'lucide-react';
import { useAlerts } from '../../context/AlertContext';

const AlertsPage = () => {
  const { alerts, markAsRead, loading, unreadCount } = useAlerts();
  const [filter, setFilter] = useState('ALL'); // 'ALL' or 'UNREAD'

  const filteredAlerts = alerts.filter((a) => {
    if (filter === 'UNREAD') return !a.isRead;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-[#17211D] flex items-center gap-3">
            <span>Security Alerts</span>
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FAF4EB] text-[#946625] border border-[#EAD7BA]">
                {unreadCount} Unread
              </span>
            )}
          </h1>
          <p className="text-xs sm:text-sm text-[#5A6E65] mt-1">
            Real-time security notifications, escrow hold notices, and account protection updates.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 bg-[#FAFCFA] p-1 rounded-lg border border-[#D4E2DC] shadow-xs">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              filter === 'ALL'
                ? 'bg-[#EAF3EF] text-[#285C4D] font-semibold'
                : 'text-[#5A6E65] hover:text-[#17211D]'
            }`}
          >
            All Alerts ({alerts.length})
          </button>
          <button
            onClick={() => setFilter('UNREAD')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              filter === 'UNREAD'
                ? 'bg-[#EAF3EF] text-[#285C4D] font-semibold'
                : 'text-[#5A6E65] hover:text-[#17211D]'
            }`}
          >
            Unread ({unreadCount})
          </button>
        </div>
      </div>

      {/* Alerts Feed */}
      <div className="space-y-3">
        {loading && alerts.length === 0 ? (
          <div className="py-16 text-center text-[#5A6E65] text-xs">
            Loading security notifications...
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div className="py-16 text-center rounded-xl bg-[#FAFCFA] border border-[#D4E2DC]">
            <div className="w-12 h-12 rounded-full bg-[#EDF6F1] text-[#285C4D] flex items-center justify-center mx-auto mb-3">
              <Bell className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-[#17211D]">All clear! No alerts.</h3>
            <p className="text-xs text-[#5A6E65] mt-1">
              {filter === 'UNREAD'
                ? 'You have addressed all unread security notices.'
                : 'Your account has zero recorded security alerts.'}
            </p>
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const isHigh = alert.severity === 'HIGH';
            return (
              <div
                key={alert._id}
                className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  alert.isRead
                    ? 'bg-[#FAFCFA] border-[#D4E2DC] opacity-80'
                    : isHigh
                    ? 'bg-[#FBF0EF] border-[#E6BFBD]'
                    : 'bg-[#FAF4EB] border-[#EAD7BA]'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                      isHigh
                        ? 'bg-[#B65D59] text-white'
                        : 'bg-[#C89445] text-white'
                    }`}
                  >
                    {isHigh ? (
                      <ShieldAlert className="w-5 h-5" />
                    ) : (
                      <AlertTriangle className="w-5 h-5" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-[#17211D]">{alert.title}</h4>
                      {!alert.isRead && (
                        <span className="w-2 h-2 rounded-full bg-[#285C4D]" />
                      )}
                    </div>
                    <p className="text-xs text-[#5A6E65] mt-1 max-w-2xl leading-relaxed">
                      {alert.message}
                    </p>
                    <div className="text-[10px] text-[#5A6E65] mt-2 font-mono">
                      {new Date(alert.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>

                {!alert.isRead && (
                  <button
                    onClick={() => markAsRead(alert._id)}
                    className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FAFCFA] border border-[#D4E2DC] hover:bg-[#EDF6F1] text-xs font-medium text-[#17211D] transition-colors"
                  >
                    <Check className="w-3.5 h-3.5 text-[#285C4D]" />
                    <span>Mark as Read</span>
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AlertsPage;
