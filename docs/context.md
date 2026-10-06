# Project Context & Developer Governance Specification
## Project: FraudShield — Real-Time Rule-Based Fraud Detection & Prevention Platform

---

### Document Information
- **File:** `docs/context.md`
- **Version:** 1.0.0
- **Status:** Active / Source of Truth Context Document
- **Parent Document:** `docs/FraudShield_SRS.md` (Approved v1.0.0)
- **Target Audience:** Core Developers, AI Coding Agents, System Architects, QA Engineers

---

## 1. Project Identity

- **Project Name:** FraudShield
- **Project Type:** Payment Fraud Detection & Prevention Platform
- **Primary Purpose:** Detect suspicious digital payment transactions in real time using deterministic backend fraud rules and risk scoring, while empowering administrators with on-demand investigation intelligence using Google Gemini AI.

---

## 2. Source of Truth & Governance Hierarchy

To eliminate ambiguity, inconsistencies, and unauthorized architectural drift during development, all contributors and AI coding agents must adhere to the following strict documentation hierarchy:

1. **Approved SRS (`docs/FraudShield_SRS.md`)** — Sovereign source of truth for all requirements, business rules, and architectural boundaries.
2. **Context Document (`docs/context.md`)** — Permanent engineering context, developer operating principles, and guardrails.
3. **Approved Module Implementation Plan** — Module-specific architecture, data structures, and execution steps.
4. **Approved Module Edge Cases Document** — Comprehensive edge case specifications for each module.
5. **Approved Module Test Cases Document** — Mandatory unit and integration test criteria.
6. **Existing Implementation Codebase** — The physical code implementing the above documents.

> **Precedence Rule:** If any conflict arises between documents or between code and documentation, the higher-level approved document strictly supersedes the lower-level artifact. The SRS is currently the highest-level source of truth.

---

## 3. Core Product Principle

The foundational architecture of FraudShield is governed by a strict deterministic evaluation pipeline:

```
Customer Submits Transaction
          ↓
  Backend Validation
          ↓
Deterministic Rule Engine
          ↓
      Risk Score
          ↓
      Risk Tier (Low / Medium / High)
          ↓
Transaction Decision (Approve / Review / Block)
```

### The Role of Google Gemini AI
Google Gemini AI functions **strictly and exclusively as an on-demand investigation assistant**.

**Gemini AI CANNOT and MUST NEVER:**
- Make or influence the final fraud decision.
- Override or adjust the deterministic fraud engine's risk score.
- Approve a blocked or flagged transaction.
- Block or decline any transaction.
- Modify customer wallet balances or escrow accounts.
- Directly update database models or change transaction statuses.

The deterministic backend fraud engine retains absolute, sovereign decision-making authority.

---

## 4. Approved User Roles

FraudShield strictly enforces **exactly two user roles**:

### 4.1 `customer`
- Registered end-user holding a simulated digital wallet balance.
- Initiates peer-to-peer simulated transfers.
- Manages personal beneficiaries, wallet balance (test deposit), and profile.
- Views personal transaction history and received customer fraud alerts.

### 4.2 `admin`
- Authorized security officer and fraud analyst.
- Accesses the administrative fraud operations dashboard.
- Inspects real-time flagged and blocked transactions with complete rule breakdowns.
- Invokes on-demand Gemini AI case investigation briefs.
- Conducts manual reviews on escrow-held transactions (`APPROVE` or `REJECT` with mandatory notes).
- Inspects system-wide security audit trails and alert queues.

> **Strict Constraint:** Under no circumstances should unauthorized roles (e.g., `fraud_analyst`, `super_admin`, `manager`, `support_agent`, `auditor`) be introduced unless explicitly amended and approved in the SRS.

---

## 5. Technology Stack & Constraints

### Frontend
- **Framework:** React 18+
- **Build Tool:** Vite
- **Language:** JavaScript (ES6+)
- **Routing:** React Router v6
- **Styling:** Tailwind CSS
- **HTTP Client:** Axios

### Backend
- **Runtime:** Node.js (LTS)
- **Web Framework:** Express.js
- **Language:** JavaScript (Node.js CommonJS or ES Modules)
- **Authentication:** JSON Web Tokens (`jsonwebtoken`)
- **Password Hashing:** `bcrypt` (minimum 10 salt rounds)
- **Request Validation:** `express-validator` or `joi`

### Database
- **Database:** MongoDB
- **Object Data Modeling (ODM):** Mongoose

### Artificial Intelligence
- **AI SDK / API:** Google Gemini API
- **Integration Boundary:** Backend proxy service only. Gemini API keys and client interactions must remain strictly server-side.

### Testing
- **Unit & Integration Testing:** Jest
- **API Endpoint Testing:** Supertest

### Technology Boundary Policy
Do NOT introduce:
- Machine Learning frameworks (Python, Scikit-learn, TensorFlow, PyTorch).
- Distributed event streaming (Apache Kafka, RabbitMQ, Flink).
- Container orchestration & complex cloud infra (Kubernetes, AWS Lambda, microservices).
- Distributed caching (Redis, Memcached) unless explicitly approved.
- Blockchain or Web3 technologies.

---

## 6. Architecture & Physical Boundaries

The repository maintains absolute physical separation between frontend and backend:

```
FraudShield/
├── backend/       # Isolated Node.js/Express API server & engine
├── frontend/      # Isolated React/Vite SPA client application
└── docs/          # Sovereign project specifications & documentation
```

### Modular Monolith Backend Structure:
```
backend/src/
├── controllers/            # HTTP request/response orchestration
├── services/               # Core business & domain logic
├── repositories/           # Data persistence and query layer
├── models/                 # Mongoose schemas
├── routes/                 # Express route definitions
├── middlewares/            # Auth guards, device context, error handling
├── validators/             # Joi request validation schemas
├── fraud/                  # Independent fraud detection subsystem
│   ├── rules/
│   │   ├── amountRule.js
│   │   ├── velocityRule.js
│   │   ├── deviceRule.js
│   │   ├── beneficiaryRule.js
│   │   ├── failedAttemptsRule.js
│   │   └── dormantAccountRule.js
│   ├── fraudEngine.js
│   ├── riskCalculator.js
│   └── contextCollector.js
├── audit/                  # Audit logging subsystem
├── config/                 # Env configuration & database connection
├── utils/                  # Utility helpers and API response formatters
└── tests/                  # Jest & Supertest automated test suites
```

### High-Level Architectural Flow:

```
[ Frontend (React SPA) ]
           │
           │  HTTPS / JSON REST API with Bearer JWT
           ▼
[ Backend API Layer (Express) ]
           │
   Controllers / Services / Business Logic
           │
   ┌───────┴────────────────────────┐
   ▼                                ▼
[ Deterministic Fraud Engine ]    [ Repositories / MongoDB ]
   │                                (Mongoose Models)
   │ (Rules, Scoring, Tiers)
   ▼
[ Transaction Decision ]

[ Admin UI ] ──(On-Demand Request)──> [ Backend Gemini Service ] ──> [ Gemini API ]
```

### Architectural Guardrails:
1. **Frontend-to-Database Isolation:** The frontend must NEVER connect directly to MongoDB. All data access occurs through authenticated REST APIs.
2. **Credential Isolation:** The frontend must NEVER contain Gemini API credentials, JWT signing secrets, or database connection strings.
3. **Engine Isolation:** Fraud rule evaluation logic must reside exclusively on the backend. No client-side fraud evaluation is permitted.
4. **Independent Fraud Logic:** Fraud heuristics and scoring calculations are isolated in `fraud/` and remain completely decoupled from controllers.

---

## 7. Simulated Digital Wallet Model

FraudShield utilizes a **simulated digital wallet** to model realistic financial movement without real banking or gateway integrations.

### Wallet Attributes per Customer:
- `availableBalance`: Liquid funds immediately available for transfers or withdrawal (default simulated starting balance: ₹10,000).
- `heldBalance`: Funds reserved in security escrow during review-tier investigations (initial value: ₹0).
- `transactionHistory`: Immutable ledger of all debits, credits, holds, and releases.

### Operations:
- **Test Deposit / Add Funds:** Self-service simulated credit to `availableBalance` to facilitate scenario and edge-case testing.
- **Simulated Transfer:** Debits sender and credits recipient atomically upon approval.
- **No Real Gateways:** Zero external payment gateway (Stripe, Razorpay, UPI, PayPal) integrations. All balance mutations occur within internal database ledger collections.

---

## 8. Approved Fraud Rules & Deterministic Weights

The fraud detection engine evaluates transactions against exactly **six approved deterministic rules**. All monetary thresholds are denominated in **Indian Rupees (INR / ₹)**.

| Rule Identifier | Trigger Condition | Weight |
| :--- | :--- | :---: |
| **`RULE_AMT_EXTREME`** | Single transfer amount > **₹50,000**<br>OR<br>Transfer amount > **5x** the user's historical 30-day average transaction amount. | **+35** |
| **`RULE_VELOCITY_HIGH`** | More than **3 transactions** initiated by the same user account within a **10-minute** sliding window. | **+30** |
| **`RULE_DEVICE_NEW`** | Transaction originates from an unrecognized device identifier provided via the `x-device-id` request header. | **+25** |
| **`RULE_BENEFICIARY_NEW`** | Transfer exceeding **₹10,000** sent to a beneficiary added to the account less than **24 hours** ago. | **+30** |
| **`RULE_FAIL_BURST`** | At least **3 failed transaction attempts** (e.g., insufficient funds, schema failures) from this user within the last **15 minutes**. | **+20** |
| **`RULE_DORMANT_SPIKE`** | Transfer exceeding **₹5,000** from an account that had **0 transaction activity over the prior 30 days**. | **+25** |

> **Important Device Context Note:** The `x-device-id` value generated and persisted by the frontend is an application-level device identifier for fraud-rule evaluation. It is NOT a secure device fingerprint and must not be treated as proof of device identity.

> **Strict Constraint:** Do not modify rule criteria, add new rules, or alter weights without formal amendment and approval of the SRS.

---

## 9. Risk Scoring & Decision Tiers

### Score Calculation:
$$\text{totalRuleScore} = \sum_{\text{Rule Triggered}} \text{Weight}_{\text{Rule}}$$
$$\text{finalScore} = \min(\text{totalRuleScore}, 100)$$

### Decision Matrix:

| Risk Tier | Score Range | System Action | Transaction Status | Ledger & Balance Impact |
| :---: | :---: | :---: | :---: | :--- |
| **LOW** | **0 – 30** | **`APPROVE`** | `APPROVED` | Immediate atomic transfer: Sender `availableBalance` debited; Recipient `availableBalance` credited. |
| **MEDIUM** | **31 – 70** | **`VERIFY`** | `CUSTOMER_VERIFICATION_REQUIRED` | **Escrow Hold:** Sender `availableBalance` debited; Sender `heldBalance` credited. Recipient balance unchanged. Enqueued for Customer Self-Verification. |
| **HIGH** | **71 – 100** | **`BLOCK`** | `BLOCKED` | **Immediate Halt:** Zero balance deducted from sender. Alert generated; transaction rejected. |

The deterministic fraud engine is the sole, authoritative source of this decision.

---

## 10. Escrow / Held Balance Specification

When a transaction is classified as `CUSTOMER_VERIFICATION_REQUIRED` (or escalated to `FLAGGED_FOR_REVIEW`):
1. **Fund Reservation:** The transaction amount is atomically transferred from the sender's `availableBalance` to their `heldBalance`.
2. **Double-Spend Prevention:** The held funds are inaccessible to the sender for subsequent transfers or withdrawals while the verification or review is active.
3. **Resolution Pathways:**
   - **Customer Self-Verification (`POST /api/transactions/:id/confirm`):** Atomically locks the transaction (`PENDING`), re-evaluates risk. If acceptable, sender `heldBalance` is debited and recipient `availableBalance` is credited (status becomes `APPROVED`). If elevated to HIGH, sender `heldBalance` is refunded to sender `availableBalance` (status becomes `BLOCKED`).
   - **Customer Escalation (`POST /api/transactions/:id/escalate`):** If customer reports "I Didn't Initiate This", status transitions to `FLAGGED_FOR_REVIEW` and is enqueued into the Admin Review Queue.
   - **Admin Review (`POST /api/admin/reviews/:id/resolve`):** For escalated cases, Admin manually approves (sender `heldBalance` debited, recipient `availableBalance` credited; status `APPROVED`) or rejects (sender `heldBalance` debited, sender `availableBalance` credited / refunded; status `REJECTED`).
4. **Scope Boundary:** This is an internal ledger escrow simulation, not a multi-currency or commercial banking clearinghouse.

---

## 11. Gemini AI Boundaries & Guardrails

### 11.1 On-Demand Execution
- Gemini is invoked **only when an authenticated Admin explicitly clicks "Analyze with Gemini"** on a flagged transaction detail screen.
- Automated background calls during transaction processing are prohibited.

### 11.2 Permitted AI Responsibilities:
- Translate technical triggered reason codes into clear, plain-English case narratives.
- Summarize suspicious behavioral patterns and account anomalies.
- Propose 3–5 contextual investigative questions and verification checks for the Admin.
- Assist human triage without introducing bias or non-deterministic verdict shifts.

### 11.3 Prohibited AI Actions:
- Determining transaction legitimacy or fraud verdict.
- Calculating or altering risk scores.
- Approving, rejecting, or blocking transactions.
- Mutating wallet balances or database records.
- Executing administrative workflows directly.

### 11.4 Resiliency & PII Sanitization:
- **Zero-Dependency Guarantee:** If the Gemini API is degraded, times out (> 5,000ms), or returns an error, the core fraud engine and admin review features must continue functioning normally.
- **PII Scrubbing:** Raw passwords, customer names, emails, raw phone numbers, and full bank identifiers must be stripped or masked before transmitting payloads to Gemini.

---

## 12. Security Principles

1. **Zero Plaintext Passwords:** All passwords hashed using `bcrypt` (rounds >= 10).
2. **Stateless JWT Security:** Authenticated routes require signed Bearer tokens with strict expiration.
3. **Role-Based Authorization:** Strict middleware guards enforce `customer` vs `admin` permissions on all protected routes.
4. **Secrets Management:** JWT secrets, database connection strings, and Gemini API keys must reside strictly in backend `.env` files.
5. **Rigorous Input Validation:** Every incoming API payload must be strictly validated against predefined schemas before reaching service logic. Unknown fields must be rejected.
6. **Defense in Depth for Financial Data:** Atomic balance checks and balance holds prevent race conditions and double-spending.
7. **Client Privacy:** Administrative and fraud rule internals (e.g. specific point weights) are never exposed to end-customer API responses.
8. **Immutable Audit Logging:** All sensitive security events (auth, transactions, manual reviews, AI invocations) must be logged permanently in an append-only collection.

---

## 13. Backend Architecture Principles

The backend must follow a clean, maintainable, layered architectural pattern:

```
[ HTTP Request ]
       ↓
[ Express Routes ]
       ↓
[ Middleware ] (CORS, Rate Limit, Auth JWT, RBAC Guard, Input Validator)
       ↓
[ Controllers ] (HTTP status handling, request/response formatting)
       ↓
[ Services / Business Logic ] (Transaction processing, wallet logic, audit logger)
       ↓
[ Dedicated Fraud Detection Engine ] (Isolated rule evaluators, score calculator)
       ↓
[ Mongoose Models / Repositories ]
       ↓
[ MongoDB ]
```

### Structural Rules:
- **Separation of Concerns:** Fraud detection rules must NOT be written inside controllers or route files. They reside in a dedicated engine module.
- **Modular Isolation:** Transaction processing logic is strictly decoupled from fraud rule evaluation logic.
- **AI Service Isolation:** Gemini API interactions are encapsulated in a dedicated service with its own error handling and sanitization layers.
- **No Overabstraction:** Avoid unnecessary enterprise patterns (CQRS, event sourcing, complex DI containers) that obscure code clarity.

---

## 14. Frontend Architecture Principles

The frontend is an autonomous Single Page Application (SPA) built with React, Vite, and Tailwind CSS.

### Responsibilities:
- Deliver intuitive, responsive user experiences for both `customer` and `admin` personas.
- Perform client-side form validation before API submission.
- Display transparent transaction statuses (`APPROVED`, `CUSTOMER_VERIFICATION_REQUIRED`, `FLAGGED_FOR_REVIEW`, `BLOCKED`, `REJECTED`).
- Provide the customer with wallet management, beneficiary controls, and security alerts.
- Provide the admin with real-time incident queues, risk score visualizations, on-demand AI investigation panels, and review resolution forms.

### Guardrails:
- **No Client-Side Fraud Evaluation:** Fraud decisions are never made or simulated in the browser. The backend remains 100% authoritative.
- **No Secret Storage:** No API keys or server secrets in `.env` files exposed via `VITE_` prefixes.

---

## 15. Module Development Philosophy

FraudShield will be developed across **11 sequential, isolated modules**:

1. **Module 1 — Project Setup & Infrastructure**
2. **Module 2 — Authentication & Authorization (RBAC)**
3. **Module 3 — Wallet, Accounts & Beneficiaries**
4. **Module 4 — Device & Context Tracking**
5. **Module 5 — Rule-Based Fraud Detection Engine**
6. **Module 6 — Transaction Processing Engine**
7. **Module 7 — Fraud Alert & Incident Review System**
8. **Module 8 — Gemini AI Investigation Assistant**
9. **Module 9 — Audit Logging & Observability**
10. **Module 10 — Frontend Customer Portal**
11. **Module 11 — Frontend Analyst Dashboard**

### Execution Rule:
Modules must be developed and verified **one at a time**. Developers and AI agents must NOT begin implementing subsequent modules until the active module has passed all specifications, edge cases, and automated tests.

---

## 16. Documentation-First Workflow

Every individual module must strictly follow this sequential lifecycle:

```
[1] Review Approved Requirements
       ↓
[2] Author Module Implementation Plan
       ↓
[3] Author Module Edge Cases Document
       ↓
[4] Author Module Test Cases Document
       ↓
[5] Execute Implementation (Backend / Frontend)
       ↓
[6] Execute Automated & Manual Tests (Jest / Supertest)
       ↓
[7] Stakeholder Review & Verification
       ↓
[8] Version Control Commit
```

No stage may be skipped or performed out of sequence.

---

## 17. AI Coding-Agent Rules

All AI coding assistants (including Antigravity) must strictly obey these 19 non-negotiable development rules:

1. **Never assume missing requirements.** If a detail is missing, ask the user.
2. **Never invent an API endpoint** not specified in an approved plan.
3. **Never invent database fields** without justification from approved documentation.
4. **Never invent or alter business rules** autonomously.
5. **Never introduce new technologies or libraries** without explicit user approval.
6. **Never change the approved fraud rules silently.**
7. **Never change risk thresholds silently.**
8. **Never change the role model silently** (strictly 2 roles: `customer` and `admin`).
9. **Never allow Gemini to become the fraud decision-maker.**
10. **Never expose secrets or API keys in frontend code.**
11. **Never modify unrelated modules** when working on a specific module.
12. **Implement only the requested module** during any given task.
13. **Inspect the existing project structure** before proposing new files or changes.
14. **Stop and ask** if existing code conflicts with approved documentation.
15. **Ask for clarification** whenever requirements appear ambiguous.
16. **Do not generate placeholder functionality** (e.g., `// TODO: implement later`) and claim it is production-ready.
17. **Do not delete working functionality** without explicit authorization.
18. **Do not refactor unrelated code** while implementing a module.
19. **Maintain absolute explainability** so that the project owner can articulate every design choice in technical interviews.

---

## 18. Coding Philosophy

- **Simplicity over Cleverness:** Clean, readable, modular code is preferred over obscure one-liners.
- **Maintainability:** Clear variable naming, modular functions (< 50 lines where practical), and descriptive JSDoc comments.
- **Defensive Programming:** Validate all inputs, handle asynchronous errors gracefully, and never crash the process unhandled.
- **Interview-Ready Engineering:** The architecture must demonstrate industrial best practices that reflect deep software engineering competence.

---

## 19. Testing Philosophy

Each module must be accompanied by comprehensive automated tests using **Jest** and **Supertest**:
- **Happy Paths:** Standard successful user journeys and transaction completions.
- **Validation Failures:** Malformed payloads, negative amounts, missing headers (`x-device-id`).
- **Authorization Guards:** Unauthenticated requests and customer attempts to access admin endpoints.
- **Edge Cases:** Boundary conditions (e.g., transfers of exactly ₹50,000, 3rd vs 4th velocity transaction, beneficiary added exactly 24 hours ago).
- **Resilience Testing:** Verification that transactions process seamlessly when the Gemini AI service is mocked as down/unavailable.

---

## 20. Change Management Procedure

If future requirements evolve or conflict with this context document:

1. **STOP execution immediately.**
2. **Document the conflict and present clear options to the project stakeholder.**
3. **Do not alter code or architecture prematurely.**
4. **Once the stakeholder approves the change, update `docs/FraudShield_SRS.md` and `docs/context.md` first.**
5. **Only proceed to implementation after documentation is locked.**

---

## 21. UI/UX Standards & Operational Experience (BizOS Visual Baseline)

1. **Zero-Emoji Rule:** To ensure FraudShield presents as an industrial fintech platform rather than a prototype, consumer emojis are strictly prohibited across all customer, public, and administrative interfaces. All visual affordances must use official SVG iconography (Lucide React).
2. **BizOS Visual Palette & Architecture:** 
   - Base canvas background: Pale mint / sage `#EDF6F1`
   - Primary action & brand: Deep muted forest green `#285C4D`
   - Typography & high-contrast elements: Charcoal `#17211D`
   - Card surfaces: Warm crisp white `#FAFCFA`
   - Secondary containers & subtle accents: Soft mint `#DCEBE4`
   - Borders: Soft green-gray `#D4E2DC`
   - Warning indicator: Warm amber `#C89445` (Medium Risk / Review)
   - Danger indicator: Muted crimson `#B65D59` (High Risk / Blocked)
   - Restrained elevation: Subtle `shadow-sm`, generous whitespace, clean geometric layouts, no bright blue SaaS styling, no purple gradients, no excessive glassmorphism.
3. **Public Landing Page:**
   - Nav: FraudShield | Product, How It Works, Security, For Analysts | Sign In, Get Started.
   - Hero: "REAL-TIME PAYMENT SECURITY" - "Detect suspicious payments before money moves."
   - Realistic interactive preview showcasing transaction evaluation, risk scores, rule breakdowns, and decisions (no fake statistics).
4. **Strict Interface Segregation:** Customer accounts can never view administrative queue telemetry, internal rule weight thresholds, or admin tools. Admins access a dedicated fraud operations console.
5. **Interactive Explainability:** Transaction details and investigation pages clearly explain WHY every decision was reached through rule breakdowns (+35 Extreme Amount, etc.).
6. **Mandatory Analyst Notes:** Escrow case resolutions (`APPROVE` or `REJECT`) enforce a minimum 10-character rationale to maintain regulatory auditability.
7. **Definition of Done Demo Scenarios:**
   - Scenario 1: ₹2,000, Known device, Known beneficiary -> LOW, APPROVED
   - Scenario 2: ₹15,000, New device (with additional risk factor) -> MEDIUM, CUSTOMER_VERIFICATION_REQUIRED (Customer self-verification: "Confirm Payment" -> re-evaluated and APPROVED, or "I Didn't Initiate This" -> FLAGGED_FOR_REVIEW escalated to Admin Review)
   - Scenario 3: ₹60,000, New device, New beneficiary -> HIGH, BLOCKED

