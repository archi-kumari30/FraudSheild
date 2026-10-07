import React, { useState, useEffect } from 'react';
import {
  Clock,
  LogIn,
  Smartphone,
  Send,
  AlertTriangle,
  Lock,
  UserCheck,
  Shield,
  FileCheck,
  ChevronDown,
  ChevronUp,
  Loader2,
  Activity,
  History
} from 'lucide-react';
import axiosClient from '../../api/axiosClient';

const stageIcons = {
  AUTHENTICATION: LogIn,
  DEVICE_SECURITY: Smartphone,
  BENEFICIARY_MANAGEMENT: UserCheck,
  PAYMENT_EXECUTION: Send,
  FRAUD_EVALUATION: Shield,
  ESCROW_HOLD: Lock,
  SOC_CASE_MANAGEMENT: FileCheck,
  GENERAL_AUDIT: Activity
};

const stageColors = {
  AUTHENTICATION: 'text-[#285C4D] bg-[#EAF3EF] border-[#C8DCD2]',
  DEVICE_SECURITY: 'text-[#946625] bg-[#FAF4EB] border-[#EAD7BA]',
  BENEFICIARY_MANAGEMENT: 'text-[#285C4D] bg-[#EAF3EF] border-[#C8DCD2]',
  PAYMENT_EXECUTION: 'text-[#17211D] bg-[#F4F8F5] border-[#D4E2DC]',
  FRAUD_EVALUATION: 'text-[#8C3E3A] bg-[#FBF0EF] border-[#E6BFBD]',
  ESCROW_HOLD: 'text-[#946625] bg-[#FAF4EB] border-[#EAD7BA]',
  SOC_CASE_MANAGEMENT: 'text-[#285C4D] bg-[#EAF3EF] border-[#C8DCD2]',
  GENERAL_AUDIT: 'text-[#5A6E65] bg-[#F4F8F5] border-[#D4E2DC]'
};

const ForensicTimeline = ({ transactionId }) => {
  const [timelineData, setTimelineData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedIndex, setExpandedIndex] = useState(null);

  useEffect(() => {
    if (!transactionId) return;

    let isMounted = true;
    setLoading(true);
    setError('');

    axiosClient
      .get(`/admin/reviews/${transactionId}/timeline`)
      .then((res) => {
        if (!isMounted) return;
        if (res.success && res.data) {
          setTimelineData(res.data);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || 'Failed to load forensic attack-chain timeline.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [transactionId]);

  if (loading) {
    return (
      <div className="bg-[#FAFCFA] rounded-2xl p-6 border border-[#D4E2DC] shadow-xs flex items-center justify-center py-12">
        <div className="flex items-center gap-2 text-xs text-[#5A6E65]">
          <Loader2 className="w-4 h-4 animate-spin text-[#285C4D]" />
          <span>Constructing attack-chain chronological forensic timeline...</span>
        </div>
      </div>
    );
  }

  if (error || !timelineData) {
    return (
      <div className="bg-[#FAFCFA] rounded-2xl p-6 border border-[#D4E2DC] shadow-xs">
        <div className="p-4 rounded-xl bg-[#FAF4EB] border border-[#EAD7BA] text-xs text-[#946625]">
          {error || 'Forensic timeline telemetry is unavailable for this case.'}
        </div>
      </div>
    );
  }

  const events = timelineData.timeline || [];

  return (
    <div className="bg-[#FAFCFA] rounded-2xl p-6 border border-[#D4E2DC] shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#D4E2DC]">
        <div>
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-[#285C4D]" />
            <h2 className="text-base font-bold text-[#17211D] uppercase tracking-wider">
              Attack-Chain Forensic Timeline
            </h2>
          </div>
          <p className="text-xs text-[#5A6E65] mt-1">
            Correlated sequence of authentication, device security, and payment telemetry spanning the incident window.
          </p>
        </div>
        <span className="text-xs font-mono font-bold text-[#285C4D] bg-[#EAF3EF] px-2.5 py-1 rounded-lg border border-[#C8DCD2]">
          {events.length} Correlated Events
        </span>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-8 text-xs text-[#5A6E65] italic">
          No correlated audit events found for this transaction window.
        </div>
      ) : (
        <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#D4E2DC]">
          {events.map((evt, idx) => {
            const IconComponent = stageIcons[evt.stage] || Clock;
            const badgeStyle = stageColors[evt.stage] || stageColors.GENERAL_AUDIT;
            const isExpanded = expandedIndex === idx;

            return (
              <div key={idx} className="relative group">
                {/* Node Dot on Vertical Line */}
                <div className="absolute -left-6 sm:-left-8 top-1.5 w-6 h-6 rounded-full bg-white border-2 border-[#285C4D] flex items-center justify-center shadow-xs">
                  <div className="w-2 h-2 rounded-full bg-[#285C4D]" />
                </div>

                {/* Event Card */}
                <div className="p-4 rounded-xl bg-white border border-[#D4E2DC] shadow-xs space-y-2 hover:border-[#B8CEC4] transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${badgeStyle}`}>
                        {evt.stage ? evt.stage.replace(/_/g, ' ') : 'EVENT'}
                      </span>
                      <span className="font-bold text-xs text-[#17211D]">
                        {evt.title || evt.eventType}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-[#5A6E65]">
                      {new Date(evt.timestamp).toLocaleString()}
                    </span>
                  </div>

                  <p className="text-xs text-[#4A5B53] leading-relaxed">
                    {evt.description}
                  </p>

                  {/* Telemetry metadata footer */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#E4ECE8] text-[11px] text-[#5A6E65]">
                    <div className="flex items-center gap-3">
                      <span>Actor: <strong className="text-[#17211D]">{evt.actorRole || 'System'}</strong></span>
                      {evt.ipAddress && <span>IP: <strong className="font-mono text-[#17211D]">{evt.ipAddress}</strong></span>}
                    </div>

                    {evt.metadata && Object.keys(evt.metadata).length > 0 && (
                      <button
                        type="button"
                        onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                        className="text-[10px] text-[#285C4D] font-bold hover:underline flex items-center gap-1"
                      >
                        <span>{isExpanded ? 'Hide Payload' : 'View Payload'}</span>
                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    )}
                  </div>

                  {isExpanded && evt.metadata && (
                    <div className="mt-2 p-2.5 rounded-lg bg-[#F4F8F5] border border-[#D4E2DC] font-mono text-[10px] text-[#17211D] overflow-x-auto">
                      <pre>{JSON.stringify(evt.metadata, null, 2)}</pre>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ForensicTimeline;
