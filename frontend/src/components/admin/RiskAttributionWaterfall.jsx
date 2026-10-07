import React from 'react';
import { ShieldAlert, CheckCircle2, AlertTriangle, Layers, Info, ArrowUpRight, Scale } from 'lucide-react';

const RiskAttributionWaterfall = ({ transaction }) => {
  if (!transaction) return null;

  const waterfall = transaction.attributionWaterfall || [];
  const mitigating = transaction.mitigatingSignals || [];
  const summary = transaction.waterfallSummary || {};
  const score = transaction.riskScore || 0;
  const level = transaction.riskLevel || 'LOW';

  const tierStyles = {
    LOW: {
      bg: 'bg-[#EAF3EF]',
      text: 'text-[#1E473B]',
      border: 'border-[#C8DCD2]',
      bar: 'bg-[#285C4D]',
      label: 'Low Risk — Immediate Settlement'
    },
    MEDIUM: {
      bg: 'bg-[#FAF4EB]',
      text: 'text-[#946625]',
      border: 'border-[#EAD7BA]',
      bar: 'bg-[#C89445]',
      label: 'Medium Risk — Escrow Hold & SOC Review'
    },
    HIGH: {
      bg: 'bg-[#FBF0EF]',
      text: 'text-[#8C3E3A]',
      border: 'border-[#E6BFBD]',
      bar: 'bg-[#B65D59]',
      label: 'High Risk — Transfer Hard Blocked'
    }
  };

  const style = tierStyles[level] || tierStyles.LOW;

  return (
    <div className="bg-[#FAFCFA] rounded-2xl p-6 border border-[#D4E2DC] shadow-xs space-y-6">
      {/* Header with Risk Score & Tier */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#D4E2DC]">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#285C4D]" />
            <h2 className="text-base font-bold text-[#17211D] uppercase tracking-wider">
              Explainable Risk Attribution Waterfall
            </h2>
          </div>
          <p className="text-xs text-[#5A6E65] mt-1">
            Deterministic point-by-point penalty attribution with behavioral baseline comparisons.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className={`px-3 py-1.5 rounded-xl border ${style.bg} ${style.border} ${style.text} flex items-center gap-2 font-mono text-sm font-bold`}>
            <span>Score: {score}/100</span>
            <span className="text-xs uppercase font-sans tracking-wide">({level})</span>
          </div>
        </div>
      </div>

      {/* Waterfall Visual Calculation Formula */}
      <div className="p-4 rounded-xl bg-white border border-[#D4E2DC] text-xs">
        <div className="text-[11px] font-bold text-[#5A6E65] uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Scale className="w-3.5 h-3.5 text-[#285C4D]" />
          Deterministic Score Formulation
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 font-mono text-xs">
          <div className="p-2 rounded-lg bg-[#F4F8F5] border border-[#D4E2DC]">
            <span className="text-[#5A6E65] block text-[10px]">Base Baseline</span>
            <span className="font-bold text-[#17211D]">{summary.baseScore || 0} pts</span>
          </div>
          <span className="text-[#5A6E65] font-bold">+</span>
          <div className="p-2 rounded-lg bg-[#FAF4EB] border border-[#EAD7BA]">
            <span className="text-[#946625] block text-[10px]">Rule Penalties</span>
            <span className="font-bold text-[#946625]">+{summary.totalPenalties || score} pts</span>
          </div>
          <span className="text-[#5A6E65] font-bold">=</span>
          <div className="p-2 rounded-lg bg-[#F4F8F5] border border-[#D4E2DC]">
            <span className="text-[#5A6E65] block text-[10px]">Raw Accumulated</span>
            <span className="font-bold text-[#17211D]">{summary.rawScore || score} pts</span>
          </div>
          <span className="text-[#5A6E65] font-bold">→</span>
          <div className={`p-2 rounded-lg border ${style.bg} ${style.border}`}>
            <span className={`block text-[10px] ${style.text}`}>Final Capped Score</span>
            <span className={`font-bold ${style.text}`}>{score}/100</span>
          </div>
        </div>

        {/* Visual Score Progress Meter */}
        <div className="mt-3">
          <div className="w-full bg-[#E4ECE8] h-2.5 rounded-full overflow-hidden">
            <div
              className={`h-full ${style.bar} transition-all duration-500`}
              style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-[#5A6E65] mt-1 font-mono">
            <span>0 (Low)</span>
            <span>30 (Approval Ceiling)</span>
            <span>70 (Escrow Ceiling)</span>
            <span>100 (Hard Block)</span>
          </div>
        </div>
      </div>

      {/* Triggered Rule Breakdown */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-[#17211D] uppercase tracking-wider">
          Triggered Risk Penalties ({waterfall.length})
        </h3>

        {waterfall.length === 0 ? (
          <div className="p-4 rounded-xl bg-[#EAF3EF] border border-[#C8DCD2] text-xs text-[#1E473B] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#285C4D] shrink-0" />
            <span>Clean transaction. Zero heuristic fraud rules were triggered against established baselines.</span>
          </div>
        ) : (
          <div className="space-y-2.5">
            {waterfall.map((rule, idx) => (
              <div
                key={rule.ruleCode || idx}
                className="p-4 rounded-xl bg-white border border-[#D4E2DC] shadow-xs space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#17211D]">
                        {rule.ruleCode}
                      </span>
                      {rule.severity && (
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            rule.severity === 'CRITICAL'
                              ? 'bg-[#FBF0EF] text-[#8C3E3A]'
                              : rule.severity === 'HIGH'
                              ? 'bg-[#FAF4EB] text-[#946625]'
                              : 'bg-[#F4F8F5] text-[#5A6E65]'
                          }`}
                        >
                          {rule.severity}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#17211D] font-medium mt-1">{rule.reason}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="inline-block px-2.5 py-1 rounded-lg font-mono font-bold text-xs bg-[#FAF4EB] text-[#946625] border border-[#EAD7BA]">
                      +{rule.points} pts
                    </span>
                  </div>
                </div>

                {/* Behavioral Baseline vs Observed Comparison Grid */}
                {(rule.metric || rule.observedValue || rule.baselineValue) && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-[#E4ECE8] text-[11px]">
                    <div>
                      <span className="text-[#5A6E65] block">Metric Evaluated</span>
                      <span className="font-semibold text-[#17211D]">{rule.metric || 'Behavioral heuristic'}</span>
                    </div>
                    <div>
                      <span className="text-[#5A6E65] block">Observed Telemetry</span>
                      <span className="font-mono font-bold text-[#946625]">{rule.observedValue || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-[#5A6E65] block">Baseline / Reference</span>
                      <span className="font-mono text-[#5A6E65]">{rule.baselineValue || 'Account profile'}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mitigating / Clean Signals */}
      {mitigating.length > 0 && (
        <div className="space-y-2 pt-2">
          <h3 className="text-xs font-bold text-[#17211D] uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#285C4D]" />
            Clean Baseline Mitigations ({mitigating.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {mitigating.map((m, idx) => (
              <div key={idx} className="p-2.5 rounded-lg bg-[#F4F8F5] border border-[#D4E2DC] flex items-center justify-between">
                <div>
                  <span className="text-[#17211D] font-medium block">{m.metric}</span>
                  <span className="text-[10px] text-[#5A6E65] font-mono">
                    Observed: {m.observedValue} • Baseline: {m.baselineValue}
                  </span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-[#EAF3EF] text-[#285C4D]">
                  Normal
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RiskAttributionWaterfall;
