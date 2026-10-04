# Module 8 Test Cases: Gemini AI Investigation Assistant
## Project: FraudShield — Real-Time Rule-Based Fraud Detection & Prevention Platform

---

### Document Information
- **Module ID:** `MOD-08`
- **Module Name:** Gemini AI Investigation Assistant
- **Document Path:** `docs/test-cases/08-gemini-ai-assistant.md`
- **Version:** 1.0.0
- **Status:** Complete / Ready for Execution
- **Parent Documents (Sources of Truth):**
  - `docs/FraudShield_SRS.md`
  - `docs/context.md`
  - `docs/implementation-plan.md`
  - `docs/plan/08-gemini-ai-assistant.md`
  - `docs/edge-cases/08-gemini-ai-assistant.md`

---

## 1. Overview

This document specifies the unit, API, resilience, and security test cases for **Module 8: Gemini AI Investigation Assistant**. It verifies on-demand AI brief generation, PII sanitization filters, timeout and circuit breaker fallbacks, and the non-negotiable rule that AI output cannot alter deterministic decisions or wallet balances.

---

## 2. Test Cases Specification

### TC-M8-001: Admin Successfully Generates AI Brief On-Demand
- **Test Case ID:** `TC-M8-001`
- **Module ID:** `MOD-08`
- **Test Scenario:** Admin requests AI brief for a flagged transaction; receives structured summary and checklist.
- **Preconditions:** Flagged transaction exists; Gemini client mocked or live with valid API key.
- **Test Data:** `POST /api/admin/reviews/:id/ai-analyze` with header `Authorization: Bearer <admin_jwt>`
- **Steps:**
  1. Send request to analyze flagged transaction.
  2. Inspect response payload structure.
- **Expected Result:**
  - Status Code: `200 OK`
  - Response contains:
    - `caseSummary`: Non-empty string.
    - `riskPatterns`: Array of strings explaining rule interactions.
    - `investigationChecklist`: Array with 3–5 verification questions.
  - `isFallback`: `false`.
- **Test Type:** API / Integration
- **Priority:** High
- **Status:** Not Run

---

### TC-M8-002: PII Sanitization Assertion Before External Dispatch
- **Test Case ID:** `TC-M8-002`
- **Module ID:** `MOD-08`
- **Test Scenario:** Asserts that context dispatched to Gemini contains zero raw customer names, emails, passwords, or full account numbers.
- **Preconditions:** Transaction with customer email `john.doe@secret.com`, name `"Johnathan Doe"`, password hash, and raw IP.
- **Test Data:** Raw transaction context object.
- **Steps:**
  1. Pass object through `piiSanitizer.sanitizeContext()`.
  2. Inspect sanitized output string.
- **Expected Result:**
  - String does NOT contain `"john.doe@secret.com"`.
  - String does NOT contain `"Johnathan Doe"`.
  - String does NOT contain password hashes.
  - Names and identifiers replaced by synthetic tokens (`Customer_A`, `ACC-***9821`).
- **Test Type:** Unit / Security
- **Priority:** Critical
- **Status:** Not Run

---

### TC-M8-003: Gemini API Failure Returns Graceful Fallback
- **Test Case ID:** `TC-M8-003`
- **Module ID:** `MOD-08`
- **Test Scenario:** Mocking a 500 error from Gemini API triggers the resilient fallback handler without crashing the server.
- **Preconditions:** Gemini SDK mocked to reject with `new Error("Google API Unavailable (503)")`.
- **Test Data:** `POST /api/admin/reviews/:id/ai-analyze`
- **Steps:**
  1. Send request with mocked failure.
  2. Inspect HTTP status code and response body.
- **Expected Result:**
  - Status Code: `200 OK` or `503 Service Unavailable` with structured fallback.
  - Response contains `isFallback: true` and a user-friendly message explaining the AI co-pilot is offline.
  - Server process remains active and healthy.
- **Test Type:** Integration / Resilience
- **Priority:** Critical
- **Status:** Not Run

---

### TC-M8-004: Request Timeout Exceeding 5,000ms Triggers Fallback
- **Test Case ID:** `TC-M8-004`
- **Module ID:** `MOD-08`
- **Test Scenario:** An external API call delayed beyond 5,000ms is terminated by the internal timeout timer.
- **Preconditions:** Gemini SDK mocked to delay response by 7,000ms.
- **Test Data:** `POST /api/admin/reviews/:id/ai-analyze`
- **Steps:**
  1. Send analysis request.
  2. Assert elapsed time until response.
- **Expected Result:**
  - Request returns in approximately 5,000ms (+/- 100ms).
  - Returns fallback payload indicating request timed out.
- **Test Type:** Unit / Timeout
- **Priority:** High
- **Status:** Not Run

---

### TC-M8-005: Customer Blocked from Invoking AI Assistant
- **Test Case ID:** `TC-M8-005`
- **Module ID:** `MOD-08`
- **Test Scenario:** Customer token calling AI analysis route is rejected.
- **Preconditions:** Authenticated user with `role: "customer"`.
- **Test Data:** Header `Authorization: Bearer <customer_jwt>`
- **Steps:**
  1. Send `POST /api/admin/reviews/:id/ai-analyze`.
- **Expected Result:**
  - Status Code: `403 Forbidden`
  - Error: `"Access denied: insufficient permissions"`.
- **Test Type:** Security
- **Priority:** Critical
- **Status:** Not Run

---

### TC-M8-006: Advisory-Only Guarantee (AI Cannot Mutate State)
- **Test Case ID:** `TC-M8-006`
- **Module ID:** `MOD-08`
- **Test Scenario:** Verify that completing an AI analysis has ZERO impact on transaction status, risk score, or wallet balances.
- **Preconditions:** Transaction #101 in `FLAGGED_FOR_REVIEW` with score 55.
- **Test Data:** `POST /api/admin/reviews/101/ai-analyze`
- **Steps:**
  1. Query transaction state and sender/recipient wallet balances before call.
  2. Execute AI analysis call.
  3. Query transaction state and wallet balances after call.
- **Expected Result:**
  - Transaction `status` remains strictly `FLAGGED_FOR_REVIEW`.
  - Transaction `riskScore` remains strictly `55`.
  - Wallet balances remain completely unchanged.
- **Test Type:** Security / Architectural Invariant
- **Priority:** Critical
- **Status:** Not Run
