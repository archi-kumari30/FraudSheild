# Module 10 Implementation Plan: Frontend Customer Portal
## Project: FraudShield — Real-Time Rule-Based Fraud Detection & Prevention Platform

---

### Document Information
- **Module ID:** `MOD-10`
- **Module Name:** Frontend Customer Portal
- **Document Path:** `docs/plan/10-frontend-customer-portal.md`
- **Version:** 1.0.0
- **Status:** Pending Stakeholder Approval
- **Parent Documents (Sources of Truth):**
  - `docs/FraudShield_SRS.md` (Approved v1.0.0)
  - `docs/context.md` (Approved v1.0.0)
  - `docs/implementation-plan.md` (Approved v1.0.0)

---

## 1. Module Objective

The objective of **Module 10 (Frontend Customer Portal)** is to build the responsive, intuitive client-side Single Page Application (SPA) for end-customers using React, Tailwind CSS, and React Router. The portal provides customer authentication, simulated digital wallet balance management, test deposit funding, beneficiary address book management, secure transfer initiation, transparent transaction status tracking with visual risk badges, and in-app fraud alert notifications.

---

## 2. Scope

### In-Scope:
- Authentication & Session Views:
  - `LoginPage.jsx`: Email and password login with validation and error messaging.
  - `RegisterPage.jsx`: Customer registration form.
  - `AuthContext.jsx`: Centralized authentication state management (login, logout, token persistence, user profile).
- Customer Portal Layout & Shell:
  - `CustomerLayout.jsx`: Top navigation bar, user identity display, live wallet balance chip, logout action.
  - Protected Route wrapper (`ProtectedRoute.jsx`) redirecting unauthenticated visitors to `/login`.
- Digital Wallet & Balance Components:
  - `WalletCard.jsx`: Displays `availableBalance` and `heldBalance` formatted cleanly in INR (₹).
  - `DepositModal.jsx`: Modal for self-service test funding into `availableBalance`.
- Transfer Workflow:
  - `SendMoneyModal.jsx`: Transfer submission form allowing selection from saved beneficiaries or entering recipient ID/email, amount in INR, and optional transfer note.
  - Immediate feedback display reflecting transaction outcome:
    - `APPROVED`: Instant green confirmation badge.
    - `FLAGGED_FOR_REVIEW`: Informative amber notice stating funds are held in escrow pending security review.
    - `BLOCKED`: Clear red security notice explaining the payment was halted.
- Beneficiary Address Book:
  - `BeneficiaryManager.jsx`: Add new beneficiary modal, list saved contacts, delete beneficiary.
- Transaction History Table:
  - `TransactionList.jsx`: Chronological list of user's transfers with color-coded status badges, amounts, timestamps, and recipient details.
- Customer Fraud Alert Drawer / Panel:
  - `CustomerAlerts.jsx`: Notifications panel listing alerts for held or blocked transfers with mark-as-read capability.
- Client Device Token Utility:
  - `deviceToken.js`: Generates and persists an application-level UUID in `localStorage` and injects it into outgoing requests via the `x-device-id` header in Axios interceptors.

### Out-of-Scope for Module 10:
- Admin portals, analyst queues, case inspection, or review resolution modals (belongs to Module 11).
- Gemini AI co-pilot panels or prompts (belongs to Module 11).
- Audit log viewers (belongs to Module 11).
- Displaying internal rule scores, weights, or heuristic parameters to customers.

---

## 3. Dependencies

- **Preceding Modules:**
  - Module 1 (`MOD-01`: Vite React scaffold, Tailwind CSS, Axios client).
  - Module 2 (`MOD-02`: Auth APIs).
  - Module 3 (`MOD-03`: Wallet and Beneficiary APIs).
  - Module 4 (`MOD-04`: Device ID header expectations).
  - Module 6 (`MOD-06`: Transaction APIs).
  - Module 7 (`MOD-07`: Customer alert APIs).

---

## 4. Backend Work

- None in this module. Consumes backend REST APIs established in Modules 2–7.

---

## 5. Frontend Work

- Implement application state and contexts:
  - `frontend/src/context/AuthContext.jsx`
  - `frontend/src/context/AlertContext.jsx`
- Implement device utility:
  - `frontend/src/utils/deviceToken.js`
- Update Axios interceptor in `frontend/src/api/axiosClient.js` to attach:
  - `Authorization: Bearer <token>`
  - `x-device-id: <persistentDeviceId>`
- Implement reusable UI components:
  - `Navbar.jsx`, `Modal.jsx`, `StatusBadge.jsx`, `AlertCard.jsx`
- Implement page components:
  - `frontend/src/pages/customer/LoginPage.jsx`
  - `frontend/src/pages/customer/RegisterPage.jsx`
  - `frontend/src/pages/customer/DashboardPage.jsx`
  - `frontend/src/pages/customer/BeneficiariesPage.jsx`
  - `frontend/src/pages/customer/TransactionsPage.jsx`
- Configure React Router routes in `frontend/src/routes/AppRoutes.jsx`.

---

## 6. Database Work

- None in this module.

---

## 7. API Work (Client-Side Invocations)

- `POST /api/auth/login`
- `POST /api/auth/register`
- `GET /api/auth/me`
- `GET /api/wallet`
- `POST /api/wallet/deposit`
- `GET /api/beneficiaries`
- `POST /api/beneficiaries`
- `DELETE /api/beneficiaries/:id`
- `POST /api/transactions`
- `GET /api/transactions`
- `GET /api/alerts`
- `PATCH /api/alerts/:id/read`

---

## 8. Security Considerations

- **SEC-M10-01 (Token Hygiene):** JWT tokens stored securely in memory / `localStorage`; strictly cleared upon user logout.
- **SEC-M10-02 (Route Guards):** Protected routes prevent unauthenticated users from rendering customer dashboards, immediately redirecting to `/login`.
- **SEC-M10-03 (Fraud Rule Opacity):** The customer UI never renders internal fraud rule names, point weights, or risk score numbers to prevent adversarial learning.
- **SEC-M10-04 (Input Sanitization):** All client inputs are sanitized and validated to prevent script injection.

---

## 9. Validation Requirements

- Client-side validation:
  - Registration: Email format, password length >= 8.
  - Deposit: Positive integer/decimal > 0.
  - Transfer: Amount strictly > 0 and <= available balance; valid recipient selected.
  - Beneficiary: Non-empty nickname, valid recipient email or ID.

---

## 10. Error Handling

- Network / Server offline: Display persistent banner notification indicating backend connectivity failure.
- API 400 Validation Error: Render inline field errors on forms.
- API 401 Unauthorized: Clear stale token and redirect to `/login`.
- Transfer Blocked / Held: Display clear, non-intimidating modal explanations with instructions.

---

## 11. Files and Folders Expected to Be Created

```
frontend/
└── src/
    ├── context/
    │   ├── AuthContext.jsx
    │   └── AlertContext.jsx
    ├── utils/
    │   └── deviceToken.js
    ├── components/
    │   ├── common/
    │   │   ├── Navbar.jsx
    │   │   ├── Modal.jsx
    │   │   └── StatusBadge.jsx
    │   └── customer/
    │       ├── WalletCard.jsx
    │       ├── DepositModal.jsx
    │       ├── SendMoneyModal.jsx
    │       ├── BeneficiaryList.jsx
    │       ├── TransactionTable.jsx
    │       └── AlertDrawer.jsx
    ├── pages/
    │   ├── LoginPage.jsx
    │   ├── RegisterPage.jsx
    │   └── CustomerDashboard.jsx
    └── routes/
        ├── ProtectedRoute.jsx
        └── AppRoutes.jsx
```

---

## 12. Files and Features Explicitly Out of Scope

- Prohibited files: Admin views (`AnalystDashboard.jsx`, `ReviewModal.jsx`, `AiCopilotModal.jsx`, `AuditLogView.jsx`).
- Prohibited features: Direct client connections to MongoDB, direct calls to Gemini API.

---

## 13. Implementation Sequence

1. Implement `deviceToken.js` and configure Axios request interceptors.
2. Implement `AuthContext` managing login state and token storage.
3. Build `LoginPage` and `RegisterPage` with form validation.
4. Implement `ProtectedRoute` guard.
5. Build `CustomerLayout` with navigation and balance header.
6. Build `WalletCard` and `DepositModal`.
7. Build `BeneficiaryList` and modal workflows.
8. Build `SendMoneyModal` and transaction submission handling.
9. Build `TransactionTable` with visual risk badges.
10. Build `AlertDrawer` displaying customer security notices.

---

## 14. Completion Criteria

1. Customer can register and log in; JWT is persisted and authenticated state active.
2. Protected routes block unauthenticated access.
3. Wallet card displays accurate `availableBalance` and `heldBalance` in INR.
4. Test deposit increases available balance in real time.
5. Customer can add, view, and delete beneficiaries.
6. Customer can submit a transfer; UI correctly displays green for `APPROVED`, amber for `FLAGGED_FOR_REVIEW`, and red for `BLOCKED`.
7. Outgoing requests include persistent `x-device-id` header.
8. Customer alerts panel displays notifications for held and blocked transactions.
9. Zero client-side crashes or unhandled console errors during user flows.
