# Module 2 Test Cases: Authentication & Authorization (RBAC)
## Project: FraudShield — Real-Time Rule-Based Fraud Detection & Prevention Platform

---

### Document Information
- **Module ID:** `MOD-02`
- **Module Name:** Authentication & Authorization
- **Document Path:** `docs/test-cases/02-authentication-authorization.md`
- **Version:** 1.0.0
- **Status:** Complete / Ready for Execution
- **Parent Documents (Sources of Truth):**
  - `docs/FraudShield_SRS.md`
  - `docs/context.md`
  - `docs/implementation-plan.md`
  - `docs/plan/02-authentication-authorization.md`
  - `docs/edge-cases/02-authentication-authorization.md`

---

## 1. Overview

This document specifies the test cases for **Module 2: Authentication & Authorization (RBAC)**. It covers customer registration, login verification, password hashing, JWT issuance and lifecycle, role-based access restrictions, and boundary security.

---

## 2. Test Cases Specification

### TC-M2-001: Successful Customer Registration
- **Test Case ID:** `TC-M2-001`
- **Module ID:** `MOD-02`
- **Test Scenario:** Valid customer registration payload creates a new user and returns JWT.
- **Preconditions:** Email `alice@example.com` does not exist in database.
- **Test Data:** `{ "name": "Alice Smith", "email": "alice@example.com", "password": "Password123!" }`
- **Steps:**
  1. Send `POST /api/auth/register` with test payload.
  2. Inspect HTTP status code and response body.
  3. Verify database record in `users` collection.
- **Expected Result:**
  - Status Code: `201 Created`
  - Response contains `success: true`, `token` (valid JWT string), and `user` object.
  - `user.passwordHash` is excluded from the response.
  - Database stores bcrypt-hashed password; `role` equals `'customer'`.
- **Test Type:** API / Integration
- **Priority:** High
- **Status:** Not Run

---

### TC-M2-002: Duplicate Email Registration Rejection
- **Test Case ID:** `TC-M2-002`
- **Module ID:** `MOD-02`
- **Test Scenario:** Registration with an already registered email is rejected.
- **Preconditions:** User with `email: "alice@example.com"` already registered.
- **Test Data:** `{ "name": "Alice Duplicate", "email": "alice@example.com", "password": "Password123!" }`
- **Steps:**
  1. Send `POST /api/auth/register` with duplicate email.
  2. Inspect HTTP status code.
- **Expected Result:**
  - Status Code: `409 Conflict`
  - Error message: `"Email already registered"`.
- **Test Type:** API / Security
- **Priority:** High
- **Status:** Not Run

---

### TC-M2-003: Registration Payload Role Tampering (Privilege Escalation Prevention)
- **Test Case ID:** `TC-M2-003`
- **Module ID:** `MOD-02`
- **Test Scenario:** Attacker supplies `role: 'admin'` in registration payload.
- **Preconditions:** None.
- **Test Data:** `{ "name": "Attacker", "email": "attacker@example.com", "password": "Password123!", "role": "admin" }`
- **Steps:**
  1. Send `POST /api/auth/register` with payload containing `role: "admin"`.
  2. Check registered user record in database.
- **Expected Result:**
  - User is created with `role: "customer"`.
  - Client cannot self-promote to `admin`.
- **Test Type:** Security
- **Priority:** Critical
- **Status:** Not Run

---

### TC-M2-004: Successful Customer Login
- **Test Case ID:** `TC-M2-004`
- **Module ID:** `MOD-02`
- **Test Scenario:** Valid credentials return HTTP 200 and signed JWT.
- **Preconditions:** Registered user `alice@example.com` with password `Password123!`.
- **Test Data:** `{ "email": "alice@example.com", "password": "Password123!" }`
- **Steps:**
  1. Send `POST /api/auth/login`.
  2. Validate response structure.
- **Expected Result:**
  - Status Code: `200 OK`
  - Response contains valid `token` and `user` object with `role: "customer"`.
- **Test Type:** API / Integration
- **Priority:** High
- **Status:** Not Run

---

### TC-M2-005: Login with Incorrect Password
- **Test Case ID:** `TC-M2-005`
- **Module ID:** `MOD-02`
- **Test Scenario:** Valid email with wrong password fails with generic 401 error.
- **Preconditions:** Registered user exists.
- **Test Data:** `{ "email": "alice@example.com", "password": "WrongPassword999!" }`
- **Steps:**
  1. Send `POST /api/auth/login`.
  2. Inspect HTTP status and error.
- **Expected Result:**
  - Status Code: `401 Unauthorized`
  - Message: `"Invalid email or password"`.
- **Test Type:** Security / API
- **Priority:** High
- **Status:** Not Run

---

### TC-M2-006: Authenticated Profile Retrieval (`GET /api/auth/me`)
- **Test Case ID:** `TC-M2-006`
- **Module ID:** `MOD-02`
- **Test Scenario:** Valid Bearer token returns profile of authenticated user.
- **Preconditions:** Valid JWT obtained via login.
- **Test Data:** Header `Authorization: Bearer <valid_jwt>`
- **Steps:**
  1. Send `GET /api/auth/me` with header.
  2. Inspect response payload.
- **Expected Result:**
  - Status Code: `200 OK`
  - Returns user ID, name, email, role. Password hash is absent.
- **Test Type:** API / Integration
- **Priority:** Medium
- **Status:** Not Run

---

### TC-M2-007: Missing Authorization Header Rejection
- **Test Case ID:** `TC-M2-007`
- **Module ID:** `MOD-02`
- **Test Scenario:** Request to protected route without header returns HTTP 401.
- **Preconditions:** None.
- **Test Data:** No Authorization header.
- **Steps:**
  1. Send `GET /api/auth/me`.
- **Expected Result:**
  - Status Code: `401 Unauthorized`
  - Error: `"Authentication token required"`.
- **Test Type:** Security
- **Priority:** High
- **Status:** Not Run

---

### TC-M2-008: Role Guard Blocks Customer from Admin Route
- **Test Case ID:** `TC-M2-008`
- **Module ID:** `MOD-02`
- **Test Scenario:** Customer token attempting to access admin-only route returns HTTP 403.
- **Preconditions:** Valid customer token; route guarded with `authorizeRole(['admin'])`.
- **Test Data:** Header `Authorization: Bearer <customer_jwt>`
- **Steps:**
  1. Send request to an admin-guarded test route.
- **Expected Result:**
  - Status Code: `403 Forbidden`
  - Error: `"Access denied: insufficient permissions"`.
- **Test Type:** Security
- **Priority:** Critical
- **Status:** Not Run

---

### TC-M2-009: Admin Seed Script Successfully Provisions Default Administrator
- **Test Case ID:** `TC-M2-009`
- **Module ID:** `MOD-02`
- **Test Scenario:** Execution of `seedAdmin.js` reads environment variables and creates admin user.
- **Preconditions:** Environment variables `ADMIN_EMAIL`, `ADMIN_PASSWORD` defined.
- **Test Data:** CLI command `node src/scripts/seedAdmin.js`
- **Steps:**
  1. Run seed script.
  2. Query database for user with `email = process.env.ADMIN_EMAIL`.
  3. Attempt login with admin credentials.
- **Expected Result:**
  - Admin user created with `role: "admin"`.
  - Login returns valid admin JWT.
- **Test Type:** Integration / Script
- **Priority:** High
- **Status:** Not Run
