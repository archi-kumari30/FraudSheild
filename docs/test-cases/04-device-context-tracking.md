# Module 4 Test Cases: Device & Context Tracking
## Project: FraudShield — Real-Time Rule-Based Fraud Detection & Prevention Platform

---

### Document Information
- **Module ID:** `MOD-04`
- **Module Name:** Device & Context Tracking
- **Document Path:** `docs/test-cases/04-device-context-tracking.md`
- **Version:** 1.0.0
- **Status:** Complete / Executed & Passed
- **Parent Documents (Sources of Truth):**
  - `docs/FraudShield_SRS.md`
  - `docs/context.md`
  - `docs/implementation-plan.md`
  - `docs/plan/04-device-context-tracking.md`
  - `docs/edge-cases/04-device-context-tracking.md`

---

## 1. Overview

This document specifies the test cases for **Module 4: Device & Context Tracking**. It verifies application-level device identifier capture (`x-device-id`), user-agent parsing, IP extraction, and historical device recognition.

---

## 2. Test Cases Specification

### TC-M4-001: Device Context Middleware Attaches Normalized Context
- **Test Case ID:** `TC-M4-001`
- **Module ID:** `MOD-04`
- **Test Scenario:** Middleware parses headers and attaches `req.deviceContext`.
- **Preconditions:** Express application with `deviceContextMiddleware` mounted.
- **Test Data:** Headers: `x-device-id: "dev-uuid-12345"`, `User-Agent: "Mozilla/5.0 Chrome/120"`
- **Steps:**
  1. Send request with specified headers to a test route inspecting `req.deviceContext`.
  2. Assert context properties.
- **Expected Result:**
  - `req.deviceContext.deviceId` equals `"dev-uuid-12345"`.
  - `req.deviceContext.userAgent` contains `"Chrome/120"`.
  - `req.deviceContext.ipAddress` is resolved.
- **Test Type:** Unit / Middleware
- **Priority:** High
- **Status:** Passed

---

### TC-M4-002: Missing `x-device-id` Handled Gracefully
- **Test Case ID:** `TC-M4-002`
- **Module ID:** `MOD-04`
- **Test Scenario:** Request sent without `x-device-id` header does not crash and marks context as unverified.
- **Preconditions:** Express app running.
- **Test Data:** Request with zero custom device headers.
- **Steps:**
  1. Send request to endpoint without `x-device-id`.
  2. Inspect `req.deviceContext`.
- **Expected Result:**
  - Middleware completes without throwing.
  - `req.deviceContext.deviceId` set to fallback `"unspecified-device"`.
  - `req.deviceContext.isVerified` equals `false`.
- **Test Type:** Unit / Resilience
- **Priority:** High
- **Status:** Passed

---

### TC-M4-003: Unrecognized Device Correctly Identified as New
- **ID:** `TC-M4-003`
- **Module ID:** `MOD-04`
- **Test Scenario:** `deviceService.isKnownDevice()` returns `false` for a device not in user history.
- **Preconditions:** User exists; device `"unseen-device-999"` has 0 records in `user_devices`.
- **Test Data:** `userId: user._id`, `deviceId: "unseen-device-999"`
- **Steps:**
  1. Call `deviceService.isKnownDevice(userId, "unseen-device-999")`.
- **Expected Result:** Returns `false`.
- **Test Type:** Unit / Service
- **Priority:** High
- **Status:** Passed

---

### TC-M4-004: Previously Registered Device Correctly Identified as Known
- **ID:** `TC-M4-004`
- **Module ID:** `MOD-04`
- **Test Scenario:** Device registered during past session returns `true` on subsequent checks.
- **Preconditions:** `deviceService.registerDevice(userId, { deviceId: "known-device-101" })` executed.
- **Test Data:** `userId: user._id`, `deviceId: "known-device-101"`
- **Steps:**
  1. Call `deviceService.isKnownDevice(userId, "known-device-101")`.
- **Expected Result:** Returns `true`.
- **Test Type:** Integration
- **Priority:** High
- **Status:** Passed

---

### TC-M4-005: Customer Queries Registered Devices (`GET /api/devices`)
- **ID:** `TC-M4-005`
- **Module ID:** `MOD-04`
- **Test Scenario:** Authenticated user retrieves list of their registered devices.
- **Preconditions:** User has 2 registered devices.
- **Test Data:** Header `Authorization: Bearer <customer_jwt>`
- **Steps:**
  1. Send `GET /api/devices`.
  2. Inspect response array.
- **Expected Result:**
  - Status Code: `200 OK`
  - Returns array with 2 device records containing `deviceId`, `firstSeenAt`, `lastSeenAt`.
- **Test Type:** API
- **Priority:** Medium
- **Status:** Passed

---

### TC-M4-006: Device Registry Isolation Between Users
- **ID:** `TC-M4-006`
- **Module ID:** `MOD-04`
- **Test Scenario:** Device registered to User A is NOT considered known for User B.
- **Preconditions:** Device `"shared-pc-01"` registered for User A. User B has never logged in from it.
- **Test Data:** `isKnownDevice(userB._id, "shared-pc-01")`
- **Steps:**
  1. Query device status for User B with User A's device ID.
- **Expected Result:** Returns `false`.
- **Test Type:** Security / Isolation
- **Priority:** High
- **Status:** Passed

---

## 3. Test Execution Summary

| Test Case ID | Test Description | Category | Result |
| :--- | :--- | :--- | :--- |
| `TC-M4-001` | Device Context Middleware Attaches Normalized Context | Middleware / Unit | **PASSED** |
| `TC-M4-002` | Missing `x-device-id` Handled Gracefully | Middleware / Resilience | **PASSED** |
| `TC-M4-003` | Unrecognized Device Correctly Identified as New | Service / Unit | **PASSED** |
| `TC-M4-004` | Previously Registered Device Correctly Identified as Known | Integration | **PASSED** |
| `TC-M4-005` | Customer Queries Registered Devices (`GET /api/devices`) | API | **PASSED** |
| `TC-M4-006` | Device Registry Isolation Between Users | Security / Isolation | **PASSED** |

**Total Tests:** 6 | **Passed:** 6 | **Failed:** 0 | **Skipped:** 0
**Execution Status:** ALL TESTS PASSED (100% Pass Rate)

