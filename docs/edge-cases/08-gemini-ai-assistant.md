# Module 8 Edge Cases: Gemini AI Investigation Assistant
## Project: FraudShield — Real-Time Rule-Based Fraud Detection & Prevention Platform

---

### Document Information
- **Module ID:** `MOD-08`
- **Module Name:** Gemini AI Investigation Assistant
- **Document Path:** `docs/edge-cases/08-gemini-ai-assistant.md`
- **Version:** 1.0.0
- **Status:** Complete / Ready for Review
- **Parent Documents (Sources of Truth):**
  - `docs/FraudShield_SRS.md`
  - `docs/context.md`
  - `docs/implementation-plan.md`
  - `docs/plan/08-gemini-ai-assistant.md`

---

## 1. Overview

This document specifies the technical, resilience, and data governance edge cases for **Module 8: Gemini AI Investigation Assistant**. It addresses external LLM service degradation, latency timeouts, rate limiting, PII leakage prevention, hallucination boundaries, and the absolute architectural rule that AI must never possess decision or balance-mutation authority.

> **Non-Negotiable Architecture Invariant:** Gemini AI is strictly an **advisory co-pilot**. It cannot approve, reject, or block transactions, modify wallet balances, alter fraud scores, or override deterministic rules.

---

## 2. Edge Cases Catalog

### EC-M8-001: External Gemini API Degraded or Down (Network Outage / 503)
- **ID:** `EC-M8-001`
- **Scenario:** The Google Gemini API returns HTTP 500/503 or DNS resolution fails when an admin clicks "Analyze with Gemini".
- **Preconditions:** Admin requests on-demand analysis during Gemini outage.
- **Expected System Behavior:** The backend does not crash with an unhandled exception. It catches the network error and returns a structured fallback payload with `isFallback: true`.
- **Handling / Mitigation:** Service wraps call in try-catch; returns `{ success: true, isFallback: true, message: "AI Assistant is temporarily offline. Core fraud evaluation and manual review tools remain fully operational." }`.
- **Priority:** Critical
- **Security Impact:** Ensures system resiliency; zero external single point of failure.

---

### EC-M8-002: Gemini API Latency Spike / Request Timeout (> 5,000ms)
- **ID:** `EC-M8-002`
- **Scenario:** Gemini API takes > 5,000 milliseconds to respond due to external model queue congestion.
- **Preconditions:** Outbound API call in progress.
- **Expected System Behavior:** The request is aborted at exactly 5,000ms. The admin receives a timeout notice immediately rather than hanging indefinitely.
- **Handling / Mitigation:** `Promise.race()` with a 5,000ms timer rejects the hanging request cleanly and invokes the fallback handler.
- **Priority:** High
- **Security Impact:** Protects backend thread availability and analyst responsiveness.

---

### EC-M8-003: Gemini API Quota Exhaustion / Rate Limiting (HTTP 429)
- **ID:** `EC-M8-003`
- **Scenario:** The project's API key hits requests-per-minute (RPM) or daily token quota limits.
- **Preconditions:** High volume of analyst inquiries.
- **Expected System Behavior:** Caught cleanly; logs quota warning and informs analyst that AI quota is temporarily reached without halting manual reviews.
- **Handling / Mitigation:** Error handler intercepts HTTP 429 status and provides descriptive fallback messaging.
- **Priority:** Medium
- **Security Impact:** Prevents application crashes during quota exhaustion.

---

### EC-M8-004: Accidental PII Transmission Attempt (PII Leakage Defense)
- **ID:** `EC-M8-004`
- **Scenario:** Transaction context prepared for Gemini contains customer email, raw phone number, full account numbers, or password hashes.
- **Preconditions:** Data sanitization pipeline executes prior to API dispatch.
- **Expected System Behavior:** The `piiSanitizer` filter strips or masks all PII before the prompt payload is constructed.
- **Handling / Mitigation:** Sanitizer replaces real names with synthetic tokens (`Customer_A`), masks account numbers (`ACC-***1234`), and discards credential fields. Automated tests verify zero plaintext PII in outbound strings.
- **Priority:** Critical
- **Security Impact:** Compliance with financial data privacy regulations.

---

### EC-M8-005: Customer Role Attempting to Invoke AI Endpoint
- **ID:** `EC-M8-005`
- **Scenario:** A customer user crafts an authenticated request to `POST /api/admin/reviews/:id/ai-analyze`.
- **Preconditions:** Authenticated user has `role: "customer"`.
- **Expected System Behavior:** Request is rejected with HTTP 403 Forbidden.
- **Handling / Mitigation:** Route is guarded with `authorizeRole(['admin'])`.
- **Priority:** Critical
- **Security Impact:** Prevents customer access to internal analytical tools.

---

### EC-M8-006: Gemini Response Hallucination or Contradictory Recommendations
- **ID:** `EC-M8-006`
- **Scenario:** Gemini model hallucinates an inaccurate conclusion (e.g., suggests "Transaction is safe" despite multiple high-risk rule triggers).
- **Preconditions:** AI generation completes.
- **Expected System Behavior:** The system logs the response as advisory text only. The deterministic Risk Score (e.g., 85 - High) and status (`FLAGGED_FOR_REVIEW`) remain 100% unchanged.
- **Handling / Mitigation:** UI and backend isolate AI output into a clearly labeled advisory co-pilot panel with zero automated state coupling.
- **Priority:** High
- **Security Impact:** Prevents non-deterministic LLM errors from compromising financial security.

---

### EC-M8-007: Empty or Malformed JSON Response from Gemini
- **ID:** `EC-M8-007`
- **Scenario:** Gemini returns empty content `""` or invalid text that fails schema parsing.
- **Preconditions:** API responds with HTTP 200 but malformed body.
- **Expected System Behavior:** Parser catches formatting error, logs warning, and delivers fallback structure rather than throwing runtime errors.
- **Handling / Mitigation:** Defensive JSON parser validates presence of `caseSummary`, `riskPatterns`, and `investigationChecklist`; supplies default fallback items if missing.
- **Priority:** Medium
- **Security Impact:** Ensures stable UI rendering.

---

### EC-M8-008: Caching AI Response on Repeat Invocations
- **ID:** `EC-M8-008`
- **Scenario:** An admin opens a flagged transaction that was already analyzed by Gemini previously.
- **Preconditions:** `transaction.aiInvestigation` already exists.
- **Expected System Behavior:** System returns the cached brief immediately without making a redundant paid API call to Google.
- **Handling / Mitigation:** Service checks if cached analysis exists before calling Gemini API.
- **Priority:** Low
- **Security Impact:** Conserves API quotas and provides instant UI rendering.
