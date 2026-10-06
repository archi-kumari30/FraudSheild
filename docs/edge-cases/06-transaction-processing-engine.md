# Module 6 Edge Cases: Transaction Processing Engine
## Project: FraudShield — Real-Time Rule-Based Fraud Detection & Prevention Platform

---

### Document Information
- **Module ID:** `MOD-06`
- **Module Name:** Transaction Processing Engine
- **Document Path:** `docs/edge-cases/06-transaction-processing-engine.md`
- **Version:** 1.0.0
- **Status:** Complete / Ready for Review
- **Parent Documents (Sources of Truth):**
  - `docs/FraudShield_SRS.md`
  - `docs/context.md`
  - `docs/implementation-plan.md`
  - `docs/plan/06-transaction-processing-engine.md`

---

## 1. Overview

This document specifies the technical, financial, and state machine edge cases for **Module 6: Transaction Processing Engine**. It covers double-spending prevention, atomic balance operations, escrow reservation (`heldBalance`), concurrency conflicts, and lifecycle synchronization with the deterministic fraud engine decisions.

---

## 2. Edge Cases Catalog

### EC-M6-001: Insufficient Available Balance at Initiation
- **ID:** `EC-M6-001`
- **Scenario:** Customer has `availableBalance = ₹5,000` and `heldBalance = ₹2,000` (Total ₹7,000) and attempts to initiate a transfer of ₹6,000.
- **Preconditions:** `availableBalance < transferAmount`.
- **Expected System Behavior:** Request is rejected immediately with HTTP 400 Bad Request before fraud evaluation or balance mutation. `heldBalance` is completely ignored for spending eligibility.
- **Handling / Mitigation:** Service checks `if (wallet.availableBalance < amount) return error`. Returns `{ success: false, error: { message: "Insufficient available balance", code: "INSUFFICIENT_FUNDS" } }`.
- **Priority:** Critical
- **Security Impact:** Prevents overdrafts and spending of escrowed funds.

---

### EC-M6-002: Double-Spending Attempt via Concurrent API Submissions
- **ID:** `EC-M6-002`
- **Scenario:** Customer has `availableBalance = ₹10,000`. Two concurrent `POST /api/transactions` requests for ₹8,000 each are dispatched at the exact same millisecond.
- **Preconditions:** Sender has sufficient balance for one, but not both transfers.
- **Expected System Behavior:** Exactly one transaction succeeds (or is held in review); the second transaction fails with HTTP 400 Insufficient Funds. Final balance is non-negative (₹2,000).
- **Handling / Mitigation:** Atomic update condition uses MongoDB query:
  `Wallet.findOneAndUpdate({ userId: senderId, availableBalance: { $gte: amount } }, { $inc: { availableBalance: -amount } })`. The second concurrent request fails the `$gte` condition and is aborted cleanly.
- **Priority:** Critical
- **Security Impact:** Eliminates financial race conditions and double-spending.

---

### EC-M6-003: Verification Tier Transaction (`CUSTOMER_VERIFICATION_REQUIRED`) Escrow Hold Execution
- **ID:** `EC-M6-003`
- **Scenario:** Customer initiates transfer of ₹15,000 with `availableBalance = ₹20,000` and `heldBalance = ₹0`. Fraud engine returns Score = 55 (`MEDIUM` Risk).
- **Preconditions:** Fraud evaluation returns `MEDIUM`.
- **Expected System Behavior:**
  - Transaction status set to `CUSTOMER_VERIFICATION_REQUIRED`.
  - Sender's `availableBalance` decrements from ₹20,000 to ₹5,000.
  - Sender's `heldBalance` increments from ₹0 to ₹15,000.
  - Recipient balance is **NOT** credited.
  - Response returns HTTP 202 Accepted with status `CUSTOMER_VERIFICATION_REQUIRED`.
- **Handling / Mitigation:** Escrow reservation logic atomically executes `$inc: { availableBalance: -amount, heldBalance: +amount }` on sender wallet.
- **Priority:** Critical
- **Security Impact:** Locks funds in escrow so the sender cannot withdraw or spend them while self-verification is pending.

---

### EC-M6-004: Blocked Tier Transaction (`BLOCKED`) Execution
- **ID:** `EC-M6-004`
- **Scenario:** Customer initiates transfer triggering high risk (Score = 85, `HIGH` Risk).
- **Preconditions:** Fraud evaluation returns `HIGH`.
- **Expected System Behavior:**
  - Transaction status set to `BLOCKED`.
  - Sender's `availableBalance` is **NOT** deducted (remains unchanged).
  - Sender's `heldBalance` is **NOT** modified.
  - Recipient balance is **NOT** modified.
  - Response returns HTTP 400 Bad Request / 403 Forbidden stating transaction was blocked for security.
- **Handling / Mitigation:** Transaction controller catches `HIGH` risk, logs transaction as `BLOCKED`, and bypasses all wallet balance mutations.
- **Priority:** Critical
- **Security Impact:** Prevents execution of high-risk fraudulent transactions.

---

### EC-M6-005: Low-Risk Approved Transaction (`APPROVED`) Instant Settlement
- **ID:** `EC-M6-005`
- **Scenario:** Normal transfer of ₹1,000 triggering Score = 0 (`LOW` Risk).
- **Preconditions:** Sender `availableBalance = ₹10,000`; Recipient `availableBalance = ₹5,000`.
- **Expected System Behavior:**
  - Status set to `APPROVED`.
  - Sender `availableBalance` becomes ₹9,000.
  - Recipient `availableBalance` becomes ₹6,000.
  - Response returns HTTP 200 OK with status `APPROVED`.
- **Handling / Mitigation:** Atomic balance settlement debits sender and credits recipient.
- **Priority:** High
- **Security Impact:** Seamless, instantaneous payment execution.

---

### EC-M6-006: Self-Transfer Attempt (Sender ID Equals Recipient ID)
- **ID:** `EC-M6-006`
- **Scenario:** Customer sends a transfer specifying their own account ID or email as the recipient.
- **Preconditions:** Sender ID == Recipient ID.
- **Expected System Behavior:** Request is rejected with HTTP 400 Bad Request before wallet or fraud processing.
- **Handling / Mitigation:** Controller checks `if (senderId.toString() === recipientId.toString()) return 400`.
- **Priority:** High
- **Security Impact:** Prevents circular self-transfers that pollute fraud velocity metrics.

---

### EC-M6-007: Duplicate Submission Idempotency (Rapid Multi-Click)
- **ID:** `EC-M6-007`
- **Scenario:** User double-clicks "Submit Transfer" button rapidly in browser, issuing identical duplicate POST requests within 50 milliseconds.
- **Preconditions:** Two identical payloads dispatched in rapid succession.
- **Expected System Behavior:** Only one transaction is processed; the rapid duplicate is detected by short-interval rate limiter or idempotency token.
- **Handling / Mitigation:** Debouncing on client + backend velocity check / recent identical submission lock prevents duplicate transactions.
- **Priority:** High
- **Security Impact:** Protects against accidental multiple debits.

---

### EC-M6-008: Database Error During Recipient Balance Credit
- **ID:** `EC-M6-008`
- **Scenario:** Sender `availableBalance` has been debited, but a database failure or network disconnect occurs before recipient `availableBalance` can be credited.
- **Preconditions:** Partial database failure during two-legged transaction.
- **Expected System Behavior:** System must maintain ledger consistency; sender funds must not vanish.
- **Handling / Mitigation:** Mongoose multi-document transactions (via replica set session) or compensating rollback logic refunds sender `availableBalance` if recipient credit fails, marking transaction `FAILED`.
- **Priority:** Critical
- **Security Impact:** Prevents money loss and financial discrepancy.

---

### EC-M6-009: Customer Confirms Self-Verification Payment with Pre-Settlement Re-Screening
- **ID:** `EC-M6-009`
- **Scenario:** Customer clicks "Confirm Payment" on a transaction in `CUSTOMER_VERIFICATION_REQUIRED`. Request sent to `POST /api/transactions/:id/confirm`.
- **Preconditions:** Transaction `status === 'CUSTOMER_VERIFICATION_REQUIRED'`; user is the sender; sender has sufficient `heldBalance`.
- **Expected System Behavior:**
  - Status transitions atomically to `PENDING` (concurrency guard).
  - Fresh pre-settlement fraud rule evaluation runs.
  - Risk score remains acceptable (<= 70).
  - Sender `heldBalance` decremented by amount; Recipient `availableBalance` credited by amount.
  - Transaction status becomes `APPROVED`.
  - Response returns HTTP 200 with `{ status: 'APPROVED' }`.
- **Handling / Mitigation:** Atomic update guard and pre-settlement re-screen in `transactionService.confirmTransaction`.
- **Priority:** Critical
- **Security Impact:** Eliminates 24/7 admin bottleneck while ensuring fresh security validation prior to settlement.

---

### EC-M6-010: Pre-Settlement Re-Screening Elevates Risk to HIGH upon Confirmation
- **ID:** `EC-M6-010`
- **Scenario:** Customer confirms a payment, but background activity (e.g., velocity burst or concurrent malicious attempts) causes fresh rule evaluation to score >= 71 (`HIGH` risk).
- **Preconditions:** Transaction in `CUSTOMER_VERIFICATION_REQUIRED`; fresh fraud evaluation returns `HIGH`.
- **Expected System Behavior:**
  - Transaction status transitions to `BLOCKED`.
  - Held funds in sender's `heldBalance` are refunded back to sender's `availableBalance`.
  - Recipient receives ₹0.
  - Security audit and alert logged.
  - Response returns `{ status: 'BLOCKED' }`.
- **Handling / Mitigation:** Escrow refund logic in `confirmTransaction` returns held funds to availableBalance upon high-risk elevation.
- **Priority:** Critical
- **Security Impact:** Prevents fraudulent funds settlement even if the confirmation action was attempted.

---

### EC-M6-011: Concurrent Double-Click on Confirm Payment Button
- **ID:** `EC-M6-011`
- **Scenario:** Customer rapidly clicks "Confirm Payment" multiple times within milliseconds.
- **Preconditions:** Two concurrent `POST /api/transactions/:id/confirm` requests.
- **Expected System Behavior:** Only the first request matches `{ _id: transactionId, senderId: userId, status: 'CUSTOMER_VERIFICATION_REQUIRED' }` and transitions to `PENDING`. The second request fails with HTTP 400 (`"Transaction is not awaiting customer verification"`).
- **Handling / Mitigation:** Atomic filter in `Transaction.findOneAndUpdate` guarantees strict idempotency.
- **Priority:** High
- **Security Impact:** Prevents duplicate settlement or race condition vulnerabilities.

---

### EC-M6-012: Customer Escalates Unauthorized Payment ("I Didn't Initiate This")
- **ID:** `EC-M6-012`
- **Scenario:** Customer spots an unrecognized transaction in `CUSTOMER_VERIFICATION_REQUIRED` and clicks "I Didn't Initiate This". Request dispatched to `POST /api/transactions/:id/escalate`.
- **Preconditions:** Transaction `status === 'CUSTOMER_VERIFICATION_REQUIRED'`; user is the sender.
- **Expected System Behavior:**
  - Transaction status transitions atomically to `FLAGGED_FOR_REVIEW`.
  - Held balance remains safely locked in sender's `heldBalance` (recipient gets ₹0).
  - Transaction is enqueued in the Admin Review Queue (`GET /api/admin/reviews`).
  - High-priority security alert generated.
  - Response returns HTTP 200 with `{ status: 'FLAGGED_FOR_REVIEW' }`.
- **Handling / Mitigation:** Ownership check `senderId === user._id` and atomic transition to `FLAGGED_FOR_REVIEW`.
- **Priority:** Critical
- **Security Impact:** Empowers customers to immediately quarantine unauthorized transactions for expert human investigation.
