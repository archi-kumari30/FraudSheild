# Module 8 Implementation Plan: Gemini AI Investigation Assistant
## Project: FraudShield — Real-Time Rule-Based Fraud Detection & Prevention Platform

---

### Document Information
- **Module ID:** `MOD-08`
- **Module Name:** Gemini AI Investigation Assistant
- **Document Path:** `docs/plan/08-gemini-ai-assistant.md`
- **Version:** 1.0.0
- **Status:** Pending Stakeholder Approval
- **Parent Documents (Sources of Truth):**
  - `docs/FraudShield_SRS.md` (Approved v1.0.0)
  - `docs/context.md` (Approved v1.0.0)
  - `docs/implementation-plan.md` (Approved v1.0.0)

---

## 1. Module Objective

The objective of **Module 8 (Gemini AI Investigation Assistant)** is to build the secure, backend-orchestrated AI investigation co-pilot using the Google Gemini API. Invoked exclusively on-demand by authenticated Admins, the service synthesizes technical fraud reason codes into plain-language case summaries, explains behavioral risk patterns, and generates actionable investigative checklists to accelerate manual review triage.

> **Absolute Architecture Boundary:** Gemini AI is strictly an advisory co-pilot. It possesses **ZERO decision-making authority**. Gemini cannot override the deterministic fraud engine, alter risk scores, approve or block transactions, or mutate wallet balances. If Gemini API is degraded, rate-limited, or unreachable, 100% of core payment and review workflows continue functioning normally.

---

## 2. Scope

### In-Scope:
- Backend Gemini service utilizing the official Google Gen AI SDK (`@google/genai` or `@google/generative-ai`).
- Strict PII Sanitization & Data Minimization Filter:
  - Redacts/masks user IDs, account numbers (e.g. `ACC-***9821`), customer names, emails, and raw IP addresses.
  - Passes only essential analytical context: transaction amount (INR), 30-day historical average, account age in days, beneficiary relationship age, and triggered rule codes with descriptions.
- Structured Prompt Engineering:
  - Low temperature (0.2) enforcing factual, hallucination-resistant responses.
  - Strict output schema:
    1. `caseSummary`: Plain-English narrative explaining why the transaction was flagged.
    2. `riskPatterns`: Synthesis of the interaction between triggered rules.
    3. `investigationChecklist`: 3–5 concrete verification steps for the Admin.
- Resilient Client Execution:
  - Request timeout capped at 5,000 milliseconds.
  - Graceful circuit breaker / fallback returning informative advisory error payload without throwing 500s.
- Admin On-Demand Analysis Endpoint: `POST /api/admin/reviews/:id/ai-analyze`.
- Caching of generated AI brief on the transaction record to prevent redundant external API calls.

### Out-of-Scope for Module 8:
- Automated invocation during background payment ingestion.
- End-user / customer access to AI endpoints.
- Any capability for AI to execute status updates or balance mutations.
- Chat interfaces or multi-turn conversational bots.

---

## 3. Dependencies

- **Preceding Modules:**
  - Module 1 (`MOD-01`: Express infrastructure, config loader with `GEMINI_API_KEY`).
  - Module 2 (`MOD-02`: Admin role authentication).
  - Module 7 (`MOD-07`: Incident Review queue and flagged transaction records).
- **External Dependencies:** `@google/generative-ai` or `@google/genai`.

---

## 4. Backend Work

- Implement `backend/src/ai/piiSanitizer.js`:
  - Strips all sensitive credentials, passwords, raw emails, and personal identifiers.
  - Formats transaction parameters into an anonymized analytical context object.
- Implement `backend/src/ai/geminiClient.js`:
  - Initializes Gemini SDK client using `process.env.GEMINI_API_KEY`.
  - Configures model (Gemini Flash), temperature (0.2), and system instruction prompt.
- Implement `backend/src/ai/promptTemplates.js`:
  - Defines the structured prompt template directing Gemini to act as a financial fraud co-pilot.
- Implement `backend/src/services/aiInvestigationService.js`:
  - Orchestrates sanitization, prompt injection, SDK call with 5,000ms timeout, and fallback error handling.
  - Caches the AI report into the transaction document.
- Implement `backend/src/controllers/aiController.js` and mount route `backend/src/routes/aiRoutes.js`.

---

## 5. Frontend Work

- None in this module. Consumed by Module 11 (Frontend Analyst Dashboard).

---

## 6. Database Work

- Updates to Collection: `transactions`:
  - Optional field `aiInvestigation`:
    - `caseSummary`: String.
    - `riskPatterns`: Array of strings.
    - `investigationChecklist`: Array of strings.
    - `analyzedAt`: Date.

---

## 7. API Work

| Method | Path | Access | Description |
| :--- | :--- | :---: | :--- |
| `POST` | `/api/admin/reviews/:id/ai-analyze` | Admin Only | Generates or retrieves cached Gemini AI investigation brief for a flagged case. |

---

## 8. Security Considerations

- **SEC-M8-01 (API Key Isolation):** `GEMINI_API_KEY` exists solely in backend `.env`. It is never delivered to the client or checked into git.
- **SEC-M8-02 (Zero PII Leakage):** Automated sanitization asserts that raw passwords, full account numbers, customer names, and emails are stripped prior to external dispatch.
- **SEC-M8-03 (Admin-Only Authorization):** Route strictly protected by `authorizeRole(['admin'])`.
- **SEC-M8-04 (Fail-Safe Architecture):** External API failure must never block or degrade core banking/review operations.

---

## 9. Validation Requirements

- `id`: Valid Mongo ObjectId in URL params corresponding to a transaction in `FLAGGED_FOR_REVIEW` or `BLOCKED` status.

---

## 10. Error Handling

- Missing or invalid `GEMINI_API_KEY`: Service logs warning and returns fallback response: `{ success: false, isFallback: true, message: "AI assistant service is currently unconfigured or unavailable." }`.
- Gemini API Timeout (> 5000ms) or 429 Rate Limit: Caught cleanly; returns graceful fallback advisory payload without halting the application.
- Target transaction not found: HTTP 404 Not Found.

---

## 11. Files and Folders Expected to Be Created

```
backend/
├── src/
│   ├── ai/
│   │   ├── geminiClient.js
│   │   ├── piiSanitizer.js
│   │   └── promptTemplates.js
│   ├── services/
│   │   └── aiInvestigationService.js
│   ├── controllers/
│   │   └── aiController.js
│   └── routes/
│       └── aiRoutes.js
└── tests/
    └── ai.test.js
```

---

## 12. Files and Features Explicitly Out of Scope

- Prohibited features: Autonomous AI actions, automatic background triggering, streaming chat widgets.

---

## 13. Implementation Sequence

1. Install official Gemini SDK (`@google/generative-ai`).
2. Implement `piiSanitizer.js` with comprehensive redaction logic.
3. Implement `promptTemplates.js` and `geminiClient.js` with temperature 0.2.
4. Implement `aiInvestigationService.js` with timeout and fallback logic.
5. Implement `aiController.js` and mount `aiRoutes.js` under `/api/admin/reviews/:id/ai-analyze`.
6. Write unit and integration tests with mocked Gemini responses and failure states (`ai.test.js`).

---

## 14. Completion Criteria

1. Request to `/api/admin/reviews/:id/ai-analyze` by an Admin returns structured AI brief containing case summary, risk pattern, and investigation checklist.
2. Verified that payload dispatched to Gemini contains zero raw customer names, emails, or account IDs.
3. Customer token calling the endpoint receives HTTP 403.
4. Mocking a Gemini API failure/timeout returns a clean fallback payload with HTTP 200/503 and does not crash the server.
5. Subsequent calls for the same transaction return cached results without re-invoking the external API.
6. 100% of tests in `tests/ai.test.js` pass.
