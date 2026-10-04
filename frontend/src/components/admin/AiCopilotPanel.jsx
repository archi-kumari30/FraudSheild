import React, { useState } from 'react';
import { Sparkles, Loader2, AlertTriangle, CheckSquare, ShieldQuestion, HelpCircle } from 'lucide-react';
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
    <div className="rounded-2xl border border-indigo-200/80 bg-gradient-to-br from-indigo-50/40 via-white to-purple-50/30 p-5 shadow-sm space-y-4">
      {/* Header and Advisory Guard */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-indigo-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-sm">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              Gemini AI Co-Pilot
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700 uppercase tracking-wide">
                Advisory Only
              </span>
            </h4>
            <p className="text-[11px] text-slate-500">
              Sanitized contextual narrative synthesis for human investigators
            </p>
          </div>
        </div>

        {!analysis && !loading && (
          <button
            onClick={handleAnalyze}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Analyze with Gemini</span>
          </button>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="py-8 text-center space-y-2">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mx-auto" />
          <p className="text-xs font-semibold text-slate-700">
            Generating AI investigation brief...
          </p>
          <p className="text-[11px] text-slate-400">
            PII is sanitized; consulting Google Gemini via backend co-pilot
          </p>
        </div>
      )}

      {/* Error or Fallback Warning Banner (EC-M11-003, TC-M11-005) */}
      {(error || analysis?.isFallback) && (
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block">AI Assistant Notice</span>
            <span className="text-[11px] text-amber-800">
              {error
                ? 'AI co-pilot service is temporarily offline. You may proceed with manual review using the deterministic rule breakdown below.'
                : 'Showing heuristic fallback brief: External AI service returned advisory template. Manual review controls remain fully operational.'}
            </span>
          </div>
        </div>
      )}

      {/* Structured AI Report */}
      {analysis && (
        <div className="space-y-4 pt-1">
          {/* Summary Narrative */}
          <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-xs">
            <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <ShieldQuestion className="w-3.5 h-3.5 text-indigo-600" />
              Case Summary Narrative
            </h5>
            <p className="text-xs text-slate-700 leading-relaxed">
              {analysis.caseSummary}
            </p>
          </div>

          {/* Risk Patterns */}
          {analysis.riskPatterns && analysis.riskPatterns.length > 0 && (
            <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-xs">
              <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-purple-600" />
                Synthesized Risk Patterns
              </h5>
              <ul className="space-y-1.5">
                {analysis.riskPatterns.map((pattern, idx) => (
                  <li key={idx} className="text-xs text-slate-600 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0 mt-1.5" />
                    <span>{pattern}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommended Verification Checklist */}
          {analysis.investigationChecklist && analysis.investigationChecklist.length > 0 && (
            <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-xs">
              <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                Analyst Verification Checklist
              </h5>
              <div className="space-y-2">
                {analysis.investigationChecklist.map((item, idx) => {
                  const isChecked = !!checkedItems[idx];
                  return (
                    <label
                      key={idx}
                      className={`flex items-start gap-2.5 p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-emerald-50/60 border-emerald-200 text-slate-500 line-through'
                          : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleCheck(idx)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 mt-0.5"
                      />
                      <span className="leading-snug">{item}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          <div className="text-[10px] text-slate-400 text-right">
            Generated {new Date(analysis.analyzedAt || Date.now()).toLocaleTimeString()}
          </div>
        </div>
      )}
    </div>
  );
};

export default AiCopilotPanel;
