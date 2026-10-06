import React, { useState } from 'react';
import { Sparkles, Loader2, AlertTriangle, CheckSquare, ShieldQuestion, HelpCircle, Bot } from 'lucide-react';
import axiosClient from '../../api/axiosClient';

const AiCopilotPanel = ({ transactionId, existingAnalysis = null }) => {
  const [analysis, setAnalysis] = useState(existingAnalysis);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checkedItems, setCheckedItems] = useState({});

  const handleAnalyze = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axiosClient.post(`/admin/reviews/${transactionId}/ai-analyze`);
      if (res.success && res.data?.aiInvestigation) {
        setAnalysis(res.data.aiInvestigation);
      }
    } catch (err) {
      setError(err.message || 'AI assistant request failed');
    } finally {
      setLoading(false);
    }
  };

  const toggleCheck = (idx) => {
    setCheckedItems((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <div className="rounded-2xl border border-[#D4E2DC] bg-[#FAFCFA] p-5 shadow-xs space-y-4 text-[#17211D]">
      {/* Header and Advisory Guard */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#D4E2DC]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#EAF3EF] border border-[#D4E2DC] text-[#285C4D] flex items-center justify-center">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-[#17211D]">
                Gemini Advisory Co-Pilot
              </h4>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EAF3EF] text-[#285C4D] border border-[#D4E2DC] uppercase tracking-wide">
                Advisory Only
              </span>
            </div>
            <p className="text-[11px] text-[#5A6E65]">
              Sanitized contextual narrative synthesis for human investigators (Zero decision authority)
            </p>
          </div>
        </div>

        {!analysis && !loading && (
          <button
            onClick={handleAnalyze}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#285C4D] hover:bg-[#20493D] text-white font-semibold text-xs shadow-xs transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generate Brief</span>
          </button>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="py-8 text-center space-y-2">
          <Loader2 className="w-6 h-6 animate-spin text-[#285C4D] mx-auto" />
          <p className="text-xs font-semibold text-[#17211D]">
            Synthesizing advisory investigation brief...
          </p>
          <p className="text-[11px] text-[#5A6E65]">
            PII is sanitized; consulting Google Gemini via backend co-pilot
          </p>
        </div>
      )}

      {/* Error or Fallback Warning Banner */}
      {(error || analysis?.isFallback) && (
        <div className="p-3 rounded-xl bg-[#FAF4EB] border border-[#EAD7BA] text-[#946625] text-xs flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-[#C89445] shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block">Advisory Service Notice</span>
            <span className="text-[11px] text-[#946625]/90">
              {error
                ? 'External Gemini co-pilot is temporarily unavailable. The core deterministic fraud engine continues operating normally.'
                : 'Deterministic heuristic summary active: External advisory service timed out. Manual review controls remain fully operational.'}
            </span>
          </div>
        </div>
      )}

      {/* Structured AI Report */}
      {analysis && (
        <div className="space-y-4 pt-1">
          {/* Summary Narrative */}
          <div className="p-4 rounded-xl bg-[#F4F8F5] border border-[#D4E2DC]">
            <h5 className="text-xs font-bold text-[#285C4D] uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <ShieldQuestion className="w-3.5 h-3.5 text-[#285C4D]" />
              Case Summary Narrative
            </h5>
            <p className="text-xs text-[#17211D] leading-relaxed">
              {analysis.caseSummary}
            </p>
          </div>

          {/* Risk Patterns */}
          {analysis.riskPatterns && analysis.riskPatterns.length > 0 && (
            <div className="p-4 rounded-xl bg-[#F4F8F5] border border-[#D4E2DC]">
              <h5 className="text-xs font-bold text-[#17211D] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-[#285C4D]" />
                Identified Risk Patterns
              </h5>
              <ul className="space-y-1.5">
                {analysis.riskPatterns.map((pattern, idx) => (
                  <li key={idx} className="text-xs text-[#17211D] flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#285C4D] shrink-0 mt-1.5" />
                    <span>{pattern}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommended Verification Checklist */}
          {analysis.investigationChecklist && analysis.investigationChecklist.length > 0 && (
            <div className="p-4 rounded-xl bg-[#F4F8F5] border border-[#D4E2DC]">
              <h5 className="text-xs font-bold text-[#285C4D] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <CheckSquare className="w-3.5 h-3.5 text-[#285C4D]" />
                Analyst Verification Checklist
              </h5>
              <div className="space-y-2">
                {analysis.investigationChecklist.map((item, idx) => {
                  const isChecked = !!checkedItems[idx];
                  return (
                    <label
                      key={idx}
                      className={`flex items-start gap-2.5 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                        isChecked
                          ? 'bg-white border-[#D4E2DC] text-[#5A6E65] line-through'
                          : 'bg-white border-[#D4E2DC] text-[#17211D] hover:border-[#285C4D]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleCheck(idx)}
                        className="rounded border-[#D4E2DC] text-[#285C4D] focus:ring-[#285C4D] mt-0.5"
                      />
                      <span className="leading-snug">{item}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          <div className="text-[10px] text-[#5A6E65] text-right">
            Generated {new Date(analysis.analyzedAt || Date.now()).toLocaleTimeString()} • Read-Only Advisory Brief
          </div>
        </div>
      )}
    </div>
  );
};

export default AiCopilotPanel;
