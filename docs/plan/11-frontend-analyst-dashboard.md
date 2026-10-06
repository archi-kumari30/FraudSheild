# Module 11 Implementation Plan: Frontend Analyst Dashboard
## Project: FraudShield — Real-Time Rule-Based Fraud Detection & Prevention Platform

---

### Document Information
- **Module ID:** `MOD-11`
- **Module Name:** Frontend Analyst Dashboard
- **Document Path:** `docs/plan/11-frontend-analyst-dashboard.md`
- **Version:** 1.0.0
- **Status:** Pending Stakeholder Approval
- **Parent Documents (Sources of Truth):**
  - `docs/FraudShield_SRS.md` (Approved v1.0.0)
  - `docs/context.md` (Approved v1.0.0)
  - `docs/implementation-plan.md` (Approved v1.0.0)

---

## 1. Module Objective

The objective of **Module 11 (Frontend Analyst Dashboard)** is to build the administrative operations interface for authenticated `admin` users. It provides real-time transaction monitoring, detailed explainability inspection for triggered fraud rules, an interactive review queue for escalated transactions held in escrow (`FLAGGED_FOR_REVIEW`), human-in-the-loop manual resolution workflows (`APPROVE` / `REJECT`), an on-demand Gemini AI investigation co-pilot panel, and an immutable security audit trail explorer.

---

## 2. Scope

### In-Scope:
- Admin Role Guard & Navigation:
  - `AdminRoute.jsx`: Route guard verifying `user.role === 'admin'`; customer tokens are redirected with an access denied notice.
  - `AdminLayout.jsx`: Top navigation with review queue counter badge, audit logs link, and admin profile summary.
- Incident & Review Queue View (`AnalystDashboard.jsx`):
  - Filterable live table of escalated transactions in `FLAGGED_FOR_REVIEW` and blocked transactions in `BLOCKED` status.
  - Color-coded badges for Risk Tiers:
    - Low: Green (`0 – 30`)
    - Medium: Amber (`31 – 70`)
    - High: Red (`71 – 100`)
  - Filtering by status, date range, risk tier, and customer ID.
- Detailed Case Inspection Modal (`CaseDetailModal.jsx`):
  - Visual breakdown of the composite Risk Score and triggered heuristic rules table (Rule Code, Weight, Reason).
  - Comparative session information (current device vs known devices, client IP, User-Agent).
  - Transaction amounts, account age, and recipient beneficiary age.
- On-Demand Gemini AI Co-Pilot Panel (`AiCopilotPanel.jsx`):
  - On-demand action button: *"Analyze with Gemini"*.
  - Loading spinner with timeout awareness.
  - Clean card-based display of AI insights:
    - Case Summary narrative.
    - Risk Pattern synthesis.
    - Recommended Investigation Checklist.
  - Resilient UI handling: displays informative warning banner if Gemini service is offline, keeping manual review controls fully functional.
- Manual Resolution Action Modal (`ResolveCaseModal.jsx`):
  - Action buttons: `APPROVE` and `REJECT`.
  - Mandatory textarea for resolution notes (validation enforces >= 10 characters).
  - Confirmation prompt preventing accidental clicks.
  - Real-time table update reflecting fund release and status transition.
- Audit Trail Explorer (`AuditLogViewer.jsx`):
  - Paginated table of system audit logs (`timestamp`, `eventType`, `actorId`, `targetEntity`, `metadata`).

### Out-of-Scope for Module 11:
- Dynamic rule weighting configuration or code alteration via UI.
- Customer payment initiation or wallet funding (belongs to Module 10).
- Permitting AI to execute approvals or rejections directly.

---

## 3. Dependencies

- **Preceding Modules:**
  - Modules 1–9 (All backend APIs for Admin Reviews, Transactions, AI Assistant, and Audit Logs).
  - Module 10 (Base React layout, AuthContext, Tailwind theme configurations).

---

## 4. Backend Work

- None in this module. Consumes backend REST APIs established in Modules 2, 7, 8, and 9.

---

## 5. Frontend Work

- Implement admin route wrapper:
  - `frontend/src/routes/AdminRoute.jsx`
- Implement admin components:
  - `frontend/src/components/admin/AdminNavbar.jsx`
  - `frontend/src/components/admin/ReviewQueueTable.jsx`
  - `frontend/src/components/admin/CaseDetailModal.jsx`
  - `frontend/src/components/admin/AiCopilotPanel.jsx`
  - `frontend/src/components/admin/ResolveCaseModal.jsx`
  - `frontend/src/components/admin/AuditLogTable.jsx`
- Implement admin pages:
  - `frontend/src/pages/admin/AdminDashboardPage.jsx`
  - `frontend/src/pages/admin/AuditLogsPage.jsx`
- Mount routes in `AppRoutes.jsx` under `/admin/*`.

---

## 6. Database Work

- None in this module.

---

## 7. API Work (Client-Side Invocations)

- `GET /api/admin/reviews` (Fetch review queue)
- `GET /api/admin/reviews/:id` (Fetch case details)
- `POST /api/admin/reviews/:id/resolve` (Submit review decision)
- `POST /api/admin/reviews/:id/ai-analyze` (Request Gemini AI brief)
- `GET /api/admin/audit-logs` (Fetch audit history)

---

## 8. Security Considerations

- **SEC-M11-01 (Strict Admin Boundary):** Non-admin users are strictly blocked by client-side route guards and server-side RBAC middleware.
- **SEC-M11-02 (AI Advisory Distinction):** The UI visually differentiates between the authoritative deterministic rule score (prominent top score card) and the advisory AI copilot insight (distinct co-pilot panel with "Advisory Co-Pilot Only" label).
- **SEC-M11-03 (Mandatory Audit Accountability):** Resolution buttons remain disabled until the admin enters at least 10 characters of explanation notes.
- **SEC-M11-04 (XSS Prevention):** All dynamic strings (notes, reasons, AI outputs) rendered safely using standard React text nodes to prevent XSS.

---

## 9. Validation Requirements

- Resolution notes: Non-empty string, trimmed length >= 10 characters.
- Decision: Exactly `'APPROVE'` or `'REJECT'`.

---

## 10. Error Handling

- AI Service Unavailable: Display graceful inline alert: *"Gemini Assistant is currently offline. You may proceed with manual review based on the deterministic rule score below."*
- Case Already Resolved Conflict: Display error banner informing analyst that another session resolved the case; refresh queue automatically.
- Unauthorized 403: Redirect non-admin user to customer dashboard with error toast.

---

## 11. Files and Folders Expected to Be Created

```
frontend/
└── src/
    ├── components/
    │   └── admin/
    │       ├── AdminNavbar.jsx
    │       ├── ReviewQueueTable.jsx
    │       ├── CaseDetailModal.jsx
    │       ├── AiCopilotPanel.jsx
    │       ├── ResolveCaseModal.jsx
    │       └── AuditLogTable.jsx
    ├── pages/
    │   └── admin/
    │       ├── AdminDashboardPage.jsx
    │       └── AuditLogsPage.jsx
    └── routes/
        └── AdminRoute.jsx
```

---

## 12. Files and Features Explicitly Out of Scope

- Prohibited features: Dynamic code modification, allowing customers into admin routes, automated AI decision triggers.

---

## 13. Implementation Sequence

1. Implement `AdminRoute` guard verifying `user.role === 'admin'`.
2. Implement `AdminNavbar` with navigation links and active alert counters.
3. Build `ReviewQueueTable` displaying flagged/blocked transactions with filters and status badges.
4. Build `CaseDetailModal` displaying score breakdowns, rule weights, and device comparisons.
5. Build `AiCopilotPanel` with on-demand "Analyze with Gemini" trigger, loading states, and fallback warnings.
6. Build `ResolveCaseModal` with notes validation and confirmation prompt.
7. Build `AuditLogTable` and `AuditLogsPage` with pagination.
8. Mount routes under `/admin/dashboard` and `/admin/audit-logs` in `AppRoutes.jsx`.

---

## 14. Completion Criteria

1. Only users with `role === 'admin'` can access `/admin/*` routes; customers are redirected with 403.
2. Review queue lists escalated `FLAGGED_FOR_REVIEW` transactions in real time.
3. Case detail modal displays accurate rule breakdown, weights, and device context.
4. Clicking "Analyze with Gemini" triggers API, renders structured summary and checklist, and shows graceful fallback when AI is mocked offline.
5. Submitting `APPROVE` or `REJECT` with notes successfully calls backend, settles escrow balance, updates transaction state, and removes item from pending queue.
6. Audit logs page displays paginated historical records.
7. Zero client-side console errors or crashes during review workflows.
