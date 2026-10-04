import React from 'react';
import { X, ShieldAlert, AlertTriangle, Check, BellOff } from 'lucide-react';
import { useAlerts } from '../../context/AlertContext';

const AlertDrawer = ({ isOpen, onClose }) => {
  const { alerts, markAsRead, loading } = useAlerts();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-md w-full flex">
        <div className="relative w-full bg-white shadow-2xl border-l border-slate-100 flex flex-col">
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-bold text-slate-900">Security Alerts</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Alert List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {loading && alerts.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm">
                Loading security notices...
              </div>
            ) : alerts.length === 0 ? (
              <div className="text-center py-16 px-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                  <BellOff className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-800">No Security Alerts</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  Your account has no active fraud warnings or pending transaction holds.
                </p>
              </div>
            ) : (
              alerts.map((alert) => {
                const isHigh = alert.severity === 'HIGH';
                return (
                  <div
                    key={alert._id}
                    className={`p-4 rounded-xl border transition-all ${
                      alert.isRead
                        ? 'bg-slate-50/60 border-slate-200/80 opacity-75'
                        : isHigh
                        ? 'bg-rose-50/50 border-rose-200'
                        : 'bg-amber-50/50 border-amber-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {isHigh ? (
                          <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        )}
                        <h4 className="text-sm font-bold text-slate-900">{alert.title}</h4>
                      </div>
                      {!alert.isRead && (
                        <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0 mt-1" />
                      )}
                    </div>

                    <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                      {alert.message}
                    </p>

                    <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
                      <span>{new Date(alert.createdAt).toLocaleString()}</span>
                      {!alert.isRead && (
                        <button
                          onClick={() => markAsRead(alert._id)}
                          className="inline-flex items-center gap-1 font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlertDrawer;
