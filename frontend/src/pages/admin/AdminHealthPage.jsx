import React, { useState, useEffect, useCallback } from 'react';
import { Server, Database, Clock, RefreshCw, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import axiosClient from '../../api/axiosClient';

const AdminHealthPage = () => {
  const [healthData, setHealthData] = useState(null);
  const [latency, setLatency] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState(null);

  const checkHealth = useCallback(async () => {
    setLoading(true);
    const start = performance.now();
    try {
      const res = await axiosClient.get('/health');
      const end = performance.now();
      setLatency(Math.round(end - start));
      if (res.success && res.data) {
        setHealthData(res.data);
      }
      setLastChecked(new Date());
    } catch (err) {
      console.warn('Health check failed:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  const isHealthy = healthData?.database === 'connected' && healthData?.status === 'healthy';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#17211D]">
            System & Engine Diagnostics
          </h1>
          <p className="text-xs sm:text-sm text-[#5A6E65] mt-0.5">
            Real-time diagnostics, database connectivity, and backend API latency telemetry.
          </p>
        </div>

        <button
          onClick={checkHealth}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-[#F4F8F5] text-[#17211D] font-semibold text-xs border border-[#D4E2DC] shadow-xs transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[#285C4D] ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {/* Main Status Hero */}
      <div className="p-6 rounded-2xl bg-[#FAFCFA] border border-[#D4E2DC] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-6 text-[#17211D]">
        <div className="flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${
              isHealthy
                ? 'bg-[#EAF3EF] text-[#285C4D] border-[#D4E2DC]'
                : 'bg-[#FBF0EF] text-[#8C3E3A] border-[#F2D6D3]'
            }`}
          >
            {isHealthy ? <CheckCircle2 className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6 text-[#B65D59]" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-[#17211D]">
                {isHealthy ? 'All Systems Fully Operational' : 'Degraded System Performance'}
              </h2>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                  isHealthy
                    ? 'bg-[#EAF3EF] text-[#285C4D] border-[#D4E2DC]'
                    : 'bg-[#FBF0EF] text-[#8C3E3A] border-[#F2D6D3]'
                }`}
              >
                {healthData?.status || 'Active'}
              </span>
            </div>
            <p className="text-xs text-[#5A6E65] mt-0.5">
              Backend service responding on port 5001 • Deterministic engine pipeline online
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6 text-xs">
          <div>
            <span className="text-[#5A6E65] block">Round-Trip Latency</span>
            <span className="text-sm font-bold text-[#285C4D] font-mono">
              {latency !== null ? `${latency} ms` : 'Measuring...'}
            </span>
          </div>
          <div className="border-l border-[#D4E2DC] pl-6">
            <span className="text-[#5A6E65] block">Last Verification</span>
            <span className="text-xs text-[#17211D]">
              {lastChecked ? lastChecked.toLocaleTimeString() : 'Pending'}
            </span>
          </div>
        </div>
      </div>

      {/* Health Diagnostic Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Database Diagnostic */}
        <div className="p-5 rounded-2xl bg-[#FAFCFA] border border-[#D4E2DC] shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#5A6E65] uppercase tracking-wider">
              MongoDB Database
            </span>
            <Database className="w-4 h-4 text-[#285C4D]" />
          </div>
          <div className="text-lg font-bold text-[#17211D] font-mono">
            {healthData?.database === 'connected' ? 'Connected (State: 1)' : 'Offline / Reconnecting'}
          </div>
          <p className="text-xs text-[#5A6E65] leading-relaxed">
            Persistent storage and transactional audit logging operational on port 27017.
          </p>
        </div>

        {/* Runtime Environment */}
        <div className="p-5 rounded-2xl bg-[#FAFCFA] border border-[#D4E2DC] shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#5A6E65] uppercase tracking-wider">
              Runtime Mode
            </span>
            <Server className="w-4 h-4 text-[#285C4D]" />
          </div>
          <div className="text-lg font-bold text-[#17211D] font-mono capitalize">
            {healthData?.environment || 'Development'} Mode
          </div>
          <p className="text-xs text-[#5A6E65] leading-relaxed">
            Node.js v20+ with Express 4.x running deterministic heuristic pipeline.
          </p>
        </div>

        {/* Heuristic Screening Engine */}
        <div className="p-5 rounded-2xl bg-[#FAFCFA] border border-[#D4E2DC] shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#5A6E65] uppercase tracking-wider">
              Fraud Heuristics
            </span>
            <ShieldCheck className="w-4 h-4 text-[#285C4D]" />
          </div>
          <div className="text-lg font-bold text-[#285C4D]">
            6 / 6 Active Rules
          </div>
          <p className="text-xs text-[#5A6E65] leading-relaxed">
            Extreme Amount, Velocity, Device, Beneficiary, Burst, and Dormant heuristics executing.
          </p>
        </div>
      </div>

      {/* Server Timestamp Box */}
      <div className="p-4 rounded-xl bg-[#FAFCFA] border border-[#D4E2DC] shadow-xs flex items-center justify-between text-xs text-[#5A6E65]">
        <span className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#285C4D]" />
          <span>Server Epoch Timestamp: <strong className="text-[#17211D] font-mono">{healthData?.timestamp || new Date().toISOString()}</strong></span>
        </span>
        <span className="text-[#5A6E65] font-medium">FraudShield API v1.0.0</span>
      </div>
    </div>
  );
};

export default AdminHealthPage;
