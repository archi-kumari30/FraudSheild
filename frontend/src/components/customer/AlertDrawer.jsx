import React from 'react';
import { X, ShieldAlert, AlertTriangle, Check, BellOff } from 'lucide-react';
import { useAlerts } from '../../context/AlertContext';

const AlertDrawer = ({ isOpen, onClose }) => {
  const { alerts, markAsRead, loading } = useAlerts();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        className="fixed inset-0 bg-[#17211D]/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-md w-full flex">
        <div className="relative w-full bg-[#FAFCFA] shadow-2xl border-l border-[#D4E2DC] flex flex-col text-[#17211D]">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-[#D4E2DC] flex items-center justify-between bg-[#F4F8F5]">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-[#285C4D]" />
              <h2 className="text-sm font-semibold text-[#17211D]">Security Alerts</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-[#5A6E65] hover:text-[#17211D] hover:bg-[#DCEBE4] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Alert List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
            {loading && alerts.length === 0 ? (
              <div className="text-center py-12 text-[#5A6E65] text-xs">
                Loading security notices...
              </div>
            ) : alerts.length === 0 ? (
              <div className="text-center py-16 px-4">
                <div className="w-12 h-12 rounded-full bg-[#EDF6F1] text-[#285C4D] flex items-center justify-center mx-auto mb-3">
                  <BellOff className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-semibold text-[#17211D]">No Security Alerts</h4>
                <p className="text-xs text-[#5A6E65] mt-1 max-w-xs mx-auto">
                  Your account has no active fraud warnings or escrow holds.
                </p>
              </div>
            ) : (
              alerts.map((alert) => {
                const isHigh = alert.severity === 'HIGH';
                return (
                  <div
                    key={alert._id}
                    className={`p-3.5 rounded-lg border transition-all ${
                      alert.isRead
                        ? 'bg-[#FAFCFA] border-[#D4E2DC] opacity-70'
                        : isHigh
                        ? 'bg-[#FBF0EF] border-[#E6BFBD]'
                        : 'bg-[#FAF4EB] border-[#EAD7BA]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {isHigh ? (
                          <ShieldAlert className="w-4 h-4 text-[#B65D59] shrink-0" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-[#C89445] shrink-0" />
                        )}
                        <h4 className="text-xs font-semibold text-[#17211D]">{alert.title}</h4>
                      </div>
                      {!alert.isRead && (
                        <button
                          onClick={() => markAsRead(alert._id)}
                          className="p-1 text-[#5A6E65] hover:text-[#285C4D]"
                          title="Mark read"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-[#5A6E65] mt-1.5 leading-relaxed">
                      {alert.message}
                    </p>
                    <div className="text-[10px] text-[#5A6E65] mt-2 font-mono">
                      {new Date(alert.createdAt).toLocaleString()}
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
