# Module 2 Edge Cases: Authentication & Authorization (RBAC)
## Project: FraudShield — Real-Time Rule-Based Fraud Detection & Prevention Platform

---

### Document Information
- **Module ID:** `MOD-02`
- **Module Name:** Authentication & Authorization
- **Document Path:** `docs/edge-cases/02-authentication-authorization.md`
- **Version:** 1.0.0
- **Status:** Complete / Ready for Review
- **Parent Documents (Sources of Truth):**
  - `docs/FraudShield_SRS.md`
  - `docs/context.md`
  - `docs/implementation-plan.md`
  - `docs/plan/02-authentication-authorization.md`

---

## 1. Overview

This document specifies the technical and operational edge cases for **Module 2: Authentication & Authorization (RBAC)**. It covers user registration, credential validation, stateless JWT lifecycle, timing-attack resilience, role privilege isolation, and account enumeration defenses.

---

## 2. Edge Cases Catalog

### EC-M2-001: Duplicate Customer Registration with Existing Email
- **ID:** `EC-M2-001`
- **Scenario:** A user attempts to register with an email address that already exists in the `users` collection.
- **Preconditions:** A user record with `email: "user@example.com"` already exists.
- **Expected System Behavior:** Registration is rejected with HTTP 409 Conflict without throwing an unhandled database duplicate key error.
- **Handling / Mitigation:** Pre-check or unique index error handler catches `E11000` duplicate key error and formats a uniform error: `{ success: false, error: { message: "Email already registered", code: "EMAIL_EXISTS" } }`.
- **Priority:** High
- **Security Impact:** Prevents database schema corruption and duplicate identity collisions.

---

### EC-M2-002: Malformed or Invalid Email Syntax During Registration
- **ID:** `EC-M2-002`
- **Scenario:** Registration payload provides invalid email formats (e.g., `user@`, `user@domain`, `plainaddress`, `@domain.com`).
- **Preconditions:** None.
- **Expected System Behavior:** Request is rejected before reaching business logic with HTTP 400 Bad Request.
- **Handling / Mitigation:** Input validation middleware (`express-validator`) validates email format via standard regex and sanitizes to lowercase.
- **Priority:** High
- **Security Impact:** Ensures clean identity indexing and prevents injection vectors.

---

### EC-M2-003: Weak or Non-Compliant Password on Registration
- **ID:** `EC-M2-003`
- **Scenario:** Registration payload contains passwords that are too short (< 8 characters), empty, or lacking required character diversity.
- **Preconditions:** None.
- **Expected System Behavior:** Registration is rejected with HTTP 400 Bad Request detailing password policy requirements.
- **Handling / Mitigation:** Schema validator enforces minimum 8 characters, at least one number, and at least one letter.
- **Priority:** High
- **Security Impact:** Prevents brute-force vulnerabilities stemming from weak customer passwords.

---

### EC-M2-004: Customer Attempting Privilege Escalation via Payload `role` Attribute
- **ID:** `EC-M2-004`
- **Scenario:** A malicious actor attempts to self-assign the administrator role during public registration by submitting `{ "name": "Eve", "email": "eve@hack.com", "password": "Password123!", "role": "admin" }`.
- **Preconditions:** None.
- **Expected System Behavior:** The `role` attribute in the registration payload is strictly ignored; user is persisted with `role: "customer"`.
- **Handling / Mitigation:** Controller explicitly hardcodes `role = 'customer'` when creating new users. Client payloads cannot override this.
- **Priority:** Critical
- **Security Impact:** Prevents unauthorized administrative access and privilege escalation.

---

### EC-M2-005: Authentication Attempt with Incorrect Password
- **ID:** `EC-M2-005`
- **Scenario:** Registered customer submits valid email but incorrect password.
- **Preconditions:** User exists in database.
- **Expected System Behavior:** Login fails with HTTP 401 Unauthorized; returns generic error message.
- **Handling / Mitigation:** `bcrypt.compare()` returns `false`. Controller returns `{ success: false, error: { message: "Invalid email or password", code: "INVALID_CREDENTIALS" } }`.
- **Priority:** High
- **Security Impact:** Standard credential validation.

---

### EC-M2-006: Authentication Attempt with Non-Existent Email (Account Enumeration Defense)
- **ID:** `EC-M2-006`
- **Scenario:** Attacker submits an unregistered email to determine whether an account exists.
- **Preconditions:** User does not exist in database.
- **Expected System Behavior:** Login fails with HTTP 401 Unauthorized and an identical error message to invalid password.
- **Handling / Mitigation:** Controller returns `{ success: false, error: { message: "Invalid email or password", code: "INVALID_CREDENTIALS" } }` without revealing whether the email or password was incorrect. A dummy bcrypt compare can be performed to equalize response timing.
- **Priority:** High
- **Security Impact:** Mitigates user enumeration and timing attacks.

---

### EC-M2-007: Missing Authorization Header on Protected Route
- **ID:** `EC-M2-007`
- **Scenario:** Client sends request to protected route (`GET /api/auth/me`) without an `Authorization` header.
- **Preconditions:** None.
- **Expected System Behavior:** Request is rejected with HTTP 401 Unauthorized.
- **Handling / Mitigation:** `authenticateToken` middleware checks `req.headers.authorization`. If missing or not starting with `Bearer `, returns `{ success: false, error: { message: "Authentication token required", code: "TOKEN_MISSING" } }`.
- **Priority:** High
- **Security Impact:** Enforces authentication perimeter.

---

### EC-M2-008: Malformed or Forged JWT Token
- **ID:** `EC-M2-008`
- **Scenario:** Client supplies a malformed token string (e.g., `Bearer invalid.token.value`) or a token signed with an invalid secret.
- **Preconditions:** None.
- **Expected System Behavior:** Request is rejected with HTTP 401 Unauthorized.
- **Handling / Mitigation:** `jwt.verify()` throws `JsonWebTokenError`, caught by middleware and formatted into `{ success: false, error: { message: "Invalid authentication token", code: "TOKEN_INVALID" } }`.
- **Priority:** High
- **Security Impact:** Prevents cryptographic forgery and unauthorized access.

---

### EC-M2-009: Expired JWT Token
- **ID:** `EC-M2-009`
- **Scenario:** Client presents an otherwise valid token whose expiration timestamp (`exp`) has elapsed.
- **Preconditions:** Valid token generated > 24 hours ago.
- **Expected System Behavior:** Request is rejected with HTTP 401 Unauthorized.
- **Handling / Mitigation:** `jwt.verify()` throws `TokenExpiredError`, formatted as `{ success: false, error: { message: "Authentication token expired", code: "TOKEN_EXPIRED" } }`.
- **Priority:** High
- **Security Impact:** Ensures session expiration and bounds exposure window.

---

### EC-M2-010: Customer Role Attempting Access to Admin-Guarded Endpoints
- **ID:** `EC-M2-010`
- **Scenario:** An authenticated customer presents a valid token to an admin-guarded route (e.g., `/api/admin/*`).
- **Preconditions:** Authenticated user has `role: "customer"`.
- **Expected System Behavior:** Request is rejected with HTTP 403 Forbidden.
- **Handling / Mitigation:** `authorizeRole(['admin'])` middleware verifies `req.user.role === 'admin'`. If mismatched, returns `{ success: false, error: { message: "Access denied: insufficient permissions", code: "FORBIDDEN" } }`.
- **Priority:** Critical
- **Security Impact:** Enforces strict role-based authorization boundary.

---

### EC-M2-011: Inactive / Suspended User Account Attempting Access
- **ID:** `EC-M2-011`
- **Scenario:** A user account has `isActive: false` but attempts to log in or use a previously issued valid token.
- **Preconditions:** User record has `isActive: false`.
- **Expected System Behavior:** Login is blocked; protected routes reject the request with HTTP 403 Forbidden.
- **Handling / Mitigation:** Login controller checks `user.isActive`. Middleware verifies user active status on sensitive operations and returns `{ success: false, error: { message: "Account is inactive", code: "ACCOUNT_INACTIVE" } }`.
- **Priority:** Medium
- **Security Impact:** Enables operational account suspension.

---

### EC-M2-012: Empty or Non-JSON Authentication Body
- **ID:** `EC-M2-012`
- **Scenario:** Client submits empty body `{}` or raw string to `/api/auth/login`.
- **Preconditions:** None.
- **Expected System Behavior:** Request fails validation cleanly with HTTP 400 Bad Request.
- **Handling / Mitigation:** Schema validation checks required presence of `email` and `password`.
- **Priority:** Low
- **Security Impact:** Protects against unhandled null-reference runtime exceptions.

---

### EC-M2-013: Expired or Malformed Password Reset Token
- **ID:** `EC-M2-013`
- **Scenario:** User attempts to reset password using an expired or forged reset token.
- **Preconditions:** Token was generated >15 minutes ago or is tampered with.
- **Expected System Behavior:** Request is rejected with HTTP 400 Bad Request.
- **Handling / Mitigation:** Controller checks SHA-256 hash match and `passwordResetExpires > Date.now()`. Returns `{ success: false, error: { message: "Invalid or expired password reset token", code: "INVALID_RESET_TOKEN" } }`.
- **Priority:** High
- **Security Impact:** Prevents credential hijacking via stale or forged recovery tokens.

---

### EC-M2-014: Non-Existent Account Forgot Password Request (Account Enumeration Defense)
- **ID:** `EC-M2-014`
- **Scenario:** User requests password reset for an unregistered or non-existent email address.
- **Preconditions:** No user account exists with the provided email.
- **Expected System Behavior:** System returns identical success confirmation message without revealing whether the email exists.
- **Handling / Mitigation:** Controller returns generic success message: `"If that email is registered, password reset instructions have been dispatched."`
- **Priority:** Medium
- **Security Impact:** Prevents account enumeration through the password recovery endpoint.
