# Module 5 Edge Cases: Rule-Based Fraud Detection Engine
## Project: FraudShield — Real-Time Rule-Based Fraud Detection & Prevention Platform

---

### Document Information
- **Module ID:** `MOD-05`
- **Module Name:** Rule-Based Fraud Detection Engine
- **Document Path:** `docs/edge-cases/05-fraud-detection-engine.md`
- **Version:** 1.0.0
- **Status:** Complete / Ready for Review
- **Parent Documents (Sources of Truth):**
  - `docs/FraudShield_SRS.md`
  - `docs/context.md`
  - `docs/implementation-plan.md`
  - `docs/plan/05-fraud-detection-engine.md`

---

## 1. Overview

This document specifies the technical, mathematical, and algorithmic edge cases for **Module 5: Rule-Based Fraud Detection Engine**. It verifies boundary conditions across all **six approved heuristic rules**, multi-rule interactions, mathematical score capping at 100, risk tier partitioning, and missing historical context handling.

---

## 2. Edge Cases Catalog

### EC-M5-001: Exact Boundary Value for `RULE_AMT_EXTREME` (> ₹50,000)
- **ID:** `EC-M5-001`
- **Scenario:** Transfer amount is tested right at the threshold:
  - Sub-case A: Amount is exactly ₹50,000.
  - Sub-case B: Amount is ₹50,001.
- **Preconditions:** Historical 30-day average is ₹15,000 (so 5x = ₹75,000).
- **Expected System Behavior:**
  - Sub-case A (₹50,000): Condition is strictly `> 50000`, so rule does NOT trigger (+0 points).
  - Sub-case B (₹50,001): Condition is met, rule triggers (+35 points).
- **Handling / Mitigation:** Evaluator checks `amount > 50000 || (hasHistory && amount > 5 * historyAvg)`.
- **Priority:** High
- **Security Impact:** Eliminates off-by-one threshold classification bugs.

---

### EC-M5-002: User with Zero Prior History for `RULE_AMT_EXTREME` (Historical Average Null/Undefined)
- **ID:** `EC-M5-002`
- **Scenario:** A brand new user initiates their very first transfer of ₹20,000. They have zero transactions in the prior 30 days, so 30-day average is undefined/0.
- **Preconditions:** User has 0 previous transactions.
- **Expected System Behavior:** The engine does not trigger a division-by-zero or NaN error. Since ₹20,000 is <= ₹50,000 and historical average multiplier is not applicable, `RULE_AMT_EXTREME` returns +0 points.
- **Handling / Mitigation:** Rule evaluator checks `if (historyCount > 0 && historyAvg > 0)` before calculating multiplier.
- **Priority:** High
- **Security Impact:** Prevents false-positive blocks on legitimate new user first transactions.

---

### EC-M5-003: Velocity Sliding Window Exact Boundary for `RULE_VELOCITY_HIGH` (> 3 Transactions in 10 Minutes)
- **ID:** `EC-M5-003`
- **Scenario:** A user submits multiple transactions within a rolling 10-minute window:
  - Sub-case A: 3 transactions have occurred in the last 10 minutes; this is the 3rd transaction.
  - Sub-case B: 3 transactions have already occurred in the last 10 minutes; this is the 4th transaction.
- **Preconditions:** Transactions timestamps within `Date.now() - 10 * 60 * 1000`.
- **Expected System Behavior:**
  - Sub-case A: Count is 3 (not `> 3`), rule does NOT trigger (+0 points).
  - Sub-case B: Count is 4 (which is `> 3`), rule triggers (+30 points).
- **Handling / Mitigation:** Query counts completed or pending transactions where `createdAt >= 10 minutes ago`. Evaluates strictly `count > 3`.
- **Priority:** High
- **Security Impact:** Accurately throttles automated fund draining attacks.

---

### EC-M5-004: Transaction Occurring at 10 Minutes and 1 Second (Sliding Window Expiry)
- **ID:** `EC-M5-004`
- **Scenario:** A user completed 4 transactions exactly 10 minutes and 5 seconds ago.
- **Preconditions:** Transactions exist with `createdAt < Date.now() - 10 * 60 * 1000`.
- **Expected System Behavior:** Expired transactions outside the 10-minute window are excluded; rule does NOT trigger.
- **Handling / Mitigation:** Timestamp filtering uses precise millisecond boundary: `createdAt >= new Date(now - 600000)`.
- **Priority:** Medium
- **Security Impact:** Prevents false velocity alerts after cooldown periods.

---

### EC-M5-005: Unrecognized Device Evaluation for `RULE_DEVICE_NEW`
- **ID:** `EC-M5-005`
- **Scenario:** Transaction originates from a device identifier that is NOT found in `user_devices` for this user.
- **Preconditions:** `isKnownDevice === false`.
- **Expected System Behavior:** Rule triggers (+25 points) and includes reason code `RULE_DEVICE_NEW: "Transaction initiated from an unrecognized device identifier"`.
- **Handling / Mitigation:** Pure evaluator checks `!deviceContext.isKnownDevice`.
- **Priority:** High
- **Security Impact:** Detects session hijacking or new device account access.

---

### EC-M5-006: Beneficiary Age Boundary for `RULE_BENEFICIARY_NEW` (> ₹10,000 Sent to Beneficiary Added < 24 Hours Ago)
- **ID:** `EC-M5-006`
- **Scenario:** Transfer amount is ₹15,000:
  - Sub-case A: Beneficiary was added 23 hours and 59 minutes ago.
  - Sub-case B: Beneficiary was added 24 hours and 1 minute ago.
  - Sub-case C: Beneficiary was added 2 hours ago, but transfer amount is ₹8,000 (<= ₹10,000).
- **Preconditions:** Beneficiary record with creation timestamp.
- **Expected System Behavior:**
  - Sub-case A: Beneficiary age < 24h AND amount > ₹10,000 -> Rule triggers (+30 points).
  - Sub-case B: Beneficiary age >= 24h -> Rule does NOT trigger (+0 points).
  - Sub-case C: Beneficiary age < 24h BUT amount <= ₹10,000 -> Rule does NOT trigger (+0 points).
- **Handling / Mitigation:** Evaluates `amount > 10000 && (now - beneficiaryCreatedAt) < 24 * 60 * 60 * 1000`.
- **Priority:** High
- **Security Impact:** Targets classic mule-account draining patterns.

---

### EC-M5-007: Failed Burst Boundary for `RULE_FAIL_BURST` (>= 3 Failed Attempts in 15 Minutes)
- **ID:** `EC-M5-007`
- **Scenario:** User activity in the prior 15 minutes:
  - Sub-case A: Exactly 2 failed attempts.
  - Sub-case B: Exactly 3 failed attempts.
- **Preconditions:** Recent failed transactions recorded.
- **Expected System Behavior:**
  - Sub-case A: 2 failures (not `>= 3`), rule does NOT trigger (+0 points).
  - Sub-case B: 3 failures (`>= 3`), rule triggers (+20 points).
- **Handling / Mitigation:** Query counts transactions with status `BLOCKED` or failed attempts in the last 15 minutes.
- **Priority:** High
- **Security Impact:** Flags credential/brute-force or carding-style repeated failures.

---

### EC-M5-008: Dormant Account Boundary for `RULE_DORMANT_SPIKE` (> ₹5,000 After > 30 Days Inactivity)
- **ID:** `EC-M5-008`
- **Scenario:** Account created 60 days ago with zero transactions in the last 35 days:
  - Sub-case A: Initiates transfer of ₹4,999.
  - Sub-case B: Initiates transfer of ₹5,001.
  - Sub-case C: Active account that transferred yesterday attempts ₹20,000.
- **Preconditions:** Account age > 30 days.
- **Expected System Behavior:**
  - Sub-case A: Inactive > 30 days BUT amount <= ₹5,000 -> Does NOT trigger (+0 points).
  - Sub-case B: Inactive > 30 days AND amount > ₹5,000 -> Triggers (+25 points).
  - Sub-case C: Active account (last transaction 1 day ago) -> Does NOT trigger (+0 points).
- **Handling / Mitigation:** Checks `isDormant (lastActivity > 30 days) && amount > 5000`.
- **Priority:** High
- **Security Impact:** Detects dormant account takeovers.

---

### EC-M5-009: Score Capping at 100 When Multiple Rules Trigger (Mathematical Invariant)
- **ID:** `EC-M5-009`
- **Scenario:** All six rules trigger on a single transaction:
  - `RULE_AMT_EXTREME` (+35)
  - `RULE_VELOCITY_HIGH` (+30)
  - `RULE_DEVICE_NEW` (+25)
  - `RULE_BENEFICIARY_NEW` (+30)
  - `RULE_FAIL_BURST` (+20)
  - `RULE_DORMANT_SPIKE` (+25)
  - Total Raw Score: 35 + 30 + 25 + 30 + 20 + 25 = **165 points**.
- **Preconditions:** All rule criteria satisfied.
- **Expected System Behavior:** Raw score is calculated as 165, but the final score is strictly capped at **100** via `min(totalRuleScore, 100)`. Tier is `HIGH` (`BLOCKED`).
- **Handling / Mitigation:** Scorer enforces `finalScore = Math.min(100, Math.max(0, totalRuleScore))`.
- **Priority:** Critical
- **Security Impact:** Guarantees score integrity within the defined [0, 100] interval.

---

### EC-M5-010: Boundary Mapping for Risk Tiers (30 vs 31, 70 vs 71)
- **ID:** `EC-M5-010`
- **Scenario:** Edge score values right on the tier boundaries:
  - Score = 30
  - Score = 31
  - Score = 70
  - Score = 71
- **Preconditions:** Rules trigger exact point totals.
- **Expected System Behavior:**
  - Score 30 -> `LOW` (`APPROVED`)
  - Score 31 -> `MEDIUM` (`FLAGGED_FOR_REVIEW`)
  - Score 70 -> `MEDIUM` (`FLAGGED_FOR_REVIEW`)
  - Score 71 -> `HIGH` (`BLOCKED`)
- **Handling / Mitigation:** Tier mapper uses strict ranges:
  - `score <= 30`: `LOW`
  - `score > 30 && score <= 70`: `MEDIUM`
  - `score > 70`: `HIGH`
- **Priority:** Critical
- **Security Impact:** Ensures correct deterministic decision assignment.

---

### EC-M5-011: Zero Rules Triggered (Clean Low-Risk Payment)
- **ID:** `EC-M5-011`
- **Scenario:** Standard transfer (₹500) to familiar beneficiary (> 30 days old) from a recognized device with normal velocity.
- **Preconditions:** Zero rule triggers.
- **Expected System Behavior:** Total score = 0, Tier = `LOW`, Decision = `APPROVED`, `triggeredRules = []`.
- **Handling / Mitigation:** Engine handles empty array without errors.
- **Priority:** High
- **Security Impact:** Baseline normal transaction processing.
