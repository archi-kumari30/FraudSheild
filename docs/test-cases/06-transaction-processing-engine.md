# Module 6 Test Cases: Transaction Processing Engine
## Project: FraudShield — Real-Time Rule-Based Fraud Detection & Prevention Platform

---

### Document Information
- **Module ID:** `MOD-06`
- **Module Name:** Transaction Processing Engine
- **Document Path:** `docs/test-cases/06-transaction-processing-engine.md`
- **Version:** 1.0.0
- **Status:** Complete / Ready for Execution
- **Parent Documents (Sources of Truth):**
  - `docs/FraudShield_SRS.md`
  - `docs/context.md`
  - `docs/implementation-plan.md`
  - `docs/plan/06-transaction-processing-engine.md`
  - `docs/edge-cases/06-transaction-processing-engine.md`

---

## 1. Overview

This document specifies the integration and API test cases for **Module 6: Transaction Processing Engine**. It validates the complete transaction lifecycle, atomic balance mutations, escrow hold execution (`heldBalance`), double-spending protection, and adherence to deterministic fraud engine decisions.

---

## 2. Test Cases Specification

### TC-M6-001: Low-Risk Transaction Executes Immediately (`LOW` -> `APPROVED`)
- **Test Case ID:** `TC-M6-001`
- **Module ID:** `MOD-06`
- **Test Scenario:** A low-risk transfer (Score <= 30) is immediately approved and settles atomically.
- **Preconditions:**
  - Sender has `availableBalance = 10000`, `heldBalance = 0`.
  - Recipient has `availableBalance = 5000`.
  - Transfer parameters trigger 0 fraud rules (Score = 0).
- **Test Data:** `{ "recipientId": recipient._id, "amount": 1000 }`
- **Steps:**
  1. Send `POST /api/transactions` with test payload.
  2. Inspect response status and payload.
  3. Query sender and recipient wallet balances.
- **Expected Result:**
  - Status Code: `200 OK`
  - Response: `{ "status": "APPROVED", "riskScore": 0, "riskLevel": "LOW" }`
  - Sender `availableBalance` is `9000` (₹9,000); `heldBalance` is `0`.
  - Recipient `availableBalance` is `6000` (₹6,000).
- **Test Type:** API / Integration
- **Priority:** High
- **Status:** Not Run

---

### TC-M6-002: Medium-Risk Transaction Places Funds in Escrow (`MEDIUM` -> `FLAGGED_FOR_REVIEW`)
- **Test Case ID:** `TC-M6-002`
- **Module ID:** `MOD-06`
- **Test Scenario:** A medium-risk transfer (Score 31–70) transitions to `FLAGGED_FOR_REVIEW` and reserves funds in `heldBalance`.
- **Preconditions:**
  - Sender has `availableBalance = 20000`, `heldBalance = 0`.
  - Recipient has `availableBalance = 5000`.
  - Transfer parameters trigger `RULE_BENEFICIARY_NEW` (+30) and `RULE_DEVICE_NEW` (+25) -> Score = 55 (`MEDIUM`).
- **Test Data:** `{ "recipientId": newBeneficiary._id, "amount": 12000 }`
- **Steps:**
  1. Send `POST /api/transactions`.
  2. Inspect response and query wallets.
- **Expected Result:**
  - Status Code: `202 Accepted`
  - Response: `{ "status": "FLAGGED_FOR_REVIEW", "riskScore": 55, "riskLevel": "MEDIUM" }`
  - Sender `availableBalance` drops to `8000` (₹8,000).
  - Sender `heldBalance` increments to `12000` (₹12,000 in escrow).
  - Recipient `availableBalance` remains `5000` (untouched).
- **Test Type:** API / Integration
- **Priority:** Critical
- **Status:** Not Run

---

### TC-M6-003: High-Risk Transaction Is Immediately Blocked (`HIGH` -> `BLOCKED`)
- **Test Case ID:** `TC-M6-003`
- **Module ID:** `MOD-06`
- **Test Scenario:** A high-risk transfer (Score 71–100) is halted immediately with zero balance deduction.
- **Preconditions:**
  - Sender has `availableBalance = 60000`.
  - Transfer parameters trigger `RULE_AMT_EXTREME` (+35), `RULE_VELOCITY_HIGH` (+30), and `RULE_DEVICE_NEW` (+25) -> Score = 90 (`HIGH`).
- **Test Data:** `{ "recipientId": recipient._id, "amount": 55000 }`
- **Steps:**
  1. Send `POST /api/transactions`.
  2. Inspect response and verify sender balance.
- **Expected Result:**
  - Status Code: `400 Bad Request` or `403 Forbidden`
  - Response: `{ "status": "BLOCKED", "riskScore": 90, "riskLevel": "HIGH" }`
  - Sender `availableBalance` remains exactly `60000` (zero deduction).
  - Sender `heldBalance` remains `0`.
- **Test Type:** API / Security
- **Priority:** Critical
- **Status:** Not Run

---

### TC-M6-004: Insufficient Balance Rejection
- **Test Case ID:** `TC-M6-004`
- **Module ID:** `MOD-06`
- **Test Scenario:** Transfer amount exceeding available balance is rejected before fraud evaluation.
- **Preconditions:** Sender `availableBalance = 3000`.
- **Test Data:** `{ "recipientId": recipient._id, "amount": 5000 }`
- **Steps:**
  1. Send `POST /api/transactions`.
- **Expected Result:**
  - Status Code: `400 Bad Request`
  - Error: `"Insufficient available balance"`.
  - Zero database mutations.
- **Test Type:** API / Validation
- **Priority:** High
- **Status:** Not Run

---

### TC-M6-005: Concurrent Double-Spend Prevention Test
- **Test Case ID:** `TC-M6-005`
- **Module ID:** `MOD-06`
- **Test Scenario:** Two simultaneous transfer requests for ₹8,000 with available balance of ₹10,000.
- **Preconditions:** Sender `availableBalance = 10000`.
- **Test Data:** Two concurrent calls to `POST /api/transactions` with `amount: 8000`.
- **Steps:**
  1. Dispatch both requests concurrently using `Promise.all()`.
  2. Inspect both HTTP responses.
  3. Query final sender `availableBalance`.
- **Expected Result:**
  - Exactly one request succeeds (Status 200 or 202).
  - The other request fails with HTTP 400 (`"Insufficient available balance"`).
  - Sender `availableBalance` equals `2000` (never drops below 0).
- **Test Type:** Security / Concurrency
- **Priority:** Critical
- **Status:** Not Run

---

### TC-M6-006: Customer Queries Own Transaction History
- **Test Case ID:** `TC-M6-006`
- **Module ID:** `MOD-06`
- **Test Scenario:** Authenticated customer retrieves their past transactions.
- **Preconditions:** User has 3 completed transactions.
- **Test Data:** Header `Authorization: Bearer <customer_jwt>`
- **Steps:**
  1. Send `GET /api/transactions`.
- **Expected Result:**
  - Status Code: `200 OK`
  - Returns paginated list of 3 transactions.
  - Internal rule weights and scoring formulas are masked from customer view.
- **Test Type:** API
- **Priority:** Medium
- **Status:** Not Run
