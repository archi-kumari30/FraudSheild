# Module 7 Implementation Plan: Fraud Alert & Incident Review System
## Project: FraudShield — Real-Time Rule-Based Fraud Detection & Prevention Platform

---

### Document Information
- **Module ID:** `MOD-07`
- **Module Name:** Fraud Alert & Incident Review System
- **Document Path:** `docs/plan/07-fraud-alert-incident-review.md`
- **Version:** 1.0.0
- **Status:** Pending Stakeholder Approval
- **Parent Documents (Sources of Truth):**
  - `docs/FraudShield_SRS.md` (Approved v1.0.0)
  - `docs/context.md` (Approved v1.0.0)
  - `docs/implementation-plan.md` (Approved v1.0.0)

---

## 1. Module Objective

The objective of **Module 7 (Fraud Alert & Incident Review System)** is to provide alerting capabilities for suspicious activity, establish the Admin Review Queue for transactions marked `FLAGGED_FOR_REVIEW`, and execute human-in-the-loop manual determinations (`APPROVE` or `REJECT`) with final escrow fund settlement.

---

## 2. Scope

### In-Scope:
- Alert model and schema storing notifications for customers and internal monitoring.
- Automated alert generation when transactions are classified as `FLAGGED_FOR_REVIEW` or `BLOCKED`.
- Customer alerts API:
  - `GET /api/alerts`: List alerts for authenticated customer.
  - `PATCH /api/alerts/:id/read`: Mark alert as read.
- Admin Review Queue API (strictly accessible to `role === 'admin'`):
  - `GET /api/admin/reviews`: Query pending review cases with search and filtering.
  - `GET /api/admin/reviews/:id`: Detailed case inspection (triggered rules, weights, sender history, device context).
  - `POST /api/admin/reviews/:id/resolve`: Submit human review decision (`APPROVE` or `REJECT`).
- Escrow Settlement Logic upon resolution:
  - **Manual Approve:** Status transitions to `APPROVED`. Sender `heldBalance` is debited; recipient `availableBalance` is credited.
  - **Manual Reject:** Status transitions to `REJECTED`. Sender `heldBalance` is debited; sender `availableBalance` is refunded.
- Enforcement of mandatory resolution notes (minimum 10 characters) and recording `resolvedBy` and `resolvedAt`.

### Out-of-Scope for Module 7:
- Gemini AI assistance, summaries, or checklists (belongs to Module 8).
- Audit log collection (belongs to Module 9).
- React components or UI screens (belongs to Modules 10 and 11).

---

## 3. Dependencies

- **Preceding Modules:**
  - Module 1 (`MOD-01`: Express infrastructure).
  - Module 2 (`MOD-02`: Authentication & admin role guard).
  - Module 3 (`MOD-03`: Wallet dual-balance escrow operations).
  - Module 6 (`MOD-06`: Transaction Processing Engine & transaction lifecycle states).

---

## 4. Backend Work

- Implement `backend/src/models/Alert.js`.
- Update `backend/src/models/Transaction.js` to include resolution fields (`resolutionStatus`, `resolutionNotes`, `resolvedBy`, `resolvedAt`).
- Implement `backend/src/services/alertService.js`:
  - `createAlert(userId, transactionId, severity, title, message)`.
  - `getUserAlerts(userId)`.
  - `markAsRead(userId, alertId)`.
- Implement `backend/src/services/reviewService.js`:
  - `getPendingReviews(filterOptions)`.
  - `getReviewDetails(transactionId)`.
  - `resolveReview(transactionId, adminId, decision, resolutionNotes)`.
- Implement `backend/src/controllers/alertController.js` and `backend/src/controllers/reviewController.js`.
- Implement `backend/src/routes/alertRoutes.js` and `backend/src/routes/reviewRoutes.js`.
- Mount routes under `/api/alerts` and `/api/admin/reviews`.

---

## 5. Frontend Work

- None in this module. Consumed by Module 10 (Customer alerts) and Module 11 (Admin dashboard).

---

## 6. Database Work

### Collection: `alerts`
- Attributes:
  - `userId`: ObjectId, ref: `'User'`, required, indexed.
  - `transactionId`: ObjectId, ref: `'Transaction'`, required.
  - `severity`: String, enum: `['MEDIUM', 'HIGH']`, required.
  - `title`: String, required.
  - `message`: String, required.
  - `isRead`: Boolean, default: `false`, indexed.
  - `createdAt`: Date, default: `Date.now`, indexed.

### Updates to Collection: `transactions`
- Additional fields:
  - `resolutionStatus`: String, enum: `['PENDING_REVIEW', 'APPROVED', 'REJECTED']`, default: `'PENDING_REVIEW'`.
  - `resolutionNotes`: String.
  - `resolvedBy`: ObjectId, ref: `'User'`.
  - `resolvedAt`: Date.

---

## 7. API Work

| Method | Path | Access | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/alerts` | Customer | Lists alerts for the logged-in user. |
| `PATCH` | `/api/alerts/:id/read` | Customer | Marks a specific alert as read. |
| `GET` | `/api/admin/reviews` | Admin Only | Lists transactions currently in `FLAGGED_FOR_REVIEW` status. |
| `GET` | `/api/admin/reviews/:id` | Admin Only | Inspects complete case file (rule breakdown, device info, amounts). |
| `POST` | `/api/admin/reviews/:id/resolve` | Admin Only | Submits human review verdict (`APPROVE` or `REJECT`) with notes. |

---

## 8. Security Considerations

- **SEC-M7-01 (Admin Route Guard):** All review endpoints strictly protected with `authorizeRole(['admin'])`. Customers attempting access receive HTTP 403.
- **SEC-M7-02 (Immutable Resolution):** Once a transaction has been resolved, subsequent resolution requests must be rejected to prevent duplicate settlement.
- **SEC-M7-03 (Resolution Note Enforcement):** Admins cannot resolve a case without providing an audit-ready explanation (minimum 10 characters).

---

## 9. Validation Requirements

- **Resolution Validation:**
  - `decision`: String, must be exactly `'APPROVE'` or `'REJECT'`.
  - `resolutionNotes`: String, required, minimum 10 characters, maximum 1000 characters.

---

## 10. Error Handling

- Attempting to resolve a non-existent transaction: HTTP 404 Not Found.
- Attempting to resolve a transaction not in `FLAGGED_FOR_REVIEW` status: HTTP 400 Bad Request.
- Attempting to re-resolve an already resolved case: HTTP 409 Conflict (`"Transaction already resolved"`).
- Missing resolution notes: HTTP 400 Bad Request (`"Resolution notes must be at least 10 characters long"`).

---

## 11. Files and Folders Expected to Be Created

```
backend/
├── src/
│   ├── models/
│   │   └── Alert.js
│   ├── services/
│   │   ├── alertService.js
│   │   └── reviewService.js
│   ├── controllers/
│   │   ├── alertController.js
│   │   └── reviewController.js
│   └── routes/
│       ├── alertRoutes.js
│       └── reviewRoutes.js
└── tests/
    ├── alert.test.js
    └── review.test.js
```

---

## 12. Files and Features Explicitly Out of Scope

- Prohibited files: `geminiService.js`, `AuditLog.js`.
- Prohibited features: Automated AI resolution, customer self-approval bypassing admin, email/SMS dispatch.

---

## 13. Implementation Sequence

1. Define `Alert` Mongoose model.
2. Update `Transaction` schema with resolution attributes.
3. Implement `alertService` and customer alert endpoints.
4. Hook alert generation into transaction flagging/blocking in `transactionService`.
5. Implement `reviewService` with escrow settlement logic.
6. Implement `reviewController` and `reviewRoutes` with admin role guards.
7. Mount routes in `app.js`.
8. Write automated test suites (`alert.test.js`, `review.test.js`).

---

## 14. Completion Criteria

1. Transactions in `FLAGGED_FOR_REVIEW` or `BLOCKED` auto-generate corresponding alerts.
2. Customer can query their own alerts; marking as read updates database.
3. Admin can view the list of pending review cases; customers are rejected with HTTP 403.
4. Admin can inspect case details with complete triggered rule names and points.
5. Manual `APPROVE` moves funds from sender's `heldBalance` to recipient's `availableBalance` and sets transaction status to `APPROVED`.
6. Manual `REJECT` moves funds from sender's `heldBalance` back to sender's `availableBalance` and sets transaction status to `REJECTED`.
7. Attempting to resolve without notes fails with HTTP 400.
8. 100% of tests in `tests/alert.test.js` and `tests/review.test.js` pass.
