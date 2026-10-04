# Module 7 Edge Cases: Fraud Alert & Incident Review System
## Project: FraudShield — Real-Time Rule-Based Fraud Detection & Prevention Platform

---

### Document Information
- **Module ID:** `MOD-07`
- **Module Name:** Fraud Alert & Incident Review System
- **Document Path:** `docs/edge-cases/07-fraud-alert-incident-review.md`
- **Version:** 1.0.0
- **Status:** Complete / Ready for Review
- **Parent Documents (Sources of Truth):**
  - `docs/FraudShield_SRS.md`
  - `docs/context.md`
  - `docs/implementation-plan.md`
  - `docs/plan/07-fraud-alert-incident-review.md`

---

## 1. Overview

This document specifies the technical and operational edge cases for **Module 7: Fraud Alert & Incident Review System**. It addresses alerting lifecycles, human-in-the-loop manual review concurrency, escrow settlement idempotency (`APPROVE` and `REJECT`), authorization boundaries, and state conflict handling.

---

## 2. Edge Cases Catalog

### EC-M7-001: Customer Attempting to Access Admin Review Endpoints
- **ID:** `EC-M7-001`
- **Scenario:** A customer user presents a valid JWT to `GET /api/admin/reviews` or `POST /api/admin/reviews/:id/resolve`.
- **Preconditions:** Authenticated user with `role: "customer"`.
- **Expected System Behavior:** Request is rejected with HTTP 403 Forbidden.
- **Handling / Mitigation:** `authorizeRole(['admin'])` middleware rejects the request before hitting review service.
- **Priority:** Critical
- **Security Impact:** Enforces administrative access control perimeter.

---

### EC-M7-002: Attempting to Resolve an Already-Resolved Transaction (Double Settlement)
- **ID:** `EC-M7-002`
- **Scenario:** An admin attempts to resolve a transaction that was already resolved (e.g., submitting `APPROVE` on a transaction whose `status` is already `APPROVED` or `REJECTED`).
- **Preconditions:** Transaction `status !== 'FLAGGED_FOR_REVIEW'`.
- **Expected System Behavior:** Request is rejected with HTTP 409 Conflict without modifying balances.
- **Handling / Mitigation:** Service checks current state. If `transaction.status !== 'FLAGGED_FOR_REVIEW'`, returns `{ success: false, error: { message: "Transaction has already been resolved", code: "ALREADY_RESOLVED" } }`.
- **Priority:** Critical
- **Security Impact:** Prevents duplicate escrow fund movement or double-crediting.

---

### EC-M7-003: Concurrent Review Actions by Multiple Admins (Race Condition)
- **ID:** `EC-M7-003`
- **Scenario:** Two fraud analysts open the same flagged case simultaneously; Analyst 1 clicks "Approve" at the exact moment Analyst 2 clicks "Reject".
- **Preconditions:** Two concurrent resolve requests for the same transaction ID.
- **Expected System Behavior:** Exactly one admin's action succeeds atomically; the second receives an HTTP 409 Conflict stating the case is already resolved.
- **Handling / Mitigation:** Atomic update condition:
  `Transaction.findOneAndUpdate({ _id: transactionId, status: 'FLAGGED_FOR_REVIEW' }, { status: newStatus, resolvedBy: adminId, ... })`. Only the first request matches the filter; the second returns null and responds with HTTP 409.
- **Priority:** Critical
- **Security Impact:** Guarantees single-resolution integrity in multi-analyst environments.

---

### EC-M7-004: Attempting to Resolve a BLOCKED Transaction
- **ID:** `EC-M7-004`
- **Scenario:** An admin attempts to manually approve a transaction whose initial deterministic decision was `BLOCKED`.
- **Preconditions:** Transaction `status: "BLOCKED"`.
- **Expected System Behavior:** Resolution is rejected with HTTP 400 Bad Request. Blocked transactions cannot be transitioned to approved.
- **Handling / Mitigation:** Service enforces that only transactions in `FLAGGED_FOR_REVIEW` (where funds are actively held in escrow) can enter resolution workflows.
- **Priority:** High
- **Security Impact:** Upholds strict deterministic fraud blocking policy.

---

### EC-M7-005: Manual Approval Escrow Settlement (`APPROVE`)
- **ID:** `EC-M7-005`
- **Scenario:** Admin approves a ₹15,000 transaction currently in review.
- **Preconditions:** Transaction in `FLAGGED_FOR_REVIEW`; sender has `heldBalance = ₹15,000`.
- **Expected System Behavior:**
  - Status updates to `APPROVED`.
  - Sender's `heldBalance` decrements by ₹15,000.
  - Recipient's `availableBalance` increments by ₹15,000.
  - Admin user ID, timestamp, and notes recorded on transaction.
- **Handling / Mitigation:** Atomic multi-field wallet updates execute cleanly.
- **Priority:** Critical
- **Security Impact:** Finalizes legitimate held payment safely.

---

### EC-M7-006: Manual Rejection Escrow Refund (`REJECT`)
- **ID:** `EC-M7-006`
- **Scenario:** Admin rejects a ₹15,000 transaction currently in review.
- **Preconditions:** Transaction in `FLAGGED_FOR_REVIEW`; sender has `heldBalance = ₹15,000`.
- **Expected System Behavior:**
  - Status updates to `REJECTED`.
  - Sender's `heldBalance` decrements by ₹15,000.
  - Sender's `availableBalance` increments by ₹15,000 (refunded).
  - Recipient balance is **NOT** credited.
  - Admin user ID, timestamp, and notes recorded on transaction.
- **Handling / Mitigation:** Atomically refunds sender wallet from held to available.
- **Priority:** Critical
- **Security Impact:** Restores customer funds upon confirmed fraud rejection.

---

### EC-M7-007: Missing or Insufficient Resolution Notes (< 10 Characters)
- **ID:** `EC-M7-007`
- **Scenario:** Admin attempts to resolve a case with empty notes `""` or trivial notes `"ok"`.
- **Preconditions:** Admin authenticated.
- **Expected System Behavior:** Request is rejected with HTTP 400 Bad Request before changing transaction state.
- **Handling / Mitigation:** Schema validator enforces `resolutionNotes.trim().length >= 10`.
- **Priority:** High
- **Security Impact:** Enforces compliance accountability for every manual override.

---

### EC-M7-008: Empty Review Queue Handling
- **ID:** `EC-M7-008`
- **Scenario:** Admin opens review queue when there are zero pending flagged transactions.
- **Preconditions:** Database contains 0 transactions with `status: 'FLAGGED_FOR_REVIEW'`.
- **Expected System Behavior:** API returns HTTP 200 with an empty data array `{ success: true, data: [] }` without errors.
- **Handling / Mitigation:** Normal query returns empty array.
- **Priority:** Low
- **Security Impact:** Normal operational state.

---

### EC-M7-009: Customer Attempting to Mark Another User's Alert as Read
- **ID:** `EC-M7-009`
- **Scenario:** Customer A attempts `PATCH /api/alerts/:id/read` where `:id` belongs to Customer B.
- **Preconditions:** Alert belongs to Customer B.
- **Expected System Behavior:** Request returns HTTP 404 Not Found or HTTP 403 Forbidden.
- **Handling / Mitigation:** Service updates alert matching both `_id: alertId` and `userId: req.user.id`.
- **Priority:** High
- **Security Impact:** Prevents IDOR unauthorized alert tampering.
