# FraudShield — Frontend Implementation Plan (BizOS Visual Baseline)

## 1. Visual Identity & Editorial Design System
The frontend is completely redesigned using an editorial, clean geometric visual language (BizOS inspired):

### Color Palette
- **Background (`bg`):** Pale mint / soft sage `#EDF6F1`
- **Primary Brand / Buttons (`primary`):** Deep muted forest green `#285C4D` (hover: `#1d453a`)
- **Typography & High-Contrast (`dark`):** Charcoal `#17211D`
- **Card Surfaces (`surface`):** Warm crisp white `#FAFCFA`
- **Soft Accent / Tints (`soft`):** Soft sage/mint `#DCEBE4`
- **Borders & Dividers (`border`):** Soft green-gray `#D4E2DC`
- **Warning Indicator (`warning`):** Warm amber `#C89445` (Review tier)
- **Danger Indicator (`danger`):** Muted crimson `#B65D59` (Blocked tier)
- **Approved Indicator (`success`):** Deep forest green `#285C4D`

### Design Principles
- Restrained shadows (`shadow-sm` or border-driven depth)
- Generous whitespace and padding
- Editorial typography (high-contrast charcoal headings, subtle metadata labels)
- Clean geometric cards with subtle rounded corners (`rounded-lg` / `rounded-xl`)
- Minimal visual noise — absolutely NO bright blue SaaS styling, NO purple gradients, NO consumer emojis, NO fake statistics, and NO dead buttons.

---

## 2. Public Landing Page Structure
- **Navigation Header:**
  - Logo: `FraudShield` with shield icon
  - Links: `Product`, `How It Works`, `Security`, `For Analysts`
  - Action Buttons: `Sign In`, `Get Started`
- **Hero Section:**
  - Eyebrow Badge: "REAL-TIME PAYMENT SECURITY"
  - Headline: "Detect suspicious payments before money moves."
  - Subtitle: "FraudShield evaluates every simulated payment using transparent behavioral rules, explainable risk scoring, and analyst-controlled review."
  - Action Buttons: "Explore Platform" (smooth scroll / get started), "Sign In"
- **Interactive Hero Visual:**
  - A live, realistic fraud-monitoring preview exhibiting:
    - Transaction Amount (e.g. ₹60,000)
    - Calculated Risk Score (e.g. 90 / 100)
    - Triggered Rules Breakdown: Extreme Amount (+35), New Device (+25), New Beneficiary (+30)
    - Decision: `BLOCKED` with high risk indicator
    - Scenario toggle: Test Approved (₹2,000), Review (₹15,000), Blocked (₹60,000) directly in the preview!
- **Feature Pillars:**
  - Deterministic Rule Engine
  - Escrow-Held Quarantine
  - Explainable Risk Scoring
  - AI Analyst Co-Pilot (advisory only)
- **Footer:** Editorial footer with navigation links and platform disclaimer (simulated wallet, no real money).

---

## 3. Customer Portal Structure
Persistent application layout (`CustomerLayout.jsx`) with sidebar/top navigation:
1. **Overview / Dashboard:**
   - Available Balance card & Held Balance card
   - Quick Send Payment CTA
   - Recent Transactions ledger with status badges
   - Recent Security Alerts
2. **Wallet:**
   - Balance overview (available vs held)
   - Simulated Add Funds / Deposit modal & action
   - Detailed ledger
3. **Send Money:**
   - Beneficiary selection or direct recipient input
   - Amount in INR (₹)
   - Real-time pre-check feedback
   - Instant visual explanation of fraud result upon submission (Approved, Customer Verification Required in Escrow, or Blocked)
4. **Beneficiaries:**
   - Beneficiary address book
   - Add new beneficiary with creation timestamp tracking
   - Age indicator (e.g., "Added 2 hours ago - High-value transfer watch active")
5. **Transactions:**
   - Filterable transaction history (Amount, Recipient, Date, Risk Score, Status badge)
   - Interactive self-verification ("Confirm Payment") and escalation ("I Didn't Initiate This") for transactions in `CUSTOMER_VERIFICATION_REQUIRED`
   - Transaction detail modal with full customer-facing explanation
6. **Security Alerts:**
   - Alert feed explaining verification-required, held, and blocked transactions without leaking internal thresholds
7. **Settings:** Profile info, registered devices
8. **Logout:** Clear JWT and redirect to login

---

## 4. Admin Fraud Operations Console Structure
Persistent operational layout (`AdminLayout.jsx`):
1. **Overview / Dashboard:**
   - Key Metrics: Total Transactions, Under Review, Blocked, Approved
   - Live Risk Activity feed
   - Priority review alerts
2. **Transactions:**
   - System-wide transaction table with search, status filters, risk score sorting
   - Direct link to investigation page
3. **Review Queue:**
   - Prioritized queue of escalated transactions in `FLAGGED_FOR_REVIEW`
   - Case summary: Sender, Recipient, Amount, Risk Score, Triggered Rules, Escrow state
   - Instant action modal for `APPROVE` or `REJECT` with mandatory resolution note (>= 10 chars)
4. **Fraud Alerts:**
   - System-wide alerts classified by severity (`MEDIUM`, `HIGH`)
5. **Audit Logs:**
   - Immutable audit trail of logins, transaction evaluations, admin review determinations
6. **Settings & Health:**
   - System rules overview (6 heuristic rules, weights, conditions)
   - Database and system health telemetry
7. **Logout:** Secure admin sign-out

---

## 5. Transaction Investigation Page Structure
Accessible via `/admin/transactions/:id` and `/admin/reviews/:id`:
- **Header:** Transaction ID, Timestamp, Status badge (`APPROVED`, `FLAGGED_FOR_REVIEW`, `BLOCKED`, `REJECTED`)
- **Key Metrics Row:** Transfer Amount, Final Risk Score (e.g. 90 / 100), Risk Level (`LOW`, `MEDIUM`, `HIGH`)
- **Triggered Rule Breakdown Card:**
  - Visual additive breakdown showing each triggered rule with its exact score contribution:
    - Extreme Amount: +35 (`RULE_AMT_EXTREME`)
    - New Device: +25 (`RULE_DEVICE_NEW`)
    - New Beneficiary: +30 (`RULE_BENEFICIARY_NEW`)
    - Total Score: 90 / 100
- **Profiles & Context Grid:**
  - Sender Profile & 30-day transaction history
  - Recipient Profile & Beneficiary relationship age
  - Device & Network Metadata (device identifier, known device status, IP, User-Agent)
- **Audit & Resolution Timeline:**
  - Created timestamp, Evaluation timestamp, Resolution state (if resolved, analyst name, notes, timestamp)
- **On-Demand Gemini Advisory Co-Pilot:**
  - Button: "Generate Investigation Brief"
  - Generates: Executive Case Summary, Behavioral Risk Pattern, Investigation Checklist, Key Forensic Questions
  - Prominent disclaimer: *Gemini is strictly an advisory co-pilot with zero decision authority.*
- **Action Toolbar (for FLAGGED_FOR_REVIEW):**
  - "Approve Transfer" (releases held escrow to recipient)
  - "Reject Transfer" (refunds held escrow to sender)
  - Mandatory resolution note textarea (>= 10 chars)
