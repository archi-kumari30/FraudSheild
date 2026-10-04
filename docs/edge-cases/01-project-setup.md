# Module 1 Edge Cases: Project Setup & Infrastructure
## Project: FraudShield — Real-Time Rule-Based Fraud Detection & Prevention Platform

---

### Document Information
- **Module ID:** `MOD-01`
- **Module Name:** Project Setup & Infrastructure
- **Document Path:** `docs/edge-cases/01-project-setup.md`
- **Version:** 1.0.0
- **Status:** Complete / Ready for Review
- **Parent Documents (Sources of Truth):**
  - `docs/FraudShield_SRS.md`
  - `docs/context.md`
  - `docs/implementation-plan.md`
  - `docs/plan/01-project-setup.md`

---

## 1. Overview

This document specifies the technical and operational edge cases for **Module 1: Project Setup & Infrastructure**. It focuses strictly on infrastructure initialization, configuration resilience, environment validation, database lifecycle anomalies, networking, HTTP security, error handling, and client-server connectivity.

---

## 2. Edge Cases Catalog

### EC-M1-001: Missing Essential Backend Environment Variables
- **ID:** `EC-M1-001`
- **Scenario:** The backend process is started with a missing or unreadable `.env` file, or required variables (e.g., `PORT`, `MONGODB_URI`, `JWT_SECRET`) are undefined.
- **Expected Behavior:** The application must not start in an unconfigured, vulnerable, or indeterminate state.
- **Handling / Mitigation:** Centralized configuration loader (`src/config/index.js`) validates all mandatory keys during boot. If any key is missing or empty, it outputs an explicit console error detailing the missing variable and terminates immediately via `process.exit(1)`.
- **Priority:** High

---

### EC-M1-002: Malformed / Invalid MongoDB Connection String
- **ID:** `EC-M1-002`
- **Scenario:** `MONGODB_URI` is provided but contains a malformed URI syntax (e.g., missing protocol `mongodb://` or invalid host syntax).
- **Expected Behavior:** The server catches the URI parsing error cleanly without unhandled promise rejections.
- **Handling / Mitigation:** `mongoose.connect()` throws a connection/URI parsing error caught by the connection manager (`src/config/db.js`). A formatted error is logged, and the process exits gracefully with exit code 1.
- **Priority:** High

---

### EC-M1-003: MongoDB Unavailable During Server Startup
- **ID:** `EC-M1-003`
- **Scenario:** The MongoDB daemon or Atlas cluster is unreachable/down at the exact moment the backend server starts up.
- **Expected Behavior:** The server logs the connection failure. Depending on policy, the server refuses to serve requests requiring a database or logs the degraded state without silently hanging.
- **Handling / Mitigation:** `connectDB()` handles the initial connection failure with a clear error log. In production/development server boot, the process fails fast with an exit code rather than accepting traffic it cannot persist. In test environments, test harnesses report connection failure immediately.
- **Priority:** High

---

### EC-M1-004: Transient Database Connection Failure and Retry Behavior
- **ID:** `EC-M1-004`
- **Scenario:** Temporary network jitter causes initial connection attempt to fail, or intermittent connectivity occurs.
- **Expected Behavior:** The driver does not crash the Node.js event loop unhandled.
- **Handling / Mitigation:** Mongoose built-in connection pool and reconnect logic manage socket reconnects. Connection lifecycle event listeners (`error`, `disconnected`) log events with timestamps to standard error for operational observability.
- **Priority:** Medium

---

### EC-M1-005: Database Disconnect During Runtime
- **ID:** `EC-M1-005`
- **Scenario:** The MongoDB connection drops while the backend HTTP server is actively running and receiving incoming requests.
- **Expected Behavior:** The server continues running, logs the disconnection event, attempts to reconnect automatically, and reports degraded database status on health checks.
- **Handling / Mitigation:** Mongoose `connection.on('disconnected')` event handler logs the disconnection. The health check endpoint (`GET /api/health`) dynamically inspects `mongoose.connection.readyState` and returns `database: "disconnected"` rather than crashing.
- **Priority:** High

---

### EC-M1-006: Backend Port Already in Use (EADDRINUSE)
- **ID:** `EC-M1-006`
- **Scenario:** The configured `PORT` (e.g., `5000`) is already bound by another running process.
- **Expected Behavior:** The server catches the `EADDRINUSE` error cleanly instead of crashing with an uncaught exception stack dump.
- **Handling / Mitigation:** In `src/server.js`, error event listener attached to the HTTP server (`server.on('error')`) detects `err.code === 'EADDRINUSE'`. It outputs a human-readable instruction to change the `PORT` in `.env` or terminate the conflicting process, then exits cleanly.
- **Priority:** Medium

---

### EC-M1-007: Missing or Invalid Frontend API Base URL
- **ID:** `EC-M1-007`
- **Scenario:** The frontend `.env` file is missing `VITE_API_URL` or contains a trailing slash / malformed URL.
- **Expected Behavior:** The frontend Axios client does not fail silently or generate invalid concatenated request paths (e.g., `//api/health`).
- **Handling / Mitigation:** `src/api/axiosClient.js` provides a default fallback (`http://localhost:5000/api`) and normalizes trailing slashes before issuing requests.
- **Priority:** Medium

---

### EC-M1-008: Unauthorized CORS Origin Request
- **ID:** `EC-M1-008`
- **Scenario:** A browser from an unauthorized domain (e.g., `http://malicious-site.com`) makes an AJAX/Fetch request to the FraudShield API.
- **Expected Behavior:** The API rejects the cross-origin request; browser blocks response access due to missing/disallowed `Access-Control-Allow-Origin` header.
- **Handling / Mitigation:** Express CORS middleware verifies incoming `Origin` against `process.env.CORS_ORIGIN`. Disallowed origins are rejected or omitted from CORS headers without exposing internal data.
- **Priority:** High

---

### EC-M1-009: Missing or Mismatched Content-Type for JSON Requests
- **ID:** `EC-M1-009`
- **Scenario:** A client sends a `POST`/`PUT` request with a JSON payload but omits `Content-Type: application/json` or specifies `text/plain`.
- **Expected Behavior:** The server does not crash or parse invalid objects; `req.body` remains empty or unparsed safely.
- **Handling / Mitigation:** Body parser middleware only parses requests with matching MIME types. Subsequent route validators in later modules will validate body contents and reject empty payloads with standard 400 responses.
- **Priority:** Medium

---

### EC-M1-010: Request Payload Larger Than Configured Limit (Payload Too Large)
- **ID:** `EC-M1-010`
- **Scenario:** A client attempts to transmit a body larger than the configured `10kb` limit to trigger memory exhaustion.
- **Expected Behavior:** The server immediately terminates reading the body, prevents memory exhaustion, and returns HTTP 413.
- **Handling / Mitigation:** `express.json({ limit: '10kb' })` catches oversized payloads and passes an `entity.too.large` error to the centralized error handler, which returns `{ success: false, error: { message: "Payload too large", code: "PAYLOAD_TOO_LARGE" } }` with HTTP 413.
- **Priority:** High

---

### EC-M1-011: Unknown API Route Request (404 Not Found)
- **ID:** `EC-M1-011`
- **Scenario:** A client sends a request to a non-existent route (e.g., `GET /api/non-existent-endpoint` or `POST /random`).
- **Expected Behavior:** The server returns a standardized JSON 404 response instead of default Express HTML.
- **Handling / Mitigation:** Standardized 404 catch-all middleware placed after all mounted routes constructs a uniform JSON payload: `{ success: false, error: { message: "Route not found", code: "NOT_FOUND" } }` with HTTP 404.
- **Priority:** Low

---

### EC-M1-012: Unexpected Internal Server Error (500)
- **ID:** `EC-M1-012`
- **Scenario:** An unexpected runtime exception or unhandled synchronous/asynchronous error occurs inside a route handler.
- **Expected Behavior:** The request does not hang indefinitely; server returns a standardized HTTP 500 JSON response and remains alive.
- **Handling / Mitigation:** Centralized error handling middleware `(err, req, res, next)` intercepts all forwarded errors via `next(err)` and returns standardized `{ success: false, error: { message: "Internal server error", code: "INTERNAL_ERROR" } }`.
- **Priority:** High

---

### EC-M1-013: Production Error Response Must Not Expose Sensitive Internals
- **ID:** `EC-M1-013`
- **Scenario:** An unhandled error occurs when `NODE_ENV === 'production'`, generating a raw error stack containing file paths, libraries, or internal variables.
- **Expected Behavior:** Zero stack traces or sensitive internal paths are sent to the client.
- **Handling / Mitigation:** Centralized error handler explicitly checks `process.env.NODE_ENV`. In production, `stack` property is deleted or omitted from the response JSON, providing only sanitized error messages.
- **Priority:** High

---

### EC-M1-014: Graceful Server Shutdown Signals (SIGINT / SIGTERM)
- **ID:** `EC-M1-014`
- **Scenario:** The process manager or OS sends a termination signal (`SIGINT` via Ctrl+C, `SIGTERM` in containerized environments).
- **Expected Behavior:** Active HTTP requests are completed, no new connections are accepted, MongoDB connections are closed cleanly, and process exits with 0.
- **Handling / Mitigation:** Handlers for `SIGINT` and `SIGTERM` invoke `server.close()`, followed by `disconnectDB()`, logging each step before executing `process.exit(0)`.
- **Priority:** Medium

---

### EC-M1-015: Frontend Running While Backend Is Unavailable
- **ID:** `EC-M1-015`
- **Scenario:** The React client is rendered in the browser, but the backend API server is down, restarting, or unreachable due to network failure.
- **Expected Behavior:** The frontend does not crash with unhandled JavaScript errors; it informs the user gracefully of connection issues.
- **Handling / Mitigation:** Axios response interceptor intercepts `ERR_NETWORK` or `ECONNREFUSED` and translates them into a standardized user-friendly error object rather than breaking the UI.
- **Priority:** Medium

---

### EC-M1-016: Health Endpoint When Database Is Unavailable
- **ID:** `EC-M1-016`
- **Scenario:** Client checks `GET /api/health` when MongoDB is disconnected or connecting.
- **Expected Behavior:** The endpoint returns HTTP 200 or 503 accurately reflecting system status without throwing an unhandled error.
- **Handling / Mitigation:** `healthRoutes.js` queries `mongoose.connection.readyState`. If disconnected (`readyState !== 1`), it returns `database: "disconnected"` with status `"degraded"`, maintaining full transparency of system health.
- **Priority:** Medium
