# Module 11 Edge Cases: Frontend Analyst Dashboard
## Project: FraudShield — Real-Time Rule-Based Fraud Detection & Prevention Platform

---

### Document Information
- **Module ID:** `MOD-11`
- **Module Name:** Frontend Analyst Dashboard
- **Document Path:** `docs/edge-cases/11-frontend-analyst-dashboard.md`
- **Version:** 1.0.0
- **Status:** Complete / Ready for Review
- **Parent Documents (Sources of Truth):**
  - `docs/FraudShield_SRS.md`
  - `docs/context.md`
  - `docs/implementation-plan.md`
  - `docs/plan/11-frontend-analyst-dashboard.md`

---

## 1. Overview

This document specifies the technical and interface edge cases for **Module 11: Frontend Analyst Dashboard**. It addresses role-based route guards, review queue concurrency, Gemini AI co-pilot fallback visualization, manual resolution validation, and audit trail rendering.

---

## 2. Edge Cases Catalog

### EC-M11-001: Customer User Attempting to Access `/admin/*` Routes
- **ID:** `EC-M11-001`
- **Scenario:** A customer logs in and manually types `http://localhost:5173/admin/dashboard` in the browser URL bar.
- **Preconditions:** Authenticated user with `role: "customer"`.
- **Expected System Behavior:** Access is blocked; user is redirected to `/dashboard` with an error toast: *"Access denied: Administrator privileges required."*
- **Handling / Mitigation:** `AdminRoute.jsx` checks `user.role === 'admin'`. If false, navigates to `/dashboard`.
- **Priority:** Critical
- **Security Impact:** Enforces client-side administrative route boundary.

---

### EC-M11-002: Concurrent Admin Resolution (Case Already Resolved by Another Analyst)
- **ID:** `EC-M11-002`
- **Scenario:** Analyst A and Analyst B both view Case #123. Analyst A approves it. A moment later, Analyst B attempts to submit a rejection on the same modal.
- **Preconditions:** Backend returns HTTP 409 Conflict (`"Transaction already resolved"`).
- **Expected System Behavior:** The UI catches the 409 error, displays an informative alert: *"This transaction was already resolved by another administrator."*, closes the modal, and automatically refreshes the queue to remove the item.
- **Handling / Mitigation:** Resolve modal error handler intercepts 409, refreshes local queue state, and updates counters.
- **Priority:** Critical
- **Security Impact:** Prevents state desynchronization in multi-analyst teams.

---

### EC-M11-003: Gemini AI Service Offline During "Analyze with Gemini" Request
- **ID:** `EC-M11-003`
- **Scenario:** Analyst clicks "Analyze with Gemini" while Google Gemini API is degraded or backend returns a fallback payload (`isFallback: true`).
- **Preconditions:** AI service offline.
- **Expected System Behavior:** The AI panel does not crash or throw unhandled JavaScript errors. It displays an amber notice: *"AI Assistant is temporarily offline. You may proceed with manual review using the deterministic rule breakdown below."* Manual resolution buttons remain 100% active.
- **Handling / Mitigation:** `AiCopilotPanel.jsx` checks `data.isFallback` or network error; gracefully renders fallback UI.
- **Priority:** High
- **Security Impact:** Asserts that AI outages never block human review or core operations.

---

### EC-M11-004: Validation Guard on Resolution Notes (< 10 Characters)
- **ID:** `EC-M11-004`
- **Scenario:** Analyst types 5 characters into the resolution notes textarea and attempts to click "Approve".
- **Preconditions:** Analyst in resolve modal.
- **Expected System Behavior:** The "Confirm Action" button remains disabled until at least 10 non-whitespace characters are entered.
- **Handling / Mitigation:** Button state binds to `notes.trim().length >= 10`. Character counter indicator displays `(X/10 min characters)`.
- **Priority:** High
- **Security Impact:** Enforces compliance accountability and prevents empty audit records.

---

### EC-M11-005: Visual Separation Between Deterministic Score and Advisory AI
- **ID:** `EC-M11-005`
- **Scenario:** Analyst inspects case detail screen with both rule scores and Gemini insights.
- **Preconditions:** Modal rendering both panels.
- **Expected System Behavior:** The UI clearly separates the two domains:
  - Top card: *"Authoritative Rule-Based Risk Assessment"* with exact points (e.g. 55/100) and triggered reason codes.
  - Distinct co-pilot card: *"Gemini AI Co-Pilot (Advisory Only - No Decision Authority)"*.
- **Handling / Mitigation:** Explicit visual badges and styling prevent confusion between deterministic facts and generative advice.
- **Priority:** High
- **Security Impact:** Reinforces deterministic governance model.

---

### EC-M11-006: Empty Review Queue (Zero Pending Flagged Cases)
- **ID:** `EC-M11-006`
- **Scenario:** All flagged cases have been resolved; review queue is completely empty.
- **Preconditions:** 0 transactions in `FLAGGED_FOR_REVIEW`.
- **Expected System Behavior:** Table displays a clean state with a shield checkmark icon: *"All clear! No transactions currently require manual review."*
- **Handling / Mitigation:** Component renders empty queue card without console warnings.
- **Priority:** Low
- **Security Impact:** Normal operational UI state.
