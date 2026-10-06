# Software Requirements Specification (SRS)
## Project: FraudShield — Real-Time Rule-Based Fraud Detection & Prevention Platform

---

### Document Information
- **Project Name:** FraudShield
- **Document Version:** 1.0.0-APPROVED (Formal Baseline)
- **Status:** Approved / Baseline Established
- **Author:** Antigravity AI & Architecture Team
- **Approved By:** Project Stakeholder
- **Target Stack:** MERN Stack (MongoDB, Express.js, React, Node.js) + Google Gemini API
- **GitHub Repository:** https://github.com/archi-kumari30/FraudSheild

---

## 1. Project Overview

**FraudShield** is an enterprise-grade web application designed to monitor, evaluate, and prevent fraudulent digital payment transactions in real time. Built on a deterministic, transparent, and explainable foundation, FraudShield safeguards digital payment ecosystems against unauthorized transactions, account takeovers, velocity abuse, and suspicious beneficiary patterns.

Unlike black-box machine learning systems that can introduce opacity and non-deterministic behavior into high-stakes financial decisions, FraudShield employs a high-performance **rule-based fraud detection and risk scoring engine**. Every transaction is systematically evaluated against a predefined suite of heuristic and behavioral fraud rules, generating a deterministic numerical risk score, an associated risk tier, and an explicit list of triggered fraud indicators.

To augment operational efficiency without compromising regulatory auditability, FraudShield integrates **Google Gemini AI** strictly as an **AI Fraud Investigation Assistant**. Gemini acts as an intelligent co-pilot for fraud analysts—synthesizing alert narratives, deciphering rule combinations into plain-English case summaries, suggesting contextual investigative questions, and accelerating manual review triage. Crucially, the deterministic backend fraud engine retains absolute, sovereign decision-making authority.

### 1.1 Project Repository

**GitHub Repository:**
https://github.com/archi-kumari30/FraudSheild

---

## 2. Problem Statement

Digital payment systems, peer-to-peer (P2P) transfers, and digital wallets have experienced exponential growth globally. However, this convenience brings substantial exposure to financial crime, including:
1. **Account Takeover (ATO):** Fraudulent access via credential stuffing or session hijacking leading to rapid fund draining.
2. **Velocity Attacks:** Automated scripts executing bursts of rapid transactions to extract funds before detection.
3. **Mule Accounts & Unrecognized Beneficiaries:** Immediate laundering of stolen funds through newly created or unfamiliar recipient accounts.
4. **Anomalous Behavioral Deviation:** Sudden atypical transaction spikes from historically low-value accounts.
5. **Analyst Fatigue and Opacity:** Operational fraud teams are often flooded with cryptic alerts lacking clear context, leading to either delayed intervention or high false-positive friction for legitimate customers.

Modern fintech platforms require a fraud prevention system that satisfies three critical pillars:
- **Instantaneous Real-Time Evaluation:** Minimal latency added to the customer payment journey.
- **Explainable & Deterministic Decisions:** Every block or review action must cite exact, explainable reason codes.
- **Assisted Human Triage:** Analysts need immediate, human-readable intelligence to resolve escalated cases rapidly without manual forensic overhead.

FraudShield directly addresses these challenges by combining deterministic rule evaluation with AI-assisted operational intelligence.

---

## 3. Objectives

The primary engineering and operational objectives of FraudShield are:

1. **Deterministic Fraud Prevention:** Implement an explainable, rule-based risk scoring pipeline capable of evaluating transactions against velocity, threshold, beneficiary, and device heuristics.
2. **Sub-Second Latency:** Complete full rule evaluation, risk score synthesis, and decision assignment within milliseconds during transaction ingestion.
3. **Tri-Tier Transaction Lifecycle:** Accurately classify every transaction into one of three deterministic actions:
   - `APPROVE` (Low Risk: execute payment immediately)
   - `VERIFICATION / ESCROW` (Medium Risk: hold funds in escrow; customer self-verification with backend re-screening, or escalate to analyst upon customer reporting unauthorized activity)
   - `BLOCK` / `REJECT` (High Risk: prevent execution immediately and safeguard account)
4. **AI-Assisted Operational Intelligence:** Leverage Gemini AI strictly on-demand to produce plain-language case summaries, root-cause explanations, and recommended investigative checklists for fraud analysts without granting AI any decision authority.
5. **Robust Resiliency & Fail-Safe Architecture:** Ensure that 100% of payment evaluation and core banking capabilities remain fully operational if Gemini API is degraded, rate-limited, or unreachable.
6. **Data Privacy & Strict Zero-Leakage:** Guarantee that sensitive customer financial data (e.g., account credentials, unmasked identifiers, raw passwords) is never transmitted to external AI endpoints.
7. **Auditable Governance:** Provide complete, immutable audit logs for all security-sensitive events, administrative decisions, and rule evaluations.

---

## 4. Scope

The initial production-ready version (v1.0) of FraudShield encompasses the following core capabilities:

### In-Scope Capabilities:
- **User & Account Management:**
  - Secure customer registration and login with bcrypt password hashing and JWT authentication.
  - Role-Based Access Control (RBAC) enforcing strictly 2 roles: `customer` and `admin`.
  - Customer profile management.
- **Simulated Digital Wallet System (Simulated Environment Only):**
  - Provisioning of a simulated digital wallet for each customer.
  - Tracking of two distinct balance fields:
    - `availableBalance` (funds readily available for withdrawal or transfers)
    - `heldBalance` (funds reserved in security escrow during review-tier transactions)
  - Simulated "Add Funds / Deposit" capability for balance adjustment and testing edge cases.
  - Complete personal transaction ledger history.
- **Beneficiary Management:**
  - Address book to add, view, and remove saved beneficiaries (recipient account identifier, nickname, creation timestamp).
  - Explicit beneficiary age tracking to detect rapid fund transfers to newly added recipients.
- **Device & Session Metadata Capture:**
  - Capture client User-Agent header (browser, OS).
  - Capture client IP address (or forwarded IP representation).
  - Capture client Device Identifier (fingerprint token passed via request header).
  - Registry of known devices per customer account.
- **Payment & Transaction Engine:**
  - Initiation of peer-to-peer / digital wallet transfer transactions in Indian Rupees (INR / ₹).
  - Atomic transaction state management (`PENDING`, `APPROVED`, `CUSTOMER_VERIFICATION_REQUIRED`, `FLAGGED_FOR_REVIEW`, `BLOCKED`, `REJECTED`).
  - Escrow hold mechanism: funds are placed on hold in `heldBalance` when a transaction requires customer verification or is escalated for review.
- **Rule-Based Fraud Detection & Risk Scoring Engine:**
  - 6 approved deterministic fraud rules evaluated synchronously on transaction creation.
  - Calculation of normalized composite Risk Score (0 to 100) using $\min(\text{totalRuleScore}, 100)$.
  - Mapping to 3 approved Risk Tiers (`LOW`: 0–30, `MEDIUM`: 31–70, `HIGH`: 71–100).
  - Explicit logging of triggered Fraud Reason Codes on transaction records.
- **Fraud Alert & Incident Management:**
  - In-app notification generation for flagged or blocked transactions.
  - Dedicated Admin Incident Review Queue for transactions marked `FLAGGED_FOR_REVIEW`.
  - Admin resolution actions: manual `APPROVE` or `REJECT` with mandatory resolution notes and audit tracking.
- **On-Demand Gemini AI Investigation Assistant:**
  - Backend-orchestrated service calling Gemini API exclusively on-demand when requested by an Admin.
  - Generation of natural-language case summaries and contextual investigation questions.
  - PII scrubbing and anonymization layer prior to calling Gemini.
  - Circuit breaker / graceful fallback when Gemini is offline.
- **Security & Auditability:**
  - Immutable audit log records for transaction decisions, admin reviews, and authentication events.
  - Input validation and sanitization on all endpoints.

---

## 5. Out of Scope

To preserve architectural clarity, avoid unnecessary dependencies, and adhere to strict project constraints, the following features are explicitly **OUT OF SCOPE**:

1. **Machine Learning & Statistical Model Training:**
   - No Python ML microservices, Scikit-learn, PyTorch, or TensorFlow.
   - No black-box automated weight learning; all rules and scoring parameters remain explicit, deterministic JavaScript.
2. **Real External Banking / Payment Gateway Integrations:**
   - No direct connection to real-world clearinghouses (Fedwire, ACH, SWIFT, NEFT, RTGS, UPI) or commercial gateways (Stripe, Razorpay, PayPal).
   - All balance operations are entirely simulated within an internal ledger.
3. **Complex Distributed Streaming Infrastructure:**
   - No Apache Kafka, RabbitMQ, Apache Flink, or Spark streaming clusters.
   - No microservices architecture; a clean, modular Node.js monolith with distinct domain services will be utilized.
4. **Blockchain / Smart Contracts:**
   - No distributed ledger, crypto wallets, or Web3 technologies.
5. **Native Mobile Applications:**
   - No iOS or Android native code (Swift, Kotlin, React Native). The frontend is a responsive web application built with React, Vite, and Tailwind CSS.
6. **Automated AI Decision Execution:**
   - Gemini will under no circumstances have the permission or capability to change transaction statuses or override engine decisions.
7. **Hardware Biometrics / Physical Location Sensors:**
   - No GPS telemetry or physical hardware authentication modules.

---

## 6. Users and Roles

FraudShield strictly enforces **2 user roles**:

```
+-----------------------------------------------------------------+
|                       FRAUDSHIELD USERS                         |
+-----------------------------------------------------------------+
          |                                             |
          v                                             v
+-------------------+                         +-------------------+
|     CUSTOMER      |                         |       ADMIN       |
|   (End-User)      |                         |  (Fraud Analyst)  |
+-------------------+                         +-------------------+
  - Register / Login                            - View Analyst Queue
  - Manage Wallet & Deposit                     - Inspect Flagged Cases
  - Manage Beneficiaries                        - View Rule Reasons
  - Initiate Transfers                          - Invoke Gemini AI Insights
  - View Own Transactions                       - Approve / Reject Reviews
  - View Fraud Alerts on Account                - View System Audit Logs
```

### 6.1 Role: `customer`
- **Description:** Registered end-user holding a simulated digital wallet balance who initiates transfer transactions to other accounts or beneficiaries.
- **Permissions:**
  - Create and manage their profile.
  - Maintain an address book of saved beneficiaries.
  - Add funds / deposit into their simulated wallet for testing.
  - Submit transfer transaction requests.
  - View their personal transaction history and current status.
  - Receive in-app alerts when their own transactions are flagged or blocked.
- **Restrictions:**
  - Cannot access the admin dashboard, review queues, audit logs, or other users' transaction data.
  - Cannot access Gemini AI investigation endpoints.

### 6.2 Role: `admin` (Fraud Analyst)
- **Description:** Authorized administrator and fraud analyst responsible for monitoring system-wide transaction risk, investigating suspicious activity, and taking manual review actions.
- **Permissions:**
  - Access the Admin / Fraud Analyst Dashboard.
  - View all transactions across the platform, filterable by risk tier, date, amount, and status.
  - Inspect detailed fraud rule breakdowns and triggered reason codes.
  - Request on-demand Gemini AI case summaries and investigation checklists on flagged transactions.
  - Submit final human determinations (`APPROVE` or `REJECT`) for review-tier transactions with mandatory audit notes.
  - View system-wide security audit logs and fraud alert logs.
- **Restrictions:**
  - Cannot alter deterministic rule code on the fly without formal deployment.
  - Cannot bypass audit logging during manual overrides.

---

## 7. Functional Requirements

### 7.1 Module: Authentication & User Management
- **FR-AUTH-01:** The system shall allow new customers to register using an email address, full name, phone number, and password.
- **FR-AUTH-02:** Passwords must be hashed using `bcrypt` (salt rounds >= 10) before persistence. Plaintext passwords must never be logged or stored.
- **FR-AUTH-03:** The system shall authenticate users via email and password, issuing a stateless JSON Web Token (JWT) containing user ID, role (`customer` or `admin`), and expiration timestamp.
- **FR-AUTH-04:** The system shall restrict endpoint access based strictly on user role (`customer` vs `admin`).
- **FR-AUTH-05:** The system shall allow users to retrieve and update their personal profile details (excluding balance and role).
- **FR-AUTH-06:** The system shall support secure password recovery via `/api/auth/forgot-password` and `/api/auth/reset-password`. Password reset tokens must be cryptographically generated (32-byte hex), hashed with SHA-256 before database persistence, and bounded by a 15-minute expiration window.
- **FR-AUTH-07:** The administrative system shall provide aggregated queue metrics (`/api/admin/reviews/stats`) reporting pending reviews, total screened transfers, settled clean, blocked risk, and active accounts.

### 7.2 Module: Simulated Digital Wallet & Beneficiary Management
- **FR-WAL-01:** Upon registration, each customer shall be automatically provisioned an internal simulated digital wallet.
- **FR-WAL-02:** The wallet shall maintain two distinct financial state fields:
  - `availableBalance`: Funds readily spendable (default simulated initial balance: ₹10,000).
  - `heldBalance`: Funds placed in escrow pending review (initial value: ₹0).
- **FR-WAL-03:** The system shall allow customers to perform simulated deposits ("Add Funds") into their `availableBalance` to facilitate scenario testing.
- **FR-WAL-04:** The system shall allow customers to add, view, and remove beneficiaries (recipient account identifier, nickname, creation timestamp).
- **FR-WAL-05:** The system shall record the exact timestamp when a beneficiary is added to evaluate beneficiary familiarity and age heuristics.

### 7.3 Module: Device & Session Capture
- **FR-DEV-01:** On every transaction request, the system shall capture client device metadata:
  - User-Agent header (browser, operating system).
  - Client IP address (or forwarded IP representation).
  - Client Device Identifier (persistent client token passed via request header `x-device-id`).
- **FR-DEV-02:** The system shall maintain a history of known device identifiers associated with each user account to detect new or unrecognized device logins and transactions.

> **Important Clarification:** The `x-device-id` value generated and persisted by the frontend is an application-level device identifier for fraud-rule evaluation. It is NOT a secure device fingerprint and must not be treated as proof of device identity.

### 7.4 Module: Transaction Processing Engine
- **FR-TX-01:** Customers shall initiate a transfer specifying recipient account/beneficiary, amount (in INR / ₹), and optional transfer note.
- **FR-TX-02:** The system shall validate transaction parameters (positive non-zero amount, sufficient sender `availableBalance`, active recipient account, valid sender identity).
- **FR-TX-03:** Upon passing baseline validation, the transaction shall be routed immediately into the Rule-Based Fraud Detection Engine before balance mutation.
- **FR-TX-04:** The transaction status and wallet balances shall be updated based on the engine outcome:
  - **If Risk Level = `LOW` (Score 0–30):**
    - Status: `APPROVED`.
    - Sender's `availableBalance` is debited by amount.
    - Recipient's `availableBalance` is credited by amount.
  - **If Risk Level = `MEDIUM` (Score 31–70):**
    - Status: `CUSTOMER_VERIFICATION_REQUIRED`.
    - Escrow Hold: Sender's `availableBalance` is debited by amount, and `heldBalance` is credited by amount.
    - Recipient balance is NOT modified (recipient receives ₹0).
    - Transaction does NOT require 24/7 admin availability and is NOT enqueued directly to Admin Review.
    - Customer is prompted to verify initiation via `POST /api/transactions/:id/confirm`. Upon confirmation and fresh security re-evaluation, acceptable transactions settle to `APPROVED` (held balance released to recipient); if elevated to HIGH, transaction is `BLOCKED` and escrow refunded to sender.
    - If customer reports unauthorized payment ("I Didn't Initiate This") via `POST /api/transactions/:id/escalate`, status transitions to `FLAGGED_FOR_REVIEW` and enqueues to the Admin Review Queue.
  - **If Risk Level = `HIGH` (Score 71–100):**
    - Status: `BLOCKED`.
    - Transaction execution is aborted; no balance is deducted from sender.

### 7.5 Module: Rule-Based Fraud Detection & Risk Scoring
- **FR-FRD-01:** The engine shall evaluate every incoming transaction against the 6 approved deterministic fraud rules.
- **FR-FRD-02:** Each rule that evaluates to `true` shall contribute a deterministic numerical score increment and a structured Reason Code to the transaction assessment.
- **FR-FRD-03:** The engine shall calculate the final composite Risk Score capped at 100:
  $$\text{finalScore} = \min(\text{totalRuleScore}, 100)$$
- **FR-FRD-04:** The engine shall map the composite score to the approved categorical Risk Levels:
  - `0 – 30`: `LOW` Risk (`APPROVED`)
  - `31 – 70`: `MEDIUM` Risk (`CUSTOMER_VERIFICATION_REQUIRED`)
  - `71 – 100`: `HIGH` Risk (`BLOCKED`)
- **FR-FRD-05:** The engine shall record the complete breakdown of triggered rules, raw score, and evaluation timestamp directly onto the transaction record for total explainability.

### 7.6 Module: Fraud Alerting
- **FR-ALT-01:** Whenever a transaction is classified as `CUSTOMER_VERIFICATION_REQUIRED`, `FLAGGED_FOR_REVIEW`, or `BLOCKED`, the system shall generate a structured Fraud Alert document.
- **FR-ALT-02:** Customers shall receive an in-app alert informing them that their transaction requires confirmation or has been blocked for security reasons, without exposing internal rule thresholds.
- **FR-ALT-03:** Admins shall see newly escalated alerts within their monitoring queue.

### 7.7 Module: Suspicious Transaction Review (Admin Workflow)
- **FR-REV-01:** The system shall provide Admins with a dedicated queue of escalated transactions currently in `FLAGGED_FOR_REVIEW` status (reported by customer as unauthorized or escalated for investigation). Normal medium-risk transactions do not burden the admin queue.
- **FR-REV-02:** Admins shall be able to inspect all case parameters:
  - Sender profile, account age, and past 30-day transaction history.
  - Recipient profile and beneficiary relationship history.
  - Triggered fraud rules and corresponding score contributions.
  - Device and network metadata.
- **FR-REV-03:** The Admin shall submit a final determination:
  - **Manual Approve:** Transaction transitions to `APPROVED`. Sender's `heldBalance` is debited, and recipient's `availableBalance` is credited.
  - **Manual Reject:** Transaction transitions to `REJECTED`. Sender's `heldBalance` is debited and returned to sender's `availableBalance`.
- **FR-REV-04:** Every Admin decision must mandate an analyst commentary note and record the Admin's user ID and timestamp.

### 7.8 Module: On-Demand Gemini AI Investigation Assistant
- **FR-GEM-01:** The backend shall provide an authenticated endpoint accessible exclusively to Admins to generate an AI Investigation Brief on-demand for a specified transaction.
- **FR-GEM-02:** Before dispatching data to Gemini, the backend shall sanitize the payload, stripping passwords, full account numbers, customer contact details, and raw PII.
- **FR-GEM-03:** The Gemini Assistant shall return a structured investigation report containing:
  - Plain-English Case Summary: Explanation of why the transaction scored into its risk tier.
  - Risk Pattern Breakdown: Contextual explanation of the interaction between triggered rules.
  - Recommended Investigation Checklist: Specific, actionable questions and verifications the analyst should perform before reaching a decision.
- **FR-GEM-04:** The AI prompt shall enforce strict temperature (0.2) to maintain factual consistency and prevent hallucination.
- **FR-GEM-05:** System Resiliency: If the Gemini API call fails, times out (> 5000ms), or returns an error, the backend shall log the error and return an informative message to the analyst without affecting transaction state or blocking the analyst from making a manual decision.
- **FR-GEM-06:** Gemini shall NEVER have the capability to make or override the final fraud decision.

### 7.9 Module: Audit Logging
- **FR-AUD-01:** The system shall record immutable audit log entries for all security-relevant events.
- **FR-AUD-02:** Audit entries shall capture: timestamp, actor ID, actor role, IP address, event type, target entity ID, and event summary/metadata.
- **FR-AUD-03:** Audit records shall be strictly read-only and cannot be updated or deleted via API.

---

## 8. Transaction Lifecycle Flow

The complete end-to-end lifecycle of a transaction through FraudShield is illustrated below:

```
[Customer]
    |
    | 1. Submit Transfer Request (Recipient, Amount in INR)
    v
[Backend API Layer]
    |
    | 2. Authenticate JWT & Authorize Role ('customer')
    | 3. Validate Payload Schema (Amount > 0, valid recipient)
    | 4. Validate Account State & Available Balance >= Amount
    v
[Fraud Detection Engine]
    |
    | 5. Gather Historical Signals (Velocity, Device, Beneficiary Age, Failures)
    | 6. Evaluate Approved 6 Rules Concurrently
    | 7. Sum Rule Weights -> finalScore = min(totalRuleScore, 100)
    | 8. Determine Risk Level & Action Tier
    v
+---------------------------------------------------------------------------------+
| DECISION BRANCH                                                                 |
+---------------------------------------------------------------------------------+
|  A. Score 0 - 30 (LOW RISK)                                                     |
|     -> Status: APPROVED                                                         |
|     -> Wallet: Sender availableBalance - Amount | Recipient availableBalance + Amount |
|     -> Response: 200 OK (Payment Successful)                                   |
+---------------------------------------------------------------------------------+
|  B. Score 31 - 70 (MEDIUM RISK)                                                 |
|     -> Status: CUSTOMER_VERIFICATION_REQUIRED                                   |
|     -> Escrow Hold: Sender availableBalance - Amount | Sender heldBalance + Amount |
|     -> Recipient balance unchanged                                              |
|     -> In-App Alert: Verification required; customer prompted to confirm        |
|     -> Response: 202 Accepted (Transaction Held in Escrow for Self-Verification)|
+---------------------------------------------------------------------------------+
|  C. Score 71 - 100 (HIGH RISK)                                                  |
|     -> Status: BLOCKED                                                          |
|     -> Wallet: Zero balance deducted from sender                                |
|     -> Alert Generated -> Logged to Security Audit                              |
|     -> Response: 400 Bad Request / 403 Forbidden (Blocked for Security)         |
+---------------------------------------------------------------------------------+
    |
    | [If Transaction is CUSTOMER_VERIFICATION_REQUIRED]
    v
[Customer Self-Verification Portal / Option]
    |
    +---> Option 1: Customer confirms payment ("Confirm Payment")
    |       -> POST /api/transactions/:id/confirm
    |       -> Atomic concurrency lock (status: 'PENDING')
    |       -> Fresh Pre-Settlement Fraud Re-Evaluation
    |       -> If Acceptable:
    |            Sender heldBalance - Amount | Recipient availableBalance + Amount
    |            Status: APPROVED (Settled)
    |       -> If Elevated to HIGH:
    |            Sender heldBalance - Amount | Sender availableBalance + Amount (Refunded)
    |            Status: BLOCKED
    |
    +---> Option 2: Customer reports unauthorized payment ("I Didn't Initiate This")
            -> POST /api/transactions/:id/escalate
            -> Status: FLAGGED_FOR_REVIEW
            v
[Admin / Fraud Analyst Review Queue (Escalated Only)]
    |
    | 9. Admin Inspects Escalated Case in Review Queue
    | 10. (Optional, On-Demand) Admin clicks "Analyze Case with Gemini"
    |       -> Backend Sanitizes Payload (Redacts PII)
    |       -> Calls Gemini API -> Returns Summary & Questions
    | 11. Admin Decides:
    |       -> MANUAL APPROVE:
    |            Sender heldBalance - Amount | Recipient availableBalance + Amount
    |            Status: APPROVED
    |       -> MANUAL REJECT:
    |            Sender heldBalance - Amount | Sender availableBalance + Amount
    |            Status: REJECTED
    | 12. Mandatory Resolution Notes (>= 10 chars) & Action Recorded in Immutable Audit Trail
    v
[Complete]
```

---

## 9. Fraud Detection: Approved Rule-Based Architecture

The Fraud Detection Engine operates deterministically. Instead of opaque neural networks, it applies heuristic evaluation functions against the transaction context and historical account activity.

### 9.1 Approved Fraud Rules & Weights (All Thresholds in INR / ₹)

| Rule Code | Rule Name | Evaluated Condition | Weight | Status |
| :--- | :--- | :--- | :---: | :---: |
| **RULE_AMT_EXTREME** | Abnormal Transaction Amount | Single transfer amount > **₹50,000** OR > **5x** the user's historical 30-day average transaction amount. | **+35** | **Approved** |
| **RULE_VELOCITY_HIGH** | High Transaction Velocity | More than **3 transactions** initiated by the same user account within a **10-minute** sliding window. | **+30** | **Approved** |
| **RULE_DEVICE_NEW** | Unrecognized Device / Session | Transaction initiated from a Device Identifier never previously registered to this customer account. | **+25** | **Approved** |
| **RULE_BENEFICIARY_NEW** | New Beneficiary High-Value Outflow | Transfer exceeding **₹10,000** sent to a beneficiary added to the account within the last **24 hours**. | **+30** | **Approved** |
| **RULE_FAIL_BURST** | Repeated Recent Failed Attempts | **3 or more failed attempts** (e.g., insufficient funds, bad requests) from this user within the last **15 minutes**. | **+20** | **Approved** |
| **RULE_DORMANT_SPIKE** | Dormant Account Sudden Spike | Transfer exceeding **₹5,000** from an account that had **0 transaction activity over the prior 30 days**. | **+25** | **Approved** |

### 9.2 Execution Mechanism
- Each rule is implemented as an isolated, pure heuristic evaluator receiving `(currentTransaction, userHistory, context)`.
- The engine executes rule evaluations synchronously in memory.
- If multiple rules trigger, their respective weights are summed together.
- The composite score is capped at `100` maximum.

---

## 10. Risk Scoring & Decision Tiers

### 10.1 Score Computation
$$\text{totalRuleScore} = \sum_{i \in \text{Triggered Rules}} \text{Weight}_i$$
$$\text{finalScore} = \min(\text{totalRuleScore}, 100)$$

### 10.2 Approved Risk Tiers and Decision Matrix

| Score Range | Risk Level | System Action | Transaction State | Balance Impact | Customer Experience |
| :---: | :---: | :---: | :---: | :--- | :--- |
| **0 – 30** | **LOW** | **APPROVE** | `APPROVED` | Immediate debit from sender `availableBalance` to recipient `availableBalance`. | Seamless instant payment execution. |
| **31 – 70** | **MEDIUM** | **VERIFY** | `CUSTOMER_VERIFICATION_REQUIRED` | Escrow Hold: Amount moved from sender `availableBalance` to `heldBalance`. Recipient not credited yet. | Payment held in escrow; customer self-verification prompt: *"Confirm Payment"* or *"I Didn't Initiate This"*. Escalate to Admin queue only if reported by customer. |
| **71 – 100** | **HIGH** | **BLOCK** | `BLOCKED` | No balance deduction. | Payment immediately halted; message: *"Transaction blocked due to high security risk. Please contact support."* |

---

## 11. Fraud Alerts

### 11.1 Customer-Facing Alerts
- When a transaction is `CUSTOMER_VERIFICATION_REQUIRED`, an in-app security notification is created prompting self-verification:
  - *Title:* "Payment Verification Required"
  - *Details:* Timestamp, Transaction ID, Amount (₹), Recipient.
  - *Actions:* Customer can self-confirm via "Confirm Payment" or escalate via "I Didn't Initiate This".
  - *Note:* Specific triggered rule names and internal points are omitted to prevent adversarial reverse-engineering.
- When a customer reports a transaction as unauthorized, it transitions to `FLAGGED_FOR_REVIEW` and notifies the customer that the payment is under analyst investigation.
- When a transaction is `BLOCKED`, an in-app alert is created notifying the customer to review their account security.

### 11.2 Admin / Internal Alerts
- Every `FLAGGED_FOR_REVIEW` (escalated by customer) or `BLOCKED` transaction generates a high-priority entry in the Admin Alert Queue with:
  - Severity indicator (`MEDIUM` or `HIGH`).
  - Aggregated triggered rule codes (`RULE_AMT_EXTREME`, `RULE_DEVICE_NEW`, etc.).
  - User ID, recipient ID, transaction amount (₹), and calculated risk score.
  - Status indicator: `NEW`, `INVESTIGATING`, `RESOLVED`.

---

## 12. Admin & Fraud Analyst Capabilities

The Admin portal provides full visibility and control over suspicious activity:

1. **Live Transaction Feed & Queue:**
   - Filter transactions by status (`FLAGGED_FOR_REVIEW`, `BLOCKED`, `APPROVED`), score range, date, and user.
2. **Case Detail Inspection View:**
   - Visual breakdown of the calculated Risk Score and individual rule contributions.
   - Comparative timeline of user's past 10 transactions.
   - Beneficiary relationship info (when added, past transfers to this recipient).
   - Device signature comparison (known devices vs current transaction device).
3. **On-Demand Gemini AI Co-Pilot Panel:**
   - An on-demand button: *"Analyze Case with Gemini"*.
   - Displays AI-generated narrative explanation and tailored investigation checklist.
4. **Resolution Action Modal:**
   - Decision selection: `APPROVE` or `REJECT`.
   - Mandatory field: `Resolution Reason / Notes` (minimum 10 characters).
   - Confirmation prompt preventing accidental overrides.
5. **Audit History Viewer:**
   - Chronological log of all admin actions, previous overrides, and system alerts.

---

## 13. Gemini AI Assistant: Role, Guardrails & Governance

### 13.1 Clear Boundaries of AI Authority
- **Zero Decision Authority:** Gemini is strictly an investigative advisory tool. Gemini can NEVER directly update database records, alter transaction states, or approve/block payments.
- **Deterministic Engine Authority:** The deterministic backend fraud engine remains the final authority.
- **Human-in-the-Loop Requirement:** All manual decisions on review-tier transactions require explicit action by an authenticated human Admin.

### 13.2 Responsibilities of the AI Assistant (On-Demand)
When queried on-demand by an Admin for a specific flagged transaction, the Gemini service shall:
1. **Explainability Synthesis:** Convert technical reason codes (e.g. `RULE_AMT_EXTREME + RULE_DEVICE_NEW`) into a coherent plain-English narrative of why the transaction triggered alarms.
2. **Contextual Risk Summary:** Provide a 3-4 sentence executive overview of the customer's behavioral deviation.
3. **Investigation Checklist:** Propose 3-5 specific questions or checks the analyst should perform before reaching a decision.

### 13.3 Data Privacy & Sensitive Information Scrubbing
To comply with financial data privacy standards, the backend will sanitize all payloads before dispatching to Gemini:

| Field | Treatment Prior to Gemini API Dispatch |
| :--- | :--- |
| **Passwords / Hash** | **NEVER included** in AI context. |
| **Account Numbers / IDs** | Anonymized to masked format (e.g. `ACC-***9821`). |
| **Customer Name / Email** | Replaced with synthetic alias (e.g. `Customer_X`, `Recipient_Y`). |
| **Raw IP Address** | Masked / general geographic region or anonymized token only. |
| **Transaction Amount & Delta** | Retained (e.g. Amount: ₹45,000; 30-day average: ₹3,500) for heuristic explanation. |
| **Triggered Rule Codes** | Retained verbatim for analysis. |

### 13.4 Resilience and Graceful Fallback
- The Gemini service is wrapped in a resilient error handler with an aggressive timeout (default: 5,000ms).
- If the Gemini API is unreachable, times out, or returns a 429/500 error:
  - The analyst UI displays an alert: *"AI Assistant is temporarily unavailable. All deterministic rule data and manual review tools remain fully operational."*
  - The core transaction processing pipeline and manual review workflows continue with zero interruption.

---

## 14. Security Requirements

- **SEC-01: Password Hashing:** Passwords must be hashed using `bcrypt` with a minimum of 10 salt rounds before storage.
- **SEC-02: Stateless JWT Authentication:** All non-public APIs require a valid Bearer token signed with a strong secret key (`JWT_SECRET`). Expiration must be enforced (e.g., 24 hours).
- **SEC-03: Role-Based Authorization:** Endpoints under `/api/admin/*` must strictly verify `role === 'admin'` via dedicated Express middleware.
- **SEC-04: Robust Request Validation:** All incoming request payloads must be strictly validated against predefined schemas (using express-validator or Joi) before reaching business logic. Unknown or malformed fields must be rejected with HTTP 400.
- **SEC-05: API Key Protection:** Gemini API credentials (`GEMINI_API_KEY`) and database credentials (`MONGODB_URI`) must reside strictly in backend environment variables (`.env`). They must never be checked into source control or exposed to the frontend.
- **SEC-06: Cross-Origin Resource Sharing (CORS):** The backend must strictly restrict CORS headers to the authorized frontend origin URL.
- **SEC-07: Rate Limiting:** Sensitive endpoints (login, registration, transaction submission) must implement IP-based rate limiting to thwart brute-force and DoS attacks.
- **SEC-08: Defense in Depth for Transactions:** Transaction processing logic must perform atomic balance verification and state transitions to prevent race conditions or double-spending.

---

## 15. Audit Logging

To maintain complete accountability, the system shall maintain an append-only `AuditLog` collection in MongoDB.

### 15.1 Auditable Events
The following events are strictly auditable:
- `AUTH_LOGIN_SUCCESS` & `AUTH_LOGIN_FAILURE`
- `TRANSACTION_INITIATED`
- `FRAUD_EVALUATION_COMPLETED` (records transaction ID, risk score, triggered rules)
- `TRANSACTION_FLAGGED` & `TRANSACTION_BLOCKED`
- `ADMIN_REVIEW_APPROVED` (records admin ID, transaction ID, resolution notes)
- `ADMIN_REVIEW_REJECTED` (records admin ID, transaction ID, resolution notes)
- `BENEFICIARY_ADDED` & `BENEFICIARY_REMOVED`
- `WALLET_DEPOSIT_COMPLETED` (records customer ID, amount, timestamp)
- `AI_ASSISTANT_ACCESSED` (records admin ID and target transaction ID)

### 15.2 Audit Record Structure
Each audit entry must contain:
- `timestamp`: ISO 8601 UTC timestamp.
- `eventType`: Standardized uppercase event code.
- `actorId`: User ID or system process responsible.
- `actorRole`: `customer`, `admin`, or `system`.
- `targetEntity`: Entity type (e.g. `Transaction`, `User`, `Beneficiary`, `Wallet`) and ID.
- `metadata`: JSON object containing event-specific parameters (excluding sensitive PII).
- `ipAddress`: Client IP address.

---

## 16. Non-Functional Requirements

### 16.1 Security
- Adherence to OWASP Top 10 web application security principles.
- Zero plaintext credential storage; zero sensitive data transmission to external LLMs.

### 16.2 Performance & Latency
- Rule engine evaluation time: **< 50 milliseconds** per transaction in-memory.
- Total end-to-end transaction API latency (excluding network transit): **< 250 milliseconds** for automated approve/block pathways.
- UI initial load time: **< 2 seconds** on standard broadband.

### 16.3 Reliability & Availability
- Core payment processing must maintain high availability independent of third-party AI services.
- Database operations must leverage transactional integrity or atomic updates where balance deductions occur.

### 16.4 Maintainability & Clean Code
- Clean separation of concerns following a layered architecture: `Routes -> Controllers -> Services -> Repositories/Models`.
- Consistent coding style, strict ESLint standards, and descriptive comments.
- Explicit documentation for every module, test case, and edge case.

### 16.5 Usability
- Responsive, clean UI designed with Tailwind CSS, offering intuitive visual cues:
  - Green badges for `APPROVED` / Low Risk.
  - Amber/Yellow badges for `FLAGGED_FOR_REVIEW` / Medium Risk.
  - Red badges for `BLOCKED` / High Risk.
- Human-readable error messages without leaking stack traces or sensitive internals.

### 16.6 Testability
- Unit test coverage for all fraud detection rules, scoring calculators, and utility services.
- Integration test coverage for authentication flows, transaction lifecycle, and role-based route guards using Jest and Supertest.

---

## 17. High-Level Architecture

The system architecture follows a clean decoupled MERN model where frontend and backend are completely autonomous applications communicating exclusively over RESTful JSON APIs.

```
+--------------------------------------------------------------------------+
|                            FRONTEND (React + Vite)                       |
|   - Customer Dashboard (Balance, Send Money, Beneficiaries, History)     |
|   - Admin Portal (Alert Queue, Case Review, On-Demand AI Assistant View) |
+--------------------------------------------------------------------------+
                                    |
                                    | HTTPS / JSON REST APIs (JWT Auth)
                                    v
+--------------------------------------------------------------------------+
|                         BACKEND API (Node.js + Express)                  |
|                                                                          |
|  [Middleware]: Auth (JWT), RBAC (2 roles), Request Validation, CORS       |
|                                                                          |
|  [Controllers & Services]:                                               |
|    - Auth Service                                                        |
|    - Wallet & Beneficiary Service (Available & Held balances)            |
|    - Transaction Processing Service (Escrow Hold logic)                  |
|    - Audit Service                                                       |
|                                                                          |
|  [Core Engine]:                                                          |
|    - Deterministic Rule-Based Fraud Detection Engine                     |
|        ├── 6 Heuristic Rule Evaluators                                   |
|        ├── Scoring Aggregator: min(totalRuleScore, 100)                  |
|        └── Risk Tier Classifier (Low / Medium / High)                    |
|                                                                          |
|  [AI Integration]:                                                       |
|    - On-Demand Gemini Assistant Service                                  |
|        ├── PII Redactor / Data Sanitizer                                 |
|        └── Resilient Client & Circuit Breaker                            |
+--------------------------------------------------------------------------+
               |                                            |
               v                                            v
+-----------------------------+              +-----------------------------+
|     DATABASE (MongoDB)      |              |      EXTERNAL AI API        |
|  - Users & Credentials      |              |   Google Gemini API         |
|  - Wallets & Beneficiaries  |              |   (On-Demand Advisory       |
|  - Transactions & Rules     |              |    Assistant Only)          |
|  - Alerts & Incident Reviews|              +-----------------------------+
|  - Immutable Audit Logs     |
+-----------------------------+
```

---

## 18. Approved System Modules

FraudShield is organized into the approved **11 discrete architectural modules**:

- **Module 1 — Project Setup & Infrastructure:** Directory scaffolds, linting, configuration, error handling framework.
- **Module 2 — Authentication & Authorization:** User registration, login, JWT middleware, 2-role RBAC (`customer`, `admin`).
- **Module 3 — Wallet, Accounts & Beneficiaries:** Simulated wallet balances (`availableBalance`, `heldBalance`), deposit funds, beneficiary management.
- **Module 4 — Device & Context Tracking:** Client device fingerprint header capture (`x-device-id`), IP recording, user device registry.
- **Module 5 — Rule-Based Fraud Detection Engine:** The 6 approved heuristic rules, scoring aggregation (`finalScore = min(totalRuleScore, 100)`), risk tier categorization.
- **Module 6 — Transaction Processing Engine:** Transaction initiation, synchronous fraud evaluation, atomic balance holds/updates, escrow logic.
- **Module 7 — Fraud Alert & Incident Review System:** Alert generation, admin review queue, manual approve/reject actions with fund release.
- **Module 8 — Gemini AI Investigation Assistant:** PII redaction, prompt engineering, Gemini API client, on-demand admin insight generation.
- **Module 9 — Audit Logging & Observability:** Security audit model, event dispatcher, query endpoints.
- **Module 10 — Frontend Customer Portal:** Wallet UI (available & held balance, add funds), send money modal, beneficiary manager, transaction history, customer alerts.
- **Module 11 — Frontend Analyst Dashboard:** Live transaction feed, risk breakdown visualization, escrow review queue, on-demand AI co-pilot modal.

---

## 19. Technology Constraints & Architecture Boundaries

To ensure the project remains robust, maintainable, explainable, and aligned with industrial standards without overengineering, the following strict technology constraints apply:

- **Stack Focus:** Pure MERN stack (MongoDB, Express, React, Node.js).
- **Backend:** Node.js + Express.js + MongoDB + Mongoose + JWT + bcrypt.
- **Frontend:** React + Vite + JavaScript + Tailwind CSS + Axios.
- **AI:** Gemini API through the backend only.
- **Testing:** Jest + Supertest.
- **No Python / Machine Learning:** No TensorFlow, PyTorch, Scikit-Learn, or Jupyter notebooks. The fraud engine must remain 100% deterministic JavaScript/Node.js.
- **No Heavy Distributed Streaming:** No Kafka, RabbitMQ, or Flink.
- **No Microservices:** The backend is a modular, well-structured monolith.
- **No Unnecessary Infrastructure:** No Redis, Docker Swarm, or Kubernetes clusters unless explicitly mandated.
- **Backend Isolation of AI:** Frontend must NEVER call Gemini directly. The `GEMINI_API_KEY` must never leave the backend environment.
- **Database Access Restriction:** Frontend must NEVER connect directly to MongoDB. All data access occurs through authenticated REST APIs.

---

## 20. Future Enhancements

The following features are recognized as valuable evolutions for post-v1.0 releases:
1. **Dynamic Rule Configuration Admin UI:** Allowing administrators to adjust rule weightings and thresholds from an admin settings screen without code redeployment.
2. **Customer Step-Up Multi-Factor Authentication (MFA / OTP):** When a transaction lands in `FLAGGED_FOR_REVIEW`, automatically triggering an email or SMS OTP to allow the legitimate customer to self-approve.
3. **Webhook Notifications:** Emitting event webhooks to external enterprise monitoring tools on high-risk blocks.
4. **Exportable Regulatory Compliance Reports:** Generating PDF / CSV audit reports of all blocked transactions and analyst reviews.

---

## 21. Very Important Development Rules

The development of FraudShield strictly adheres to the following 19 non-negotiable engineering principles:

1. **Do not invent requirements.**
2. **Do not invent APIs.**
3. **Do not invent database fields.**
4. **Do not invent business rules.**
5. **Do not invent roles.**
6. **Do not assume unspecified behavior.**
7. **If something is unclear, ask the stakeholder.**
8. **Do not start implementation until the documentation is approved.**
9. **Do not use ML for the initial fraud detection system.**
10. **Gemini is an investigation assistant, not the final fraud decision-maker.**
11. **Frontend and backend must remain separate.**
12. **The frontend must communicate with the backend through APIs.**
13. **Gemini credentials must remain on the backend.**
14. **Do not modify unrelated modules during future implementation.**
15. **Future implementation will happen module-by-module.**
16. **Each module will have its own implementation plan.**
17. **Each module will have its own edge-case document.**
18. **Each module will have test cases.**
19. **Each module must be tested before moving to the next module.**

---

## 22. Documentation-First Workflow

The engineering roadmap follows this strict chronological hierarchy. No phase may commence before the prior phase is reviewed and approved:

```
  [1] Software Requirements Specification (SRS) - docs/FraudShield_SRS.md  <-- APPROVED BASELINE
       ↓
  [2] Context Document (context.md)                                        <-- NEXT STAGE
       ↓
  [3] Overall Implementation Plan
       ↓
  [4] Module-wise Implementation Plans
       ↓
  [5] Module-wise Edge Cases
       ↓
  [6] Module-wise Test Cases
       ↓
  [7] Backend / Frontend Implementation (Module-by-Module)
       ↓
  [8] Module Testing (Jest / Supertest)
       ↓
  [9] Integration Testing
       ↓
  [10] Security Testing (Input validation, auth guards, PII redaction)
       ↓
  [11] Deployment Preparation
       ↓
  [12] Final Documentation & Runbooks
```

---

## 23. Stakeholder Approvals and Sign-off Log

The following formal decisions have been ratified by the stakeholder and baseline established:

| Decision Item | Ratified Decision | Status |
| :--- | :--- | :---: |
| **1. User Roles** | Strictly **2 roles**: `customer` and `admin`. | **Approved** |
| **2. Wallet Architecture** | **Simulated Digital Wallet** with `availableBalance`, `heldBalance`, transaction history, and test deposit capability. No real banking gateways. | **Approved** |
| **3. Fraud Rules & Weights** | **6 Deterministic Rules** using **INR (₹)** thresholds: `RULE_AMT_EXTREME` (+35), `RULE_VELOCITY_HIGH` (+30), `RULE_DEVICE_NEW` (+25), `RULE_BENEFICIARY_NEW` (+30), `RULE_FAIL_BURST` (+20), `RULE_DORMANT_SPIKE` (+25). Final score capped at 100: $\min(\text{totalRuleScore}, 100)$. | **Approved** |
| **4. Risk Levels** | `0–30` → **LOW** (`APPROVED`); `31–70` → **MEDIUM** (`CUSTOMER_VERIFICATION_REQUIRED` / Escrow Hold; escalates to `FLAGGED_FOR_REVIEW` upon customer report); `71–100` → **HIGH** (`BLOCKED`). | **Approved** |
| **5. Review Funds Handling** | **Option A — Escrow Hold**: Amount moved from `availableBalance` to `heldBalance` during self-verification or escalated review; settled upon customer confirmation or admin resolution. | **Approved** |
| **6. Gemini AI Assistant** | **Option A — On-Demand**: Invoked only when admin requests investigation brief. Cannot make or override final fraud decisions. | **Approved** |
| **7. Module Structure** | **11 Modules**: Modules 1 through 11 established as the foundation for upcoming implementation plans and test suites. | **Approved** |

---

## 24. Production Visual Architecture & Design Language (BizOS Visual Baseline)

### 24.1 Visual System & Editorial Palette
FraudShield adopts an editorial, clean geometric visual language inspired by modern operational systems (BizOS design philosophy). The visual architecture eliminates generic bright blue SaaS cliches, dark gamified aesthetics, emojis, excessive glassmorphism, and fake statistics.

- **Background Canvas (`bg`):** Pale mint / soft sage `#EDF6F1`
- **Primary Accent (`primary`):** Deep muted forest green `#285C4D` (hover: `#1d453a`, light: `#377764`)
- **Typography & Dark Elements (`dark`):** Charcoal / deep slate `#17211D`
- **Card Surfaces (`surface`):** Warm crisp white `#FAFCFA`
- **Subtle Containers / Tints (`soft`):** Soft sage/mint `#DCEBE4`
- **Borders & Dividers (`border`):** Soft green-gray `#D4E2DC`
- **Warning Indicator (`warning`):** Warm amber `#C89445` (for Medium Risk / `CUSTOMER_VERIFICATION_REQUIRED` / `FLAGGED_FOR_REVIEW`)
- **Danger / Block Indicator (`danger`):** Muted crimson `#B65D59` (for High Risk / `BLOCKED`)
- **Approved / Low Risk:** Primary deep forest green `#285C4D` or clean emerald `#2D7A58`
- **Restrained Elevation:** Minimal subtle drop shadows (`shadow-sm`), relying instead on crisp geometric borders (`border border-[#D4E2DC]`) and generous whitespace.
- **Editorial Typography:** High-contrast charcoal headings, tabular numerical figures, clean monospace for IDs and reason codes.
- **Iconography Standard:** Exclusively Lucide React SVG icons. Zero consumer emojis permitted across the entire application.

### 24.2 Modular Node.js Monolith Backend Architecture
The backend follows a strict modular structure decoupling the deterministic fraud engine, repositories, validators, and audit pipelines from controllers:

```
backend/src/
├── controllers/            # Thin HTTP controllers handling requests/responses
├── services/               # Orchestration and core domain services
├── repositories/           # Data access layer interfacing directly with Mongoose models
├── models/                 # Mongoose schema definitions
├── routes/                 # Express REST endpoint route definitions
├── middlewares/            # Auth, device context, rate-limiting, error handling
├── validators/             # Joi-based payload schemas and request validators
├── fraud/                  # Independent deterministic fraud detection subsystem
│   ├── rules/
│   │   ├── amountRule.js           # Rule 1: Extreme Amount (+35, RULE_AMT_EXTREME)
│   │   ├── velocityRule.js         # Rule 2: High Velocity (+30, RULE_VELOCITY_HIGH)
│   │   ├── deviceRule.js           # Rule 3: New Device (+25, RULE_DEVICE_NEW)
│   │   ├── beneficiaryRule.js      # Rule 4: New Beneficiary (+30, RULE_BENEFICIARY_NEW)
│   │   ├── failedAttemptsRule.js   # Rule 5: Failed Attempt Burst (+20, RULE_FAIL_BURST)
│   │   └── dormantAccountRule.js   # Rule 6: Dormant Account Spike (+25, RULE_DORMANT_SPIKE)
│   ├── fraudEngine.js              # Evaluates the 6 heuristic rules concurrently
│   ├── riskCalculator.js           # Computes finalScore = min(totalRuleScore, 100) & risk tiers
│   └── contextCollector.js         # Queries historical and behavioral telemetry
├── audit/                  # Audit log dispatcher and event recording
├── config/                 # Environment variables and database connectivity
├── utils/                  # Structured API response formatters and JWT helpers
└── tests/                  # Jest and Supertest test suites
```

### 24.3 Customer Self-Verification & Escalated Human-in-the-Loop Governance
Medium-risk transactions (score 31–70) use customer self-verification to eliminate 24/7 admin dependency:
- Funds are locked in sender `heldBalance` with status `CUSTOMER_VERIFICATION_REQUIRED`.
- Customer confirms payment (`POST /api/transactions/:id/confirm`) -> atomic lock (`PENDING`) -> pre-settlement re-screening -> settles to `APPROVED` (funds released to recipient) or blocks if elevated to `HIGH` (funds refunded to sender).
- If customer reports unauthorized payment (`POST /api/transactions/:id/escalate`) -> status becomes `FLAGGED_FOR_REVIEW`.
- Fraud analysts examine escalated transactions in the Admin Review Queue:
  - Inspect heuristic triggers, device telemetry, customer history, and optional Gemini co-pilot advisory briefings.
  - Explicit analyst sign-off requires a mandatory rationale note of $\ge 10$ characters stored immutably in system audit logs.
  - `APPROVE`: Transfers `heldBalance` directly to recipient's `availableBalance`.
  - `REJECT`: Refunds `heldBalance` back to sender's `availableBalance`.

### 24.4 Definition of Done Demo Scenarios
The implementation is verified against three standard end-to-end scenarios:
- **Scenario 1 (Low Risk - Instant Approval):**
  - Amount: ₹2,000 | Known device | Known beneficiary
  - Score: 0 / 100 | Risk Level: `LOW` | Status: `APPROVED`
  - Balance Impact: Sender `availableBalance` debited ₹2,000, recipient `availableBalance` credited ₹2,000.
- **Scenario 2 (Medium Risk - Customer Self-Verification & Escalation Flow):**
  - Amount: ₹15,000 | New device (`RULE_DEVICE_NEW` +25) | Additional risk factor
  - Score: 55 / 100 | Risk Level: `MEDIUM` | Status: `CUSTOMER_VERIFICATION_REQUIRED`
  - Balance Impact: Sender `availableBalance` debited, sender `heldBalance` credited. Recipient not credited yet.
  - Customer Action A (Self-Verification): Customer clicks "Confirm Payment" -> re-evaluated -> settles to `APPROVED`, transferring `heldBalance` to recipient `availableBalance`.
  - Customer Action B (Escalation): Customer clicks "I Didn't Initiate This" -> status transitions to `FLAGGED_FOR_REVIEW` -> enqueued into Admin Review Queue for manual analyst investigation and resolution (`APPROVE`/`REJECT`).
- **Scenario 3 (High Risk - Automatic Block):**
  - Amount: ₹60,000 (`RULE_AMT_EXTREME` +35) | New device (`RULE_DEVICE_NEW` +25) | New beneficiary (`RULE_BENEFICIARY_NEW` +30)
  - Score: 90 / 100 | Risk Level: `HIGH` | Status: `BLOCKED`
  - Balance Impact: Zero debit, zero credit. Alert logged. Explainability breakdown shows why it was blocked.

