# Module 10 Edge Cases: Frontend Customer Portal
## Project: FraudShield — Real-Time Rule-Based Fraud Detection & Prevention Platform

---

### Document Information
- **Module ID:** `MOD-10`
- **Module Name:** Frontend Customer Portal
- **Document Path:** `docs/edge-cases/10-frontend-customer-portal.md`
- **Version:** 1.0.0
- **Status:** Complete / Ready for Review
- **Parent Documents (Sources of Truth):**
  - `docs/FraudShield_SRS.md`
  - `docs/context.md`
  - `docs/implementation-plan.md`
  - `docs/plan/10-frontend-customer-portal.md`

---

## 1. Overview

This document specifies the technical, user interface, and state management edge cases for **Module 10: Frontend Customer Portal**. It addresses client-side session expiry, unauthenticated access, network failures, loading state transitions, form validation anomalies, and transaction status representation.

---

## 2. Edge Cases Catalog

### EC-M10-001: Unauthenticated Visitor Accessing Customer Dashboard
- **ID:** `EC-M10-001`
- **Scenario:** A user navigates directly to `http://localhost:5173/dashboard` without a valid token in storage.
- **Preconditions:** No JWT present in `localStorage` or `AuthContext`.
- **Expected System Behavior:** User is immediately redirected to `/login` with an informative toast notice.
- **Handling / Mitigation:** `ProtectedRoute.jsx` checks `isAuthenticated`. If false, redirects to `/login` with `replace: true`.
- **Priority:** High
- **Security Impact:** Prevents rendering private account UI shells to unauthenticated users.

---

### EC-M10-002: Token Expiration During Active Client Session
- **ID:** `EC-M10-002`
- **Scenario:** A customer is active on the dashboard, but their 24-hour JWT expires, causing the next API call to return HTTP 401.
- **Preconditions:** Stale JWT in browser.
- **Expected System Behavior:** The UI catches the 401 response, clears expired tokens, resets auth state, and redirects to `/login` with a message: *"Session expired. Please log in again."*
- **Handling / Mitigation:** Axios response interceptor intercepts 401 status, dispatches `logout()`, and redirects cleanly without infinite redirect loops.
- **Priority:** High
- **Security Impact:** Ensures timely session termination on token expiration.

---

### EC-M10-003: Double-Clicking / Rapid Multiple Clicks on "Send Money" Button
- **ID:** `EC-M10-003`
- **Scenario:** Customer eagerly clicks the "Send Money" submit button multiple times before the first API request resolves.
- **Preconditions:** Transfer form valid; user clicks button 3 times in 100ms.
- **Expected System Behavior:** Exactly one API request is dispatched; submit button immediately disables and displays a loading spinner.
- **Handling / Mitigation:** Form state sets `isSubmitting = true` on initial click, disabling the button and preventing duplicate requests.
- **Priority:** High
- **Security Impact:** Prevents accidental duplicate payments on slow networks.

---

### EC-M10-004: Rendering `CUSTOMER_VERIFICATION_REQUIRED` Outcome with Escrow Notice
- **ID:** `EC-M10-004`
- **Scenario:** A customer initiates a transfer that lands in medium risk (held in escrow).
- **Preconditions:** API returns HTTP 202 with `status: "CUSTOMER_VERIFICATION_REQUIRED"`.
- **Expected System Behavior:** Modal displays an informative amber security badge: *"Your transfer of ₹XX,XXX requires verification. Your funds are temporarily held in escrow. Please confirm this payment to proceed, or report if unauthorized."* Available balance drops, and held balance increments immediately. Options to "Confirm Payment" or "I Didn't Initiate This" are rendered.
- **Handling / Mitigation:** Component checks `response.data.status === 'CUSTOMER_VERIFICATION_REQUIRED'`, updates balances in `AuthContext`, and renders clear confirmation and escalation actions without leaking internal rule scores.
- **Priority:** High
- **Security Impact:** Clear user communication while maintaining internal scoring opacity.

---

### EC-M10-005: Rendering `BLOCKED` Outcome
- **ID:** `EC-M10-005`
- **Scenario:** A customer initiates a high-risk transfer that is halted.
- **Preconditions:** API returns HTTP 400/403 with `status: "BLOCKED"`.
- **Expected System Behavior:** Modal displays a prominent red security warning: *"Transaction blocked due to elevated security risk. Your funds have not been debited. Please contact support."*
- **Handling / Mitigation:** UI catches blocked status, leaves wallet balances intact, and directs user to support.
- **Priority:** High
- **Security Impact:** Clear customer notification for blocked transactions.

---

### EC-M10-006: Backend API Completely Down / Network Timeout
- **ID:** `EC-M10-006`
- **Scenario:** The backend Express server is stopped or unreachable while the customer is using the portal.
- **Preconditions:** Backend server down.
- **Expected System Behavior:** The app renders a non-intrusive offline banner: *"Unable to reach FraudShield servers. Please check your internet connection."* App does not crash with a white screen of death.
- **Handling / Mitigation:** Global error boundary + Axios interceptor error handling renders friendly fallback alerts.
- **Priority:** High
- **Security Impact:** Prevents frontend application crashes.

---

### EC-M10-007: Empty State Displays (Zero Beneficiaries / Zero Transactions)
- **ID:** `EC-M10-007`
- **Scenario:** A newly registered customer navigates to Transactions or Beneficiaries page.
- **Preconditions:** Arrays returned from API are empty `[]`.
- **Expected System Behavior:** UI renders clean, friendly empty states (e.g., *"No transactions yet. Send your first payment!"*) with actionable buttons.
- **Handling / Mitigation:** Explicit checks for `items.length === 0` rendering empty state cards.
- **Priority:** Low
- **Security Impact:** Polished user experience.

---

### EC-M10-008: Customer Confirmation and Escalation from Transactions List
- **ID:** `EC-M10-008`
- **Scenario:** Customer views the Transactions page and interacts with a payment awaiting verification.
- **Preconditions:** Transaction has `status === 'CUSTOMER_VERIFICATION_REQUIRED'`.
- **Expected System Behavior:**
  - Clicking "Confirm Payment" triggers `POST /api/transactions/:id/confirm`.
  - Button exhibits a loading spinner and disables (`isConfirming = true`) to prevent double-clicks.
  - On approval: balances refresh, status becomes `APPROVED`, success notice displayed.
  - On elevation to high-risk: balances refresh, `heldBalance` returned to `availableBalance`, recipient receives ₹0, blocked notice displayed.
  - Clicking "I Didn't Initiate This" triggers `POST /api/transactions/:id/escalate`, transitions status to `FLAGGED_FOR_REVIEW`, and displays notice that it was sent to fraud analysts.
- **Handling / Mitigation:** Async state guards, loading indicators, and optimistic/reactive balance synchronization.
- **Priority:** High
- **Security Impact:** Clean user experience and fraud reporting integration.
