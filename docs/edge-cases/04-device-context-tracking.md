# Module 4 Edge Cases: Device & Context Tracking
## Project: FraudShield — Real-Time Rule-Based Fraud Detection & Prevention Platform

---

### Document Information
- **Module ID:** `MOD-04`
- **Module Name:** Device & Context Tracking
- **Document Path:** `docs/edge-cases/04-device-context-tracking.md`
- **Version:** 1.0.0
- **Status:** Complete / Ready for Review
- **Parent Documents (Sources of Truth):**
  - `docs/FraudShield_SRS.md`
  - `docs/context.md`
  - `docs/implementation-plan.md`
  - `docs/plan/04-device-context-tracking.md`

---

## 1. Overview

This document specifies the technical and operational edge cases for **Module 4: Device & Context Tracking**. It addresses application-level device telemetry capture, identifier anomalies, user-agent parsing, IP extraction, and session consistency.

> **Foundational Principle:** The `x-device-id` value is strictly an **application-level identifier** passed by the frontend to assist the rule-based fraud engine in evaluating behavioral familiarity (`RULE_DEVICE_NEW`). It is **NOT** a cryptographically secure device fingerprint and must never be treated as proof of identity.

---

## 2. Edge Cases Catalog

### EC-M4-001: Missing `x-device-id` Request Header
- **ID:** `EC-M4-001`
- **Scenario:** A client (e.g., custom script or curl command) submits a request without including the `x-device-id` HTTP header.
- **Preconditions:** Authenticated API call.
- **Expected System Behavior:** The middleware does not crash. It either tags the device context as `"unspecified-device"` or generates a temporary request-scoped session identifier and treats it as unrecognized (`isKnownDevice === false`).
- **Handling / Mitigation:** `deviceContextMiddleware` detects missing header, sets `deviceId = 'unspecified-device'`, and flags context as unverified. In Module 5, this ensures `RULE_DEVICE_NEW` triggers (+25 points) rather than bypassing security.
- **Priority:** High
- **Security Impact:** Prevents attackers from bypassing new device fraud rules by omitting headers.

---

### EC-M4-002: Empty or Whitespace-Only `x-device-id` Header
- **ID:** `EC-M4-002`
- **Scenario:** Request header is provided as `x-device-id: ""` or `x-device-id: "   "`.
- **Preconditions:** Authenticated request.
- **Expected System Behavior:** Treated identically to a missing device header; normalized to `"invalid-device-id"` and marked as unrecognized.
- **Handling / Mitigation:** Middleware trims string; if length < 10, sanitizes to default fallback and flags as unrecognized.
- **Priority:** Medium
- **Security Impact:** Prevents empty string index matching across unrelated users.

---

### EC-M4-003: Malformed or Suspicious Character Injection in `x-device-id`
- **ID:** `EC-M4-003`
- **Scenario:** Attacker passes SQL/NoSQL injection or script tags in the header (e.g., `x-device-id: {"$gt": ""}` or `<script>alert(1)</script>`).
- **Preconditions:** Authenticated request.
- **Expected System Behavior:** The header value is strictly cast to string and validated against an alphanumeric regex before database query.
- **Handling / Mitigation:** Regex validation permits only `^[a-zA-Z0-9_-]{10,100}$`. Invalid strings are sanitized or rejected with HTTP 400.
- **Priority:** High
- **Security Impact:** Prevents NoSQL injection and header exploitation.

---

### EC-M4-004: First-Time Login / Transaction from Unrecognized Device
- **ID:** `EC-M4-004`
- **Scenario:** A legitimate user logs in or initiates a transfer from a new browser or computer for the first time.
- **Preconditions:** `deviceId` has never been recorded for this `userId`.
- **Expected System Behavior:** Device service returns `isKnownDevice === false`. Device is marked as new, allowing Module 5 to evaluate `RULE_DEVICE_NEW`.
- **Handling / Mitigation:** `isKnownDevice(userId, deviceId)` queries `user_devices`. When zero records match, returns `false`. After an approved transaction or login, device is registered into the registry.
- **Priority:** High
- **Security Impact:** Core trigger for new-device risk assessment.

---

### EC-M4-005: Same Device Identifier Reused Across Multiple Distinct User Accounts
- **ID:** `EC-M4-005`
- **Scenario:** Two different family members or users share the same physical computer and browser; both requests send the identical `x-device-id`.
- **Preconditions:** Two distinct user IDs share the same `deviceId`.
- **Expected System Behavior:** Device recognition is scoped strictly per-user (`{ userId, deviceId }`).
- **Handling / Mitigation:** The database query strictly matches both `userId` and `deviceId`. A device being known for User A does not automatically mark it as known for User B.
- **Priority:** Medium
- **Security Impact:** Prevents cross-account device contamination.

---

### EC-M4-006: Client Clearing Local Storage / Recreating Device Identifier
- **ID:** `EC-M4-006`
- **Scenario:** Customer clears their browser cookies and `localStorage`, causing the frontend to generate a fresh new UUID.
- **Preconditions:** Legitimate user with cleared browser storage.
- **Expected System Behavior:** System treats the new UUID as an unrecognized device (`isKnownDevice === false`).
- **Handling / Mitigation:** The fraud engine will evaluate the new device rule (+25 points). Because the score is only 25 (Low Risk, < 30), a normal transfer will still be approved without friction, demonstrating the resilience of composite scoring.
- **Priority:** Medium
- **Security Impact:** Normal behavioral handling without false-positive lockouts.

---

### EC-M4-007: Device Identifier Spoofing (Header Replay)
- **ID:** `EC-M4-007`
- **Scenario:** An attacker learns a victim's `x-device-id` and manually replays it in HTTP requests.
- **Preconditions:** Attacker has intercepted previous traffic or logs.
- **Expected System Behavior:** The system matches the device ID, but `x-device-id` alone NEVER grants authentication or bypasses password/JWT verification.
- **Handling / Mitigation:** Architecture enforces that `x-device-id` is only one of six fraud signals and has zero authentication authority. Other rules (e.g. `RULE_AMT_EXTREME`, `RULE_VELOCITY_HIGH`, `RULE_BENEFICIARY_NEW`) remain fully active.
- **Priority:** Critical
- **Security Impact:** Reinforces that device identifiers are advisory heuristic inputs, not security proofs.

---

### EC-M4-008: Missing or Forwarded Client IP Telemetry
- **ID:** `EC-M4-008`
- **Scenario:** Request passes through reverse proxies, CDNs, or load balancers stripping standard remote address.
- **Preconditions:** Proxied request.
- **Expected System Behavior:** Middleware parses `x-forwarded-for` cleanly, taking the client IP, or falls back to `req.socket.remoteAddress`.
- **Handling / Mitigation:** Standard proxy resolution helper extracts the primary client IP address cleanly without throwing exceptions.
- **Priority:** Low
- **Security Impact:** Ensures audit log and context telemetry completeness.
