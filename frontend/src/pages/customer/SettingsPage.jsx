import React, { useState, useEffect } from 'react';
import { User, Shield, Smartphone, Lock, CheckCircle2, AlertTriangle, Monitor, Key } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import axiosClient from '../../api/axiosClient';

const SettingsPage = () => {
  const { user } = useAuth();
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosClient
      .get('/devices')
      .then((res) => {
        if (res.success && Array.isArray(res.data?.devices)) {
          setDevices(res.data.devices);
        }
      })
      .catch((err) => console.warn('Could not fetch devices:', err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#17211D]">
          Account & Security Settings
        </h1>
        <p className="text-xs sm:text-sm text-[#5A6E65] mt-0.5">
          Manage your customer profile, registered transaction devices, and security preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="bg-[#FAFCFA] rounded-2xl p-6 border border-[#D4E2DC] shadow-xs space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-[#D4E2DC]">
            <div className="w-12 h-12 rounded-full bg-[#285C4D] text-white flex items-center justify-center font-bold text-base uppercase">
              {user?.name ? user.name.charAt(0) : 'U'}
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#17211D]">{user?.name || 'Customer'}</h3>
              <p className="text-xs text-[#5A6E65]">{user?.email || ''}</p>
            </div>
          </div>

          <div className="space-y-2.5 text-xs">
            <div>
              <span className="text-[#5A6E65] block font-medium">User Role</span>
              <span className="font-bold text-[#285C4D] uppercase">{user?.role || 'customer'}</span>
            </div>
            <div>
              <span className="text-[#5A6E65] block font-medium">Customer ID</span>
              <span className="font-mono text-[#5A6E65] text-[11px]">{user?._id || user?.id || 'N/A'}</span>
            </div>
            <div>
              <span className="text-[#5A6E65] block font-medium">Account Currency</span>
              <span className="font-bold text-[#17211D]">INR (₹ - Simulated Ledger)</span>
            </div>
          </div>
        </div>

        {/* Security & Verification Card */}
        <div className="lg:col-span-2 bg-[#FAFCFA] rounded-2xl p-6 border border-[#D4E2DC] shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#D4E2DC]">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#285C4D]" />
              <h3 className="text-sm font-bold text-[#17211D]">
                Registered Known Devices ({devices.length})
              </h3>
            </div>
            <span className="text-[10px] font-bold text-[#285C4D] bg-[#EAF3EF] px-2 py-0.5 rounded border border-[#D4E2DC]">
              Rule 3 Protected
            </span>
          </div>

          <p className="text-xs text-[#5A6E65] leading-relaxed">
            The FraudShield engine enforces <strong className="text-[#17211D]">Rule 3 (New Device)</strong>. Transactions originating from unrecognized device fingerprints add a +25 risk weight to prevent account takeover.
          </p>

          {loading ? (
            <div className="py-8 text-center text-xs text-[#5A6E65]">
              Loading registered hardware devices...
            </div>
          ) : devices.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#5A6E65]">
              No recognized devices logged yet. Your next transaction device fingerprint will be registered.
            </div>
          ) : (
            <div className="space-y-2.5">
              {devices.map((dev) => (
                <div
                  key={dev._id}
                  className="p-3.5 rounded-xl bg-[#F4F8F5] border border-[#D4E2DC] text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-3.5 h-3.5 text-[#285C4D]" />
                      <span className="font-mono font-bold text-[#17211D]">
                        {dev.deviceId}
                      </span>
                    </div>
                    <span className="text-[11px] text-[#5A6E65] block">
                      IP: {dev.ipAddress || 'Unknown'} • First seen: {new Date(dev.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-center">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#EAF3EF] text-[#285C4D] border border-[#D4E2DC]">
                      Verified Device
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Security Policies Banner */}
      <div className="p-5 rounded-2xl bg-[#EAF3EF] border border-[#D4E2DC] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h4 className="text-xs font-bold text-[#285C4D] uppercase tracking-wider">
            Simulated Ledger Protection
          </h4>
          <p className="text-xs text-[#5A6E65] max-w-2xl leading-relaxed">
            All balances, deposits, and payments are strictly simulated within an internal ledger in Indian Rupees (₹). Real financial gateways, credit cards, and UPI rails are deliberately disconnected for safety.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
