import React from 'react';
import { Shield, Cpu, Scale, CheckCircle2, AlertTriangle, ShieldAlert } from 'lucide-react';

const SecurityRulesPage = () => {
  const rules = [
    {
      number: 1,
      code: 'RULE_AMOUNT_ANOMALY',
      weight: 35,
      title: 'Rule 1 — Unusual Transaction Amount',
      condition: '≤ 2× avg (+0) | > 2× & ≤ 3× avg (+20) | > 3× avg (+35)',
      description: 'Compares transaction amount against the user\'s 30-day settled outbound average. Payments within 2× baseline receive +0 pts. Spikes between 2× and 3× receive +20 pts, and spikes exceeding 3× receive +35 pts. If no history exists, a safe cold-start baseline (+0 pts) applies. Absolute transaction value alone does not determine fraud risk.'
    },
    {
      number: 2,
      code: 'RULE_VELOCITY_HIGH',
      weight: 30,
      title: 'Rule 2 — High Velocity',
      condition: 'more than 3 transactions occur within 10 minutes',
      description: 'Monitors the rolling 10-minute sliding window of outbound transactions originating from the account. Triggers when velocity exceeds 3 transactions to prevent rapid account drainage.'
    },
    {
      number: 3,
      code: 'RULE_DEVICE_NEW',
      weight: 25,
      title: 'Rule 3 — New Device',
      condition: 'device identifier is not known for the customer',
      description: 'Inspects the client device identifier header against verified device fingerprints associated with the customer profile. Unrecognized devices incur a 25-point risk penalty.'
    },
    {
      number: 4,
      code: 'RULE_BENEFICIARY_NEW',
      weight: 30,
      title: 'Rule 4 — New Beneficiary',
      condition: 'transaction amount > ₹10,000 AND beneficiary age < 24 hours',
      description: 'Guards against newly added beneficiary exploitation. When high-value capital (> ₹10,000) is directed to a recipient added within the preceding 24 hours, a 30-point risk score is applied.'
    },
    {
      number: 5,
      code: 'RULE_FAIL_BURST',
      weight: 20,
      title: 'Rule 5 — Failed Attempt Burst',
      condition: 'at least 3 failed transaction attempts occur within 15 minutes',
      description: 'Counters brute-force PIN guessing, insufficient fund hammering, and automated bot scripts by flagging accounts exhibiting 3 or more failed transaction attempts in 15 minutes.'
    },
    {
      number: 6,
      code: 'RULE_DORMANT_SPIKE',
      weight: 25,
      title: 'Rule 6 — Dormant Account Spike',
      condition: 'inactivity ≥ 30 days AND amount > 2 × user\'s historical average (or > ₹5,000 if no history)',
      description: 'Detects sudden reactivation of dormant sleeper accounts. Triggers if an account with zero outbound transactions over the preceding 30 days attempts a payment exceeding 2× their historical average (or > ₹5,000 if no behavioral history exists).'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#17211D]">
          Deterministic Fraud Engine Rules Matrix
        </h1>
        <p className="text-xs sm:text-sm text-[#5A6E65] mt-0.5">
          Active heuristic algorithms, mathematical weights, and threshold bounds evaluated synchronously on every transaction.
        </p>
      </div>

      {/* Engine Architecture Banner */}
      <div className="p-6 rounded-2xl bg-[#FAFCFA] border border-[#D4E2DC] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="text-xs font-bold text-[#285C4D] uppercase tracking-wider block mb-1">
            Engine Architecture
          </span>
          <h2 className="text-base font-bold text-[#17211D]">
            Parallel Heuristic Pipeline with Deterministic Clamping
          </h2>
          <p className="text-xs text-[#5A6E65] mt-1 max-w-2xl leading-relaxed">
            Every transaction passes through all 6 heuristic rules in parallel. Triggered rule weights are aggregated into a composite score: <code className="bg-[#EAF3EF] text-[#285C4D] font-mono px-1.5 py-0.5 rounded font-bold">finalScore = min(totalRuleScore, 100)</code>. Transparent, predictable, and explainable with zero black-box variance.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="p-3 rounded-xl bg-[#F4F8F5] border border-[#D4E2DC] text-center min-w-[90px]">
            <span className="text-[#5A6E65] block text-[10px] font-bold uppercase">Active Rules</span>
            <span className="text-lg font-extrabold text-[#17211D]">6 / 6</span>
          </div>
          <div className="p-3 rounded-xl bg-[#F4F8F5] border border-[#D4E2DC] text-center min-w-[90px]">
            <span className="text-[#5A6E65] block text-[10px] font-bold uppercase">Score Ceiling</span>
            <span className="text-lg font-extrabold text-[#17211D]">100 Pts</span>
          </div>
        </div>
      </div>

      {/* Rules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {rules.map((rule) => (
          <div
            key={rule.code}
            className="p-5 rounded-2xl bg-[#FAFCFA] border border-[#D4E2DC] hover:border-[#285C4D] transition-colors shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <span className="font-mono text-xs font-bold text-[#285C4D]">
                  {rule.code}
                </span>
                <span className="px-2.5 py-0.5 rounded-md bg-[#FBF0EF] text-[#8C3E3A] font-mono text-xs font-extrabold border border-[#F2D6D3]">
                  +{rule.weight}
                </span>
              </div>

              <h3 className="text-sm font-bold text-[#17211D] mb-1">{rule.title}</h3>

              <div className="p-2.5 rounded-xl bg-[#F4F8F5] border border-[#D4E2DC] text-[11px] font-mono text-[#285C4D] mb-3">
                {rule.condition}
              </div>

              <p className="text-xs text-[#5A6E65] leading-relaxed">
                {rule.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Risk Decision Boundaries (Section 5 & 6) */}
      <div className="p-6 rounded-2xl bg-[#FAFCFA] border border-[#D4E2DC] shadow-xs space-y-4">
        <h3 className="text-xs font-bold text-[#17211D] uppercase tracking-wider">
          Decision Boundary Actions & Ledger Impact
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Low Risk */}
          <div className="p-4 rounded-xl bg-[#F4F8F5] border border-[#D4E2DC] space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#285C4D]" />
                <span className="text-xs font-bold text-[#285C4D] uppercase">LOW RISK</span>
              </div>
              <span className="text-xs font-mono font-bold text-[#285C4D]">0 – 30 Pts</span>
            </div>
            <div className="text-xs font-semibold text-[#17211D]">Status: APPROVED</div>
            <p className="text-xs text-[#5A6E65] leading-relaxed">
              Debit sender <code className="bg-white px-1 py-0.5 rounded font-mono text-[11px]">availableBalance</code> and credit recipient <code className="bg-white px-1 py-0.5 rounded font-mono text-[11px]">availableBalance</code> synchronously. Transaction settles immediately without analyst intervention.
            </p>
          </div>

          {/* Medium Risk */}
          <div className="p-4 rounded-xl bg-[#FAF4EB] border border-[#EAD7BA] space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-[#C89445]" />
                <span className="text-xs font-bold text-[#946625] uppercase">MEDIUM RISK</span>
              </div>
              <span className="text-xs font-mono font-bold text-[#946625]">31 – 70 Pts</span>
            </div>
            <div className="text-xs font-semibold text-[#946625]">Status: CUSTOMER_VERIFICATION_REQUIRED</div>
            <p className="text-xs text-[#946625]/90 leading-relaxed">
              Debit sender <code className="bg-white px-1 py-0.5 rounded font-mono text-[11px]">availableBalance</code> and credit sender <code className="bg-white px-1 py-0.5 rounded font-mono text-[11px]">heldBalance</code> (Escrow). Funds are quarantined. Transaction awaits customer confirmation or escalation to analyst investigation.
            </p>
          </div>

          {/* High Risk */}
          <div className="p-4 rounded-xl bg-[#FBF0EF] border border-[#F2D6D3] space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-[#B65D59]" />
                <span className="text-xs font-bold text-[#8C3E3A] uppercase">HIGH RISK</span>
              </div>
              <span className="text-xs font-mono font-bold text-[#8C3E3A]">71 – 100 Pts</span>
            </div>
            <div className="text-xs font-semibold text-[#8C3E3A]">Status: BLOCKED</div>
            <p className="text-xs text-[#8C3E3A]/90 leading-relaxed">
              Zero balance movement occurs. Transfer is immediately rejected and halted. Security alerts are generated for customer and admin operations. Recorded to immutable audit log.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityRulesPage;
