# Module 9 Test Cases: Audit Logging & Observability
## Project: FraudShield — Real-Time Rule-Based Fraud Detection & Prevention Platform

---

### Document Information
- **Module ID:** `MOD-09`
- **Module Name:** Audit Logging & Observability
- **Document Path:** `docs/test-cases/09-audit-logging-observability.md`
- **Version:** 1.0.0
- **Status:** Complete / Ready for Execution
- **Parent Documents (Sources of Truth):**
  - `docs/FraudShield_SRS.md`
  - `docs/context.md`
  - `docs/implementation-plan.md`
  - `docs/plan/09-audit-logging-observability.md`
  - `docs/edge-cases/09-audit-logging-observability.md`

---

## 1. Overview

This document specifies the test cases for **Module 9: Audit Logging & Observability**. It verifies non-blocking security audit logging across all critical domains, query endpoints, metadata sanitization, and database immutability.

---

## 2. Test Cases Specification

### TC-M9-001: Authentication Login Events Generate Audit Records
- **Test Case ID:** `TC-M9-001`
- **Module ID:** `MOD-09`
- **Test Scenario:** Successful and failed login attempts create corresponding audit logs.
- **Preconditions:** Registered user exists.
- **Test Data:** Valid login and invalid login attempts.
- **Steps:**
  1. Perform successful login via `POST /api/auth/login`.
  2. Perform failed login with bad password.
  3. Query `audit_logs` collection.
- **Expected Result:**
  - One record created with `eventType: "AUTH_LOGIN_SUCCESS"`.
  - One record created with `eventType: "AUTH_LOGIN_FAILURE"`.
  - Passwords and tokens are strictly excluded from `metadata`.
- **Test Type:** Integration
- **Priority:** High
- **Status:** Not Run

---

### TC-M9-002: Transaction Lifecycle Events Generate Audit Records
- **Test Case ID:** `TC-M9-002`
- **Module ID:** `MOD-09`
- **Test Scenario:** Initiating and scoring a transaction creates `TRANSACTION_INITIATED` and `FRAUD_EVALUATION_COMPLETED` audit entries.
- **Preconditions:** Authenticated customer with balance.
- **Test Data:** Transfer of ₹5,000.
- **Steps:**
  1. Submit transfer via `POST /api/transactions`.
  2. Query `audit_logs` collection for `targetEntity.entityId = transaction._id`.
- **Expected Result:**
  - Audit records exist detailing actor ID, risk score, triggered rules, and outcome.
- **Test Type:** Integration
- **Priority:** High
- **Status:** Not Run

---

### TC-M9-003: Admin Manual Review Actions Generate Audit Records
- **Test Case ID:** `TC-M9-003`
- **Module ID:** `MOD-09`
- **Test Scenario:** Admin approval or rejection creates immutable audit records with admin ID and resolution notes.
- **Preconditions:** Flagged transaction in review.
- **Test Data:** `decision: "APPROVE"`, `notes: "Verified identity with customer via phone."`
- **Steps:**
  1. Submit resolution via `POST /api/admin/reviews/:id/resolve`.
  2. Inspect created audit log.
- **Expected Result:**
  - Record has `eventType: "ADMIN_REVIEW_APPROVED"`.
  - `actorId` matches admin user ID; `actorRole` is `'admin'`.
  - `metadata.notes` contains resolution commentary.
- **Test Type:** Integration / Compliance
- **Priority:** Critical
- **Status:** Not Run

---

### TC-M9-004: Admin Queries Audit Logs (`GET /api/admin/audit-logs`)
- **Test Case ID:** `TC-M9-004`
- **Module ID:** `MOD-09`
- **Test Scenario:** Admin retrieves paginated audit logs with event filtering.
- **Preconditions:** Authenticated admin; audit records exist.
- **Test Data:** Header `Authorization: Bearer <admin_jwt>`, Query `?eventType=ADMIN_REVIEW_APPROVED&page=1&limit=10`
- **Steps:**
  1. Send `GET /api/admin/audit-logs` with filters.
- **Expected Result:**
  - Status Code: `200 OK`
  - Returns array of matching audit entries and pagination metadata (`totalPages`, `totalCount`).
- **Test Type:** API / Admin
- **Priority:** High
- **Status:** Not Run

---

### TC-M9-005: Customer Blocked from Audit Log Endpoint
- **Test Case ID:** `TC-M9-005`
- **Module ID:** `MOD-09`
- **Test Scenario:** Customer token calling audit log endpoint is rejected.
- **Preconditions:** Authenticated user with `role: "customer"`.
- **Test Data:** Header `Authorization: Bearer <customer_jwt>`
- **Steps:**
  1. Send `GET /api/admin/audit-logs`.
- **Expected Result:**
  - Status Code: `403 Forbidden`
  - Error: `"Access denied: insufficient permissions"`.
- **Test Type:** Security
- **Priority:** Critical
- **Status:** Not Run

---

### TC-M9-006: Audit Log Immutability Enforcement
- **Test Case ID:** `TC-M9-006`
- **Module ID:** `MOD-09`
- **Test Scenario:** Direct update or delete operations on `AuditLog` collection are rejected.
- **Preconditions:** Existing audit log record.
- **Test Data:** `AuditLog.updateOne({ _id: logId }, { eventType: "TAMPERED" })`
- **Steps:**
  1. Execute Mongoose update query directly against `AuditLog`.
- **Expected Result:**
  - Operation throws an error or is blocked by Mongoose schema hooks.
  - Database record remains unaltered.
- **Test Type:** Unit / Security
- **Priority:** Critical
- **Status:** Not Run
