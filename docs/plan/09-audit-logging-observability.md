# Module 9 Implementation Plan: Audit Logging & Observability
## Project: FraudShield — Real-Time Rule-Based Fraud Detection & Prevention Platform

---

### Document Information
- **Module ID:** `MOD-09`
- **Module Name:** Audit Logging & Observability
- **Document Path:** `docs/plan/09-audit-logging-observability.md`
- **Version:** 1.0.0
- **Status:** Pending Stakeholder Approval
- **Parent Documents (Sources of Truth):**
  - `docs/FraudShield_SRS.md` (Approved v1.0.0)
  - `docs/context.md` (Approved v1.0.0)
  - `docs/implementation-plan.md` (Approved v1.0.0)

---

## 1. Module Objective

The objective of **Module 9 (Audit Logging & Observability)** is to provide an append-only, immutable security audit trail capturing all security-relevant and administrative actions across the platform. This guarantees forensic accountability, compliance transparency, and non-repudiation for logins, payments, fraud evaluations, manual review decisions, and AI assistant inquiries.

---

## 2. Scope

### In-Scope:
- `AuditLog` Mongoose model capturing:
  - `timestamp`: UTC ISO Date.
  - `eventType`: Standardized uppercase event code.
  - `actorId`: ObjectId of user or `'SYSTEM'`.
  - `actorRole`: `'customer'`, `'admin'`, or `'system'`.
  - `targetEntity`: Entity type (`'Transaction'`, `'User'`, `'Wallet'`, `'Beneficiary'`) and ID.
  - `metadata`: Sanitized JSON object containing event context.
  - `ipAddress`: Client IP.
- Centralized audit logger service (`auditLogger.js`) with non-blocking dispatch.
- Event instrumentation across core domains:
  - `AUTH_LOGIN_SUCCESS`, `AUTH_LOGIN_FAILURE`
  - `WALLET_DEPOSIT_COMPLETED`
  - `BENEFICIARY_ADDED`, `BENEFICIARY_REMOVED`
  - `TRANSACTION_INITIATED`, `FRAUD_EVALUATION_COMPLETED`
  - `TRANSACTION_FLAGGED`, `TRANSACTION_BLOCKED`
  - `ADMIN_REVIEW_APPROVED`, `ADMIN_REVIEW_REJECTED`
  - `AI_ASSISTANT_ACCESSED`
- Admin Audit Log Query API:
  - `GET /api/admin/audit-logs`: Paginated, filterable by date range, `eventType`, and `actorId`.
- Strict append-only architecture: zero update or delete endpoints.

### Out-of-Scope for Module 9:
- Third-party SIEM integrations (Datadog, Splunk, Elastic Cloud).
- Distributed tracing (OpenTelemetry, Jaeger).
- Frontend React audit log viewer components (belongs to Module 11).

---

## 3. Dependencies

- **Preceding Modules:**
  - Module 1 (`MOD-01`: Express infrastructure, DB connection).
  - Module 2 (`MOD-02`: Auth & admin role guard).
  - Module 3 (`MOD-03`: Wallet deposits & beneficiaries).
  - Module 6 (`MOD-06`: Transaction lifecycle).
  - Module 7 (`MOD-07`: Admin reviews).
  - Module 8 (`MOD-08`: Gemini AI assistant).

---

## 4. Backend Work

- Implement `backend/src/models/AuditLog.js`.
- Implement `backend/src/services/auditService.js`:
  - `logEvent(eventType, actorId, actorRole, targetEntity, metadata, ipAddress)`.
  - `getAuditLogs(filters, pagination)`.
- Instrument audit calls into previously completed services:
  - `authController.js` (login success/failure).
  - `walletService.js` (deposits).
  - `beneficiaryService.js` (add/remove).
  - `transactionService.js` (creation, scoring, flag/block).
  - `reviewService.js` (manual approvals/rejections).
  - `aiInvestigationService.js` (AI invocations).
- Implement `backend/src/controllers/auditController.js`.
- Implement `backend/src/routes/auditRoutes.js` mounted at `/api/admin/audit-logs`.

---

## 5. Frontend Work

- None in this module. Consumed by Module 11 (Frontend Analyst Dashboard).

---

## 6. Database Work

### Collection: `audit_logs`
- Attributes:
  - `timestamp`: Date, default: `Date.now`, required, indexed.
  - `eventType`: String, required, indexed.
  - `actorId`: ObjectId, ref: `'User'`, required, indexed.
  - `actorRole`: String, enum: `['customer', 'admin', 'system']`, required.
  - `targetEntity`: Object (`entityType`: String, `entityId`: ObjectId).
  - `metadata`: Schema.Types.Mixed (sanitized payload).
  - `ipAddress`: String, default: `'unknown'`.
- Indexes:
  - Compound indexes on `{ timestamp: -1, eventType: 1 }` and `{ actorId: 1, timestamp: -1 }`.

---

## 7. API Work

| Method | Path | Access | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/admin/audit-logs` | Admin Only | Retrieves paginated system audit history with filtering. |

---

## 8. Security Considerations

- **SEC-M9-01 (Immutability):** The `AuditLog` collection is strictly append-only. No `PUT`, `PATCH`, or `DELETE` endpoints exist. Mongoose schema hooks reject update commands.
- **SEC-M9-02 (Admin Isolation):** Only authenticated users with `role === 'admin'` can query audit logs.
- **SEC-M9-03 (Metadata Sanitization):** The audit logger strictly strips plaintext passwords, tokens, and raw secrets from `metadata` objects before persistence.
- **SEC-M9-04 (Non-Blocking Logging):** Audit logging failures must be caught cleanly and must never abort the user's primary business transaction.

---

## 9. Validation Requirements

- Query Filters Validation:
  - `page`: Optional integer >= 1.
  - `limit`: Optional integer 1–100 (default: 20).
  - `eventType`: Optional string.
  - `startDate`, `endDate`: Optional valid ISO date strings.

---

## 10. Error Handling

- Audit write failure: Caught within `auditLogger` and logged to standard error without bubbling up to crash the calling API.
- Customer requesting `/api/admin/audit-logs`: Returns HTTP 403 Forbidden.

---

## 11. Files and Folders Expected to Be Created

```
backend/
├── src/
│   ├── models/
│   │   └── AuditLog.js
│   ├── services/
│   │   └── auditService.js
│   ├── controllers/
│   │   └── auditController.js
│   └── routes/
│       └── auditRoutes.js
└── tests/
    └── audit.test.js
```

---

## 12. Files and Features Explicitly Out of Scope

- Prohibited features: Mutation or deletion of audit logs, external log streaming proxies.

---

## 13. Implementation Sequence

1. Define `AuditLog` Mongoose model with immutability guards and compound indexes.
2. Implement non-blocking `auditService.js`.
3. Instrument audit logging across existing services (Auth, Wallet, Transactions, Reviews, AI).
4. Implement `auditController.js` and `auditRoutes.js` with admin authorization.
5. Mount routes in `app.js`.
6. Write automated tests (`audit.test.js`).

---

## 14. Completion Criteria

1. Critical security events (login, transfer, review resolution, AI access) automatically create corresponding `AuditLog` documents.
2. `AuditLog` documents contain accurate actor IDs, timestamps, and sanitized metadata.
3. Admin can query audit logs with pagination and filters via `GET /api/admin/audit-logs`.
4. Customers attempting to query audit logs receive HTTP 403.
5. Attempting to update or delete an audit log via database triggers an error.
6. 100% of automated tests in `tests/audit.test.js` pass.
