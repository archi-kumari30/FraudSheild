# Module 7 Test Cases: Fraud Alert & Incident Review System
## Project: FraudShield — Real-Time Rule-Based Fraud Detection & Prevention Platform

---

### Document Information
- **Module ID:** `MOD-07`
- **Module Name:** Fraud Alert & Incident Review System
- **Document Path:** `docs/test-cases/07-fraud-alert-incident-review.md`
- **Version:** 1.0.0
- **Status:** Complete / Ready for Execution
- **Parent Documents (Sources of Truth):**
  - `docs/FraudShield_SRS.md`
  - `docs/context.md`
  - `docs/implementation-plan.md`
  - `docs/plan/07-fraud-alert-incident-review.md`
  - `docs/edge-cases/07-fraud-alert-incident-review.md`

---

## 1. Overview

This document specifies the integration and API test cases for **Module 7: Fraud Alert & Incident Review System**. It covers alert generation, admin review queue queries, human-in-the-loop manual resolutions, and escrow balance settlement.

---

## 2. Test Cases Specification

### TC-M7-001: Automatic Alert Generation on Flagged Transaction
- **Test Case ID:** `TC-M7-001`
- **Module ID:** `MOD-07`
- **Test Scenario:** A transaction marked `FLAGGED_FOR_REVIEW` generates an alert in the `alerts` collection.
- **Preconditions:** Transaction created and flagged in Module 6.
- **Test Data:** Transaction ID of flagged transaction.
- **Steps:**
  1. Complete a flagged transaction flow.
  2. Query `alerts` collection for the sender user ID.
- **Expected Result:**
  - Alert exists with `severity: "MEDIUM"`.
  - Title indicates transaction under review.
  - `isRead: false`.
- **Test Type:** Integration
- **Priority:** High
- **Status:** Not Run

---

### TC-M7-002: Customer Queries Own Alerts (`GET /api/alerts`)
- **Test Case ID:** `TC-M7-002`
- **Module ID:** `MOD-07`
- **Test Scenario:** Customer retrieves their alerts and marks an alert as read.
- **Preconditions:** User has 1 unread alert.
- **Test Data:** Header `Authorization: Bearer <customer_jwt>`
- **Steps:**
  1. Send `GET /api/alerts`.
  2. Send `PATCH /api/alerts/:alertId/read`.
- **Expected Result:**
  - `GET` returns list containing the alert.
  - `PATCH` returns status 200; `isRead` updates to `true`.
- **Test Type:** API
- **Priority:** Medium
- **Status:** Not Run

---

### TC-M7-003: Admin Views Pending Review Queue (`GET /api/admin/reviews`)
- **Test Case ID:** `TC-M7-003`
- **Module ID:** `MOD-07`
- **Test Scenario:** Authenticated admin queries the pending review queue.
- **Preconditions:** Authenticated admin; 2 transactions in `FLAGGED_FOR_REVIEW` status.
- **Test Data:** Header `Authorization: Bearer <admin_jwt>`
- **Steps:**
  1. Send `GET /api/admin/reviews`.
- **Expected Result:**
  - Status Code: `200 OK`
  - Returns array of 2 pending cases with full fraud rule details and sender/recipient info.
- **Test Type:** API / Admin
- **Priority:** High
- **Status:** Not Run

---

### TC-M7-004: Customer Blocked from Admin Review Queue
- **Test Case ID:** `TC-M7-004`
- **Module ID:** `MOD-07`
- **Test Scenario:** Customer attempts `GET /api/admin/reviews`.
- **Preconditions:** Authenticated user with `role: "customer"`.
- **Test Data:** Header `Authorization: Bearer <customer_jwt>`
- **Steps:**
  1. Send `GET /api/admin/reviews`.
- **Expected Result:**
  - Status Code: `403 Forbidden`
  - Error: `"Access denied: insufficient permissions"`.
- **Test Type:** Security
- **Priority:** Critical
- **Status:** Not Run

---

### TC-M7-005: Admin Manual Approve Settles Escrow Funds
- **Test Case ID:** `TC-M7-005`
- **Module ID:** `MOD-07`
- **Test Scenario:** Admin approves a review case; escrow funds move to recipient.
- **Preconditions:**
  - Transaction #101 in `FLAGGED_FOR_REVIEW` for ₹15,000.
  - Sender `heldBalance = 15000`. Recipient `availableBalance = 5000`.
- **Test Data:** `{ "decision": "APPROVE", "resolutionNotes": "Verified user identity and authorized transaction via phone confirmation." }`
- **Steps:**
  1. Send `POST /api/admin/reviews/101/resolve` with admin token.
  2. Inspect response.
  3. Query sender and recipient wallets.
- **Expected Result:**
  - Status Code: `200 OK`
  - Transaction status updates to `APPROVED`.
  - Sender `heldBalance` decrements from ₹15,000 to `0`.
  - Recipient `availableBalance` increments from ₹5,000 to `20000` (₹20,000).
- **Test Type:** API / Integration
- **Priority:** Critical
- **Status:** Not Run

---

### TC-M7-006: Admin Manual Reject Refunds Escrow Funds to Sender
- **Test Case ID:** `TC-M7-006`
- **Module ID:** `MOD-07`
- **Test Scenario:** Admin rejects a review case; escrow funds are refunded to sender.
- **Preconditions:**
  - Transaction #102 in `FLAGGED_FOR_REVIEW` for ₹10,000.
  - Sender `availableBalance = 5000`, `heldBalance = 10000`. Recipient `availableBalance = 2000`.
- **Test Data:** `{ "decision": "REJECT", "resolutionNotes": "Suspicious rapid beneficiary transfer; customer confirmed unauthorized." }`
- **Steps:**
  1. Send `POST /api/admin/reviews/102/resolve` with admin token.
  2. Inspect response and query wallets.
- **Expected Result:**
  - Status Code: `200 OK`
  - Transaction status updates to `REJECTED`.
  - Sender `heldBalance` drops to `0`.
  - Sender `availableBalance` increments to `15000` (₹15,000 refunded).
  - Recipient balance remains `2000` (untouched).
- **Test Type:** API / Integration
- **Priority:** Critical
- **Status:** Not Run

---

### TC-M7-007: Duplicate Resolution Attempt Rejection
- **Test Case ID:** `TC-M7-007`
- **Module ID:** `MOD-07`
- **Test Scenario:** Attempting to resolve an already-resolved transaction fails.
- **Preconditions:** Transaction #101 already resolved in TC-M7-005.
- **Test Data:** Second resolve payload for Transaction #101.
- **Steps:**
  1. Send `POST /api/admin/reviews/101/resolve`.
- **Expected Result:**
  - Status Code: `409 Conflict`
  - Message: `"Transaction has already been resolved"`.
  - Wallet balances remain untouched.
- **Test Type:** API / Security
- **Priority:** High
- **Status:** Not Run

---

### TC-M7-008: Missing Resolution Notes Validation (< 10 Characters)
- **Test Case ID:** `TC-M7-008`
- **Module ID:** `MOD-07`
- **Test Scenario:** Admin attempts to resolve without sufficient explanation notes.
- **Preconditions:** Transaction in `FLAGGED_FOR_REVIEW`.
- **Test Data:** `{ "decision": "APPROVE", "resolutionNotes": "looks ok" }` (8 chars)
- **Steps:**
  1. Send `POST /api/admin/reviews/:id/resolve`.
- **Expected Result:**
  - Status Code: `400 Bad Request`
  - Error: `"Resolution notes must be at least 10 characters long"`.
- **Test Type:** Validation
- **Priority:** High
- **Status:** Not Run
