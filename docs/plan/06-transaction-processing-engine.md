# Module 6 Implementation Plan: Transaction Processing Engine
## Project: FraudShield — Real-Time Rule-Based Fraud Detection & Prevention Platform

---

### Document Information
- **Module ID:** `MOD-06`
- **Module Name:** Transaction Processing Engine
- **Document Path:** `docs/plan/06-transaction-processing-engine.md`
- **Version:** 1.0.0
- **Status:** Pending Stakeholder Approval
- **Parent Documents (Sources of Truth):**
  - `docs/FraudShield_SRS.md` (Approved v1.0.0)
  - `docs/context.md` (Approved v1.0.0)
  - `docs/implementation-plan.md` (Approved v1.0.0)

---

## 1. Module Objective

The objective of **Module 6 (Transaction Processing Engine)** is to orchestrate the end-to-end transaction lifecycle. It validates transfer requests, verifies sender balance sufficiency, invokes the deterministic fraud detection engine synchronously, executes atomic wallet mutations, reserves funds in escrow (`heldBalance`) when review is required, prevents double-spending, and records immutable transaction records with full risk assessments.

---

## 2. Scope

### In-Scope:
- Transaction model and Mongoose schema storing:
  - `senderId`, `recipientId`, `amount` (INR), `status`.
  - `riskScore`, `riskLevel`, `triggeredRules`.
  - `deviceContext` (`deviceId`, `ipAddress`, `userAgent`).
  - Timestamps and lifecycle states.
- Transfer initiation endpoint (`POST /api/transactions`):
  1. Validates recipient account exists and is not self.
  2. Verifies sender has sufficient `availableBalance >= amount`.
  3. Gathers historical telemetry and invokes Fraud Detection Engine (Module 5).
  4. Executes atomic balance update and sets status:
     - **Low Risk (0–30):** Status = `APPROVED`. Sender `availableBalance` debited; recipient `availableBalance` credited.
     - **Medium Risk (31–70):** Status = `FLAGGED_FOR_REVIEW`. Escrow Hold: Sender `availableBalance` debited; sender `heldBalance` credited. Recipient unchanged.
     - **High Risk (71–100):** Status = `BLOCKED`. Zero balance deducted from sender.
- Customer transaction history endpoints:
  - `GET /api/transactions`: Lists authenticated customer's incoming and outgoing transactions.
  - `GET /api/transactions/:id`: Retrieves individual transaction status.
- Strict double-spending prevention and concurrency control.

### Out-of-Scope for Module 6:
- Manual Admin Review queue or resolution endpoints (belongs to Module 7).
- Generating alerts or in-app notifications (belongs to Module 7).
- Gemini AI case brief generation (belongs to Module 8).
- Customer frontend UI (belongs to Module 10).

---

## 3. Dependencies

- **Preceding Modules:**
  - Module 1 (`MOD-01`: Express infrastructure).
  - Module 2 (`MOD-02`: Authentication & customer identity).
  - Module 3 (`MOD-03`: Wallet models & balance management).
  - Module 4 (`MOD-04`: Device context extraction).
  - Module 5 (`MOD-05`: Fraud Detection Engine).

---

## 4. Backend Work

- Implement `backend/src/models/Transaction.js`.
- Implement `backend/src/services/transactionService.js`:
  - `createTransaction(senderId, recipientId, amount, note, deviceContext)`.
  - `getUserTransactions(userId, queryParams)`.
  - `getTransactionById(userId, transactionId)`.
- Implement `backend/src/controllers/transactionController.js`.
- Implement `backend/src/routes/transactionRoutes.js`.
- Mount routes under `/api/transactions`.

---

## 5. Frontend Work

- None in this module. Consumed by Module 10 (Customer Portal).

---

## 6. Database Work

### Collection: `transactions`
- Attributes:
  - `senderId`: ObjectId, ref: `'User'`, required, indexed.
  - `recipientId`: ObjectId, ref: `'User'`, required, indexed.
  - `amount`: Number, required, min: 1.
  - `currency`: String, default: `'INR'`.
  - `status`: String, enum: `['PENDING', 'APPROVED', 'FLAGGED_FOR_REVIEW', 'BLOCKED', 'REJECTED']`, required, indexed.
  - `riskScore`: Number, required, min: 0, max: 100.
  - `riskLevel`: String, enum: `['LOW', 'MEDIUM', 'HIGH']`, required.
  - `triggeredRules`: Array of objects (`ruleCode`, `weight`, `reason`).
  - `deviceContext`: Object (`deviceId`, `ipAddress`, `userAgent`).
  - `note`: String, maxlength: 200.
  - `createdAt`: Date, default: `Date.now`, indexed.
- Indexes:
  - Compound indexes on `{ senderId: 1, createdAt: -1 }` and `{ recipientId: 1, createdAt: -1 }`.

---

## 7. API Work

| Method | Path | Access | Description |
| :--- | :--- | :---: | :--- |
| `POST` | `/api/transactions` | Customer | Initiates transfer; returns status (`APPROVED`, `FLAGGED_FOR_REVIEW`, `BLOCKED`). |
| `GET` | `/api/transactions` | Customer | Lists current customer's transaction history (paginated). |
| `GET` | `/api/transactions/:id` | Customer | Retrieves single transaction status and details. |

---

## 8. Security Considerations

- **SEC-M6-01 (Double-Spending Prevention):** Balance verification and reservation must be atomic. Query checks `availableBalance >= amount` inside the update condition using atomic Mongoose operators.
- **SEC-M6-02 (Negative Balance Guard):** Available balance must never be allowed to drop below 0 under any concurrency scenario.
- **SEC-M6-03 (Information Masking):** Responses to customer endpoints must omit specific internal fraud scoring points and rule weights to prevent adversarial reverse engineering. Customers see only the status (`APPROVED`, `FLAGGED_FOR_REVIEW`, `BLOCKED`).
- **SEC-M6-04 (Self-Transfer Block):** Sender ID must not match Recipient ID.

---

## 9. Validation Requirements

- `recipientId`: Valid Mongo ObjectId of an active registered user, != senderId.
- `amount`: Number, required, strictly > 0 (minimum ₹1, maximum ₹1,000,000).
- `note`: Optional string, max 200 characters.

---

## 10. Error Handling

- Insufficient balance: HTTP 400 Bad Request (`"Insufficient available balance"`).
- Recipient not found or self-transfer: HTTP 400 Bad Request.
- Concurrency conflict: Handled via atomic condition check returning 400 rather than overdrawing.
- Fraud engine error: Handled defensively; transaction marked for review if engine state is uncertain.

---

## 11. Files and Folders Expected to Be Created

```
backend/
├── src/
│   ├── models/
│   │   └── Transaction.js
│   ├── services/
│   │   └── transactionService.js
│   ├── controllers/
│   │   └── transactionController.js
│   └── routes/
│       └── transactionRoutes.js
└── tests/
    └── transaction.test.js
```

---

## 12. Files and Features Explicitly Out of Scope

- Prohibited files: `Alert.js`, `Review.js`, `geminiService.js`.
- Prohibited features: Real banking settlement, refund chargeback gateways, recurring subscription schedules.

---

## 13. Implementation Sequence

1. Define `Transaction` Mongoose model.
2. Implement atomic balance debit/credit methods in `walletService`.
3. Implement `transactionService` integrating validation, fraud engine evaluation, and balance mutations.
4. Implement `transactionController` and `transactionRoutes`.
5. Mount routes in `app.js`.
6. Write automated tests covering Approve, Flag/Escrow, and Block pathways, including concurrency tests.

---

## 14. Completion Criteria

1. Low-risk transaction (Score <= 30) transitions to `APPROVED`, debits sender `availableBalance`, and credits recipient `availableBalance`.
2. Medium-risk transaction (Score 31–70) transitions to `FLAGGED_FOR_REVIEW`, debits sender `availableBalance`, and credits sender `heldBalance`. Recipient balance is untouched.
3. High-risk transaction (Score 71–100) transitions to `BLOCKED`, zero balance is deducted.
4. Attempting to spend more than `availableBalance` fails with HTTP 400.
5. Customer can retrieve their own transaction history; unauthorized access to other users' transactions is blocked.
6. 100% of tests in `tests/transaction.test.js` pass.
