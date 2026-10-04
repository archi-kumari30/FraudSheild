/**
 * Client Device Token Utility
 *
 * NOTE: The x-device-id value generated and persisted by the frontend is an
 * application-level device identifier for fraud-rule evaluation.
 * It is NOT a secure device fingerprint and must not be treated as proof of device identity.
 */

const STORAGE_KEY = 'fraudshield_device_id';

const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'fs-dev-' + Math.random().toString(36).substring(2, 15) + '-' + Date.now().toString(36);
};

export const getDeviceId = () => {
  let deviceId = localStorage.getItem(STORAGE_KEY);
  if (!deviceId) {
    deviceId = generateUUID();
    localStorage.setItem(STORAGE_KEY, deviceId);
  }
  return deviceId;
};

export const resetDeviceId = () => {
  const newId = generateUUID();
  localStorage.setItem(STORAGE_KEY, newId);
  return newId;
};
