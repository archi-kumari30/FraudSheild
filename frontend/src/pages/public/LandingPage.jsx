import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Layers,
  Scale,
  UserCheck,
  Bot,
  FileText,
  ChevronRight,
  Lock,
  Zap,
  Activity,
  Menu,
  X,
  HelpCircle,
  Mail,
  Send,
  Check,
  CreditCard,
  Database,
  Cpu,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const LandingPage = () => {
  const { isAuthenticated, isAdmin } = useAuth();
  const [activeScenario, setActiveScenario] = useState('blocked'); // 'approved' | 'review' | 'blocked'
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState(null);

  // Contact form state
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactSubject, setContactSubject] = useState('General Inquiry');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSubmitted, setContactSubmitted] = useState(false);

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

  const scenarios = {
    approved: {
      amount: '₹2,000.00',
      recipient: 'Bob Recipient (Established)',
      device: 'Corporate PC (Known & Trusted)',
      riskScore: 0,
      riskLevel: 'LOW',
      status: 'APPROVED',
      statusColor: 'text-[#1E473B] bg-[#EAF3EF] border-[#C8DCD2]',
      rules: [
        { code: 'RULE_AMOUNT_ANOMALY', name: 'Unusual Amount (Spending Anomaly)', triggered: false, score: 0 },
        { code: 'RULE_VELOCITY_HIGH', name: 'High Velocity', triggered: false, score: 0 },
        { code: 'RULE_DEVICE_NEW', name: 'New Device', triggered: false, score: 0 },
        { code: 'RULE_BENEFICIARY_NEW', name: 'New Beneficiary', triggered: false, score: 0 }
      ],
      description: 'Transaction complies with all behavioral baselines and executes instantly.'
    },
    review: {
      amount: '₹15,000.00',
      recipient: 'Consulting Partner (Established)',
      device: 'Corporate PC (Known Device)',
      riskScore: 35,
      riskLevel: 'MEDIUM',
      status: 'CUSTOMER_VERIFICATION_REQUIRED',
      statusColor: 'text-[#946625] bg-[#FAF4EB] border-[#EAD7BA]',
      rules: [
        { code: 'RULE_AMOUNT_ANOMALY', name: 'Unusual Amount (> 3× 30-Day Avg)', triggered: true, score: 35 },
        { code: 'RULE_DEVICE_NEW', name: 'New Device Fingerprint', triggered: false, score: 0 },
        { code: 'RULE_BENEFICIARY_NEW', name: 'New Beneficiary (< 24h Outflow)', triggered: false, score: 0 }
      ],
      description: 'Surging 5× above the customer\'s 30-day average triggers Rule 1 (+35 pts). Score 35 is MEDIUM risk (31–70). Held in escrow (heldBalance) awaiting customer confirmation, NOT blocked.'
    },
    blocked: {
      amount: '₹60,000.00',
      recipient: 'Unverified Mule (Added 1h ago)',
      device: 'Linux / Unknown Script Fingerprint',
      riskScore: 90,
      riskLevel: 'HIGH',
      status: 'BLOCKED',
      statusColor: 'text-[#8C3E3A] bg-[#FBF0EF] border-[#E6BFBD]',
      rules: [
        { code: 'RULE_AMOUNT_ANOMALY', name: 'Unusual Amount (> 3× 30-Day Avg)', triggered: true, score: 35 },
        { code: 'RULE_DEVICE_NEW', name: 'Unrecognized Device Identifier', triggered: true, score: 25 },
        { code: 'RULE_BENEFICIARY_NEW', name: 'New Beneficiary High-Value Outflow', triggered: true, score: 30 }
      ],
      description: 'Score 90 is HIGH risk (71–100). Halted instantly before balance deduction. Zero funds moved.'
    }
  };

  const current = scenarios[activeScenario];

  const handleContactSubmit = (e) => {
    e.preventDefault();
    if (!contactName || !contactEmail || !contactMessage) return;
    setContactSubmitted(true);
    setTimeout(() => {
      setContactName('');
      setContactEmail('');
      setContactMessage('');
    }, 500);
  };

  const faqItems = [
    {
      q: 'Does FraudShield process real money or integrate UPI/Stripe?',
      a: 'No. FraudShield operates entirely on a simulated digital wallet with persistent MongoDB storage. It strictly forbids real payment gateways, UPI rails, or credit card processors to provide a safe, fully auditable testing environment for compliance teams and security analysts.'
    },
    {
      q: 'Why does an unusual transaction amount get Held for Review instead of Blocked?',
      a: 'Under Rule 1 (Unusual Transaction Amount), transfers exceeding 3× a user\'s 30-day settled average contribute +35 points (or +20 points for 2× to 3×). Because a single 35-point trigger falls within the MEDIUM risk tier (31–70), funds are placed into escrow (heldBalance) awaiting customer self-confirmation. Once the customer confirms initiation, funds settle immediately without requiring manual admin approval. A transfer is only BLOCKED if the composite score reaches the HIGH tier (71–100, e.g., >3× Amount Spike + New Device + New Beneficiary = 90 points).'
    },
    {
      q: 'How does the Escrow Quarantine (heldBalance) work?',
      a: 'When a transaction is flagged with MEDIUM risk, the transfer amount is deducted from the sender\'s availableBalance and moved into heldBalance. Funds are quarantined in escrow until the customer confirms they initiated the payment (or an administrator resolves an escalated case). Upon approval, funds move to recipient; if rejected or blocked, funds return to sender.'
    },
    {
      q: 'Can a user or administrator bypass the 6 fraud rules?',
      a: 'No. Every transaction passes synchronously through our in-memory deterministic heuristic engine before any MongoDB state transition. Even administrators cannot bypass the engine; their power is strictly limited to reviewing quarantined escrow cases with mandatory audit notes.'
    },
    {
      q: 'What role does Gemini AI play in fraud analysis?',
      a: 'Google Gemini acts purely as an advisory investigative assistant for SOC analysts. It synthesizes case context, suggests investigative questions, and generates forensic summaries. Gemini has zero automated decision-making authority over fund approval or denial.'
    },
    {
      q: 'How are beneficiary ages calculated?',
      a: 'Beneficiary ages are calculated dynamically from the exact timestamp stored in MongoDB when the contact was saved (Date.now() - createdAt). If an account was registered as a beneficiary less than 24 hours ago and receives > ₹10,000, Rule 4 triggers automatically (+30 points).'
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
            <div className="w-9 h-9 rounded-lg bg-[#285C4D] text-white flex items-center justify-center shadow-xs">
              <Shield className="w-5 h-5" />
            </div>
            <span className="font-semibold text-lg tracking-tight text-[#17211D]">
              FraudShield
            </span>
          </a>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-7 text-xs font-medium text-[#5A6E65]">
            <a
              href="#top"
              onClick={(e) => scrollToSection(e, 'top')}
              className="hover:text-[#17211D] transition-colors"
            >
              Home
            </a>
            <a
              href="#modules"
              onClick={(e) => scrollToSection(e, 'modules')}
              className="hover:text-[#17211D] transition-colors"
            >
              Modules
            </a>
            <a
              href="#comparison"
              onClick={(e) => scrollToSection(e, 'comparison')}
              className="hover:text-[#17211D] transition-colors"
            >
              Comparison
            </a>
            <a
              href="#pricing"
              onClick={(e) => scrollToSection(e, 'pricing')}
              className="hover:text-[#17211D] transition-colors"
            >
              Pricing
            </a>
            <a
              href="#faq"
              onClick={(e) => scrollToSection(e, 'faq')}
              className="hover:text-[#17211D] transition-colors"
            >
              FAQ
            </a>
            <a
              href="#contact"
              onClick={(e) => scrollToSection(e, 'contact')}
              className="hover:text-[#17211D] transition-colors"
            >
              Contact
            </a>
            <Link
              to="/security-trust"
              className="text-[#285C4D] font-semibold hover:text-[#1d453a] transition-colors flex items-center gap-1"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Security</span>
            </Link>
          </nav>

          {/* Auth CTA & Mobile Toggle */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link
                to={isAdmin ? '/admin/dashboard' : '/dashboard'}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#285C4D] hover:bg-[#1d453a] text-white font-medium text-xs shadow-xs transition-colors"
              >
                <span>{isAdmin ? 'Go to Admin Console' : 'Go to Dashboard'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <div className="hidden sm:flex items-center gap-3">
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 text-xs font-medium text-[#5A6E65] hover:text-[#17211D] transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#285C4D] hover:bg-[#1d453a] text-white font-medium text-xs shadow-xs transition-all"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}

            {/* Mobile Menu Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-[#5A6E65] hover:text-[#17211D] hover:bg-[#EDF6F1] transition-colors"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-[#D4E2DC] bg-[#FAFCFA] px-4 py-4 space-y-3 shadow-lg">
            <div className="flex flex-col space-y-2 text-xs font-medium text-[#5A6E65]">
              <a
                href="#top"
                onClick={(e) => scrollToSection(e, 'top')}
                className="py-1.5 px-2 rounded-md hover:bg-[#EDF6F1] hover:text-[#17211D]"
              >
                Home
              </a>
              <a
                href="#modules"
                onClick={(e) => scrollToSection(e, 'modules')}
                className="py-1.5 px-2 rounded-md hover:bg-[#EDF6F1] hover:text-[#17211D]"
              >
                Modules
              </a>
              <a
                href="#comparison"
                onClick={(e) => scrollToSection(e, 'comparison')}
                className="py-1.5 px-2 rounded-md hover:bg-[#EDF6F1] hover:text-[#17211D]"
              >
                Comparison
              </a>
              <a
                href="#pricing"
                onClick={(e) => scrollToSection(e, 'pricing')}
                className="py-1.5 px-2 rounded-md hover:bg-[#EDF6F1] hover:text-[#17211D]"
              >
                Pricing
              </a>
              <a
                href="#faq"
                onClick={(e) => scrollToSection(e, 'faq')}
                className="py-1.5 px-2 rounded-md hover:bg-[#EDF6F1] hover:text-[#17211D]"
              >
                FAQ
              </a>
              <a
                href="#contact"
                onClick={(e) => scrollToSection(e, 'contact')}
                className="py-1.5 px-2 rounded-md hover:bg-[#EDF6F1] hover:text-[#17211D]"
              >
                Contact
              </a>
              <Link
                to="/security-trust"
                className="py-1.5 px-2 rounded-md text-[#285C4D] font-semibold hover:bg-[#EAF3EF] flex items-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Security / Trust</span>
              </Link>
            </div>

            {!isAuthenticated && (
              <div className="pt-3 border-t border-[#D4E2DC] flex items-center gap-2">
                <Link
                  to="/login"
                  className="flex-1 text-center py-2 text-xs font-semibold rounded-lg border border-[#D4E2DC] text-[#17211D]"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="flex-1 text-center py-2 text-xs font-semibold rounded-lg bg-[#285C4D] text-white shadow-xs"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 px-4 sm:px-6 lg:px-8 border-b border-[#D4E2DC]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Hero Content */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-[#DCEBE4] text-[#285C4D] border border-[#D4E2DC]">
                <Activity className="w-3.5 h-3.5" />
                <span>EXPLAINABLE PAYMENT FRAUD DETECTION</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-[#17211D] tracking-tight leading-[1.15]">
                Detect suspicious payments before money moves.
              </h1>

              <p className="text-sm sm:text-base text-[#5A6E65] leading-relaxed max-w-xl">
                FraudShield evaluates every simulated payment using six deterministic behavioral rules, transparent scoring bounds, and security escrow quarantine.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <a
                  href="#modules"
                  onClick={(e) => scrollToSection(e, 'modules')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#285C4D] hover:bg-[#1d453a] text-white font-medium text-xs shadow-xs transition-all"
                >
                  <span>Explore Modules</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
                {isAuthenticated ? (
                  <Link
                    to={isAdmin ? '/admin/dashboard' : '/dashboard'}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#FAFCFA] border border-[#D4E2DC] hover:bg-[#EDF6F1] text-[#17211D] font-medium text-xs transition-colors"
                  >
                    <span>{isAdmin ? 'Admin Console' : 'Go to Dashboard'}</span>
                  </Link>
                ) : (
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#FAFCFA] border border-[#D4E2DC] hover:bg-[#EDF6F1] text-[#17211D] font-medium text-xs transition-colors"
                  >
                    <span>Sign In</span>
                  </Link>
                )}
              </div>

              {/* Architectural Highlights */}
              <div className="pt-6 grid grid-cols-3 gap-4 border-t border-[#D4E2DC]">
                <div>
                  <div className="text-xs font-semibold text-[#17211D]">Deterministic</div>
                  <div className="text-[11px] text-[#5A6E65] mt-0.5">6 heuristic rules</div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-[#17211D]">Escrow Quarantine</div>
                  <div className="text-[11px] text-[#5A6E65] mt-0.5">Automated balance holds</div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-[#17211D]">Analyst Co-Pilot</div>
                  <div className="text-[11px] text-[#5A6E65] mt-0.5">Advisory Gemini AI</div>
                </div>
              </div>
            </div>

            {/* Right Hero Visual: Interactive Live Telemetry Simulator */}
            <div className="lg:col-span-6">
              <div className="rounded-xl bg-[#FAFCFA] border border-[#D4E2DC] shadow-card overflow-hidden">
                {/* Visual Window Header */}
                <div className="px-5 py-3.5 bg-[#F4F8F5] border-b border-[#D4E2DC] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#B65D59]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#C89445]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#285C4D]" />
                    <span className="text-xs font-mono text-[#5A6E65] ml-2">FraudEngine // Live Telemetry</span>
                  </div>

                  {/* Interactive Scenario Switcher */}
                  <div className="flex items-center gap-1 bg-[#EDF6F1] p-0.5 rounded-md border border-[#D4E2DC]">
                    <button
                      onClick={() => setActiveScenario('approved')}
                      className={`px-2 py-0.5 text-[10px] font-medium rounded transition-colors ${
                        activeScenario === 'approved' ? 'bg-[#FAFCFA] text-[#17211D] shadow-xs' : 'text-[#5A6E65]'
                      }`}
                    >
                      Low Risk (0)
                    </button>
                    <button
                      onClick={() => setActiveScenario('review')}
                      className={`px-2 py-0.5 text-[10px] font-medium rounded transition-colors ${
                        activeScenario === 'review' ? 'bg-[#FAFCFA] text-[#17211D] shadow-xs' : 'text-[#5A6E65]'
                      }`}
                    >
                      Review (35)
                    </button>
                    <button
                      onClick={() => setActiveScenario('blocked')}
                      className={`px-2 py-0.5 text-[10px] font-medium rounded transition-colors ${
                        activeScenario === 'blocked' ? 'bg-[#FAFCFA] text-[#17211D] shadow-xs' : 'text-[#5A6E65]'
                      }`}
                    >
                      Blocked (90)
                    </button>
                  </div>
                </div>

                {/* Card Content Body */}
                <div className="p-5 space-y-4">
                  {/* Top Metrics Row */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-lg bg-[#EDF6F1] border border-[#D4E2DC]">
                      <div className="text-[11px] font-medium text-[#5A6E65]">Transaction Amount</div>
                      <div className="text-xl font-bold font-mono text-[#17211D] mt-0.5">{current.amount}</div>
                      <div className="text-[10px] text-[#5A6E65] mt-1 truncate">To: {current.recipient}</div>
                    </div>

                    <div className="p-3.5 rounded-lg bg-[#EDF6F1] border border-[#D4E2DC]">
                      <div className="text-[11px] font-medium text-[#5A6E65]">Risk Assessment</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xl font-bold font-mono text-[#17211D]">{current.riskScore}</span>
                        <span className="text-xs text-[#5A6E65] font-mono">/ 100</span>
                      </div>
                      <div className="mt-1">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border ${current.statusColor}`}>
                          {current.status === 'APPROVED' && <CheckCircle2 className="w-3 h-3" />}
                          {current.status === 'FLAGGED_FOR_REVIEW' && <AlertTriangle className="w-3 h-3" />}
                          {current.status === 'BLOCKED' && <XCircle className="w-3 h-3" />}
                          {current.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Triggered Rules Breakdown */}
                  <div>
                    <div className="text-xs font-semibold text-[#17211D] mb-2 flex items-center justify-between">
                      <span>Evaluated Rule Breakdown</span>
                      <span className="text-[11px] text-[#5A6E65] font-normal">Formula: min(total, 100)</span>
                    </div>

                    <div className="space-y-1.5">
                      {current.rules.map((rule) => (
                        <div
                          key={rule.code}
                          className={`p-2.5 rounded-lg border flex items-center justify-between text-xs transition-colors ${
                            rule.triggered
                              ? 'bg-[#FAF4EB] border-[#EAD7BA] text-[#17211D]'
                              : 'bg-[#FAFCFA] border-[#D4E2DC] text-[#5A6E65]'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {rule.triggered ? (
                              <span className="w-2 h-2 rounded-full bg-[#C89445]" />
                            ) : (
                              <span className="w-2 h-2 rounded-full bg-[#D4E2DC]" />
                            )}
                            <span className="font-medium text-xs">{rule.name}</span>
                          </div>
                          <div className="font-mono text-xs font-semibold">
                            {rule.triggered ? `+${rule.score}` : '0'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* System Decision Explanation */}
                  <div className="p-3 rounded-lg bg-[#F4F8F5] border border-[#D4E2DC] text-xs">
                    <span className="font-semibold text-[#17211D]">Operational Action: </span>
                    <span className="text-[#5A6E65]">{current.description}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Modules Section */}
      <section id="modules" className="py-20 px-4 sm:px-6 lg:px-8 border-b border-[#D4E2DC] bg-[#FAFCFA]">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-2xl mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-[#DCEBE4] text-[#285C4D] mb-3">
              <Layers className="w-3.5 h-3.5" />
              <span>CORE ARCHITECTURAL MODULES</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#17211D] tracking-tight">
              Six modular engines for zero-trust payment verification.
            </h2>
            <p className="text-xs sm:text-sm text-[#5A6E65] mt-2 leading-relaxed">
              Every subsystem operates deterministically with zero black-box opacity. Explore how FraudShield protects wallets across each layer of execution.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl bg-[#EDF6F1] border border-[#D4E2DC]">
              <div className="w-10 h-10 rounded-lg bg-[#285C4D] text-white flex items-center justify-center mb-4">
                <Scale className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-[#17211D]">1. Six Deterministic Rules</h3>
              <p className="text-xs text-[#5A6E65] mt-2 leading-relaxed">
                Interception before balance mutation: Unusual Amount (+35), Velocity Burst (+30), New Device (+25), New Beneficiary (+30), Failed Attempts (+20), and Dormancy Spike (+25).
              </p>
            </div>

            <div className="p-6 rounded-xl bg-[#EDF6F1] border border-[#D4E2DC]">
              <div className="w-10 h-10 rounded-lg bg-[#285C4D] text-white flex items-center justify-center mb-4">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-[#17211D]">2. Escrow Quarantine Engine</h3>
              <p className="text-xs text-[#5A6E65] mt-2 leading-relaxed">
                Medium-risk transfers automatically freeze funds in <code className="text-[#285C4D] font-mono">heldBalance</code>. Money is never transferred until human analyst clearance.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-[#EDF6F1] border border-[#D4E2DC]">
              <div className="w-10 h-10 rounded-lg bg-[#285C4D] text-white flex items-center justify-center mb-4">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-[#17211D]">3. Immutable Audit Ledger</h3>
              <p className="text-xs text-[#5A6E65] mt-2 leading-relaxed">
                Every login, deposit, transfer attempt, and analyst determination is permanently written to an immutable MongoDB audit trail with IP addresses and user agents.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-[#EDF6F1] border border-[#D4E2DC]">
              <div className="w-10 h-10 rounded-lg bg-[#285C4D] text-white flex items-center justify-center mb-4">
                <Bot className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-[#17211D]">4. Advisory AI Co-Pilot</h3>
              <p className="text-xs text-[#5A6E65] mt-2 leading-relaxed">
                Google Gemini synthesizes plain-English investigative dossiers and forensic checklists for SOC teams—with zero autonomous authority over funds.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-[#EDF6F1] border border-[#D4E2DC]">
              <div className="w-10 h-10 rounded-lg bg-[#285C4D] text-white flex items-center justify-center mb-4">
                <UserCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-[#17211D]">5. Strict Role Separation (RBAC)</h3>
              <p className="text-xs text-[#5A6E65] mt-2 leading-relaxed">
                Customers and administrators are segregated across separate API endpoints. Admins cannot send personal transfers; customers cannot see the SOC review queue.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-[#EDF6F1] border border-[#D4E2DC]">
              <div className="w-10 h-10 rounded-lg bg-[#285C4D] text-white flex items-center justify-center mb-4">
                <CreditCard className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-[#17211D]">6. Atomic Simulated Wallet</h3>
              <p className="text-xs text-[#5A6E65] mt-2 leading-relaxed">
                Safe sandbox currency with atomic <code className="text-[#285C4D] font-mono">$inc</code> MongoDB ledger mutations. Zero real financial gateways, zero financial risk.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section id="comparison" className="py-20 px-4 sm:px-6 lg:px-8 border-b border-[#D4E2DC]">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-2xl mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-[#DCEBE4] text-[#285C4D] mb-3">
              <Scale className="w-3.5 h-3.5" />
              <span>ARCHITECTURAL COMPARISON</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#17211D] tracking-tight">
              Deterministic Rules vs Black-Box Machine Learning
            </h2>
            <p className="text-xs sm:text-sm text-[#5A6E65] mt-2 leading-relaxed">
              Why leading financial compliance teams choose deterministic heuristic engines over opaque black-box machine learning pipelines.
            </p>
          </div>

          <div className="bg-[#FAFCFA] rounded-xl border border-[#D4E2DC] shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F4F8F5] border-b border-[#D4E2DC] text-[11px] font-semibold text-[#5A6E65] uppercase tracking-wider">
                    <th className="py-3.5 px-4">Evaluation Dimension</th>
                    <th className="py-3.5 px-4 text-[#285C4D] font-bold">FraudShield Rule Engine</th>
                    <th className="py-3.5 px-4">Black-Box ML (PyTorch / XGBoost)</th>
                    <th className="py-3.5 px-4">Traditional Siloed Rules</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D4E2DC]">
                  <tr className="hover:bg-[#F4F8F5]/50">
                    <td className="py-3.5 px-4 font-semibold text-[#17211D]">Auditability & Explainability</td>
                    <td className="py-3.5 px-4 text-[#1E473B] font-medium bg-[#EAF3EF]/40">
                      100% transparent. Every score points to exact triggered rule codes.
                    </td>
                    <td className="py-3.5 px-4 text-[#5A6E65]">
                      Opaque weights. Inability to explain individual transaction blocks to auditors.
                    </td>
                    <td className="py-3.5 px-4 text-[#5A6E65]">
                      Disjointed if-else ladders with no composite risk bounds.
                    </td>
                  </tr>

                  <tr className="hover:bg-[#F4F8F5]/50">
                    <td className="py-3.5 px-4 font-semibold text-[#17211D]">Decision Latency</td>
                    <td className="py-3.5 px-4 text-[#1E473B] font-medium bg-[#EAF3EF]/40">
                      &lt; 5ms in-memory heuristic evaluation in Node.js runtime.
                    </td>
                    <td className="py-3.5 px-4 text-[#5A6E65]">
                      50–300ms model inference overhead with feature stores and vector lookups.
                    </td>
                    <td className="py-3.5 px-4 text-[#5A6E65]">
                      Varies; often requires multiple consecutive database round-trips.
                    </td>
                  </tr>

                  <tr className="hover:bg-[#F4F8F5]/50">
                    <td className="py-3.5 px-4 font-semibold text-[#17211D]">False Positive Handling</td>
                    <td className="py-3.5 px-4 text-[#1E473B] font-medium bg-[#EAF3EF]/40">
                      Escrow quarantine holds funds safely; human analyst resolves with mandatory notes.
                    </td>
                    <td className="py-3.5 px-4 text-[#5A6E65]">
                      Silent drops or immediate blocks leading to frustrated genuine users.
                    </td>
                    <td className="py-3.5 px-4 text-[#5A6E65]">
                      Hard declines without escrow mechanisms or resolution workflows.
                    </td>
                  </tr>

                  <tr className="hover:bg-[#F4F8F5]/50">
                    <td className="py-3.5 px-4 font-semibold text-[#17211D]">AI Safety & Hallucination</td>
                    <td className="py-3.5 px-4 text-[#1E473B] font-medium bg-[#EAF3EF]/40">
                      Zero risk: Gemini AI is strictly advisory; cannot approve or block payments.
                    </td>
                    <td className="py-3.5 px-4 text-[#5A6E65]">
                      High risk of automated model drift, adversarial prompt attacks, and bias.
                    </td>
                    <td className="py-3.5 px-4 text-[#5A6E65]">
                      No AI assistance; analysts manually comb through raw database records.
                    </td>
                  </tr>

                  <tr className="hover:bg-[#F4F8F5]/50">
                    <td className="py-3.5 px-4 font-semibold text-[#17211D]">Infrastructure Footprint</td>
                    <td className="py-3.5 px-4 text-[#1E473B] font-medium bg-[#EAF3EF]/40">
                      Lightweight MERN stack (Express + MongoDB). Zero Python / GPU servers required.
                    </td>
                    <td className="py-3.5 px-4 text-[#5A6E65]">
                      Heavy Kubernetes clusters, GPU inference nodes, feature stores, and Python workers.
                    </td>
                    <td className="py-3.5 px-4 text-[#5A6E65]">
                      Complex legacy mainframes with high maintenance contracts.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 border-b border-[#D4E2DC] bg-[#FAFCFA]">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-2xl mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-[#DCEBE4] text-[#285C4D] mb-3">
              <CreditCard className="w-3.5 h-3.5" />
              <span>SIMULATED SANDBOX TIERS</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#17211D] tracking-tight">
              Transparent, open deployment plans.
            </h2>
            <p className="text-xs sm:text-sm text-[#5A6E65] mt-2 leading-relaxed">
              Designed for compliance research, academic study, and enterprise payment sandbox deployments.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Free Sandbox */}
            <div className="p-6 rounded-xl bg-[#EDF6F1] border border-[#D4E2DC] flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-[#5A6E65] uppercase tracking-wider block">Sandbox Free</span>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-3xl font-bold font-serif text-[#17211D]">₹0</span>
                  <span className="text-xs text-[#5A6E65]">/ simulated</span>
                </div>
                <p className="text-xs text-[#5A6E65] mt-2">
                  Complete simulated wallet environment for local development and testing.
                </p>
                <div className="mt-6 space-y-2.5 text-xs text-[#17211D]">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#285C4D]" />
                    <span>6 Deterministic Heuristic Rules</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#285C4D]" />
                    <span>Simulated Wallet Top-ups</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#285C4D]" />
                    <span>Beneficiary Directory with Age Tracking</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#285C4D]" />
                    <span>Customer Security Dashboard</span>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <Link
                  to="/register"
                  className="block w-full text-center py-2.5 px-4 rounded-lg bg-[#FAFCFA] border border-[#D4E2DC] text-[#17211D] hover:bg-[#DCEBE4] font-semibold text-xs transition-colors"
                >
                  Start Sandbox
                </Link>
              </div>
            </div>

            {/* FinTech Staging */}
            <div className="p-6 rounded-xl bg-[#FAFCFA] border-2 border-[#285C4D] shadow-md relative flex flex-col justify-between">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#285C4D] text-white px-3 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase">
                RECOMMENDED
              </div>
              <div>
                <span className="text-xs font-semibold text-[#285C4D] uppercase tracking-wider block">FinTech Staging</span>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-3xl font-bold font-serif text-[#17211D]">₹4,999</span>
                  <span className="text-xs text-[#5A6E65]">/ org env</span>
                </div>
                <p className="text-xs text-[#5A6E65] mt-2">
                  Full dual-role operations platform with escrow quarantine and analyst workbench.
                </p>
                <div className="mt-6 space-y-2.5 text-xs text-[#17211D]">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#285C4D]" />
                    <span>All Sandbox Free Features</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#285C4D]" />
                    <span>Automated Escrow (<code className="font-mono">heldBalance</code>)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#285C4D]" />
                    <span>Analyst Review Queue & Resolution Notes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#285C4D]" />
                    <span>Google Gemini Advisory Case Briefs</span>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <Link
                  to="/login"
                  className="block w-full text-center py-2.5 px-4 rounded-lg bg-[#285C4D] hover:bg-[#1d453a] text-white font-semibold text-xs shadow-xs transition-colors"
                >
                  Deploy Staging
                </Link>
              </div>
            </div>

            {/* Enterprise SOC */}
            <div className="p-6 rounded-xl bg-[#EDF6F1] border border-[#D4E2DC] flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-[#5A6E65] uppercase tracking-wider block">Enterprise SOC</span>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-3xl font-bold font-serif text-[#17211D]">Custom</span>
                  <span className="text-xs text-[#5A6E65]">/ deployment</span>
                </div>
                <p className="text-xs text-[#5A6E65] mt-2">
                  Dedicated high-throughput fraud monitoring with custom heuristic scoring matrices.
                </p>
                <div className="mt-6 space-y-2.5 text-xs text-[#17211D]">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#285C4D]" />
                    <span>Custom Rule Calibration & Thresholds</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#285C4D]" />
                    <span>Unlimited Immutable Audit Logs</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#285C4D]" />
                    <span>Dedicated Incident Response Webhooks</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#285C4D]" />
                    <span>Air-gapped On-premise Database Deployment</span>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <a
                  href="#contact"
                  onClick={(e) => scrollToSection(e, 'contact')}
                  className="block w-full text-center py-2.5 px-4 rounded-lg bg-[#FAFCFA] border border-[#D4E2DC] text-[#17211D] hover:bg-[#DCEBE4] font-semibold text-xs transition-colors"
                >
                  Contact Security Team
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8 border-b border-[#D4E2DC]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-[#DCEBE4] text-[#285C4D] mb-3">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>FREQUENTLY ASKED QUESTIONS</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#17211D] tracking-tight">
              Operational Clarity & Engine Rules
            </h2>
            <p className="text-xs sm:text-sm text-[#5A6E65] mt-2 leading-relaxed">
              Clear answers regarding our deterministic fraud scoring, escrow mechanics, and wallet simulation.
            </p>
          </div>

          <div className="space-y-3">
            {faqItems.map((item, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div
                  key={index}
                  className="rounded-xl border border-[#D4E2DC] bg-[#FAFCFA] overflow-hidden transition-colors"
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                    className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-semibold text-xs sm:text-sm text-[#17211D] hover:bg-[#F4F8F5] transition-colors"
                  >
                    <span>{item.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-[#5A6E65] shrink-0 transition-transform ${
                        isOpen ? 'rotate-180 text-[#285C4D]' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-0 text-xs text-[#5A6E65] leading-relaxed border-t border-[#D4E2DC]/50">
                      <p className="mt-2">{item.a}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 px-4 sm:px-6 lg:px-8 border-b border-[#D4E2DC] bg-[#FAFCFA]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Left Contact Info */}
            <div className="lg:col-span-5 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-[#DCEBE4] text-[#285C4D]">
                <Mail className="w-3.5 h-3.5" />
                <span>OPERATIONAL INQUIRIES</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#17211D] tracking-tight">
                Connect with our Fraud Operations Desk
              </h2>

              <p className="text-xs sm:text-sm text-[#5A6E65] leading-relaxed">
                Have questions about rule engine customization, integration testing, or regulatory audit procedures? Reach out to our engineering and SOC team.
              </p>

              <div className="space-y-4 pt-4 border-t border-[#D4E2DC] text-xs">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#EDF6F1] text-[#285C4D] flex items-center justify-center shrink-0 border border-[#D4E2DC]">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-[#17211D] block">SOC Desk</span>
                    <span className="text-[#5A6E65]">soc-operations@fraudshield.internal</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#EDF6F1] text-[#285C4D] flex items-center justify-center shrink-0 border border-[#D4E2DC]">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-[#17211D] block">Compliance & Audit</span>
                    <Link to="/security-trust" className="text-[#285C4D] hover:underline">
                      View Public Security & Trust Disclosure →
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Contact Form */}
            <div className="lg:col-span-7">
              <div className="p-6 sm:p-8 rounded-xl bg-[#EDF6F1] border border-[#D4E2DC]">
                <h3 className="text-base font-semibold text-[#17211D] mb-1">Send a Message</h3>
                <p className="text-xs text-[#5A6E65] mb-6">
                  Submit a query to our simulated incident response and operations team.
                </p>

                {contactSubmitted ? (
                  <div className="p-6 rounded-xl bg-[#EAF3EF] border border-[#C8DCD2] text-center space-y-3">
                    <div className="w-10 h-10 rounded-full bg-[#285C4D] text-white flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <h4 className="text-sm font-bold text-[#1E473B]">Inquiry Received</h4>
                    <p className="text-xs text-[#5A6E65] max-w-sm mx-auto">
                      Thank you! Your simulated security inquiry has been routed to our operations queue. Our team reviews all requests promptly.
                    </p>
                    <button
                      onClick={() => setContactSubmitted(false)}
                      className="mt-3 px-4 py-1.5 rounded-lg bg-[#285C4D] text-white text-xs font-semibold hover:bg-[#1d453a] transition-colors"
                    >
                      Send Another Message
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleContactSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-[#17211D] mb-1.5">
                          Full Name
                        </label>
                        <input
                          type="text"
                          value={contactName}
                          onChange={(e) => setContactName(e.target.value)}
                          placeholder="Arjun Verma"
                          className="w-full px-3.5 py-2.5 rounded-lg bg-[#FAFCFA] border border-[#D4E2DC] text-xs text-[#17211D] focus:border-[#285C4D] focus:ring-1 focus:ring-[#285C4D] outline-none"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#17211D] mb-1.5">
                          Work Email
                        </label>
                        <input
                          type="email"
                          value={contactEmail}
                          onChange={(e) => setContactEmail(e.target.value)}
                          placeholder="arjun@fintech.example.com"
                          className="w-full px-3.5 py-2.5 rounded-lg bg-[#FAFCFA] border border-[#D4E2DC] text-xs text-[#17211D] focus:border-[#285C4D] focus:ring-1 focus:ring-[#285C4D] outline-none"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#17211D] mb-1.5">
                        Inquiry Topic
                      </label>
                      <select
                        value={contactSubject}
                        onChange={(e) => setContactSubject(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-lg bg-[#FAFCFA] border border-[#D4E2DC] text-xs text-[#17211D] focus:border-[#285C4D] focus:ring-1 focus:ring-[#285C4D] outline-none"
                      >
                        <option value="General Inquiry">General Platform Inquiry</option>
                        <option value="Rule Customization">Heuristic Rule Customization</option>
                        <option value="SOC Integration">SOC & SIEM Ledger Integration</option>
                        <option value="Security Audit">Security & Compliance Verification</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#17211D] mb-1.5">
                        Message Details
                      </label>
                      <textarea
                        rows="4"
                        value={contactMessage}
                        onChange={(e) => setContactMessage(e.target.value)}
                        placeholder="Please describe your use case or specific verification inquiry..."
                        className="w-full p-3 rounded-lg bg-[#FAFCFA] border border-[#D4E2DC] text-xs text-[#17211D] focus:border-[#285C4D] focus:ring-1 focus:ring-[#285C4D] outline-none"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#285C4D] hover:bg-[#1d453a] text-white font-semibold text-xs shadow-xs transition-colors"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Submit Inquiry</span>
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-[#EDF6F1]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#5A6E65]">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#285C4D]" />
            <span className="font-semibold text-[#17211D]">FraudShield</span>
            <span>— Production-Style Rule-Based Fraud Detection</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/security-trust" className="hover:text-[#17211D] transition-colors">
              Security & Trust
            </Link>
            <span>•</span>
            <span>Simulated Digital Wallet Environment. Does NOT process real money.</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
