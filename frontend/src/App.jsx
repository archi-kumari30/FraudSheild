import { useState, useEffect } from 'react';
import axiosClient from './api/axiosClient';
import { ShieldCheck, Server, Database, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';

function App() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const checkHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosClient.get('/health');
      setHealth(res.data);
    } catch (err) {
      setError(err.message || 'Failed to connect to backend server');
      setHealth(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6">
      <div className="max-w-xl w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
        {/* Header */}
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 bg-sky-500/10 text-sky-400 rounded-xl border border-sky-500/20">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">FraudShield</h1>
            <p className="text-sm text-slate-400">Payment Fraud Detection & Prevention Platform</p>
          </div>
        </div>

        {/* Milestone Badge */}
        <div className="mb-6 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          Module 1: Infrastructure & Project Setup
        </div>

        {/* System Status Card */}
        <div className="space-y-4 mb-6">
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-slate-300 flex items-center space-x-2">
                <Server className="w-4 h-4 text-slate-400" />
                <span>Backend API Status</span>
              </span>
              {loading ? (
                <span className="text-xs text-slate-400 flex items-center space-x-1">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  <span>Connecting...</span>
                </span>
              ) : health ? (
                <span className="inline-flex items-center space-x-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  {health.status.toUpperCase()}
                </span>
              ) : (
                <span className="inline-flex items-center space-x-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  OFFLINE
                </span>
              )}
            </div>

            {/* Database indicator */}
            <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/60">
              <span className="flex items-center space-x-2">
                <Database className="w-3.5 h-3.5" />
                <span>Database Connectivity</span>
              </span>
              <span className={health?.database === 'connected' ? 'text-emerald-400 font-medium' : 'text-slate-400'}>
                {health?.database || (error ? 'Unavailable' : 'Checking...')}
              </span>
            </div>

            {/* Environment indicator */}
            <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
              <span>Environment</span>
              <span className="text-slate-300 font-mono">{health?.environment || 'development'}</span>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300">
              {error}
            </div>
          )}
        </div>

        {/* Action Button */}
        <button
          onClick={checkHealth}
          disabled={loading}
          className="w-full flex items-center justify-center space-x-2 bg-sky-600 hover:bg-sky-500 active:bg-sky-700 disabled:opacity-50 text-white font-medium py-2.5 px-4 rounded-xl transition duration-150 text-sm shadow-lg shadow-sky-600/20"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Verifying...' : 'Re-verify API Connectivity'}</span>
        </button>
      </div>
    </div>
  );
}

export default App;
