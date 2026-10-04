# Module 3 Edge Cases: Wallet, Accounts & Beneficiaries
## Project: FraudShield — Real-Time Rule-Based Fraud Detection & Prevention Platform

---

### Document Information
- **Module ID:** `MOD-03`
- **Module Name:** Wallet, Accounts & Beneficiaries
- **Document Path:** `docs/edge-cases/03-wallet-accounts-beneficiaries.md`
- **Version:** 1.0.0
- **Status:** Complete / Ready for Review
- **Parent Documents (Sources of Truth):**
  - `docs/FraudShield_SRS.md`
  - `docs/context.md`
  - `docs/implementation-plan.md`
  - `docs/plan/03-wallet-accounts-beneficiaries.md`

---

## 1. Overview

This document specifies the technical and business logic edge cases for **Module 3: Wallet, Accounts & Beneficiaries**. It covers simulated digital wallet provisioning, balance mutations, deposit thresholds, dual-balance integrity (`availableBalance` vs `heldBalance`), beneficiary constraints, concurrency, and address book validation.

---

## 2. Edge Cases Catalog

### EC-M3-001: Zero or Negative Deposit Amount
- **ID:** `EC-M3-001`
- **Scenario:** Customer attempts to deposit ₹0, -₹500, or a negative decimal via `POST /api/wallet/deposit`.
- **Preconditions:** Authenticated customer.
- **Expected System Behavior:** Request is rejected immediately with HTTP 400 Bad Request before database mutation.
- **Handling / Mitigation:** Input validator requires `amount > 0`. Error response: `{ success: false, error: { message: "Deposit amount must be greater than zero", code: "INVALID_AMOUNT" } }`.
- **Priority:** High
- **Security Impact:** Prevents balance drain attacks via negative deposit manipulation.

---

### EC-M3-002: Non-Numeric or Floating-Point Precision Vulnerability in Deposit
- **ID:** `EC-M3-002`
- **Scenario:** Customer supplies non-numeric payload (e.g., `"NaN"`, `null`, `Infinity`, or excessive decimals like `10.999999999`).
- **Preconditions:** Authenticated customer.
- **Expected System Behavior:** Request is rejected with HTTP 400 Bad Request or rounded to two decimal places safely.
- **Handling / Mitigation:** Validator checks `isNumeric()` and normalizes currency values to fixed 2 decimal places in INR.
- **Priority:** Medium
- **Security Impact:** Prevents mathematical calculation anomalies or NaN propagation in database ledgers.

---

### EC-M3-003: Extremely Large Deposit Amount Exceeding Sanity Caps
- **ID:** `EC-M3-003`
- **Scenario:** Customer attempts to deposit an unrealistic sum (e.g., ₹1,000,000,000,000) risking integer overflow.
- **Preconditions:** Authenticated customer.
- **Expected System Behavior:** Request is rejected with HTTP 400 Bad Request.
- **Handling / Mitigation:** Maximum per-transaction deposit cap enforced (e.g., max ₹10,000,000 per simulated deposit).
- **Priority:** Medium
- **Security Impact:** Prevents 64-bit integer / floating point boundary overflow.

---

### EC-M3-004: Customer Attempting to Query Another User's Wallet
- **ID:** `EC-M3-004`
- **Scenario:** Customer A attempts to query the wallet balance of Customer B by spoofing or passing parameters.
- **Preconditions:** Authenticated Customer A.
- **Expected System Behavior:** Customer A can only query `/api/wallet` for their own authenticated identity (`req.user.id`).
- **Handling / Mitigation:** Wallet endpoint does not take a `userId` query parameter from the client; it binds strictly to the verified `req.user.id` from JWT.
- **Priority:** Critical
- **Security Impact:** Guarantees total financial privacy between user accounts.

---

### EC-M3-005: Customer Adding Themselves as a Beneficiary
- **ID:** `EC-M3-005`
- **Scenario:** Customer attempts to add their own email or user ID as a saved beneficiary in their address book.
- **Preconditions:** Authenticated customer.
- **Expected System Behavior:** Request is rejected with HTTP 400 Bad Request.
- **Handling / Mitigation:** Beneficiary service explicitly checks `recipientId !== currentUserId`. Returns: `{ success: false, error: { message: "Cannot add yourself as a beneficiary", code: "SELF_BENEFICIARY_PROHIBITED" } }`.
- **Priority:** High
- **Security Impact:** Prevents circular self-transfer fraud loops.

---

### EC-M3-006: Adding a Non-Existent User as a Beneficiary
- **ID:** `EC-M3-006`
- **Scenario:** Customer attempts to add an email or account ID that does not exist in the `users` collection.
- **Preconditions:** Authenticated customer.
- **Expected System Behavior:** Request is rejected with HTTP 404 Not Found.
- **Handling / Mitigation:** Beneficiary service queries user directory before saving. Returns `{ success: false, error: { message: "Recipient user not found", code: "RECIPIENT_NOT_FOUND" } }`.
- **Priority:** Medium
- **Security Impact:** Prevents orphaned beneficiary records.

---

### EC-M3-007: Adding a Duplicate Beneficiary
- **ID:** `EC-M3-007`
- **Scenario:** Customer attempts to add a recipient who already exists in their saved beneficiary list.
- **Preconditions:** Beneficiary already recorded for this `{ userId, recipientAccountId }`.
- **Expected System Behavior:** Request is rejected with HTTP 409 Conflict.
- **Handling / Mitigation:** Beneficiary model compound unique index on `{ userId: 1, recipientAccountId: 1 }` prevents duplicate records. Service returns `{ success: false, error: { message: "Beneficiary already added", code: "BENEFICIARY_EXISTS" } }`.
- **Priority:** Low
- **Security Impact:** Maintains clean address book integrity.

---

### EC-M3-008: Deleting a Beneficiary Involving Active Pending Reviews
- **ID:** `EC-M3-008`
- **Scenario:** Customer attempts to delete a beneficiary while a transaction sent to that recipient is currently in `FLAGGED_FOR_REVIEW`.
- **Preconditions:** Beneficiary exists; an associated transaction is pending review.
- **Expected System Behavior:** Beneficiary deletion removes the recipient from the customer's active address book without breaking historical transaction references.
- **Handling / Mitigation:** Transactions store `recipientId` independently as a direct reference to the `User` model rather than relying on the beneficiary document. Beneficiary deletion succeeds cleanly without impacting the pending transaction ledger.
- **Priority:** Medium
- **Security Impact:** Ensures data integrity and historical explainability.

---

### EC-M3-009: Unauthorized Deletion of Another User's Beneficiary
- **ID:** `EC-M3-009`
- **Scenario:** Customer A attempts `DELETE /api/beneficiaries/:id` where `:id` belongs to Customer B.
- **Preconditions:** Beneficiary belongs to Customer B.
- **Expected System Behavior:** Request is rejected with HTTP 404 Not Found or HTTP 403 Forbidden.
- **Handling / Mitigation:** Service queries with `{ _id: beneficiaryId, userId: req.user.id }`. If not found, returns HTTP 404/403.
- **Priority:** High
- **Security Impact:** Prevents IDOR (Insecure Direct Object Reference) vulnerabilities.

---

### EC-M3-010: Concurrent Deposit Requests (Race Conditions)
- **ID:** `EC-M3-010`
- **Scenario:** Multiple deposit requests are dispatched simultaneously for the same user account.
- **Preconditions:** Authenticated customer.
- **Expected System Behavior:** All deposits are credited accurately; final balance equals the exact sum of all successful deposits.
- **Handling / Mitigation:** Wallet balance updates utilize MongoDB atomic operator `$inc: { availableBalance: amount }` rather than read-then-write in application memory.
- **Priority:** High
- **Security Impact:** Guarantees ledger balance consistency under high concurrency.

---

### EC-M3-011: Currency Formatting and Consistency Check (INR / ₹)
- **ID:** `EC-M3-011`
- **Scenario:** Request payload attempts to specify an unauthorized currency (e.g., `currency: "USD"`).
- **Preconditions:** Authenticated customer.
- **Expected System Behavior:** System strictly enforces `currency: "INR"`. Non-INR values are rejected or forced to INR.
- **Handling / Mitigation:** Wallet schema hardcodes `currency = 'INR'`.
- **Priority:** Low
- **Security Impact:** Enforces single-currency domestic payment scope.
