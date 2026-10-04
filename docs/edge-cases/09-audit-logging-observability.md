# Module 9 Edge Cases: Audit Logging & Observability
## Project: FraudShield — Real-Time Rule-Based Fraud Detection & Prevention Platform

---

### Document Information
- **Module ID:** `MOD-09`
- **Module Name:** Audit Logging & Observability
- **Document Path:** `docs/edge-cases/09-audit-logging-observability.md`
- **Version:** 1.0.0
- **Status:** Complete / Ready for Review
- **Parent Documents (Sources of Truth):**
  - `docs/FraudShield_SRS.md`
  - `docs/context.md`
  - `docs/implementation-plan.md`
  - `docs/plan/09-audit-logging-observability.md`

---

## 1. Overview

This document specifies the technical and compliance edge cases for **Module 9: Audit Logging & Observability**. It addresses audit write failures, data immutability enforcement, tampering attempts, sensitive secret masking, and high-throughput logging stability.

---

## 2. Edge Cases Catalog

### EC-M9-001: Audit Log Write Failure During Critical Transaction
- **ID:** `EC-M9-001`
- **Scenario:** The MongoDB cluster experiences a momentary write error while logging an `ADMIN_REVIEW_APPROVED` event.
- **Preconditions:** Main transaction has completed successfully.
- **Expected System Behavior:** The audit failure must NOT abort or revert the user's completed transaction. The error is logged to standard error for operational alerting.
- **Handling / Mitigation:** `auditLogger` catches write errors internally in a non-blocking Promise handler, logs an alert to system logs, and prevents unhandled promise rejections.
- **Priority:** Critical
- **Security Impact:** Preserves transaction integrity without process crashes.

---

### EC-M9-002: Attempted Mutation or Deletion of Existing Audit Logs (Immutability Defense)
- **ID:** `EC-M9-002`
- **Scenario:** An attacker or rogue administrator attempts `UPDATE`, `PATCH`, or `DELETE` on the `audit_logs` collection via API or Mongoose commands.
- **Preconditions:** Audit records exist.
- **Expected System Behavior:** The action is blocked. Zero API routes exist for updating or deleting audit logs; Mongoose schema hooks reject update/delete operations.
- **Handling / Mitigation:** No mutation routes exist. Mongoose schema middleware `schema.pre(['updateOne', 'updateMany', 'deleteOne', 'deleteMany'], ...)` throws an error: `"AuditLog records are immutable"`.
- **Priority:** Critical
- **Security Impact:** Guarantees non-repudiation and forensic audit integrity.

---

### EC-M9-003: Sensitive Secrets or Plaintext Passwords Entering Audit Metadata
- **ID:** `EC-M9-003`
- **Scenario:** An authentication failure event passes the raw request payload containing `password` into audit metadata.
- **Preconditions:** User submits bad password on login.
- **Expected System Behavior:** The password field is completely excluded or redacted from the audit record.
- **Handling / Mitigation:** The audit logger sanitization filter strips blacklisted keys (`password`, `token`, `secret`, `authorization`, `creditCard`) before storing `metadata`.
- **Priority:** Critical
- **Security Impact:** Prevents credential exposure in audit collections.

---

### EC-M9-004: Customer Attempting to Query System Audit Logs
- **ID:** `EC-M9-004`
- **Scenario:** An authenticated customer submits a request to `GET /api/admin/audit-logs`.
- **Preconditions:** Authenticated user has `role: "customer"`.
- **Expected System Behavior:** Request is rejected with HTTP 403 Forbidden.
- **Handling / Mitigation:** Protected by `authorizeRole(['admin'])`.
- **Priority:** High
- **Security Impact:** Prevents unauthorized surveillance of platform activity.

---

### EC-M9-005: Large Pagination / High-Volume Audit Query
- **ID:** `EC-M9-005`
- **Scenario:** An admin queries audit logs with an excessive limit (e.g., `?limit=1000000`) risking server memory exhaustion.
- **Preconditions:** Thousands of audit logs exist.
- **Expected System Behavior:** Query parameters are sanitized; `limit` is capped at a safe maximum (e.g., 100 records per page).
- **Handling / Mitigation:** Query validator enforces `min: 1, max: 100, default: 20`.
- **Priority:** Medium
- **Security Impact:** Thwarts resource exhaustion DoS via oversized database queries.

---

### EC-M9-006: System Event Initiated Without an Authenticated User Actor
- **ID:** `EC-M9-006`
- **Scenario:** An automated process or startup task (e.g., seed script or system health check) logs an audit event where there is no user token.
- **Preconditions:** Background system action.
- **Expected System Behavior:** Audit log is created cleanly with `actorRole: "system"` and `actorId: null` or a designated system ID.
- **Handling / Mitigation:** Audit schema permits `actorId` to be null when `actorRole === 'system'`.
- **Priority:** Low
- **Security Impact:** Maintains complete logging coverage for automated actions.
