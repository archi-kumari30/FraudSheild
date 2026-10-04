# Module 5 Implementation Plan: Rule-Based Fraud Detection Engine
## Project: FraudShield — Real-Time Rule-Based Fraud Detection & Prevention Platform

---

### Document Information
- **Module ID:** `MOD-05`
- **Module Name:** Rule-Based Fraud Detection Engine
- **Document Path:** `docs/plan/05-fraud-detection-engine.md`
- **Version:** 1.0.0
- **Status:** Pending Stakeholder Approval
- **Parent Documents (Sources of Truth):**
  - `docs/FraudShield_SRS.md` (Approved v1.0.0)
  - `docs/context.md` (Approved v1.0.0)
  - `docs/implementation-plan.md` (Approved v1.0.0)

---

## 1. Module Objective

The objective of **Module 5 (Rule-Based Fraud Detection Engine)** is to build the core, deterministic risk scoring and classification engine. The engine evaluates incoming transaction parameters against the **six approved heuristic fraud rules**, calculates a normalized risk score capped at 100, assigns the appropriate risk tier (`LOW`, `MEDIUM`, `HIGH`), and returns an explicit explainability payload with all triggered reason codes.

---

## 2. Scope

### In-Scope:
- Implementation of the approved **6 deterministic fraud rules**:
  1. `RULE_AMT_EXTREME` (+35): Amount > **₹50,000** OR Amount > **5x** user's 30-day historical average.
  2. `RULE_VELOCITY_HIGH` (+30): More than **3 transactions** in a **10-minute** sliding window.
  3. `RULE_DEVICE_NEW` (+25): Transaction device ID not found in user's known device history.
  4. `RULE_BENEFICIARY_NEW` (+30): Amount > **₹10,000** sent to a beneficiary added less than **24 hours** ago.
  5. `RULE_FAIL_BURST` (+20): **3 or more failed transaction attempts** within the last **15 minutes**.
  6. `RULE_DORMANT_SPIKE` (+25): Amount > **₹5,000** from an account with **0 transactions over the prior 30 days**.
- Scoring aggregation logic enforcing:
  $$\text{finalScore} = \min(\text{totalRuleScore}, 100)$$
- Risk tier mapping:
  - `0 – 30`: `LOW` (`APPROVED`)
  - `31 – 70`: `MEDIUM` (`FLAGGED_FOR_REVIEW`)
  - `71 – 100`: `HIGH` (`BLOCKED`)
- Unified orchestrator returning:
  `{ riskScore, riskLevel, triggeredRules: [{ ruleCode, weight, reason }] }`
- Pure, deterministic, explainable in-memory computation.

### Out-of-Scope for Module 5:
- Writing or committing transactions to the database (belongs to Module 6).
- Deducting wallet balances or managing escrow holds (belongs to Module 6).
- Generating alerts or incident reviews (belongs to Module 7).
- Calling Gemini AI (belongs to Module 8).
- Machine learning models, Python scripts, neural networks, or external fraud APIs.

---

## 3. Dependencies

- **Preceding Modules:**
  - Module 1 (`MOD-01`: Express infrastructure).
  - Module 3 (`MOD-03`: Beneficiary timestamps & historical context data structures).
  - Module 4 (`MOD-04`: Device context tracking & device registry queries).

---

## 4. Backend Work

- Create isolated rule evaluators under `backend/src/engine/rules/`:
  - `amtExtremeRule.js`
  - `velocityHighRule.js`
  - `deviceNewRule.js`
  - `beneficiaryNewRule.js`
  - `failBurstRule.js`
  - `dormantSpikeRule.js`
- Create score aggregator and tier classifier in `backend/src/engine/scorer.js`.
- Create engine orchestrator in `backend/src/engine/fraudEngine.js`:
  - Receives `(transactionData, userContext, historyContext)`.
  - Concurrently evaluates all 6 rules.
  - Aggregates scores, applies 100 cap, determines tier.
  - Returns structured evaluation result.
- Implement context collector helper in `backend/src/engine/contextCollector.js` to gather historical statistics (30-day average, 10-minute velocity count, etc.).

---

## 5. Frontend Work

- None in this module. The fraud engine resides 100% on the backend.

---

## 6. Database Work

- Read-only historical queries against existing collections:
  - Query recent transaction timestamps and status counts for velocity and failure bursts.
  - Query beneficiary creation timestamp.
  - Query known devices collection for device familiarity.

---

## 7. API Work

- The fraud engine operates as an internal backend domain service called synchronously during transaction processing. No direct public HTTP endpoints are exposed.

---

## 8. Security Considerations

- **SEC-M5-01 (Deterministic Guarantee):** Rule evaluation must be 100% deterministic and reproducible. Given the same transaction and context, it must always output the exact same score.
- **SEC-M5-02 (Low Latency Execution):** Evaluation must complete in < 50 milliseconds in-memory to prevent payment latency overhead.
- **SEC-M5-03 (Zero External Reliance):** The engine must never make outbound HTTP calls to third-party services during evaluation.

---

## 9. Validation Requirements

- Input validation for evaluation payload:
  - `amount`: Positive number > 0.
  - `senderId`: Valid ObjectId string.
  - `recipientId`: Valid ObjectId string.
  - `deviceId`: String.

---

## 10. Error Handling

- Missing historical context: Rule evaluates safely using fallback defaults (e.g. if historical average is null, evaluates amount against the absolute ₹50,000 threshold only).
- Individual rule failure: Isolated with try-catch so one rule evaluation exception cannot crash the entire engine pipeline.

---

## 11. Files and Folders Expected to Be Created

```
backend/
├── src/
│   └── engine/
│       ├── rules/
│       │   ├── amtExtremeRule.js
│       │   ├── velocityHighRule.js
│       │   ├── deviceNewRule.js
│       │   ├── beneficiaryNewRule.js
│       │   ├── failBurstRule.js
│       │   └── dormantSpikeRule.js
│       ├── contextCollector.js
│       ├── scorer.js
│       └── fraudEngine.js
└── tests/
    └── engine/
        ├── rules.test.js
        └── fraudEngine.test.js
```

---

## 12. Files and Features Explicitly Out of Scope

- Prohibited files: `Transaction.js`, `escrowService.js`, `geminiService.js`.
- Prohibited features: Dynamic weight learning, statistical regressions, Python integration, asynchronous streaming queues (Kafka).

---

## 13. Implementation Sequence

1. Implement individual pure rule evaluator functions in `src/engine/rules/`.
2. Implement `scorer.js` enforcing $\min(\text{totalScore}, 100)$ and tier mapping.
3. Implement `contextCollector.js` fetching historical metrics.
4. Implement `fraudEngine.js` orchestrating rule execution.
5. Write comprehensive unit test suites covering each rule individually and all score combinations.

---

## 14. Completion Criteria

1. All 6 rules accurately trigger when their specific conditions are met and return 0 when not met.
2. Multiple triggered rules sum their weights correctly.
3. Total score is strictly capped at 100 even if all 6 rules trigger (35+30+25+30+20+25 = 165 -> capped at 100).
4. Boundary scores map accurately: 0–30 -> `LOW`, 31–70 -> `MEDIUM`, 71–100 -> `HIGH`.
5. Output payload includes human-readable reason codes for all triggered rules.
6. 100% of unit tests in `tests/engine/` pass.
