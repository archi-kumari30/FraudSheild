import React, { useState, useEffect } from 'react';
import { User, Shield, Smartphone, Lock, CheckCircle2, AlertTriangle, KeyRound, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import axiosClient from '../../api/axiosClient';
import DeviceManagerCard from '../../components/customer/DeviceManagerCard';
import TransactionPinModal from '../../components/customer/TransactionPinModal';
import { getDeviceId } from '../../utils/deviceToken';

const SettingsPage = () => {
  const { user } = useAuth();
  const [devices, setDevices] = useState([]);
  const [loadingDevices, setLoadingDevices] = useState(true);
  const [pinStatus, setPinStatus] = useState({ hasPinSet: false, checked: false });
  const [loadingPin, setLoadingPin] = useState(true);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);

  const currentDeviceId = getDeviceId();

  const loadDevices = async () => {
    try {
      const res = await axiosClient.get('/devices');
      if (res.success && Array.isArray(res.data?.devices)) {
        setDevices(res.data.devices);
      }
    } catch (err) {
      console.warn('Could not fetch devices:', err.message);
    } finally {
      setLoadingDevices(false);
    }
  };

  const loadPinStatus = async () => {
    try {
      const res = await axiosClient.get('/auth/pin/status');
      if (res.success && res.data) {
        setPinStatus({
          hasPinSet: Boolean(res.data.hasPinSet),
          checked: true
        });
      }
    } catch (err) {
      console.warn('Could not fetch PIN status:', err.message);
      setPinStatus({ hasPinSet: false, checked: true });
    } finally {
      setLoadingPin(false);
    }
  };

  useEffect(() => {
    loadDevices();
    loadPinStatus();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#17211D]">
          Account & Security Settings
        </h1>
        <p className="text-xs sm:text-sm text-[#5A6E65] mt-0.5">
          Manage your customer profile, registered transaction devices, and security credentials.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Profile Card + Transaction PIN Card */}
        <div className="space-y-6">
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

          {/* Transaction PIN Card */}
          <div className="bg-[#FAFCFA] rounded-2xl p-6 border border-[#D4E2DC] shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#D4E2DC]">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#285C4D]" />
                <h3 className="text-sm font-bold text-[#17211D]">Transaction PIN</h3>
              </div>
              {loadingPin ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#5A6E65]" />
              ) : pinStatus.hasPinSet ? (
                <span className="text-[10px] font-bold text-[#285C4D] bg-[#EAF3EF] px-2 py-0.5 rounded border border-[#C8DCD2]">
                  Configured
                </span>
              ) : (
                <span className="text-[10px] font-bold text-[#8C3E3A] bg-[#FBF0EF] px-2 py-0.5 rounded border border-[#E6BFBD]">
                  Not Configured
                </span>
              )}
            </div>

            <p className="text-xs text-[#5A6E65] leading-relaxed">
              Every outgoing transfer requires a mandatory 6-digit Transaction PIN. Payments cannot be initiated without entering your verified PIN.
            </p>

            <div className="pt-1">
              <button
                type="button"
                onClick={() => setIsPinModalOpen(true)}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#285C4D] text-white font-medium text-xs hover:bg-[#1d453a] transition-colors shadow-xs"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>
                  {pinStatus.hasPinSet ? 'Change or Reset PIN' : 'Configure Transaction PIN'}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Device Management */}
        <div className="lg:col-span-2">
          {loadingDevices ? (
            <div className="bg-[#FAFCFA] rounded-2xl p-8 border border-[#D4E2DC] text-center text-xs text-[#5A6E65]">
              Loading registered hardware devices...
            </div>
          ) : (
            <DeviceManagerCard
              devices={devices}
              onDeviceUpdated={loadDevices}
              currentDeviceId={currentDeviceId}
            />
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

      {/* PIN Configuration & Reset Modal */}
      <TransactionPinModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onPinConfigured={loadPinStatus}
        hasExistingPin={pinStatus.hasPinSet}
      />
    </div>
  );
};

export default SettingsPage;
