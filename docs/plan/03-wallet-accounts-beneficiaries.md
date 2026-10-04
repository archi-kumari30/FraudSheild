# Module 3 Implementation Plan: Wallet, Accounts & Beneficiaries
## Project: FraudShield — Real-Time Rule-Based Fraud Detection & Prevention Platform

---

### Document Information
- **Module ID:** `MOD-03`
- **Module Name:** Wallet, Accounts & Beneficiaries
- **Document Path:** `docs/plan/03-wallet-accounts-beneficiaries.md`
- **Version:** 1.0.0
- **Status:** Pending Stakeholder Approval
- **Parent Documents (Sources of Truth):**
  - `docs/FraudShield_SRS.md` (Approved v1.0.0)
  - `docs/context.md` (Approved v1.0.0)
  - `docs/implementation-plan.md` (Approved v1.0.0)

---

## 1. Module Objective

The objective of **Module 3 (Wallet, Accounts & Beneficiaries)** is to implement the simulated financial balance foundation and address book management. It provisions simulated digital wallets with dual-balance tracking (`availableBalance` and `heldBalance` denominated in INR / ₹), provides test funding ("Add Funds"), and allows customers to manage saved beneficiaries with timestamped creation records for subsequent fraud rule heuristics.

---

## 2. Scope

### In-Scope:
- Wallet model and schema maintaining:
  - `userId` (1-to-1 relationship with User).
  - `availableBalance` (liquid spendable INR, default simulated initial balance: ₹10,000).
  - `heldBalance` (funds reserved in security escrow during review-tier cases, initial value: ₹0).
  - `currency` (strictly `'INR'`).
- Automatic wallet provisioning hook or service invoked when a customer account is created.
- Simulated deposit endpoint (`POST /api/wallet/deposit`) to credit `availableBalance` for testing scenarios.
- Balance retrieval endpoint (`GET /api/wallet`) for authenticated customers.
- Beneficiary model and schema (`userId`, `recipientAccountId`, `nickname`, `createdAt`).
- Beneficiary address book endpoints:
  - List beneficiaries (`GET /api/beneficiaries`).
  - Add beneficiary (`POST /api/beneficiaries`) with recipient existence verification.
  - Delete beneficiary (`DELETE /api/beneficiaries/:id`) with ownership guard.
- Timestamp capture on beneficiary creation (critical for `RULE_BENEFICIARY_NEW` in Module 5).

### Out-of-Scope for Module 3:
- Live transfers or transaction execution (belongs to Module 6).
- Escrow deductions during transfers (belongs to Module 6).
- Fraud rule evaluation or scoring (belongs to Module 5).
- Real payment gateways (Razorpay, Stripe, UPI).
- Real banking clearinghouses (NEFT, RTGS, IMPS).
- Frontend React views (belongs to Module 10).

---

## 3. Dependencies

- **Preceding Modules:**
  - Module 1 (`MOD-01`: Express app, MongoDB connection, error handling).
  - Module 2 (`MOD-02`: User identity, JWT authentication middleware, customer role).

---

## 4. Backend Work

- Implement Mongoose models:
  - `backend/src/models/Wallet.js`
  - `backend/src/models/Beneficiary.js`
- Implement wallet service (`backend/src/services/walletService.js`):
  - `createWallet(userId)`: initializes wallet with ₹10,000 available, ₹0 held.
  - `getWallet(userId)`: retrieves balances.
  - `depositFunds(userId, amount)`: atomically credits `availableBalance`.
- Implement beneficiary service (`backend/src/services/beneficiaryService.js`):
  - `addBeneficiary(userId, recipientEmailOrId, nickname)`: validates recipient exists and is not self, stores creation timestamp.
  - `getBeneficiaries(userId)`: retrieves user's saved beneficiaries.
  - `deleteBeneficiary(userId, beneficiaryId)`: verifies ownership and removes.
- Implement controllers:
  - `backend/src/controllers/walletController.js`
  - `backend/src/controllers/beneficiaryController.js`
- Implement routes:
  - `backend/src/routes/walletRoutes.js`
  - `backend/src/routes/beneficiaryRoutes.js`
- Mount routes under `/api/wallet` and `/api/beneficiaries`.

---

## 5. Frontend Work

- None in this module. Consumed by Module 10 (Customer Portal).

---

## 6. Database Work

### Collection: `wallets`
- Attributes:
  - `userId`: ObjectId, ref: `'User'`, required, unique index.
  - `availableBalance`: Number, required, default: `10000`, min: `0`.
  - `heldBalance`: Number, required, default: `0`, min: `0`.
  - `currency`: String, default: `'INR'`.
  - `createdAt`: Date, default: `Date.now`.
  - `updatedAt`: Date, default: `Date.now`.

### Collection: `beneficiaries`
- Attributes:
  - `userId`: ObjectId, ref: `'User'`, required, indexed.
  - `recipientAccountId`: ObjectId, ref: `'User'`, required.
  - `nickname`: String, required, trimmed, maxlength: 50.
  - `createdAt`: Date, default: `Date.now`.
- Indexes:
  - Compound unique index on `{ userId: 1, recipientAccountId: 1 }` preventing duplicate entries.

---

## 7. API Work

| Method | Path | Access | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/wallet` | Customer | Retrieves available and held balances in INR. |
| `POST` | `/api/wallet/deposit` | Customer | Simulated test deposit to credit `availableBalance`. |
| `GET` | `/api/beneficiaries` | Customer | Lists user's saved beneficiaries with creation timestamps. |
| `POST` | `/api/beneficiaries` | Customer | Adds a new beneficiary by recipient email or account ID. |
| `DELETE` | `/api/beneficiaries/:id` | Customer | Removes a saved beneficiary. |

---

## 8. Security Considerations

- **SEC-M3-01 (Ownership Isolation):** Customers can only query and mutate their own wallet and beneficiaries.
- **SEC-M3-02 (Self-Transfer Guard):** A customer cannot add their own user ID as a beneficiary.
- **SEC-M3-03 (Atomic Balance Updates):** Wallet balance operations must use atomic MongoDB operations (`$inc`) with positive conditions to prevent race conditions.
- **SEC-M3-04 (Currency Safety):** Deposit amounts must be positive numbers; zero, negative numbers, or non-numeric types are rejected before reaching data layers.

---

## 9. Validation Requirements

- **Deposit Validation:**
  - `amount`: Number, required, strictly > 0 (e.g. minimum ₹1, maximum ₹10,000,000 per simulated deposit).
- **Beneficiary Creation Validation:**
  - `recipientEmail`: Valid email format of an active existing customer, OR `recipientAccountId`: Valid Mongo ObjectId.
  - `nickname`: String, 1–50 characters, trimmed.
- **Beneficiary Deletion Validation:**
  - `id`: Valid Mongo ObjectId in URL params.

---

## 10. Error Handling

- Deposit with negative or non-numeric amount: HTTP 400 Bad Request (`"Deposit amount must be a positive number"`).
- Wallet not found: HTTP 404 Not Found (`"Wallet not found"`).
- Attempting to add self as beneficiary: HTTP 400 Bad Request (`"Cannot add yourself as a beneficiary"`).
- Recipient does not exist: HTTP 404 Not Found (`"Recipient user not found"`).
- Beneficiary already exists in address book: HTTP 409 Conflict (`"Beneficiary already added"`).
- Attempting to delete another user's beneficiary: HTTP 403 Forbidden or 404 Not Found.

---

## 11. Files and Folders Expected to Be Created

```
backend/
├── src/
│   ├── models/
│   │   ├── Wallet.js
│   │   └── Beneficiary.js
│   ├── services/
│   │   ├── walletService.js
│   │   └── beneficiaryService.js
│   ├── controllers/
│   │   ├── walletController.js
│   │   └── beneficiaryController.js
│   └── routes/
│       ├── walletRoutes.js
│       └── beneficiaryRoutes.js
└── tests/
    ├── wallet.test.js
    └── beneficiary.test.js
```

---

## 12. Files and Features Explicitly Out of Scope

- Prohibited files: `Transaction.js`, `fraudEngine.js`, `deviceMiddleware.js`, `Alert.js`.
- Prohibited features: Real banking API webhooks, card tokenization, withdrawal to external bank accounts.

---

## 13. Implementation Sequence

1. Define `Wallet` and `Beneficiary` Mongoose models with appropriate indexes.
2. Implement `walletService` (initialization, balance query, deposit).
3. Implement `beneficiaryService` (creation validation, listing, deletion).
4. Implement `walletController` and `beneficiaryController`.
5. Mount routes in `app.js` under `/api/wallet` and `/api/beneficiaries`.
6. Write automated tests (`wallet.test.js`, `beneficiary.test.js`).

---

## 14. Completion Criteria

1. Registering a customer automatically initializes a wallet with `availableBalance = 10000` and `heldBalance = 0`.
2. `GET /api/wallet` returns current balances for the authenticated user.
3. `POST /api/wallet/deposit` correctly increments `availableBalance` and rejects negative values.
4. Adding an existing user as beneficiary succeeds and returns creation timestamp.
5. Attempting to add self as beneficiary is rejected with HTTP 400.
6. Adding a non-existent recipient is rejected with HTTP 404.
7. Adding duplicate beneficiary is rejected with HTTP 409.
8. Deleting beneficiary succeeds and updates the address book.
9. 100% of automated tests in `tests/wallet.test.js` and `tests/beneficiary.test.js` pass.
