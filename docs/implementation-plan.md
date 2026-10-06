# Master Implementation Plan
## Project: FraudShield — Real-Time Rule-Based Fraud Detection & Prevention Platform

---

### Document Information
- **File:** `docs/implementation-plan.md`
- **Version:** 1.0.0
- **Status:** Master Plan / Awaiting Plan Sign-off
- **Parent Documents (Sources of Truth):**
  - `docs/FraudShield_SRS.md` (Approved v1.0.0)
  - `docs/context.md` (Approved v1.0.0)
- **Target Execution Model:** Documentation-First, Module-by-Module

---

## 1. Implementation Philosophy

FraudShield is built following an uncompromising **documentation-first, module-by-module engineering discipline**. To prevent architectural regression, scope creep, and undocumented side effects, development is executed in strict sequential isolation.

### The Mandatory Lifecycle per Module:
Every single module—from Infrastructure (Module 1) to Analyst Dashboard (Module 11)—must traverse the following 8-step lifecycle before the next module begins:

```
  [1] Requirements Review & Alignment (against SRS & context.md)
           ↓
  [2] Module Implementation Plan (`docs/modules/module-XX-plan.md`)
           ↓
  [3] Module Edge Cases Document (`docs/modules/module-XX-edge-cases.md`)
           ↓
  [4] Module Test Cases Document (`docs/modules/module-XX-test-cases.md`)
           ↓
  [5] Module Implementation (Isolated Backend or Frontend Code)
           ↓
  [6] Automated & Manual Verification (Jest / Supertest / UI validation)
           ↓
  [7] Stakeholder Review & Sign-Off
           ↓
  [8] Atomic Git Commit
```

### Governing Rules:
1. **Zero Premature Coding:** No application code may be written until the module-specific plan, edge cases, and test cases are approved.
2. **Strict Module Isolation:** A module under implementation must never introduce changes to completed, unrelated modules without explicit justification and stakeholder re-approval.
3. **Continuous Verification:** A module is only complete when 100% of its automated tests pass and all documented edge cases are validated.

---

## 2. Project Architecture & System Boundaries

FraudShield is engineered as a decoupled, layered MERN architecture with clear physical and logical boundaries:

```
+--------------------------------------------------------------------------+
|                        FRONTEND SPA (React + Vite)                       |
|   - Customer Portal (Wallet UI, Send Money, Beneficiaries, Alerts)       |
|   - Admin Dashboard (Queue, Case Review, On-Demand AI Co-Pilot View)     |
+--------------------------------------------------------------------------+
                                    │
                                    │ HTTPS / JSON REST APIs (JWT Bearer)
                                    ▼
+--------------------------------------------------------------------------+
|                         BACKEND API (Node.js + Express)                  |
|                                                                          |
|  [Middleware Layer]                                                      |
|    - CORS, Security Headers, Rate Limiting, Request Validation           |
|    - Authentication Middleware (JWT verification)                        |
|    - Role-Based Authorization Guard (customer vs admin)                  |
|                                                                          |
|  [Controllers & Service Layer]                                           |
|    - Auth Service, Wallet & Beneficiary Service                          |
|    - Transaction Processing Service (Escrow Hold & Ledger State)         |
|    - Incident & Alert Service, Audit Logging Service                     |
|                                                                          |
|  [Deterministic Fraud Engine]                                            |
|    - Rule Evaluator Pool (6 Heuristic Rules)                             |
|    - Score Aggregator: min(totalRuleScore, 100)                          |
|    - Risk Tier Classifier (Low / Medium / High)                          |
|                                                                          |
|  [AI Integration Boundary]                                               |
|    - On-Demand Gemini Assistant Service                                  |
|    - PII Redactor & Sanitizer -> Circuit Breaker -> Gemini SDK           |
+--------------------------------------------------------------------------+
               │                                            │
               ▼                                            ▼
+-----------------------------+              +-----------------------------+
|     DATABASE (MongoDB)      |              |       EXTERNAL AI API       |
|  - Users & Credentials      |              |    Google Gemini API        |
|  - Wallets & Beneficiaries  |              |    (On-Demand Advisory      |
|  - Transactions & Rules     |              |     Assistant Only)         |
|  - Alerts & Incident Reviews|              +-----------------------------+
|  - Immutable Audit Logs     |
+-----------------------------+
```

### Separation Guarantees:
- **No Direct Database Access from Frontend:** The client communicates exclusively through Express REST APIs.
- **Server-Side AI Secrets:** The `GEMINI_API_KEY` is loaded exclusively into backend server environment variables. The client never communicates with Gemini directly.
- **Deterministic Authority:** The fraud engine is executed synchronously in backend service logic; Gemini has zero decision authority.

---

## 3. Final Project Structure

The physical repository will adhere strictly to the following directory layout once implementation commences:

```
FraudShield/
├── docs/                                  # Living documentation & specifications
│   ├── FraudShield_SRS.md                 # Approved requirements specification
│   ├── context.md                         # Developer context & rules of engagement
│   ├── implementation-plan.md             # This master implementation plan
│   └── modules/                           # Per-module plans, edge cases, test cases
│       ├── module-01-setup/
│       ├── module-02-auth/
│       ├── module-03-wallet/
│       ├── module-04-device/
│       ├── module-05-fraud-engine/
│       ├── module-06-transactions/
│       ├── module-07-alerts-reviews/
│       ├── module-08-gemini-assistant/
│       ├── module-09-audit/
│       ├── module-10-customer-portal/
│       └── module-11-analyst-dashboard/
│
├── backend/                               # Isolated Express.js API application
│   ├── src/
│   │   ├── config/                        # Environment variables, DB connection
│   │   ├── middleware/                    # Auth, RBAC, validator, error handlers
│   │   ├── models/                        # Mongoose schemas (User, Wallet, Tx, etc.)
│   │   ├── controllers/                   # Route controllers (HTTP parsing)
│   │   ├── services/                      # Business logic & workflows
│   │   ├── engine/                        # Deterministic rule evaluators & scorer
│   │   │   └── rules/                     # The 6 heuristic rule evaluators
│   │   ├── ai/                            # Gemini client, PII sanitizer, prompts
│   │   ├── utils/                         # Token helpers, constants, formatters
│   │   └── app.js / server.js             # Express app setup & server entry
│   ├── tests/                             # Unit & integration test suites
│   ├── package.json
│   └── .env.example
│
├── frontend/                              # Isolated React SPA (Vite + Tailwind)
│   ├── src/
│   │   ├── api/                           # Axios client & centralized API calls
│   │   ├── assets/                        # Icons, logos, styles
│   │   ├── components/                    # Reusable UI components (Modals, Badges, Tables)
│   │   ├── context/                       # Auth Context, Notification Context
│   │   ├── hooks/                         # Custom hooks (useAuth, useFetch)
│   │   ├── pages/                         # Customer & Admin portal views
│   │   ├── routes/                        # Protected route guards & Router config
│   │   └── App.jsx / main.jsx
│   ├── index.html
│   ├── tailwind.config.js
│   ├── vite.config.js
│   ├── package.json
│   └── .env.example
│
└── README.md
```

> **Notice:** None of the `backend/` or `frontend/` folders or files will be created in this step. They will be constructed module-by-module in subsequent phases.

---

## 4. Module-by-Module Plan

---

### Module 1 — Project Setup & Infrastructure

- **Objective:** Establish the development foundation for both backend and frontend applications, configure environment management, database connectivity, baseline middleware, global error handling, and automated test runners.
- **Dependencies:** None (initial foundation).
- **Backend Work:**
  - Initialize Node.js application (`backend/package.json`) with Express, Mongoose, dotenv, cors.
  - Implement centralized configuration loader (`config/index.js`) validating required environment variables (`PORT`, `MONGODB_URI`, `JWT_SECRET`, `NODE_ENV`).
  - Establish resilient MongoDB connection with retry/reconnect handling.
  - Implement standardized API response utility (`success`, `error`) and global Express error handling middleware.
  - Configure Jest and Supertest test environment with in-memory or test database configuration.
- **Frontend Work:**
  - Initialize Vite React project (`frontend/package.json`) with Tailwind CSS and React Router.
  - Configure base Tailwind theme, typography, color palettes (slate, emerald, amber, rose).
  - Configure centralized Axios HTTP client instance with base URL, timeout, and request/response interceptors.
- **Database Work:** Verify active MongoDB connection and collection index creation capability.
- **API Work:** Health check endpoint (`GET /api/health`) returning server status, database state, and timestamp.
- **Business Logic:** Application boot lifecycle, environment validation, graceful process shutdown handlers (`SIGTERM`, `SIGINT`).
- **Security Considerations:** Enforce strict CORS origin whitelist; verify `.env` files are in `.gitignore`; block stack trace leakage in production error responses.
- **Testing Scope:**
  - Server starts and responds with HTTP 200 on health check.
  - Error handler catches synchronous and asynchronous unhandled errors with uniform JSON responses.
  - Database connection connects and disconnects cleanly in test harnesses.
- **Completion Criteria:** Backend and frontend run independently; health check returns 200; Jest and Supertest execute successfully; Tailwind compiles without warnings.

---

### Module 2 — Authentication & Authorization

- **Objective:** Provide secure registration, login, token lifecycle management, and role-based access control (RBAC) separating `customer` and `admin` roles.
- **Dependencies:** Module 1 (Infrastructure & Database).
- **Backend Work:**
  - Implement User model storing identity, credentials, role (`customer` or `admin`), and account status.
  - Implement password hashing with `bcrypt` (minimum 10 salt rounds) and password verification method.
  - Implement stateless JWT issuance and verification service.
  - Implement authentication middleware (`authenticateToken`) verifying Bearer JWTs.
  - Implement authorization guard (`authorizeRole(['admin'])`) rejecting unauthorized role access with HTTP 403.
  - Implement database seed script for an initial administrator account.
- **Frontend Work:** Prepared API contract for Auth; UI implementation scheduled for Module 10/11.
- **Database Work:** `users` collection with unique index on `email`. Fields include: name, email, passwordHash, role, isActive, createdAt.
- **API Work:**
  - `POST /api/auth/register` (Customer registration).
  - `POST /api/auth/login` (Authentication & JWT generation).
  - `GET /api/auth/me` (Profile retrieval for authenticated user).
- **Business Logic:** Enforce email uniqueness; validate password strength (minimum length); sanitize user responses to ensure `passwordHash` is never returned.
- **Security Considerations:**
  - Passwords never stored in plaintext.
  - Timing attack resilience during password checks.
  - Protection against role elevation (clients cannot self-assign `admin` during registration).
- **Testing Scope:**
  - Customer can register and receive JWT.
  - Duplicate email registration fails with HTTP 400/409.
  - Login succeeds with valid credentials, fails with invalid password or unknown email.
  - `authenticateToken` accepts valid JWT, rejects expired/tampered JWT.
  - Role guard allows `admin` to access protected route and blocks `customer` with HTTP 403.
- **Completion Criteria:** Complete auth lifecycle passes automated integration tests; role separation strictly verified.

---

### Module 3 — Wallet, Accounts & Beneficiaries

- **Objective:** Provision simulated digital wallets for customers with dual-balance tracking (`availableBalance`, `heldBalance`), test funding ("Add Funds"), and address book beneficiary management.
- **Dependencies:** Module 2 (Auth & User identity).
- **Backend Work:**
  - Implement Wallet model linked one-to-one with User (`userId`, `availableBalance`, `heldBalance`, `currency = 'INR'`).
  - Automatic wallet provisioning triggered upon customer registration.
  - Implement Beneficiary model (`userId`, `recipientAccountId`, `nickname`, `createdAt`).
  - Implement test deposit service to credit `availableBalance` with positive INR amounts.
  - Implement beneficiary management service (add, list, remove) with ownership validation.
- **Frontend Work:** Data contracts defined; UI implemented in Module 10.
- **Database Work:**
  - `wallets` collection: one-to-one index on `userId`.
  - `beneficiaries` collection: compound index on `{ userId, recipientAccountId }`.
- **API Work:**
  - `GET /api/wallet` (Get authenticated user's wallet balances).
  - `POST /api/wallet/deposit` (Simulated test deposit into `availableBalance`).
  - `GET /api/beneficiaries` (List user's saved beneficiaries).
  - `POST /api/beneficiaries` (Add new beneficiary with recipient validation).
  - `DELETE /api/beneficiaries/:id` (Remove beneficiary).
- **Business Logic:**
  - Initial simulated balance upon registration: ₹10,000. Initial `heldBalance`: ₹0.
  - Deposit amounts must be positive integers/decimals > 0.
  - A user cannot add their own account as a beneficiary.
  - Track exact creation timestamp on beneficiaries to facilitate 24-hour familiarity heuristics in Module 5.
- **Security Considerations:**
  - Customers can only view and modify their own wallet and beneficiaries.
  - Enforce atomic updates on balance fields.
- **Testing Scope:**
  - Wallet is auto-created with ₹10,000 available and ₹0 held.
  - Deposit increases `availableBalance` correctly; negative deposit rejected.
  - Customer can add, retrieve, and delete beneficiaries.
  - Cannot add self as beneficiary.
- **Completion Criteria:** Wallet and beneficiary operations fully unit-tested with 100% passing test assertions.

---

### Module 4 — Device & Context Tracking

- **Objective:** Capture, normalize, and evaluate device and network session telemetry per transaction, maintaining a historical device registry per user to detect unrecognized logins and transfers.
- **Dependencies:** Module 2 (Auth), Module 3 (User account context).
- **Backend Work:**
  - Implement Device Context extraction middleware:
    - Extract `x-device-id` header from incoming requests.
    - Extract User-Agent header (browser, platform).
    - Extract client IP address (with proxy forward resolution).
  - Implement User Device Registry service to record and query known devices associated with a `userId`.
  - Check whether the current request device ID has previously completed approved transactions or logins for this user.
- **Frontend Work:** Frontend device token utility (generates/persists persistent UUID in `localStorage` and injects `x-device-id` into Axios interceptor).
- **Database Work:** `user_devices` collection or embedded device history document (`userId`, `deviceId`, `userAgent`, `ipAddress`, `firstSeenAt`, `lastSeenAt`).
- **API Work:** Context extraction functions integrated into transaction pipeline middleware.
- **Business Logic:**
  - If `x-device-id` is missing in API request, fallback to generated fingerprint or reject with HTTP 400 depending on policy.
  - Mark device as "Known" once verified; evaluate "New Device" state dynamically against history.
- **Security Considerations:**
  - The `x-device-id` value generated and persisted by the frontend is an application-level device identifier for fraud-rule evaluation. It is NOT a secure device fingerprint and must not be treated as proof of device identity.
  - Device IDs sanitized to prevent header injection.
  - Privacy safeguards: device tokens stored as sanitized hashes where appropriate.
- **Testing Scope:**
  - Middleware correctly parses and attaches device metadata to request context.
  - Recognizes previously seen device as known; flags unseen device ID as new.
- **Completion Criteria:** Device context extraction and registry query verify correctly in automated tests.

---

### Module 5 — Rule-Based Fraud Detection Engine

- **Objective:** Implement the core deterministic fraud detection engine evaluating the 6 approved heuristic rules, calculating composite risk score capped at 100, and categorizing into Low, Medium, and High risk tiers.
- **Dependencies:** Module 3 (Account & Beneficiary data), Module 4 (Device context).
- **Backend Work:**
  - Implement pure, isolated rule evaluators:
    1. `RULE_AMT_EXTREME` (+35): Amount > ₹50,000 OR > 5x 30-day average.
    2. `RULE_VELOCITY_HIGH` (+30): > 3 transactions within 10-minute sliding window.
    3. `RULE_DEVICE_NEW` (+25): Device ID not found in user's known device history.
    4. `RULE_BENEFICIARY_NEW` (+30): Amount > ₹10,000 to beneficiary added < 24 hours ago.
    5. `RULE_FAIL_BURST` (+20): ≥ 3 failed attempts in the last 15 minutes.
    6. `RULE_DORMANT_SPIKE` (+25): Amount > ₹5,000 after > 30 days of 0 transaction activity.
  - Implement scoring aggregator calculating:
    $$\text{finalScore} = \min(\text{totalRuleScore}, 100)$$
  - Implement risk tier mapper:
    - `0 – 30`: `LOW`
    - `31 – 70`: `MEDIUM`
    - `71 – 100`: `HIGH`
  - Engine orchestrator returning `{ riskScore, riskLevel, triggeredRules: [{ ruleCode, weight, reason }] }`.
- **Frontend Work:** None (engine is 100% backend).
- **Database Work:** Historical queries against transactions, beneficiaries, and user device collections.
- **API Work:** Engine callable as an internal service `fraudEngine.evaluate(transactionData, userContext)`.
- **Business Logic:**
  - Pure deterministic evaluation; zero reliance on machine learning models or external networks.
  - Safe mathematical boundary checks (score never exceeds 100 or drops below 0).
  - Explicit reason descriptions for each triggered rule to power explainability.
- **Security Considerations:**
  - Engine evaluation must execute synchronously in memory in < 50ms.
  - Defensive fallbacks: if an individual rule evaluation encounters bad data, log error and fail securely without halting the pipeline.
- **Testing Scope:**
  - Dedicated unit tests for each of the 6 rules testing both positive and negative boundary conditions.
  - Composite tests: single rule triggered, multiple rules triggered, all rules triggered (verifying cap at 100).
  - Tier boundary tests: score 30 = LOW, score 31 = MEDIUM, score 70 = MEDIUM, score 71 = HIGH.
- **Completion Criteria:** 100% test coverage across all 6 rules and scoring aggregation logic.

---

### Module 6 — Transaction Processing Engine

- **Objective:** Manage the end-to-end transaction lifecycle, atomic balance mutations, escrow hold execution, and status transitions based on deterministic fraud evaluation.
- **Dependencies:** Module 3 (Wallet), Module 4 (Device Context), Module 5 (Fraud Engine).
- **Backend Work:**
  - Implement Transaction model: `senderId`, `recipientId`, `amount`, `status`, `riskScore`, `riskLevel`, `triggeredRules`, `timestamps`.
  - Transaction submission endpoint handler:
    1. Validate request payload (positive amount, valid recipient).
    2. Check sender `availableBalance >= amount`.
    3. Gather historical account context.
    4. Invoke Fraud Engine synchronously.
    5. Execute atomic wallet mutation based on decision:
       - `LOW` (Approve): Debit sender `availableBalance`, credit recipient `availableBalance`, status = `APPROVED`.
       - `MEDIUM` (Verify): Debit sender `availableBalance`, credit sender `heldBalance`, recipient unchanged, status = `CUSTOMER_VERIFICATION_REQUIRED`. Customer prompted to self-verify ("Confirm Payment") or escalate ("I Didn't Initiate This").
       - `HIGH` (Block): No balance deductions, status = `BLOCKED`.
- **Frontend Work:** Data contracts established; UI implemented in Module 10.
- **Database Work:**
  - `transactions` collection with indexes on `senderId`, `recipientId`, `status`, `createdAt`.
  - Atomic MongoDB document updates using `$inc` to ensure concurrency safety.
- **API Work:**
  - `POST /api/transactions` (Initiate simulated transfer).
  - `GET /api/transactions` (Customer gets own transaction history).
  - `GET /api/transactions/:id` (Get transaction details).
  - `POST /api/transactions/:id/confirm` (Customer confirms payment: atomic lock, pre-settlement fraud re-evaluation, settles to `APPROVED` or blocks to `BLOCKED` with refund).
  - `POST /api/transactions/:id/escalate` (Customer reports unauthorized payment: transitions to `FLAGGED_FOR_REVIEW` for admin investigation).
- **Business Logic:**
  - Prevent double-spending: held funds are locked in `heldBalance` immediately.
  - Self-transfers strictly rejected.
  - Immediate response with transaction status and masked feedback to customer.
- **Security Considerations:**
  - Concurrency control: prevent race conditions where two simultaneous transactions exceed available balance.
  - Customer API responses must never expose specific internal fraud point scores or rule thresholds.
- **Testing Scope:**
  - Low-risk transaction executes immediately and updates sender and recipient balances.
  - Medium-risk transaction places funds in escrow (`heldBalance`) and marks status `CUSTOMER_VERIFICATION_REQUIRED`.
  - Customer confirmation settles escrow to recipient; escalation moves to `FLAGGED_FOR_REVIEW`.
  - High-risk transaction rejects execution, zero balance deducted, marks status `BLOCKED`.
  - Concurrency tests verifying balance cannot be overdrawn.
- **Completion Criteria:** Transaction processing flows (Approve, Verify/Escalate, Block) verified with database balance consistency verified.

---

### Module 7 — Fraud Alert & Incident Review System

- **Objective:** Manage security alerts for flagged and blocked transactions, provide Admins with an investigation queue for escalated cases (`FLAGGED_FOR_REVIEW`), and execute manual review determinations (`APPROVE` or `REJECT`) with escrow settlement.
- **Dependencies:** Module 6 (Transaction Processing Engine).
- **Backend Work:**
  - Implement Alert model (`userId`, `transactionId`, `severity`, `title`, `message`, `isRead`).
  - Auto-generate customer and admin alert records upon transaction flag or block.
  - Implement Admin Review Queue service (list pending cases with search and filtering).
  - Implement Admin Resolution service:
    - **Manual Approve:** Transition status to `APPROVED`. Atomically debit sender `heldBalance` and credit recipient `availableBalance`.
    - **Manual Reject:** Transition status to `REJECTED`. Atomically debit sender `heldBalance` and refund to sender `availableBalance`.
    - Enforce mandatory resolution notes (minimum 10 characters).
- **Frontend Work:** Data contracts established; UI implemented in Module 11.
- **Database Work:**
  - `alerts` collection: indexes on `userId`, `isRead`, `createdAt`.
  - Updates to `transactions` collection (`resolutionStatus`, `resolvedBy`, `resolutionNotes`, `resolvedAt`).
- **API Work:**
  - `GET /api/alerts` (Customer gets own alerts).
  - `GET /api/admin/reviews` (Admin review queue).
  - `GET /api/admin/reviews/:id` (Admin inspects detailed case).
  - `POST /api/admin/reviews/:id/resolve` (Admin submits approve/reject determination).
- **Business Logic:**
  - Only transactions in `FLAGGED_FOR_REVIEW` status (escalated by customer) can be resolved.
  - Once resolved, a transaction state is immutable (cannot be re-resolved).
  - Accurate fund settlement upon resolution ensures zero fund loss or leakage.
- **Security Considerations:**
  - Endpoints under `/api/admin/*` strictly guarded by `authorizeRole(['admin'])`.
  - Audit trail captured on every resolution action.
- **Testing Scope:**
  - Generating alerts on flagged/blocked transactions.
  - Customer can only see their own alerts; admin can query all alerts.
  - Manual approve settles escrow correctly.
  - Manual reject refunds escrow to sender correctly.
  - Attempting to resolve an already-resolved transaction returns HTTP 400/409.
- **Completion Criteria:** Review queue and escrow resolution lifecycle verified with automated tests.

---

### Module 8 — Gemini AI Investigation Assistant

- **Objective:** Build the secure, on-demand AI co-pilot service using Google Gemini API to generate plain-language case explanations, behavioral summaries, and investigative checklists for Admins.
- **Dependencies:** Module 7 (Review Queue & Case Context).
- **Backend Work:**
  - Implement Gemini API client service (`@google/genai` or `@google/generative-ai`).
  - Implement PII Scrubbing & Sanitization filter:
    - Mask account IDs, names, emails, raw IP addresses.
    - Format transaction amount, historical averages, and triggered rule codes.
  - Construct structured, factual prompts with low temperature (0.2).
  - Implement circuit breaker and timeout (5,000ms) with graceful fallback error messages.
  - Endpoint for Admins to request analysis for a flagged transaction.
- **Frontend Work:** Data contracts established; UI implemented in Module 11.
- **Database Work:** Optional storage of generated AI brief on the transaction record to cache repeated requests.
- **API Work:**
  - `POST /api/admin/reviews/:id/ai-analyze` (Admin on-demand request for AI brief).
- **Business Logic:**
  - On-demand execution only; never triggered automatically during core transaction flow.
  - AI response structured into:
    1. Case Summary (plain-English explanation).
    2. Risk Pattern Synthesis (why this combination of rules matters).
    3. Recommended Investigation Checklist (questions for the analyst).
  - Gemini output is strictly advisory; no capability to alter transaction or wallet state.
- **Security Considerations:**
  - API key stored exclusively in backend `.env`.
  - Zero PII dispatched to external Google servers.
  - Fail-safe operation: core review queue functions 100% normally if Gemini API is down.
- **Testing Scope:**
  - PII scrubber removes all sensitive identifiers.
  - Mocked Gemini success response formats correctly.
  - Mocked Gemini timeout/500 error returns graceful fallback response without crashing.
  - Non-admin user blocked from calling AI endpoint.
- **Completion Criteria:** AI service functions reliably with mocked and live endpoints, verifies PII scrubbing, and exhibits zero impact on core system stability during simulated API outages.

---

### Module 9 — Audit Logging & Observability

- **Objective:** Implement a centralized, immutable security audit logging service recording all critical authentication, transaction, admin review, and AI access events.
- **Dependencies:** Modules 2, 6, 7, 8 (all security-sensitive domains).
- **Backend Work:**
  - Implement `AuditLog` Mongoose model (`timestamp`, `eventType`, `actorId`, `actorRole`, `targetEntity`, `metadata`, `ipAddress`).
  - Implement centralized `auditLogger` utility service with asynchronous write dispatch.
  - Hook audit logger into:
    - Login success & failure events.
    - Transaction creation and fraud engine scoring.
    - Admin review approvals and rejections.
    - Gemini AI assistant invocations.
    - Wallet test deposits.
  - Admin endpoint to query audit history with pagination and date filters.
- **Frontend Work:** Data contracts established; UI implemented in Module 11.
- **Database Work:**
  - `audit_logs` collection: indexes on `timestamp`, `eventType`, `actorId`.
  - Immutable: no update or delete routes exposed.
- **API Work:**
  - `GET /api/admin/audit-logs` (Admin query of audit records).
- **Business Logic:**
  - Append-only architecture.
  - Metadata sanitization to prevent storing credentials or tokens.
- **Security Considerations:**
  - Read-only access restricted strictly to `admin` role.
  - Logging failures must not block customer transaction completion.
- **Testing Scope:**
  - Security events generate corresponding audit records.
  - Audit records contain complete actor and event metadata.
  - Customer blocked from audit log queries.
- **Completion Criteria:** Audit logger records all specified events and administrative query endpoint responds accurately.

---

### Module 10 — Frontend Customer Portal

- **Objective:** Build the responsive React Single Page Application for customer users, featuring authentication, simulated digital wallet management, funds deposit, beneficiary management, send money workflow, transaction history, and fraud alerts.
- **Dependencies:** Modules 1 through 7 (All customer backend APIs).
- **Frontend Work:**
  - Authentication views: Login and Registration forms with validation and error messaging.
  - Navigation layout: Customer header, wallet balance badge, navigation links, logout.
  - Customer Dashboard:
    - Wallet Card: Display `availableBalance`, `heldBalance`, and "Add Funds / Deposit" modal.
    - Send Money Form / Modal: Recipient selection from beneficiaries or manual account ID, amount input, submit action with confirmation.
    - Beneficiary Manager: Add, list, and delete saved beneficiaries.
    - Transaction History Table: Visual status badges (`APPROVED` = Green, `CUSTOMER_VERIFICATION_REQUIRED` = Amber, `FLAGGED_FOR_REVIEW` = Orange, `BLOCKED` = Red), date, amount, recipient, with inline self-verification ("Confirm Payment") and escalation actions.
    - Fraud Alerts Panel: Customer notifications detailing verification-required, held, or blocked transactions with clear guidance.
  - State management: React Context for Auth and Notifications; Axios interceptors attaching JWT and `x-device-id`.
- **Backend Work:** None (consumes existing APIs).
- **Database Work:** None.
- **API Work:** Integration with `/api/auth/*`, `/api/wallet/*`, `/api/beneficiaries/*`, `/api/transactions/*`, `/api/alerts/*`.
- **Business Logic:**
  - Client-side validation: positive numbers, required fields, balance sufficiency checks before submit.
  - Friendly status messaging for review-held and blocked transactions.
- **Security Considerations:**
  - Tokens stored securely in browser memory/localStorage; cleared on logout.
  - Protected route guards redirect unauthenticated users to `/login`.
  - Never display internal fraud rule codes or scoring weights to customers.
- **Testing Scope:**
  - Component rendering, form input handling, and simulated API responses.
  - Route guards prevent unauthorized access to customer portal.
- **Completion Criteria:** Complete customer workflow from registration to transfer submission and alert viewing works seamlessly in the browser.

---

### Module 11 — Frontend Analyst Dashboard

- **Objective:** Build the administrative fraud operations portal for `admin` users, featuring real-time transaction monitoring, detailed rule score inspection, escrow review queue, manual approval/rejection actions, on-demand Gemini AI co-pilot view, and audit log explorer.
- **Dependencies:** Modules 1 through 9 (All admin backend APIs) and Module 10 (Base UI components).
- **Frontend Work:**
  - Admin Route Guards: Verify authenticated user has `role === 'admin'`.
  - Admin Navigation Layout: Header, queue badge counter, audit logs link.
  - Incident & Review Queue:
    - Live table of escalated transactions in `FLAGGED_FOR_REVIEW` and blocked transactions in `BLOCKED` status.
    - Color-coded Risk Badges (`LOW`, `MEDIUM`, `HIGH`).
  - Case Detail Inspection Modal / View:
    - Triggered rules breakdown table (rule name, weight, reason).
    - Customer historical activity summary.
    - Device and IP session comparison.
  - On-Demand Gemini AI Panel:
    - "Analyze Case with Gemini" action button with loading spinner.
    - Formatted display of Case Summary, Risk Pattern, and Recommended Checklist.
    - Graceful fallback alert when AI is unavailable.
  - Resolution Action Modal:
    - Approve / Reject buttons with mandatory resolution notes textarea.
    - Immediate UI update and escrow release reflection.
  - Audit Trail Viewer: Paginated table of system audit logs.
- **Backend Work:** None (consumes existing APIs).
- **Database Work:** None.
- **API Work:** Integration with `/api/admin/reviews/*`, `/api/admin/audit-logs/*`, and `/api/transactions/*`.
- **Business Logic:**
  - Clear visual distinction between AI advice (advisory) and deterministic rule scores (authoritative).
  - Disable resolution buttons until mandatory notes (>= 10 characters) are entered.
- **Security Considerations:**
  - Redirection of non-admin users attempting to load `/admin/*` routes.
  - Sanitize all rendered user inputs against XSS.
- **Testing Scope:**
  - Admin views render correctly; customer role redirected.
  - Review queue updates in real-time upon resolving a case.
  - Gemini modal renders insights when requested and displays fallback on error.
- **Completion Criteria:** Admins can inspect cases, request AI summaries, approve/reject escrow holds, and inspect audit logs with zero UI errors.

---

## 5. Module Dependencies & Sequential Execution Graph

The 11 modules must be constructed in the strict sequential order depicted below:

```
[Module 1: Infrastructure & Project Setup]
       │
       ▼
[Module 2: Authentication & RBAC]
       │
       ▼
[Module 3: Wallet, Accounts & Beneficiaries]
       │
       ▼
[Module 4: Device & Context Tracking]
       │
       ▼
[Module 5: Rule-Based Fraud Detection Engine]
       │
       ▼
[Module 6: Transaction Processing Engine]
       │
       ▼
[Module 7: Fraud Alert & Incident Review System]
       │
       ▼
[Module 8: Gemini AI Investigation Assistant]
       │
       ▼
[Module 9: Audit Logging & Observability]
       │
       ▼
[Module 10: Frontend Customer Portal]
       │
       ▼
[Module 11: Frontend Analyst Dashboard]
```

### Dependency Rationale:
1. **Modules 1 & 2** establish server infrastructure, database models, and user identities.
2. **Module 3** establishes financial balance and recipient primitives needed before any transfer can occur.
3. **Module 4** provides the device and session tracking headers (`x-device-id`) evaluated by fraud heuristics.
4. **Module 5** constructs the pure, deterministic rule evaluators and risk scoring logic in isolation.
5. **Module 6** orchestrates live transactions, combining balance checks with the fraud engine and escrow holds.
6. **Module 7** builds review queues and manual resolution mechanisms for transactions held by Module 6.
7. **Module 8** equips the review queue with on-demand Gemini AI intelligence.
8. **Module 9** instruments immutable audit trails across all previously built security and transaction events.
9. **Modules 10 & 11** construct the customer and admin user interfaces on top of thoroughly tested, robust backend APIs.

---

## 6. Testing Strategy

Testing is conducted at three distinct levels:

### 6.1 Level 1: Module-Level Testing (Unit & Component)
- **Scope:** Every individual module must have automated unit tests before it is marked complete.
- **Coverage Areas:**
  - Individual rule evaluators (Modules 5): boundary conditions for amount, velocity, devices, beneficiaries, failures, dormancy.
  - Scoring formulas: verification of the $\min(\text{totalRuleScore}, 100)$ ceiling.
  - Escrow logic: verification of balance deductions and hold states (Module 3 & 6).
  - PII sanitization: verification that sensitive data is stripped before reaching Gemini (Module 8).

### 6.2 Level 2: Integration Testing (API & Database)
- **Scope:** Verify multi-step service interactions using Jest and Supertest against a test MongoDB database.
- **Coverage Areas:**
  - Registration → Login → JWT verification → Profile access.
  - Wallet deposit → Beneficiary creation → Transaction initiation.
  - Concurrency testing: parallel transfer requests attempting to overdraw `availableBalance`.
  - Escrow hold → Admin review approval → Recipient credit.
  - Escrow hold → Admin review rejection → Sender refund.

### 6.3 Level 3: End-to-End Workflow Testing
- **Comprehensive E2E Scenario:**
  1. Customer A registers and receives initial simulated balance.
  2. Customer B registers.
  3. Customer A adds Customer B as a beneficiary.
  4. Customer A initiates transfer of ₹15,000 to Customer B (triggers `RULE_BENEFICIARY_NEW` +30 and new device +25, score 55, lands in `CUSTOMER_VERIFICATION_REQUIRED`).
  5. System verifies Customer A's `availableBalance` is reduced and ₹15,000 is placed in `heldBalance`. Customer B's balance is unchanged.
  6. Customer A receives in-app alert that payment verification is required.
  7. **Pathway A (Customer Self-Verification):** Customer A clicks "Confirm Payment" -> atomic lock acquired -> pre-settlement fraud rules re-evaluated -> transitions to `APPROVED` -> transfers ₹15,000 from Customer A's `heldBalance` to Customer B's `availableBalance`.
  8. **Pathway B (Customer Escalation):** Customer A clicks "I Didn't Initiate This" -> transitions to `FLAGGED_FOR_REVIEW`. Admin views transaction in Review Queue, optionally requests Gemini analysis, and submits Manual Approve (settles to recipient) or Manual Reject (refunds Customer A's `heldBalance` to `availableBalance`).
  9. System verifies complete action is permanently recorded in `AuditLog`.

---

## 7. Security Testing & Guardrails

The implementation test suite will explicitly test and verify the following security vulnerabilities:

1. **Authentication Bypass:** Requests to protected endpoints without Bearer tokens or with forged/expired tokens must return HTTP 401.
2. **Privilege Escalation:** Customer tokens attempting to invoke `/api/admin/*` endpoints must return HTTP 403.
3. **Double-Spending & Race Conditions:** Rapid concurrent transactions exceeding `availableBalance` must be safely rejected; balance must never become negative.
4. **Input Injection & Malformed Payloads:** Negative amounts, SQL/NoSQL injection payloads in string fields, and unvalidated parameters must be rejected by schema validators with HTTP 400.
5. **PII Leakage Prevention:** Verify automated test asserts that request payloads sent to Gemini API contain zero plaintext emails, raw account IDs, or passwords.
6. **Information Disclosure:** Verify that customer-facing endpoints never return internal rule weights, score thresholds, or system stack traces.

---

## 8. Completion Strategy & Milestone Gates

The project transitions through 5 progressive completion gates:

| Gate | Milestone | Acceptance Criteria |
| :---: | :--- | :--- |
| **Gate 1** | **Backend Core Engine (Modules 1–6)** | Server boots; auth functions; wallet balances operate; all 6 fraud rules evaluate deterministically; transactions execute or hold in escrow with zero concurrency errors. |
| **Gate 2** | **Incident Review & AI Co-Pilot (Modules 7–9)** | Review queue processes manual approvals and rejections; Gemini delivers on-demand briefs with graceful fallback; audit logs record all events. |
| **Gate 3** | **Frontend Applications (Modules 10–11)** | Customer portal and Admin dashboard fully styled in Tailwind; smooth user flows; responsive layouts; zero client-side crashes. |
| **Gate 4** | **End-to-End Integration** | Complete end-to-end user journeys pass automated and manual verification; full regression suite passing. |
| **Gate 5** | **Production Readiness** | Linting passes with 0 errors; code comments and JSDoc complete; environment configs cleanly documented; final runbooks updated. |

---

## 9. Git Version Control Strategy

Git commits will be authored atomically following each verified module completion. Commits must represent coherent, fully tested milestones:

- `feat(setup): module 1 - initialize backend and frontend infrastructure`
- `feat(auth): module 2 - implement authentication and rbac middleware`
- `feat(wallet): module 3 - implement wallet balances and beneficiary management`
- `feat(device): module 4 - implement device context tracking and registry`
- `feat(fraud-engine): module 5 - implement rule-based fraud detection engine`
- `feat(transactions): module 6 - implement transaction processing and escrow holds`
- `feat(alerts-reviews): module 7 - implement fraud alerts and admin review queue`
- `feat(ai): module 8 - implement on-demand gemini investigation assistant`
- `feat(audit): module 9 - implement immutable security audit logging`
- `feat(ui-customer): module 10 - implement frontend customer portal`
- `feat(ui-admin): module 11 - implement frontend analyst dashboard`

---

## 10. Planning Decisions & Status

The following operational details have been pre-aligned with the approved SRS and context documents:

| Decision Item | Implementation Strategy | Status |
| :--- | :--- | :---: |
| **Initial Admin Seeding** | Seed script (`npm run seed`) creating the initial default `admin` user from environment credentials. | `[Approved in SRS/Context]` |
| **Device Identification** | Extracted via incoming HTTP header `x-device-id`, backed by User-Agent and client IP tracking. The `x-device-id` value is an application-level device identifier for fraud-rule evaluation, not a secure fingerprint or proof of device identity. | `[Approved in SRS/Context]` |
| **Currency & Formatting** | Indian Rupees (INR / ₹) formatted cleanly across all backend ledgers and UI displays. | `[Approved in SRS/Context]` |
| **Gemini Model Tier** | Standardize on official `@google/genai` or `@google/generative-ai` calling Gemini Flash models with temperature 0.2. | `[Approved in SRS/Context]` |
| **Escrow Hold Mechanics** | Dual-balance model: `availableBalance` and `heldBalance` preventing double-spending during review. | `[Approved in SRS/Context]` |

> **Note on Approvals:** All core business rules, roles, fraud rules, risk thresholds, and escrow behaviors are ratified in `docs/FraudShield_SRS.md` and `docs/context.md`. There are currently **zero pending architectural ambiguities**.

---

## 11. Real-World Product Experience & SOC UX Architecture

To ensure FraudShield functions and feels like a realistic financial security platform ready for high-stakes technical demonstration:

1. **Balanced Security Design System:**
   - Deep navy canvas (`#0A1128`), surface card components (`#111C38`), dark interactive sub-elements (`#0B132B`).
   - Clean slate borders (`border-slate-800`), high-contrast typography (`text-slate-100`, `text-slate-300`, `text-slate-400`).
   - Security color mapping: Emerald/teal for low risk and approved states, amber for medium risk and escrow holds, rose for high risk and blocked transactions.
   - Zero emojis permitted; Lucide icons provide uniform, enterprise-grade visual affordances.

2. **Public Landing Page Experience (`/`):**
   - High-impact explanation of why deterministic fraud prevention protects financial networks.
   - Interactive 4-step processing pipeline: Transaction Submission $\rightarrow$ Context Aggregation $\rightarrow$ Parallel Rule Execution $\rightarrow$ Decision Routing.
   - Realistic transaction scenario demonstrations (e.g. ₹50,000 High Risk Block vs ₹2,000 Low Risk Immediate Settlement).

3. **Customer Banking Portal:**
   - Multi-step transfer wizard with real-time "Transaction Security Check" breakdown displaying amount, risk score, tier, and triggered reasons directly from the backend fraud engine.
   - Comprehensive escrow ledger detailing funds locked in `heldBalance` awaiting SOC resolution.
   - Self-service password recovery flow (`/forgot-password`, `/reset-password/:token`).

4. **Security Operations Center (SOC) Administration:**
   - Live triage queue with human-in-the-loop review actions (`APPROVE` with fund release, `REJECT` with refund).
   - Mandatory analyst notes validation ($\ge 10$ characters) saved immutably to audit logs.
   - Deterministic Security Rules Matrix (`/admin/rules`) displaying all 6 heuristic rules, weights, and mathematical boundaries.
   - Gemini AI Co-Pilot safeguards documentation (`/admin/ai-assistant`) and on-demand triage briefings.

