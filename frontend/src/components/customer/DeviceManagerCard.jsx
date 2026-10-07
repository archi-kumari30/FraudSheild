import React, { useState } from 'react';
import { Smartphone, Trash2, Edit2, Check, X, Shield, AlertTriangle, Loader2 } from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import { getDeviceId } from '../../utils/deviceToken';

const DeviceManagerCard = ({ devices = [], onDeviceUpdated, currentDeviceId }) => {
  const [editingId, setEditingId] = useState(null);
  const [editLabelText, setEditLabelText] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [revokingId, setRevokingId] = useState(null);
  const [isRevoking, setIsRevoking] = useState(false);
  const [error, setError] = useState('');

  const activeDeviceId = currentDeviceId || getDeviceId();

  const handleStartEdit = (dev) => {
    setEditingId(dev._id || dev.deviceId);
    setEditLabelText(dev.customLabel || dev.deviceId || '');
    setError('');
  };

  const handleSaveLabel = async (dev) => {
    const idToUpdate = dev._id || dev.deviceId;
    setIsUpdating(true);
    setError('');
    try {
      const res = await axiosClient.patch(`/devices/${idToUpdate}`, {
        customLabel: editLabelText.trim()
      });
      if (res.success) {
        setEditingId(null);
        if (onDeviceUpdated) onDeviceUpdated();
      }
    } catch (err) {
      setError(err.message || 'Failed to update device label.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRevoke = async (dev) => {
    const idToRevoke = dev._id || dev.deviceId;
    const isCurrent = dev.deviceId === activeDeviceId;
    const confirmMsg = isCurrent
      ? `CAUTION: You are about to revoke trust for THIS CURRENT ACTIVE SESSION DEVICE ("${dev.customLabel || dev.deviceId}"). Any future payments from this device will trigger the Rule 3 New Device risk penalty (+25 score) until re-verified. Are you sure you want to proceed?`
      : `Are you sure you want to revoke trust for device "${dev.customLabel || dev.deviceId}"? Any future transfers from this device will trigger the new device security penalty.`;

    if (!window.confirm(confirmMsg)) {
      return;
    }

    setRevokingId(idToRevoke);
    setIsRevoking(true);
    setError('');
    try {
      const res = await axiosClient.delete(`/devices/${idToRevoke}`);
      if (res.success) {
        if (onDeviceUpdated) onDeviceUpdated();
      }
    } catch (err) {
      setError(err.message || 'Failed to revoke device trust.');
    } finally {
      setIsRevoking(false);
      setRevokingId(null);
    }
  };

  return (
    <div className="bg-[#FAFCFA] rounded-xl p-5 border border-[#D4E2DC] shadow-subtle space-y-4">
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
        Recognized devices are trusted endpoints. Payments from unfamiliar hardware or browsers receive a <strong className="text-[#17211D]">+25 risk penalty</strong> to prevent account takeover.
      </p>

      {error && (
        <div className="p-2.5 rounded-lg bg-[#FAF4EB] border border-[#EAD7BA] text-xs text-[#946625]">
          {error}
        </div>
      )}

      {devices.length === 0 ? (
        <div className="py-4 text-center text-xs text-[#5A6E65] bg-[#F4F8F5] rounded-lg p-3">
          No trusted devices recorded yet. Your current device will register upon your first approved transfer.
        </div>
      ) : (
        <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
          {devices.map((dev) => {
            const devId = dev._id || dev.deviceId;
            const isEditing = editingId === devId;
            const isCurrent = dev.deviceId === activeDeviceId;

            return (
              <div
                key={devId}
                className="p-3 rounded-lg bg-white border border-[#D4E2DC] text-xs space-y-2 hover:border-[#B8CEC4] transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    {isEditing ? (
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <input
                          type="text"
                          value={editLabelText}
                          onChange={(e) => setEditLabelText(e.target.value)}
                          placeholder="e.g. Work MacBook Pro"
                          className="px-2 py-1 rounded border border-[#D4E2DC] text-xs text-[#17211D] focus:outline-none focus:border-[#285C4D] flex-1"
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveLabel(dev)}
                          disabled={isUpdating}
                          className="p-1 rounded bg-[#285C4D] text-white hover:bg-[#1d453a]"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="p-1 rounded bg-[#F4F8F5] text-[#5A6E65] hover:bg-[#E4ECE8]"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#17211D]">
                          {dev.customLabel || 'Personal Device'}
                        </span>
                        {isCurrent && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#EAF3EF] text-[#285C4D] border border-[#C8DCD2]">
                            This Session
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleStartEdit(dev)}
                          className="text-[#5A6E65] hover:text-[#17211D]"
                          title="Rename device"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                    <div className="font-mono text-[10px] text-[#5A6E65] truncate mt-1">
                      ID: {dev.deviceId}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-[#EAF3EF] text-[#285C4D]">
                      Trusted
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRevoke(dev)}
                      disabled={isRevoking && revokingId === devId}
                      className="p-1.5 rounded-lg text-[#8C3E3A] hover:bg-[#FBF0EF] transition-colors"
                      title="Revoke device trust"
                    >
                      {isRevoking && revokingId === devId ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] text-[#5A6E65] pt-1.5 border-t border-[#F4F8F5]">
                  <span>IP: {dev.ipAddress || 'Internal'}</span>
                  <span>Last active: {dev.lastSeenAt ? new Date(dev.lastSeenAt).toLocaleDateString() : 'Active now'}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DeviceManagerCard;
