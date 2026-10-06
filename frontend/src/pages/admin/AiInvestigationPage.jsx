import React from 'react';
import { Bot, ShieldCheck, Lock, EyeOff, FileText, Cpu, Terminal } from 'lucide-react';
import { Link } from 'react-router-dom';

const AiInvestigationPage = () => {
  const safeguards = [
    {
      icon: ShieldCheck,
      title: 'Zero Decision & Mutation Authority',
      desc: 'Gemini AI operates strictly in read-only advisory mode. It has no API permissions to debit or credit balances, approve transactions, or alter database states.'
    },
    {
      icon: EyeOff,
      title: 'Recursive PII Sanitization',
      desc: 'Before any contextual transaction summary is sent to the Gemini API, user emails, names, passwords, and raw session tokens are scrubbed and replaced with anonymous tokens.'
    },
    {
      icon: Cpu,
      title: 'Heuristic Rule Dominance',
      desc: 'Risk scores (0–100) and risk tiers (LOW/MEDIUM/HIGH) are 100% calculated by the deterministic rules engine. The AI cannot modify, override, or invent risk scores.'
    },
    {
      icon: FileText,
      title: 'Mandatory Human Sign-Off',
      desc: 'Every escrow resolution requires explicit review by a verified SOC administrator with mandatory written rationale (minimum 10 characters) preserved in audit logs.'
    },
    {
      icon: Lock,
      title: 'Offline Heuristic Fallback',
      desc: 'If the Gemini API is unreachable, times out, or encounters quota exhaustion, an automated deterministic fallback summary is produced instantly without interrupting SOC workflow.'
    },
    {
      icon: Terminal,
      title: 'Audited Invocation Logging',
      desc: 'Every AI briefing generation is recorded in the immutable audit log with administrator ID, transaction reference, timestamp, and client IP.'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#17211D]">
          AI Investigation Assistant Safeguards
        </h1>
        <p className="text-xs sm:text-sm text-[#5A6E65] mt-0.5">
          Governance architecture, safety boundaries, and responsible deployment specifications for the Gemini SOC co-pilot.
        </p>
      </div>

      {/* Hero Banner */}
      <div className="p-6 rounded-2xl bg-[#FAFCFA] border border-[#D4E2DC] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#EAF3EF] text-[#285C4D] border border-[#D4E2DC] flex items-center justify-center shrink-0">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-base font-bold text-[#17211D]">
                Google Gemini Advisory Co-Pilot
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#EAF3EF] text-[#285C4D] border border-[#D4E2DC]">
                Advisory Only
              </span>
            </div>
            <p className="text-xs text-[#5A6E65] max-w-2xl leading-relaxed">
              Designed specifically to reduce investigator cognitive fatigue during incident triage by synthesizing complex transaction telemetry into clear narratives and verification checklists.
            </p>
          </div>
        </div>

        <Link
          to="/admin/reviews"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#285C4D] hover:bg-[#20493D] text-white font-semibold text-xs shadow-xs transition-colors whitespace-nowrap"
        >
          <span>Open Review Queue</span>
        </Link>
      </div>

      {/* Safeguards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {safeguards.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-[#FAFCFA] border border-[#D4E2DC] hover:border-[#285C4D] transition-colors shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-[#EAF3EF] text-[#285C4D] border border-[#D4E2DC] flex items-center justify-center mb-3">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-[#17211D] mb-1.5">{item.title}</h3>
                <p className="text-xs text-[#5A6E65] leading-relaxed">{item.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Architecture Pipeline Callout */}
      <div className="p-6 rounded-2xl bg-[#FAFCFA] border border-[#D4E2DC] shadow-xs space-y-4">
        <h3 className="text-xs font-bold text-[#17211D] uppercase tracking-wider">
          AI Co-Pilot Processing Lifecycle
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-[#F4F8F5] border border-[#D4E2DC]">
            <span className="text-[10px] font-mono font-bold text-[#285C4D] block mb-1">STEP 1</span>
            <span className="font-bold text-[#17211D] block mb-1">Context Aggregation</span>
            <span className="text-[#5A6E65]">Backend compiles triggered heuristic rules, device token, and transaction amount.</span>
          </div>
          <div className="p-4 rounded-xl bg-[#F4F8F5] border border-[#D4E2DC]">
            <span className="text-[10px] font-mono font-bold text-[#285C4D] block mb-1">STEP 2</span>
            <span className="font-bold text-[#17211D] block mb-1">PII Scrubbing</span>
            <span className="text-[#5A6E65]">Personal identifiers are stripped to protect customer privacy before cloud dispatch.</span>
          </div>
          <div className="p-4 rounded-xl bg-[#F4F8F5] border border-[#D4E2DC]">
            <span className="text-[10px] font-mono font-bold text-[#285C4D] block mb-1">STEP 3</span>
            <span className="font-bold text-[#17211D] block mb-1">Gemini Synthesis</span>
            <span className="text-[#5A6E65]">Model synthesizes anomaly narrative and generates action checklist for the investigator.</span>
          </div>
          <div className="p-4 rounded-xl bg-[#F4F8F5] border border-[#D4E2DC]">
            <span className="text-[10px] font-mono font-bold text-[#285C4D] block mb-1">STEP 4</span>
            <span className="font-bold text-[#17211D] block mb-1">Human Decision</span>
            <span className="text-[#5A6E65]">Analyst reviews findings and authorizes either escrow settlement or fund refund.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiInvestigationPage;
