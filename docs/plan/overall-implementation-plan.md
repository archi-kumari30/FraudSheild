# FraudShield — Overall Implementation Plan

## 1. System Vision & Purpose
FraudShield is an enterprise-grade, deterministic, rule-based digital payment fraud detection platform built on the MERN stack with optional on-demand Google Gemini investigation intelligence. The system simulates internal wallet operations and provides complete explainability for every risk decision across customers and security analysts.

---

## 2. Technology Constraints & Architecture
- **Runtime & Backend:** Node.js (v20+ LTS), Express.js
- **Database:** MongoDB with Mongoose ODM
- **Authentication & Security:** JWT (stateless bearer token), bcrypt password hashing (10 salt rounds)
- **Validation:** Joi schema validation
- **Frontend:** React 18+, Vite, Tailwind CSS (BizOS editorial palette), Axios, Lucide React icons
- **Testing:** Jest, Supertest
- **AI Co-Pilot:** Google Gemini API (strictly backend-governed, advisory only, zero decision power)
- **Zero Forbidden Technologies:** No Python, no ML/DL, no Kafka/RabbitMQ, no Redis, no microservices, no real payment gateways.

---

## 3. High-Level Modular Monolith Architecture

```
FraudShield/
├── backend/
│   ├── src/
│   │   ├── controllers/      # Auth, Wallet, Beneficiary, Transaction, Review, Alert, Audit, AI
│   │   ├── services/         # Domain business logic & transactional orchestration
│   │   ├── repositories/     # Database queries and persistence abstractions
│   │   ├── models/           # User, Wallet, Beneficiary, UserDevice, Transaction, Alert, AuditLog
│   │   ├── routes/           # REST endpoints
│   │   ├── middlewares/      # authMiddleware, deviceMiddleware, validator, errorHandler
│   │   ├── validators/       # Joi schemas for request validation
│   │   ├── fraud/            # Independent deterministic fraud detection subsystem
│   │   │   ├── rules/        # 6 approved heuristic rule files
│   │   │   ├── fraudEngine.js
│   │   │   ├── riskCalculator.js
│   │   │   └── contextCollector.js
│   │   ├── audit/            # Audit logging dispatcher & event recorder
│   │   ├── config/           # Database and environment configuration
│   │   └── utils/            # Token generation, standard API responses
│   └── tests/                # Unit and integration test suites
├── frontend/
│   ├── src/
│   │   ├── components/       # Common, customer, and admin operational components
│   │   ├── layouts/          # CustomerLayout, AdminLayout with persistent navigation
│   │   ├── pages/            # LandingPage, Customer pages, Admin pages, Investigation page
│   │   ├── context/          # AuthContext, AlertContext
│   │   ├── routes/           # ProtectedRoute, AdminRoute, AppRoutes
│   │   └── utils/            # Device identifier helper, API client
└── docs/                     # Specifications, plans, edge cases, test cases
```

---

## 4. Priority Implementation Roadmap

### Priority 1: Core Foundation & Transactions
- Auth & RBAC (customer & admin)
- Simulated Digital Wallet (availableBalance, heldBalance, simulated deposit)
- Beneficiary Management (recipient account, age tracking)
- Transaction API baseline

### Priority 2: Fraud Detection Engine & Decision Lifecycle
- 6 Approved Deterministic Rules (`RULE_AMT_EXTREME`, `RULE_VELOCITY_HIGH`, `RULE_DEVICE_NEW`, `RULE_BENEFICIARY_NEW`, `RULE_FAIL_BURST`, `RULE_DORMANT_SPIKE`)
- Risk Calculator (`finalScore = min(totalRuleScore, 100)`)
- Tri-tier Decision Lifecycle (`LOW` -> `APPROVED`, `MEDIUM` -> `CUSTOMER_VERIFICATION_REQUIRED`, `HIGH` -> `BLOCKED`)
- Atomic balance mutations and Escrow Hold logic
- Customer Self-Verification (`POST /api/transactions/:id/confirm`) and Escalation (`POST /api/transactions/:id/escalate`)

### Priority 3: Administrative Operations, Review & Audit
- Admin review queue for escalated `FLAGGED_FOR_REVIEW` transactions
- Resolution actions: `APPROVE` (settle heldBalance to recipient) vs `REJECT` (refund heldBalance to sender) with mandatory notes (>= 10 chars)
- Immutable audit trail (`AuditLog`)
- Customer and Admin alert generation

### Priority 4: Frontends (Customer & Admin) in BizOS Visual Style
- Custom Tailwind theme: mint/forest green palette (`#EDF6F1`, `#285C4D`, `#17211D`, `#FAFCFA`, `#DCEBE4`, `#D4E2DC`, `#C89445`, `#B65D59`)
- Customer portal: persistent nav, balances, send money, beneficiaries, transactions (with Confirm Payment and Report Unauthorized actions), security alerts
- Admin console: persistent nav, metrics, risk activity, review queue (escalated cases), audit logs, settings
- Transaction investigation page: complete score breakdown and rule addends

### Priority 5: Public Landing Page Polish
- Top nav: FraudShield | Product, How It Works, Security, For Analysts | Sign In, Get Started
- Hero: "REAL-TIME PAYMENT SECURITY", "Detect suspicious payments before money moves."
- Realistic interactive fraud evaluation preview (no fake statistics)

### Priority 6: Gemini Advisory Co-Pilot
- Backend-only orchestration with PII scrubbing and graceful fallback
- Structured plain-English case summary, checklist, questions

---

## 5. Verification Against Definition of Done Scenarios
- **Scenario 1:** ₹2,000, Known device, Known beneficiary -> `LOW` (0/100), `APPROVED`. Instant settlement.
- **Scenario 2:** ₹15,000, New device (with additional risk factor) -> `MEDIUM` (55/100), `CUSTOMER_VERIFICATION_REQUIRED`. Escrow hold, customer self-verification (confirm -> `APPROVED`; or escalate -> `FLAGGED_FOR_REVIEW` for admin review).
- **Scenario 3:** ₹60,000, New device, New beneficiary -> `HIGH` (90/100), `BLOCKED`. Immediate halt, alert and audit.
