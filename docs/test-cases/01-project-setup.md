# Module 1 Test Cases: Project Setup & Infrastructure
## Project: FraudShield — Real-Time Rule-Based Fraud Detection & Prevention Platform

---

### Document Information
- **Module ID:** `MOD-01`
- **Module Name:** Project Setup & Infrastructure
- **Document Path:** `docs/test-cases/01-project-setup.md`
- **Version:** 1.0.0
- **Status:** Complete / Executed & Passed
- **Parent Documents (Sources of Truth):**
  - `docs/FraudShield_SRS.md`
  - `docs/context.md`
  - `docs/implementation-plan.md`
  - `docs/plan/01-project-setup.md`
  - `docs/edge-cases/01-project-setup.md`

---

## 1. Overview

This document specifies the complete test suite (automated and manual) for **Module 1: Project Setup & Infrastructure**. Every test case validates a specific completion requirement or edge case before Module 1 can be considered verified and ready for git commit.

---

## 2. Test Cases Specification

### TC-M1-001: Backend Server Starts Successfully
- **Test Case ID:** `TC-M1-001`
- **Module:** `Module 1 — Project Setup & Infrastructure`
- **Scenario:** Backend HTTP server initializes and binds to the configured port without errors.
- **Preconditions:** Valid `.env` file present in `backend/` with defined `PORT` and `MONGODB_URI`.
- **Steps:**
  1. Open terminal in `backend/`.
  2. Execute `npm start` (or `npm run dev`).
  3. Observe console output.
- **Expected Result:** Server prints startup log indicating running status on configured port and successful database connection. Process remains active.
- **Test Type:** Manual / Smoke
- **Priority:** High
- **Status:** Passed

---

### TC-M1-002: Health Check Endpoint Returns Expected Healthy Response
- **Test Case ID:** `TC-M1-002`
- **Module:** `Module 1 — Project Setup & Infrastructure`
- **Scenario:** Public health check endpoint returns HTTP 200 with standardized JSON payload and database status.
- **Preconditions:** Backend server running and connected to MongoDB.
- **Steps:**
  1. Send `GET /api/health` request via Supertest or HTTP client (curl/Postman).
  2. Inspect response status code and headers.
  3. Validate JSON payload structure.
- **Expected Result:**
  - Status Code: `200 OK`
  - `success`: `true`
  - `message`: `"FraudShield API is running"`
  - `data.status`: `"healthy"`
  - `data.database`: `"connected"`
  - `data.timestamp`: Valid ISO 8601 string.
- **Test Type:** Automated (Supertest)
- **Priority:** High
- **Status:** Passed

---

### TC-M1-003: Unknown API Route Returns Standardized 404 Not Found
- **Test Case ID:** `TC-M1-003`
- **Module:** `Module 1 — Project Setup & Infrastructure`
- **Scenario:** Requests to non-existent endpoints are caught by the 404 handler and return uniform JSON.
- **Preconditions:** Express application initialized with 404 catch-all middleware.
- **Steps:**
  1. Send `GET /api/non-existent-route` request.
  2. Send `POST /random-endpoint` request.
  3. Inspect HTTP status code and response payload.
- **Expected Result:**
  - Status Code: `404 Not Found`
  - Payload matches: `{ "success": false, "error": { "message": "Route not found", "code": "NOT_FOUND" } }`
- **Test Type:** Automated (Supertest)
- **Priority:** Low
- **Status:** Passed

---

### TC-M1-004: Centralized Error Handling Middleware Catches Errors
- **Test Case ID:** `TC-M1-004`
- **Module:** `Module 1 — Project Setup & Infrastructure`
- **Scenario:** Handled and unhandled application errors are caught by centralized middleware and return uniform JSON 500 without crashing the process.
- **Preconditions:** Express app mounted with test route that forwards `next(new Error("Simulated test error"))`.
- **Steps:**
  1. Send request to simulated error route.
  2. Inspect HTTP status code and response body.
- **Expected Result:**
  - Status Code: `500 Internal Server Error`
  - Payload matches: `{ "success": false, "error": { "message": "Internal server error", "code": "INTERNAL_ERROR" } }`
  - Server process does not terminate.
- **Test Type:** Automated (Supertest)
- **Priority:** High
- **Status:** Passed

---

### TC-M1-005: JSON Request Body Limit Is Enforced (10kb Limit)
- **Test Case ID:** `TC-M1-005`
- **Module:** `Module 1 — Project Setup & Infrastructure`
- **Scenario:** Payloads exceeding the configured 10kb limit are rejected with HTTP 413.
- **Preconditions:** Express application configured with `express.json({ limit: '10kb' })`.
- **Steps:**
  1. Send a `POST /api/test-body` with a JSON payload exceeding 10,240 bytes (e.g., 15kb string).
  2. Inspect HTTP status code and response error.
- **Expected Result:**
  - Status Code: `413 Payload Too Large`
  - Centralized error handler formats response with error code indicating entity too large.
- **Test Type:** Automated (Supertest)
- **Priority:** High
- **Status:** Passed

---

### TC-M1-006: Allowed CORS Origin Is Permitted
- **Test Case ID:** `TC-M1-006`
- **Module:** `Module 1 — Project Setup & Infrastructure`
- **Scenario:** HTTP requests originating from the configured `CORS_ORIGIN` receive valid CORS response headers.
- **Preconditions:** Backend `.env` configured with `CORS_ORIGIN=http://localhost:5173`.
- **Steps:**
  1. Send `OPTIONS /api/health` with header `Origin: http://localhost:5173`.
  2. Inspect response headers.
- **Expected Result:**
  - Header `Access-Control-Allow-Origin` equals `http://localhost:5173`.
  - Header `Access-Control-Allow-Credentials` equals `true`.
- **Test Type:** Automated (Supertest)
- **Priority:** High
- **Status:** Passed

---

### TC-M1-007: Unauthorized CORS Origin Is Rejected
- **Test Case ID:** `TC-M1-007`
- **Module:** `Module 1 — Project Setup & Infrastructure`
- **Scenario:** Requests originating from untrusted/unauthorized domains are blocked from accessing cross-origin resources.
- **Preconditions:** Backend `.env` configured with `CORS_ORIGIN=http://localhost:5173`.
- **Steps:**
  1. Send request with header `Origin: http://unauthorized-domain.com`.
  2. Inspect response headers.
- **Expected Result:**
  - `Access-Control-Allow-Origin` header is absent or does not match the unauthorized origin.
- **Test Type:** Automated (Supertest)
- **Priority:** High
- **Status:** Passed

---

### TC-M1-008: Helmet Security Headers Are Present in Responses
- **Test Case ID:** `TC-M1-008`
- **Module:** `Module 1 — Project Setup & Infrastructure`
- **Scenario:** Standard security headers set by Helmet are returned on API responses.
- **Preconditions:** Express application initialized with `helmet()`.
- **Steps:**
  1. Send `GET /api/health`.
  2. Inspect response headers.
- **Expected Result:**
  - `X-Content-Type-Options: nosniff` present.
  - `X-Frame-Options: SAMEORIGIN` or `DENY` present.
  - `X-DNS-Prefetch-Control: off` present.
- **Test Type:** Automated (Supertest)
- **Priority:** Medium
- **Status:** Passed

---

### TC-M1-009: Environment Configuration Is Loaded Correctly
- **Test Case ID:** `TC-M1-009`
- **Module:** `Module 1 — Project Setup & Infrastructure`
- **Scenario:** Configuration module loads and exposes required settings from `.env`.
- **Preconditions:** Valid `.env` file present.
- **Steps:**
  1. Execute unit test importing `src/config/index.js`.
  2. Assert exposed configuration properties (`port`, `mongodbUri`, `jwtSecret`, `corsOrigin`).
- **Expected Result:** Configuration object contains exact parsed values from `.env`.
- **Test Type:** Automated (Jest Unit)
- **Priority:** Medium
- **Status:** Passed

---

### TC-M1-010: Invalid / Missing Environment Configuration Is Handled
- **Test Case ID:** `TC-M1-010`
- **Module:** `Module 1 — Project Setup & Infrastructure`
- **Scenario:** Missing mandatory variables (`MONGODB_URI`, `JWT_SECRET`) triggers validation error and safe process termination.
- **Preconditions:** Environment variables simulated as undefined.
- **Steps:**
  1. Invoke configuration validation function with missing `MONGODB_URI`.
  2. Observe thrown error or process exit behavior.
- **Expected Result:** Throws explicit error or logs descriptive missing parameter name without crashing silently.
- **Test Type:** Automated (Jest Unit)
- **Priority:** High
- **Status:** Passed

---

### TC-M1-011: MongoDB Connection Succeeds
- **Test Case ID:** `TC-M1-011`
- **Module:** `Module 1 — Project Setup & Infrastructure`
- **Scenario:** Mongoose connection manager successfully connects to running MongoDB instance.
- **Preconditions:** MongoDB daemon accessible at configured URI.
- **Steps:**
  1. Invoke `connectDB()` in test suite.
  2. Check `mongoose.connection.readyState`.
- **Expected Result:** `readyState === 1` (connected); connection event listener fires.
- **Test Type:** Automated (Integration)
- **Priority:** High
- **Status:** Passed

---

### TC-M1-012: MongoDB Connection Failure Is Handled Gracefully
- **Test Case ID:** `TC-M1-012`
- **Module:** `Module 1 — Project Setup & Infrastructure`
- **Scenario:** Invalid connection URI or offline database handled gracefully without unhandled promise rejections.
- **Preconditions:** Simulated invalid URI (e.g., `mongodb://localhost:99999/invalid`).
- **Steps:**
  1. Call `connectDB()` targeting unreachable URI.
  2. Catch rejection.
- **Expected Result:** Error caught cleanly; connection error logged; unhandled rejection does not escape.
- **Test Type:** Automated (Jest Integration)
- **Priority:** High
- **Status:** Passed

---

### TC-M1-013: Graceful Server Shutdown Operates Correctly
- **Test Case ID:** `TC-M1-013`
- **Module:** `Module 1 — Project Setup & Infrastructure`
- **Scenario:** Server teardown closes HTTP server and terminates database connections cleanly upon signal.
- **Preconditions:** Server and DB connections active.
- **Steps:**
  1. Trigger shutdown handler or invoke `disconnectDB()`.
  2. Check `mongoose.connection.readyState`.
- **Expected Result:** `mongoose.connection.readyState === 0` (disconnected); process completes teardown.
- **Test Type:** Automated / Manual
- **Priority:** Medium
- **Status:** Passed

---

### TC-M1-014: Frontend Development Server Starts Successfully
- **Test Case ID:** `TC-M1-014`
- **Module:** `Module 1 — Project Setup & Infrastructure`
- **Scenario:** Vite development server starts, compiles Tailwind styles, and renders landing UI.
- **Preconditions:** Frontend dependencies installed (`npm install` in `frontend/`).
- **Steps:**
  1. Run `npm run dev` in `frontend/`.
  2. Open browser to `http://localhost:5173`.
  3. Verify UI renders with styling.
- **Expected Result:** Browser displays FraudShield base landing screen with styled Tailwind elements without console errors.
- **Test Type:** Manual / Smoke
- **Priority:** High
- **Status:** Passed

---

### TC-M1-015: Axios Client Uses Configured API Base URL
- **Test Case ID:** `TC-M1-015`
- **Module:** `Module 1 — Project Setup & Infrastructure`
- **Scenario:** Axios instance config reads `VITE_API_URL` and prefixes API requests correctly.
- **Preconditions:** Frontend configured with `VITE_API_URL=http://localhost:5000/api`.
- **Steps:**
  1. Inspect `axiosClient.defaults.baseURL` in unit test or browser console.
  2. Issue test request to `/health`.
- **Expected Result:** Request URL dispatched matches `http://localhost:5000/api/health`.
- **Test Type:** Automated / Unit
- **Priority:** Medium
- **Status:** Passed

---

### TC-M1-016: Frontend Handles Backend-Unavailable Network Errors
- **Test Case ID:** `TC-M1-016`
- **Module:** `Module 1 — Project Setup & Infrastructure`
- **Scenario:** Frontend Axios interceptor catches network failure when backend is down and formats graceful error.
- **Preconditions:** Backend server stopped; frontend running.
- **Steps:**
  1. Trigger API health query from frontend while backend is offline.
  2. Observe UI state and response interceptor error handling.
- **Expected Result:** UI renders connection error message without unhandled JavaScript crashes.
- **Test Type:** Manual / Component
- **Priority:** Medium
- **Status:** Passed

---

## 3. Test Execution Summary

| Test Case ID | Test Description | Category | Result |
| :--- | :--- | :--- | :--- |
| `TC-M1-001` | Backend Server Starts Successfully | Smoke / Server Lifecycle | **PASSED** |
| `TC-M1-002` | Health Check Endpoint Returns Expected Healthy Response | Supertest / Integration | **PASSED** |
| `TC-M1-003` | Unknown API Route Returns Standardized 404 Not Found | Supertest / Error Handling | **PASSED** |
| `TC-M1-004` | Centralized Error Handling Middleware Catches Errors | Supertest / Error Handling | **PASSED** |
| `TC-M1-005` | JSON Request Body Limit Is Enforced (10kb Limit) | Supertest / Security | **PASSED** |
| `TC-M1-006` | Allowed CORS Origin Is Permitted | Supertest / Security | **PASSED** |
| `TC-M1-007` | Unauthorized CORS Origin Is Rejected | Supertest / Security | **PASSED** |
| `TC-M1-008` | Helmet Security Headers Are Present in Responses | Supertest / Security | **PASSED** |
| `TC-M1-009` | Environment Configuration Is Loaded Correctly | Jest / Unit | **PASSED** |
| `TC-M1-010` | Invalid / Missing Environment Configuration Is Handled | Jest / Unit | **PASSED** |
| `TC-M1-011` | MongoDB Connection Succeeds | Integration / Database | **PASSED** |
| `TC-M1-012` | MongoDB Connection Failure Is Handled Gracefully | Integration / Error Handling | **PASSED** |
| `TC-M1-013` | Graceful Server Shutdown Operates Correctly | Unit / Lifecycle | **PASSED** |
| `TC-M1-014` | Frontend Development Server Starts Successfully | Vite / Smoke | **PASSED** |
| `TC-M1-015` | Axios Client Uses Configured API Base URL | Axios / Client Config | **PASSED** |
| `TC-M1-016` | Frontend Handles Backend-Unavailable Network Errors | Component / Interceptor | **PASSED** |

**Total Tests:** 16 | **Passed:** 16 | **Failed:** 0 | **Skipped:** 0
**Execution Status:** ALL TESTS PASSED (100% Pass Rate)

