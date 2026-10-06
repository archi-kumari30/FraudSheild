import React from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  Lock,
  Key,
  Database,
  Cpu,
  Layers,
  CheckCircle2,
  ArrowLeft,
  Scale,
  Users,
  ShieldCheck
} from 'lucide-react';

const SecurityTrustPage = () => {
  const securityPillars = [
    {
      icon: Key,
      title: 'Authentication & Credential Protection',
      badge: 'Identity Security',
      points: [
        'Passwords are cryptographically hashed using bcrypt with 10 salt rounds prior to storage.',
        'Plaintext credentials are never written to disk, database collections, or application logs.',
        'Session tokens are stateless JSON Web Tokens (JWT) signed with HMAC SHA-256 and verified on every endpoint.'
      ]
    },
    {
      icon: Users,
      title: 'Authorization & Strict Role Separation (RBAC)',
      badge: 'Access Control',
      points: [
        'Customer and administrative roles are physically and logically segregated in the backend API.',
        'Customer accounts cannot access SOC review queues, incident dossiers, or other users\' data.',
        'Administrators cannot initiate financial transactions or mutate balances without mandatory written notes.'
      ]
    },
    {
      icon: Cpu,
      title: 'Deterministic Fraud Detection Engine',
      badge: 'Rule Engine',
      points: [
        'Every transaction is evaluated synchronously against six approved deterministic rules before balance mutation.',
        'Rules check extreme amounts, 10-minute velocity bursts, unrecognized device fingerprints, beneficiary age (< 24h), failed attempt bursts, and dormant account spikes.',
        'All rules have fixed, auditable weights. No unpredictable black-box machine learning drift.'
      ]
    },
    {
      icon: Scale,
      title: 'Transparent Risk Scoring & Tiering',
      badge: 'Score Bounds',
      points: [
        'Composite risk scores are bounded strictly between 0 and 100 points: finalScore = min(totalRuleScore, 100).',
        'LOW (0–30): Automatically approved and settled immediately into recipient availableBalance.',
        'MEDIUM (31–70): Quarantined in sender heldBalance escrow for human analyst determination.',
        'HIGH (71–100): Blocked instantly; zero balance movements occur.'
      ]
    },
    {
      icon: Layers,
      title: 'Atomic Escrow & Balance Isolation',
      badge: 'Financial Integrity',
      points: [
        'When suspicious activity is detected, transfer amounts are isolated into the sender\'s heldBalance escrow.',
        'Funds cannot be double-spent while undergoing analyst determination.',
        'If approved by an analyst, escrow settles to the recipient. If rejected, held funds are restored to sender availableBalance.'
      ]
    },
    {
      icon: Database,
      title: 'Immutable Audit Logging',
      badge: 'Forensic Trail',
      points: [
        'Every login attempt, transfer request, fraud rule trigger, and SOC analyst determination is recorded.',
        'Logs are append-only and tamper-evident, capturing client IP, device ID, metadata, and timestamps.',
        'Sensitive authentication payloads (passwords, tokens) are recursively scrubbed prior to persistence.'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-[#EDF6F1] text-[#17211D]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#FAFCFA]/90 backdrop-blur border-b border-[#D4E2DC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-xs font-semibold text-[#5A6E65] hover:text-[#17211D] transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#285C4D] text-white flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
            <span className="font-semibold text-sm text-[#17211D]">Security & Architecture Specifications</span>
          </div>
          <Link
            to="/login"
            className="text-xs font-semibold text-[#285C4D] hover:underline transition-colors"
          >
            Access Portal
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EAF3EF] border border-[#D4E2DC] text-[#285C4D] text-xs font-semibold mb-3">
            <Lock className="w-3.5 h-3.5" />
            <span>Architecture & Trust Guarantees</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#17211D] tracking-tight">
            FraudShield Technical Security Architecture
          </h1>
          <p className="mt-3 text-sm sm:text-base text-[#5A6E65] leading-relaxed max-w-3xl">
            FraudShield is built on deterministic financial integrity, zero-trust device telemetry, and strict role segregation. The platform evaluates risk during the payment request before money moves.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {securityPillars.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <div
                key={pillar.title}
                className="bg-[#FAFCFA] border border-[#D4E2DC] rounded-2xl p-6 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-[#EAF3EF] text-[#285C4D] border border-[#D4E2DC] flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-semibold text-[#5A6E65] px-2.5 py-0.5 rounded-full bg-[#F4F8F5] border border-[#D4E2DC]">
                      {pillar.badge}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-[#17211D] mb-4">{pillar.title}</h3>

                  <ul className="space-y-3">
                    {pillar.points.map((pt, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs text-[#5A6E65] leading-relaxed">
                        <CheckCircle2 className="w-4 h-4 text-[#285C4D] shrink-0 mt-0.5" />
                        <span className="text-[#17211D]">{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

        {/* Human-in-the-Loop Clarification */}
        <div className="mt-10 bg-[#FAFCFA] border border-[#D4E2DC] rounded-2xl p-6 sm:p-8 shadow-xs">
          <div className="flex items-start gap-3.5">
            <ShieldCheck className="w-5 h-5 text-[#285C4D] shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-[#17211D] mb-1.5">Human-in-the-Loop Escrow Verification</h4>
              <p className="text-xs text-[#5A6E65] leading-relaxed">
                FraudShield combines deterministic heuristic screening with human-in-the-loop oversight. While low-risk routine transfers settle automatically and high-risk anomalies are blocked on the spot, suspicious transfers are quarantined in held escrow. An authorized SOC analyst reviews the transaction context and executes the final decision with mandatory audit rationale.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SecurityTrustPage;
