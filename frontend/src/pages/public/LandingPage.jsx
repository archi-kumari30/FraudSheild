import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Layers,
  Scale,
  UserCheck,
  Bot,
  FileText,
  Lock,
  Zap,
  Activity,
  Menu,
  X,
  HelpCircle,
  Smartphone,
  KeyRound,
  Database,
  ChevronDown,
  ChevronRight,
  Hash,
  ShieldCheck,
  Eye,
  Server
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const LandingPage = () => {
  const { isAuthenticated, isAdmin } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState(null);

  // Step Navigator State (1 to 4)
  const [activeStep, setActiveStep] = useState(1);

  // Tri-Tier Risk Scenario State
  const [activeTier, setActiveTier] = useState('medium'); // 'low' | 'medium' | 'high'

  const scrollToSection = (e, sectionId) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    if (sectionId === 'top') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Step Navigator Pipeline Definitions
  const pipelineSteps = [
    {
      step: 1,
      title: 'Payment Ingestion & Idempotency',
      tag: 'FINANCIAL CORRECTNESS',
      subtitle: 'Guaranteed Single-Execution Protection with IETF-Standard Key Hashing',
      description:
        'Every transfer payload arrives with a client-supplied Idempotency-Key. FraudShield validates the Joi schema and computes a deterministic SHA-256 payload digest. Duplicate clicks or network retries instantly replay cached responses without double-debiting balances. Mismatched payloads on the same key trigger a 409 Conflict.',
      metrics: [
        { label: 'Replay Protection', value: '100% In-Flight & Cache' },
        { label: 'Schema Validation', value: 'Joi Boundary Middleware' },
        { label: 'Atomicity', value: 'MongoDB ACID Session' }
      ],
      codeSnippet: `POST /api/transactions
Headers: { "Idempotency-Key": "idem-9a8f4c..." }
Payload: { "recipientId": "usr_882", "amount": 45000 }
→ SHA-256 Payload Hash Verification: MATCH
→ Status: 200 (Initial Execution or Cached Replay)`
    },
    {
      step: 2,
      title: 'Deterministic Heuristic Scoring',
      tag: 'ZERO BLACK-BOX HALLUCINATIONS',
      subtitle: '6 Behavioral Fraud Rules with Absolute Cold-Start & Baseline Comparison',
      description:
        'The transaction is evaluated synchronously by 6 deterministic heuristic rules. Rules analyze 30-day settled averages, hourly velocity, device fingerprints, beneficiary maturation (<24h), failed attempt bursts, and dormant account spikes. For new users with no history, absolute threshold safeguards prevent cold-start bypass.',
      metrics: [
        { label: 'Evaluation Latency', value: '< 4.2ms Synchronous' },
        { label: 'Heuristic Rules', value: '6 Explainable Heuristics' },
        { label: 'Cold-Start Defense', value: '₹50,000 Absolute Threshold' }
      ],
      codeSnippet: `RULE_AMOUNT_ANOMALY    → +35 pts (4.5x 30-day baseline ₹10,000)
RULE_DEVICE_NEW        → +25 pts (Unrecognized Hardware Fingerprint)
RULE_VELOCITY_HIGH     → +0 pts  (1 tx in past 60 min <= 3 ceiling)
---------------------------------------------------------------
Raw Penalty Total: 60 pts | Final Capped Score: 60/100 (MEDIUM)`
    },
    {
      step: 3,
      title: 'Tri-Tier Financial Routing & Escrow',
      tag: 'NON-BLOCKING SAFETY',
      subtitle: 'Instant Settlement, Quarantine Escrow, or Hard Block Reversal',
      description:
        'Scores 0–30 settle immediately via atomic ACID transfer. Scores 31–70 move funds into heldBalance (quarantine escrow) without crediting the recipient, awaiting customer step-up PIN verification or SOC resolution. Scores 71–100 trigger an immediate hard block without balance deduction.',
      metrics: [
        { label: 'Low Risk (0–30)', value: 'Instant Balance Debit & Credit' },
        { label: 'Medium Risk (31–70)', value: 'Held in Escrow (heldBalance)' },
        { label: 'High Risk (71–100)', value: 'Blocked with Zero Debit' }
      ],
      codeSnippet: `Risk Tier: MEDIUM (Score 60/100)
State Mutation:
  sender.availableBalance: ₹100,000 → ₹55,000
  sender.heldBalance:      ₹0       → ₹45,000 (Escrow)
  recipient.balance:       ₹10,000  → ₹10,000 (Unchanged)
Transaction Status: FLAGGED_FOR_REVIEW`
    },
    {
      step: 4,
      title: 'SOC Case Management & Audit Chain',
      tag: 'OBSERVABILITY & INTEGRITY',
      subtitle: 'Attack-Chain Timelines & Cryptographic SHA-256 Ledger Verification',
      description:
        'Quarantined transfers spawn an investigation case with SLA timers. Analysts claim cases, log evidence notes, and resolve determinations with atomic CAS locks. Every security event is cryptographically sealed in a sequential SHA-256 blockchain-style hash chain that detects database tampering immediately.',
      metrics: [
        { label: 'Case Lifecycle', value: 'UNASSIGNED → CLAIMED → RESOLVED' },
        { label: 'Forensic Timeline', value: 'Cross-Entity Chronology' },
        { label: 'Audit Chain', value: 'SHA-256 Linked Ledger' }
      ],
      codeSnippet: `Audit Ledger Block #142:
  Hash: 3f9a7b8e...
  PrevHash: e2b4c10a... (Linked to Block #141)
  EventType: ESCROW_HOLD_INITIATED
  Actor: SYSTEM | IP: 192.168.1.100
Integrity Verification: 100% VALID (Chain Intact)`
    }
  ];

  const currentStepData = pipelineSteps[activeStep - 1];

  // Tri-Tier Scenarios
  const tierScenarios = {
    low: {
      title: 'Low Risk — Immediate Settlement',
      score: 15,
      tier: 'LOW',
      badgeClass: 'bg-[#EAF3EF] text-[#1E473B] border-[#C8DCD2]',
      amount: '₹2,500',
      action: 'Instant Transfer Settled',
      rulesTriggered: ['RULE_DEVICE_NEW (+15 pts: Recognized IP, new browser profile)'],
      financialState: 'Sender availableBalance debited ₹2,500; Recipient availableBalance credited ₹2,500 atomically in same session.',
      socRequirement: 'No review required. Automated straight-through processing.'
    },
    medium: {
      title: 'Medium Risk — Escrow Quarantine',
      score: 55,
      tier: 'MEDIUM',
      badgeClass: 'bg-[#FAF4EB] text-[#946625] border-[#EAD7BA]',
      amount: '₹45,000',
      action: 'Held in Escrow (heldBalance)',
      rulesTriggered: [
        'RULE_AMOUNT_ANOMALY (+35 pts: 4.5x 30-day baseline average)',
        'RULE_VELOCITY_HIGH (+20 pts: 4th transfer in 60 minutes)'
      ],
      financialState: 'Sender ₹45,000 moved from availableBalance to heldBalance. Zero funds sent to recipient until step-up PIN verification or SOC resolution.',
      socRequirement: 'Case queued in SOC review. Analyst can approve (release escrow) or reject (refund to sender).'
    },
    high: {
      title: 'High Risk — Hard Block',
      score: 95,
      tier: 'HIGH',
      badgeClass: 'bg-[#FBF0EF] text-[#8C3E3A] border-[#E6BFBD]',
      amount: '₹90,000',
      action: 'Transaction Blocked & Alerted',
      rulesTriggered: [
        'RULE_AMOUNT_ANOMALY (+35 pts: Extreme behavioral spike)',
        'RULE_DEVICE_NEW (+25 pts: Unrecognized hardware & IP)',
        'RULE_BENEFICIARY_NEW (+30 pts: Beneficiary added < 2 hours ago)'
      ],
      financialState: 'Transfer rejected before wallet mutation. Zero balance debited. Account placed on elevated security watch.',
      socRequirement: 'P1 Critical SOC incident created. Tamper-evident audit log records blocked attempt.'
    }
  };

  const currentTierData = tierScenarios[activeTier];

  const faqItems = [
    {
      q: 'Why deterministic rules instead of black-box Machine Learning?',
      a: 'In financial compliance and SOC investigations, every blocking action must be legally explainable to regulators, auditors, and customers. A machine learning model outputting 0.87 risk cannot explain why a legitimate payment was held. FraudShield provides mathematical risk waterfalls showing exact rule contributions (e.g. +35 Amount Spike, +25 New Device), preventing unexplained rejections.'
    },
    {
      q: 'How does FraudShield prevent double-spending and race conditions?',
      a: 'All balance mutations use MongoDB ACID sessions (or atomic findOneAndUpdate operators on standalone instances). Financial state changes execute with compare-and-set versioning, ensuring two concurrent clicks or duplicate requests can never produce double debits or negative balances.'
    },
    {
      q: 'What is the Payment Idempotency mechanism?',
      a: 'Every payment endpoint accepts an IETF-standard Idempotency-Key. If the client retries the request (e.g., due to a temporary network timeout or impatient double click), FraudShield recognizes the key, verifies the request hash matches, and immediately replays the original response from cache without touching wallet balances.'
    },
    {
      q: 'How does Escrow Quarantine protect against unauthorized transfers?',
      a: 'Rather than immediately blocking every suspicious transfer or letting fraudulent funds escape, FraudShield moves medium-risk funds into heldBalance. The sender cannot spend the held funds, but the recipient has not received them either. If unauthorized, the funds are safely returned to the sender with zero dispute friction.'
    },
    {
      q: 'How does the Tamper-Evident Audit Ledger detect database manipulation?',
      a: 'Every audit log is cryptographically chained to its predecessor using SHA-256. If a malicious insider or compromised admin modifies an audit entry in the MongoDB collection, the cryptographic hash verification API immediately detects the broken chain and flags the exact sequence number that was modified.'
    },
    {
      q: 'What role does Gemini AI play in FraudShield?',
      a: 'Google Gemini acts strictly as an on-demand co-pilot for SOC analysts to generate investigation summaries and formulate customer inquiry scripts. Gemini has zero automated authority to approve or block payments; the deterministic heuristic engine remains 100% authoritative.'
    }
  ];

  return (
    <div id="top" className="min-h-screen bg-[#EDF6F1] text-[#17211D] scroll-smooth">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 bg-[#FAFCFA]/95 backdrop-blur-md border-b border-[#D4E2DC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <a
            href="#top"
            onClick={(e) => scrollToSection(e, 'top')}
            className="flex items-center gap-2.5 cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-[#285C4D] text-white flex items-center justify-center shadow-xs">
              <Shield className="w-5 h-5" />
            </div>
            <span className="font-serif font-bold text-lg tracking-tight text-[#17211D]">
              FraudShield
            </span>
          </a>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-semibold text-[#5A6E65]">
            <a
              href="#how-it-works"
              onClick={(e) => scrollToSection(e, 'how-it-works')}
              className="hover:text-[#17211D] transition-colors"
            >
              How It Works
            </a>
            <a
              href="#tri-tier"
              onClick={(e) => scrollToSection(e, 'tri-tier')}
              className="hover:text-[#17211D] transition-colors"
            >
              Tri-Tier Escrow
            </a>
            <a
              href="#security-suite"
              onClick={(e) => scrollToSection(e, 'security-suite')}
              className="hover:text-[#17211D] transition-colors"
            >
              Security Architecture
            </a>
            <a
              href="#faq"
              onClick={(e) => scrollToSection(e, 'faq')}
              className="hover:text-[#17211D] transition-colors"
            >
              FAQ
            </a>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link
                to={isAdmin ? '/admin' : '/dashboard'}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#285C4D] text-white hover:bg-[#1d453a] transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <span>Console</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-[#5A6E65] hover:text-[#17211D]"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#285C4D] text-white hover:bg-[#1d453a] transition-colors shadow-xs"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-16 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-4xl mx-auto space-y-6">
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono font-bold bg-[#EAF3EF] text-[#1E473B] border border-[#C8DCD2] shadow-xs">
            <span className="w-2 h-2 rounded-full bg-[#285C4D] animate-pulse" />
            <span>Deterministic Heuristic Engine • Sub-5ms Screening • ACID Safe</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-[#17211D] tracking-tight leading-[1.12]">
            Deterministic Fraud Defense &amp; Financial Escrow Architecture
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-[#5A6E65] max-w-3xl mx-auto leading-relaxed">
            Eliminate black-box hallucinations. FraudShield screens every transfer using 6 deterministic behavioral heuristics, mathematical risk waterfalls (0–100), idempotent API protection, escrow quarantine, and tamper-evident SHA-256 audit chaining.
          </p>

          {/* Hero CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
            <a
              href="#how-it-works"
              onClick={(e) => scrollToSection(e, 'how-it-works')}
              className="px-6 py-3 rounded-xl text-xs sm:text-sm font-bold bg-[#285C4D] text-white hover:bg-[#1d453a] transition-all flex items-center gap-2 shadow-xs hover:shadow-sm"
            >
              <span>Explore Evaluation Pipeline</span>
              <ArrowRight className="w-4 h-4" />
            </a>
            <Link
              to="/register"
              className="px-6 py-3 rounded-xl text-xs sm:text-sm font-bold bg-white border border-[#D4E2DC] text-[#17211D] hover:bg-[#F4F8F5] transition-all shadow-xs"
            >
              Launch Live Simulation
            </Link>
          </div>

          {/* System Capability Metrics Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-10 text-left">
            <div className="p-4 rounded-2xl bg-white border border-[#D4E2DC] shadow-xs">
              <span className="text-[11px] font-bold text-[#5A6E65] uppercase tracking-wider block">Screening Speed</span>
              <span className="text-xl font-bold font-mono text-[#285C4D] mt-1 block">&lt; 4.2ms</span>
              <span className="text-[11px] text-[#5A6E65] block mt-0.5">In-memory deterministic rules</span>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-[#D4E2DC] shadow-xs">
              <span className="text-[11px] font-bold text-[#5A6E65] uppercase tracking-wider block">Financial Safety</span>
              <span className="text-xl font-bold font-mono text-[#285C4D] mt-1 block">ACID Sessions</span>
              <span className="text-[11px] text-[#5A6E65] block mt-0.5">Atomic two-phase state updates</span>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-[#D4E2DC] shadow-xs">
              <span className="text-[11px] font-bold text-[#5A6E65] uppercase tracking-wider block">Replay Defense</span>
              <span className="text-xl font-bold font-mono text-[#285C4D] mt-1 block">Idempotent</span>
              <span className="text-[11px] text-[#5A6E65] block mt-0.5">IETF key hash protection</span>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-[#D4E2DC] shadow-xs">
              <span className="text-[11px] font-bold text-[#5A6E65] uppercase tracking-wider block">Ledger Integrity</span>
              <span className="text-xl font-bold font-mono text-[#285C4D] mt-1 block">SHA-256 Seal</span>
              <span className="text-[11px] text-[#5A6E65] block mt-0.5">Cryptographic tamper-evidence</span>
            </div>
          </div>
        </div>
      </section>

      {/* Step Navigator: "How FraudShield Evaluates Every Rupee" */}
      <section id="how-it-works" className="py-16 bg-[#FAFCFA] border-y border-[#D4E2DC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-mono font-bold text-[#285C4D] bg-[#EAF3EF] px-3 py-1 rounded-full border border-[#C8DCD2]">
              Interactive Architecture Walkthrough
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#17211D] tracking-tight">
              How FraudShield Evaluates Every Rupee
            </h2>
            <p className="text-xs sm:text-sm text-[#5A6E65] leading-relaxed">
              Step through our end-to-end payment pipeline. Use the step navigator below to see how each transfer progresses from network ingestion to cryptographic ledger sealing.
            </p>
          </div>

          {/* Step Selector Buttons */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
            {pipelineSteps.map((s) => {
              const isActive = activeStep === s.step;
              return (
                <button
                  key={s.step}
                  type="button"
                  onClick={() => setActiveStep(s.step)}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    isActive
                      ? 'bg-white border-[#285C4D] shadow-sm ring-1 ring-[#285C4D]'
                      : 'bg-[#F4F8F5] border-[#D4E2DC] hover:border-[#B8CEC4]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-[11px] font-mono font-bold ${isActive ? 'text-[#285C4D]' : 'text-[#5A6E65]'}`}>
                      Step 0{s.step}
                    </span>
                    {isActive && <div className="w-2 h-2 rounded-full bg-[#285C4D]" />}
                  </div>
                  <div className="font-bold text-xs text-[#17211D] mt-1.5 truncate">
                    {s.title}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Step Interactive Showcase Card */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#D4E2DC] shadow-xs">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Details */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#EAF3EF] text-[#285C4D] border border-[#C8DCD2]">
                    {currentStepData.tag}
                  </span>
                  <span className="text-xs font-mono text-[#5A6E65]">
                    Step {currentStepData.step} of 4
                  </span>
                </div>

                <h3 className="text-xl sm:text-2xl font-serif font-bold text-[#17211D]">
                  {currentStepData.subtitle}
                </h3>

                <p className="text-xs sm:text-sm text-[#4A5B53] leading-relaxed">
                  {currentStepData.description}
                </p>

                {/* Key Metrics */}
                <div className="grid grid-cols-3 gap-3 pt-2">
                  {currentStepData.metrics.map((m, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-[#F4F8F5] border border-[#D4E2DC]">
                      <span className="text-[10px] text-[#5A6E65] block">{m.label}</span>
                      <span className="text-xs font-bold text-[#17211D] mt-0.5 block truncate">{m.value}</span>
                    </div>
                  ))}
                </div>

                {/* Navigation Buttons */}
                <div className="flex items-center gap-3 pt-4 border-t border-[#E4ECE8]">
                  <button
                    type="button"
                    onClick={() => setActiveStep((prev) => Math.max(1, prev - 1))}
                    disabled={activeStep === 1}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-[#F4F8F5] text-[#5A6E65] hover:text-[#17211D] border border-[#D4E2DC] disabled:opacity-40 flex items-center gap-1.5 transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Previous Step</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveStep((prev) => Math.min(4, prev + 1))}
                    disabled={activeStep === 4}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-[#285C4D] text-white hover:bg-[#1d453a] disabled:opacity-40 flex items-center gap-1.5 transition-colors shadow-xs"
                  >
                    <span>Next Step</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Right Code/Telemetry Block */}
              <div className="lg:col-span-5 bg-[#17211D] rounded-xl p-5 text-white font-mono text-xs space-y-3 shadow-md">
                <div className="flex items-center justify-between pb-2 border-b border-white/10 text-[11px] text-white/60">
                  <span>Engine Telemetry Output</span>
                  <span className="text-[#377764]">LIVE STACK</span>
                </div>
                <pre className="text-[11px] text-[#EAF3EF] whitespace-pre-wrap leading-relaxed overflow-x-auto">
                  {currentStepData.codeSnippet}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tri-Tier Risk Flow Simulator */}
      <section id="tri-tier" className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="text-xs font-mono font-bold text-[#285C4D] bg-[#EAF3EF] px-3 py-1 rounded-full border border-[#C8DCD2]">
            Tri-Tier Risk Decision Engine
          </span>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#17211D] tracking-tight">
            Transparent Financial Routing by Risk Tier
          </h2>
          <p className="text-xs sm:text-sm text-[#5A6E65] leading-relaxed">
            Every transaction is mapped to one of three deterministic risk tiers. Select a scenario below to observe how the wallet balance mutates and how funds are held in escrow.
          </p>
        </div>

        {/* Tier Selector Buttons */}
        <div className="flex justify-center gap-3">
          <button
            type="button"
            onClick={() => setActiveTier('low')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold border transition-all ${
              activeTier === 'low'
                ? 'bg-[#EAF3EF] border-[#285C4D] text-[#1E473B] shadow-xs'
                : 'bg-white border-[#D4E2DC] text-[#5A6E65] hover:bg-[#F4F8F5]'
            }`}
          >
            Low Risk (0–30)
          </button>
          <button
            type="button"
            onClick={() => setActiveTier('medium')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold border transition-all ${
              activeTier === 'medium'
                ? 'bg-[#FAF4EB] border-[#C89445] text-[#946625] shadow-xs'
                : 'bg-white border-[#D4E2DC] text-[#5A6E65] hover:bg-[#F4F8F5]'
            }`}
          >
            Medium Risk (31–70)
          </button>
          <button
            type="button"
            onClick={() => setActiveTier('high')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold border transition-all ${
              activeTier === 'high'
                ? 'bg-[#FBF0EF] border-[#B65D59] text-[#8C3E3A] shadow-xs'
                : 'bg-white border-[#D4E2DC] text-[#5A6E65] hover:bg-[#F4F8F5]'
            }`}
          >
            High Risk (71–100)
          </button>
        </div>

        {/* Tier Detail Card */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#D4E2DC] shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#D4E2DC]">
            <div>
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${currentTierData.badgeClass}`}>
                  {currentTierData.tier} RISK TIER
                </span>
                <span className="font-bold text-sm text-[#17211D]">
                  {currentTierData.title}
                </span>
              </div>
              <p className="text-xs text-[#5A6E65] mt-1">
                Amount: <strong className="font-mono text-[#17211D]">{currentTierData.amount}</strong> • Decision: <strong className="text-[#17211D]">{currentTierData.action}</strong>
              </p>
            </div>
            <div className="font-mono text-sm font-bold text-right">
              <span className="text-[#5A6E65] block text-[10px] uppercase">Composite Score</span>
              <span className="text-xl text-[#17211D]">{currentTierData.score} / 100</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {/* Rules Triggered */}
            <div className="p-4 rounded-xl bg-[#F4F8F5] border border-[#D4E2DC] space-y-2">
              <span className="font-bold text-[#17211D] block uppercase tracking-wider text-[11px]">
                Heuristic Waterfall Penalties
              </span>
              <ul className="space-y-1.5 text-[#4A5B53]">
                {currentTierData.rulesTriggered.map((r, i) => (
                  <li key={i} className="flex items-start gap-1.5 font-mono text-[11px]">
                    <span className="text-[#285C4D] font-bold">›</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Financial State Mutation */}
            <div className="p-4 rounded-xl bg-[#F4F8F5] border border-[#D4E2DC] space-y-2">
              <span className="font-bold text-[#17211D] block uppercase tracking-wider text-[11px]">
                Wallet Balance State Transition
              </span>
              <p className="text-[#4A5B53] leading-relaxed">
                {currentTierData.financialState}
              </p>
              <div className="pt-2 border-t border-[#D4E2DC] text-[11px] text-[#5A6E65]">
                SOC Workflow: {currentTierData.socRequirement}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enterprise Security Architecture Pillars */}
      <section id="security-suite" className="py-16 bg-[#FAFCFA] border-y border-[#D4E2DC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-mono font-bold text-[#285C4D] bg-[#EAF3EF] px-3 py-1 rounded-full border border-[#C8DCD2]">
              Security &amp; Forensic Engineering
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#17211D] tracking-tight">
              Enterprise Defense Layer
            </h2>
            <p className="text-xs sm:text-sm text-[#5A6E65] leading-relaxed">
              Engineered with zero trust principles, cryptographic immutability, and multi-factor defense mechanisms to protect customer funds and maintain SOC observability.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-[#D4E2DC] shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#EAF3EF] text-[#285C4D] flex items-center justify-center">
                <Hash className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-[#17211D]">SHA-256 Audit Chain</h3>
              <p className="text-xs text-[#5A6E65] leading-relaxed">
                Sequential cryptographic hash chaining. Modifying any audit document in MongoDB breaks the chain and triggers immediate ledger tamper alarms.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-[#D4E2DC] shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#FAF4EB] text-[#946625] flex items-center justify-center">
                <Smartphone className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-[#17211D]">Device Fingerprinting</h3>
              <p className="text-xs text-[#5A6E65] leading-relaxed">
                Hardware, IP, and browser telemetry capture. Unvetted devices trigger automatic +25 risk penalties to prevent account takeover and session hijacking.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-[#D4E2DC] shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#EAF3EF] text-[#285C4D] flex items-center justify-center">
                <KeyRound className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-[#17211D]">Step-Up Transaction PIN</h3>
              <p className="text-xs text-[#5A6E65] leading-relaxed">
                Bcrypt-hashed 6-digit transaction PIN required for quarantined escrow release. Protected by rate limiting and 3-attempt automated lockouts.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-[#D4E2DC] shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#F4F8F5] text-[#17211D] flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-[#17211D]">Forensic Attack Timeline</h3>
              <p className="text-xs text-[#5A6E65] leading-relaxed">
                Unified chronological timeline correlating authentication, IP anomalies, beneficiary additions, and payment evaluation for SOC analysts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-3">
          <span className="text-xs font-mono font-bold text-[#285C4D] bg-[#EAF3EF] px-3 py-1 rounded-full border border-[#C8DCD2]">
            Technical FAQ
          </span>
          <h2 className="text-3xl font-serif font-bold text-[#17211D] tracking-tight">
            Frequently Asked Architecture Questions
          </h2>
        </div>

        <div className="space-y-3">
          {faqItems.map((item, index) => {
            const isOpen = openFaqIndex === index;
            return (
              <div
                key={index}
                className="bg-white rounded-xl border border-[#D4E2DC] overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-bold text-xs sm:text-sm text-[#17211D]"
                >
                  <span>{item.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-[#5A6E65] shrink-0 transition-transform ${
                      isOpen ? 'rotate-180 text-[#285C4D]' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 sm:px-5 sm:pb-5 text-xs text-[#5A6E65] leading-relaxed border-t border-[#F4F8F5] pt-3">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#FAFCFA] border-t border-[#D4E2DC] py-10 text-xs text-[#5A6E65]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-[#285C4D] text-white flex items-center justify-center">
              <Shield className="w-3.5 h-3.5" />
            </div>
            <span className="font-serif font-bold text-[#17211D]">FraudShield</span>
            <span>— Deterministic FinTech Fraud Detection &amp; SOC Defense Architecture</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span>MERN Stack</span>
            <span>•</span>
            <span>MongoDB ACID</span>
            <span>•</span>
            <span>SHA-256 Ledger</span>
            <span>•</span>
            <span>MIT License</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
