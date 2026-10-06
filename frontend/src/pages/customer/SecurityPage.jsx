import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  ShieldAlert,
  Smartphone,
  AlertTriangle,
  History,
  CheckCircle2,
  Clock,
  RefreshCw,
  ArrowRight,
  ExternalLink,
  Lock,
  UserCheck,
  Users,
  Wallet,
  Send
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAlerts } from '../../context/AlertContext';
import axiosClient from '../../api/axiosClient';
import StatusBadge from '../../components/common/StatusBadge';

const SecurityPage = () => {
  const { user, wallet } = useAuth();
  const { alerts, markAsRead, fetchAlerts } = useAlerts();
  const navigate = useNavigate();

  const [devices, setDevices] = useState([]);
  const [suspiciousTxs, setSuspiciousTxs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadSecurityData = useCallback(async () => {
    try {
      const [devRes, txRes] = await Promise.all([
        axiosClient.get('/devices'),
        axiosClient.get('/transactions')
      ]);

      if (devRes.success && Array.isArray(devRes.data?.devices)) {
        setDevices(devRes.data.devices);
      }

      if (txRes.success && Array.isArray(txRes.data?.transactions)) {
        const flaggedOrBlocked = txRes.data.transactions.filter(
          (t) => t.status === 'FLAGGED_FOR_REVIEW' || t.status === 'BLOCKED' || (t.riskScore && t.riskScore > 30)
        );
        setSuspiciousTxs(flaggedOrBlocked.slice(0, 5));
      }
    } catch (err) {
      console.warn('Security data fetch warning:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadSecurityData();
  }, [loadSecurityData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadSecurityData(), fetchAlerts()]);
  };

  const handleMarkRead = async (id) => {
    try {
      await markAsRead(id);
    } catch (err) {
      console.warn('Mark read warning:', err.message);
    }
  };

  const formatINR = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(val || 0);
  };

  const currentDeviceId = typeof window !== 'undefined'
    ? localStorage.getItem('fraudshield_device_id') || 'CURRENT_BROWSER_INSTANCE'
    : 'UNKNOWN';

  const unreadAlerts = alerts.filter((a) => !a.isRead);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#285C4D] text-white flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-[#17211D]">
              Security Dashboard
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#5A6E65] mt-1">
            Real-time account defense telemetry, recognized devices, escrow holds, and fraud diagnostics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#FAFCFA] hover:bg-[#EDF6F1] text-[#17211D] border border-[#D4E2DC] text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#285C4D] ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Syncing...' : 'Refresh Status'}</span>
          </button>
          <Link
            to="/settings"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#285C4D] hover:bg-[#1d453a] text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <span>Security Settings</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Account Security Posture Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-[#FAFCFA] border border-[#D4E2DC] shadow-subtle">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#5A6E65] uppercase tracking-wider">
              Account Status
            </span>
            <CheckCircle2 className="w-4 h-4 text-[#285C4D]" />
          </div>
          <div className="text-lg font-bold text-[#17211D] mt-2 flex items-center gap-2">
            <span>{user?.isActive ? 'Active & Protected' : 'Inactive'}</span>
          </div>
          <span className="text-[11px] text-[#5A6E65] mt-1 block">
            Customer ID: <code className="font-mono text-[10px]">{user?._id?.slice(-8) || user?.id?.slice(-8) || 'VERIFIED'}</code>
          </span>
        </div>

        <div className="p-5 rounded-xl bg-[#FAFCFA] border border-[#D4E2DC] shadow-subtle">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#5A6E65] uppercase tracking-wider">
              Rules Engine Mode
            </span>
            <ShieldCheck className="w-4 h-4 text-[#285C4D]" />
          </div>
          <div className="text-lg font-bold text-[#17211D] mt-2">
            6 Heuristics Live
          </div>
          <span className="text-[11px] text-[#285C4D] font-medium mt-1 block">
            Deterministic Evaluation Active
          </span>
        </div>

        <div className="p-5 rounded-xl bg-[#FAFCFA] border border-[#D4E2DC] shadow-subtle">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#5A6E65] uppercase tracking-wider">
              Escrow Protection
            </span>
            <Clock className="w-4 h-4 text-[#C89445]" />
          </div>
          <div className="text-lg font-bold font-mono text-[#946625] mt-2">
            {formatINR(wallet?.heldBalance)}
          </div>
          <span className="text-[11px] text-[#5A6E65] mt-1 block">
            {wallet?.heldBalance > 0 ? 'Funds quarantined in escrow' : 'Zero funds currently in hold'}
          </span>
        </div>

        <div className="p-5 rounded-xl bg-[#FAFCFA] border border-[#D4E2DC] shadow-subtle">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#5A6E65] uppercase tracking-wider">
              Active Security Alerts
            </span>
            <AlertTriangle className={`w-4 h-4 ${unreadAlerts.length > 0 ? 'text-[#B65D59]' : 'text-[#285C4D]'}`} />
          </div>
          <div className={`text-lg font-bold mt-2 font-mono ${unreadAlerts.length > 0 ? 'text-[#8C3E3A]' : 'text-[#1E473B]'}`}>
            {unreadAlerts.length} Unread
          </div>
          <span className="text-[11px] text-[#5A6E65] mt-1 block">
            {alerts.length} total lifetime alerts
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recognized Hardware Devices & Active Session */}
        <div className="space-y-6 lg:col-span-1">
          {/* Active Session & Device Fingerprint */}
          <div className="bg-[#FAFCFA] rounded-xl p-5 border border-[#D4E2DC] shadow-subtle space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-[#D4E2DC]">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-[#285C4D]" />
                <h2 className="text-xs font-bold text-[#17211D] uppercase tracking-wider">
                  Current Session
                </h2>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#EAF3EF] text-[#285C4D] border border-[#C8DCD2]">
                Active Now
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <span className="text-[#5A6E65] block font-medium">Session Fingerprint</span>
                <span className="font-mono text-[11px] text-[#17211D] break-all bg-[#EDF6F1] p-1.5 rounded block mt-1">
                  {currentDeviceId}
                </span>
              </div>
              <div>
                <span className="text-[#5A6E65] block font-medium">Authentication Type</span>
                <span className="font-semibold text-[#17211D]">JWT (Bearer HTTP-Only Header)</span>
              </div>
              <div>
                <span className="text-[#5A6E65] block font-medium">Cryptographic Credential</span>
                <span className="font-semibold text-[#17211D]">Bcrypt Hash (Cost Factor 10)</span>
              </div>
            </div>
          </div>

          {/* Recognized Devices (Rule 3 Protection) */}
          <div className="bg-[#FAFCFA] rounded-xl p-5 border border-[#D4E2DC] shadow-subtle space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-[#D4E2DC]">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-[#285C4D]" />
                <h2 className="text-xs font-bold text-[#17211D] uppercase tracking-wider">
                  Recognized Devices ({devices.length})
                </h2>
              </div>
              <span className="text-[10px] font-semibold text-[#285C4D]">
                Rule 3 Protected
              </span>
            </div>

            <p className="text-[11px] text-[#5A6E65] leading-relaxed">
              Transactions from unknown devices receive a <strong className="text-[#17211D]">+25 risk penalty</strong> to halt account takeover.
            </p>

            {loading ? (
              <div className="py-4 text-center text-xs text-[#5A6E65]">Loading recognized devices...</div>
            ) : devices.length === 0 ? (
              <div className="py-4 text-center text-xs text-[#5A6E65] bg-[#F4F8F5] rounded-lg p-3">
                No previous devices recorded yet. Your current device will register on your first approved transfer.
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {devices.map((dev) => (
                  <div
                    key={dev._id || dev.deviceId}
                    className="p-3 rounded-lg bg-[#F4F8F5] border border-[#D4E2DC] text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-[11px] text-[#17211D] truncate max-w-[150px]">
                        {dev.deviceId}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-[#EAF3EF] text-[#285C4D]">
                        Trusted
                      </span>
                    </div>
                    <div className="text-[10px] text-[#5A6E65] flex items-center justify-between">
                      <span>IP: {dev.ipAddress || 'Internal'}</span>
                      <span>{dev.lastSeenAt ? new Date(dev.lastSeenAt).toLocaleDateString() : 'Active'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Security Alerts & Suspicious Activity */}
        <div className="space-y-6 lg:col-span-2">
          {/* Recent Security Notices */}
          <div className="bg-[#FAFCFA] rounded-xl p-5 border border-[#D4E2DC] shadow-subtle space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#D4E2DC]">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#C89445]" />
                <h2 className="text-sm font-semibold text-[#17211D]">
                  Security Notices & Incident Alerts
                </h2>
              </div>
              <Link
                to="/alerts"
                className="text-xs text-[#285C4D] hover:underline font-semibold flex items-center gap-1"
              >
                <span>All Alerts</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {alerts.length === 0 ? (
              <div className="py-8 text-center bg-[#F4F8F5] rounded-xl p-4">
                <CheckCircle2 className="w-8 h-8 text-[#285C4D] mx-auto mb-2" />
                <h3 className="text-xs font-semibold text-[#17211D]">Clean Security History</h3>
                <p className="text-[11px] text-[#5A6E65] mt-1 max-w-sm mx-auto">
                  No security warnings or quarantine holds have been logged for your account.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {alerts.slice(0, 4).map((alert) => (
                  <div
                    key={alert._id}
                    className={`p-3.5 rounded-lg border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      alert.isRead
                        ? 'bg-[#FAFCFA] border-[#D4E2DC]'
                        : 'bg-[#FAF4EB] border-[#EAD7BA]'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            alert.isRead ? 'bg-[#5A6E65]' : 'bg-[#C89445]'
                          }`}
                        />
                        <span className="font-semibold text-[#17211D]">{alert.title}</span>
                        {!alert.isRead && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#FAF4EB] text-[#946625] border border-[#EAD7BA]">
                            NEW
                          </span>
                        )}
                      </div>
                      <p className="text-[#5A6E65] text-[11px] leading-relaxed">{alert.message}</p>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <span className="text-[10px] text-[#5A6E65] font-mono">
                        {new Date(alert.createdAt).toLocaleDateString()}
                      </span>
                      {!alert.isRead && (
                        <button
                          onClick={() => handleMarkRead(alert._id)}
                          className="px-2.5 py-1 rounded bg-[#FAFCFA] border border-[#D4E2DC] hover:bg-[#EDF6F1] text-[11px] font-medium text-[#285C4D] transition-colors"
                        >
                          Mark Read
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Suspicious / Quarantined Transactions */}
          <div className="bg-[#FAFCFA] rounded-xl p-5 border border-[#D4E2DC] shadow-subtle space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#D4E2DC]">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-[#B65D59]" />
                <h2 className="text-sm font-semibold text-[#17211D]">
                  Flagged & Blocked Transfers
                </h2>
              </div>
              <Link
                to="/transactions"
                className="text-xs text-[#285C4D] hover:underline font-semibold flex items-center gap-1"
              >
                <span>View Full Ledger</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {suspiciousTxs.length === 0 ? (
              <div className="py-6 text-center bg-[#F4F8F5] rounded-xl p-4">
                <CheckCircle2 className="w-6 h-6 text-[#285C4D] mx-auto mb-1.5" />
                <p className="text-xs font-semibold text-[#17211D]">No Suspicious Transfers Detected</p>
                <p className="text-[11px] text-[#5A6E65] mt-0.5">
                  All your past transfers have cleared with low risk ratings.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {suspiciousTxs.map((tx) => {
                  const recipient = tx.recipientId?.name || tx.recipientId?.email || 'Recipient';
                  return (
                    <div
                      key={tx._id}
                      className="p-3.5 rounded-lg border border-[#D4E2DC] bg-[#FAFCFA] text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold font-mono text-[#17211D]">
                            {formatINR(tx.amount)}
                          </span>
                          <span className="text-[#5A6E65]">to</span>
                          <span className="font-semibold text-[#17211D]">{recipient}</span>
                        </div>
                        <div className="text-[11px] text-[#5A6E65] mt-1 flex flex-wrap gap-1.5 items-center">
                          <span>Risk Score: <strong className="font-mono text-[#17211D]">{tx.riskScore}/100</strong></span>
                          <span>•</span>
                          <span>Triggered Rules: {tx.triggeredRules?.length || 0}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <StatusBadge status={tx.status} />
                        <Link
                          to="/transactions"
                          className="p-1.5 text-[#5A6E65] hover:text-[#285C4D] rounded"
                          title="View in transactions"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Security Action Recommendations */}
      <div className="bg-[#EDF6F1] rounded-2xl p-6 border border-[#D4E2DC] shadow-subtle space-y-4">
        <h3 className="text-sm font-bold text-[#17211D] uppercase tracking-wider flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#285C4D]" />
          <span>Security Recommendations & Quick Actions</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[#FAFCFA] p-4 rounded-xl border border-[#D4E2DC] flex flex-col justify-between">
            <div>
              <div className="w-8 h-8 rounded-lg bg-[#EDF6F1] text-[#285C4D] flex items-center justify-center mb-2">
                <Users className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-[#17211D]">Pre-Register Beneficiaries</h4>
              <p className="text-[11px] text-[#5A6E65] mt-1 leading-relaxed">
                Adding payees 24h prior to high-value payments bypasses Rule 4 (New Beneficiary) risk scoring.
              </p>
            </div>
            <Link
              to="/beneficiaries"
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[#285C4D] hover:underline"
            >
              <span>Manage Beneficiaries</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="bg-[#FAFCFA] p-4 rounded-xl border border-[#D4E2DC] flex flex-col justify-between">
            <div>
              <div className="w-8 h-8 rounded-lg bg-[#EDF6F1] text-[#285C4D] flex items-center justify-center mb-2">
                <Wallet className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-[#17211D]">Audit Escrow Balance</h4>
              <p className="text-[11px] text-[#5A6E65] mt-1 leading-relaxed">
                Check held funds awaiting analyst determination. Quarantined money is never lost.
              </p>
            </div>
            <Link
              to="/wallet"
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[#285C4D] hover:underline"
            >
              <span>View Escrow Ledger</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="bg-[#FAFCFA] p-4 rounded-xl border border-[#D4E2DC] flex flex-col justify-between">
            <div>
              <div className="w-8 h-8 rounded-lg bg-[#EDF6F1] text-[#285C4D] flex items-center justify-center mb-2">
                <Send className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-[#17211D]">Simulate Protected Transfer</h4>
              <p className="text-[11px] text-[#5A6E65] mt-1 leading-relaxed">
                Test transfers with deterministic risk scoring, instant approval, or quarantine review.
              </p>
            </div>
            <Link
              to="/send-money"
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[#285C4D] hover:underline"
            >
              <span>Send Protected Payment</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityPage;
