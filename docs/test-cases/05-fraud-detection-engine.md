# Module 5 Test Cases: Rule-Based Fraud Detection Engine
## Project: FraudShield — Real-Time Rule-Based Fraud Detection & Prevention Platform

---

### Document Information
- **Module ID:** `MOD-05`
- **Module Name:** Rule-Based Fraud Detection Engine
- **Document Path:** `docs/test-cases/05-fraud-detection-engine.md`
- **Version:** 1.0.0
- **Status:** Complete / Ready for Execution
- **Parent Documents (Sources of Truth):**
  - `docs/FraudShield_SRS.md`
  - `docs/context.md`
  - `docs/implementation-plan.md`
  - `docs/plan/05-fraud-detection-engine.md`
  - `docs/edge-cases/05-fraud-detection-engine.md`

---

## 1. Overview

This document specifies the unit and integration test cases for **Module 5: Rule-Based Fraud Detection Engine**. It validates the independent execution of all **six approved heuristic rules**, multi-rule scoring synthesis, score capping at 100, and deterministic risk tier categorization.

---

## 2. Test Cases Specification

### TC-M5-001: `RULE_AMT_EXTREME` Triggers on Amount > ₹50,000
- **Test Case ID:** `TC-M5-001`
- **Module ID:** `MOD-05`
- **Test Scenario:** Single transaction exceeding ₹50,000 triggers `RULE_AMT_EXTREME`.
- **Preconditions:** Rule evaluator loaded.
- **Test Data:** `amount: 50001`, `historyAvg: 5000`
- **Steps:**
  1. Evaluate `amtExtremeRule(transactionData, context)`.
- **Expected Result:**
  - `triggered`: `true`
  - `score`: `35`
  - `ruleCode`: `"RULE_AMT_EXTREME"`
- **Test Type:** Unit / Rule
- **Priority:** High
- **Status:** Not Run

---

### TC-M5-002: `RULE_AMT_EXTREME` Triggers on > 5x Historical Average
- **Test Case ID:** `TC-M5-002`
- **Module ID:** `MOD-05`
- **Test Scenario:** Transfer amount is below ₹50,000 but exceeds 5x user's 30-day average.
- **Preconditions:** Historical average = ₹2,000. 5x threshold = ₹10,000.
- **Test Data:** `amount: 12000`, `historyAvg: 2000`
- **Steps:**
  1. Evaluate `amtExtremeRule(transactionData, context)`.
- **Expected Result:**
  - `triggered`: `true`
  - `score`: `35`
- **Test Type:** Unit / Rule
- **Priority:** High
- **Status:** Not Run

---

### TC-M5-003: `RULE_AMT_EXTREME` Boundary (Exactly ₹50,000) Does NOT Trigger
- **Test Case ID:** `TC-M5-003`
- **Module ID:** `MOD-05`
- **Test Scenario:** Transfer amount of exactly ₹50,000 with high historical average does not trigger.
- **Preconditions:** Historical average = ₹15,000 (5x = ₹75,000).
- **Test Data:** `amount: 50000`, `historyAvg: 15000`
- **Steps:**
  1. Evaluate `amtExtremeRule(transactionData, context)`.
- **Expected Result:**
  - `triggered`: `false`
  - `score`: `0`
- **Test Type:** Unit / Boundary
- **Priority:** High
- **Status:** Not Run

---

### TC-M5-004: `RULE_VELOCITY_HIGH` Triggers on > 3 Transactions in 10 Minutes
- **Test Case ID:** `TC-M5-004`
- **Module ID:** `MOD-05`
- **Test Scenario:** 4th transaction within a 10-minute sliding window triggers velocity alert.
- **Preconditions:** Context reports 3 prior transactions in the last 10 minutes.
- **Test Data:** `recent10MinTxCount: 4`
- **Steps:**
  1. Evaluate `velocityHighRule(transactionData, context)`.
- **Expected Result:**
  - `triggered`: `true`
  - `score`: `30`
  - `ruleCode`: `"RULE_VELOCITY_HIGH"`
- **Test Type:** Unit / Rule
- **Priority:** High
- **Status:** Not Run

---

### TC-M5-005: `RULE_DEVICE_NEW` Triggers on Unrecognized Device
- **Test Case ID:** `TC-M5-005`
- **Module ID:** `MOD-05`
- **Test Scenario:** Transaction from a device not in the user's known device history triggers rule.
- **Preconditions:** `isKnownDevice: false`.
- **Test Data:** `deviceContext: { isKnownDevice: false, deviceId: "new-macbook" }`
- **Steps:**
  1. Evaluate `deviceNewRule(transactionData, context)`.
- **Expected Result:**
  - `triggered`: `true`
  - `score`: `25`
  - `ruleCode`: `"RULE_DEVICE_NEW"`
- **Test Type:** Unit / Rule
- **Priority:** High
- **Status:** Not Run

---

### TC-M5-006: `RULE_BENEFICIARY_NEW` Triggers on > ₹10,000 to Beneficiary Added < 24h Ago
- **Test Case ID:** `TC-M5-006`
- **Module ID:** `MOD-05`
- **Test Scenario:** Transfer of ₹15,000 sent to a beneficiary created 2 hours ago triggers rule.
- **Preconditions:** Beneficiary age = 2 hours (< 24h).
- **Test Data:** `amount: 15000`, `beneficiaryAgeHours: 2`
- **Steps:**
  1. Evaluate `beneficiaryNewRule(transactionData, context)`.
- **Expected Result:**
  - `triggered`: `true`
  - `score`: `30`
  - `ruleCode`: `"RULE_BENEFICIARY_NEW"`
- **Test Type:** Unit / Rule
- **Priority:** High
- **Status:** Not Run

---

### TC-M5-007: `RULE_FAIL_BURST` Triggers on >= 3 Failed Attempts in 15 Minutes
- **Test Case ID:** `TC-M5-007`
- **Module ID:** `MOD-05`
- **Test Scenario:** 3 consecutive failed attempts in the last 15 minutes triggers rule.
- **Preconditions:** Recent failure count = 3.
- **Test Data:** `recentFailedCount: 3`
- **Steps:**
  1. Evaluate `failBurstRule(transactionData, context)`.
- **Expected Result:**
  - `triggered`: `true`
  - `score`: `20`
  - `ruleCode`: `"RULE_FAIL_BURST"`
- **Test Type:** Unit / Rule
- **Priority:** High
- **Status:** Not Run

---

### TC-M5-008: `RULE_DORMANT_SPIKE` Triggers on > ₹5,000 After > 30 Days Inactivity
- **Test Case ID:** `TC-M5-008`
- **Module ID:** `MOD-05`
- **Test Scenario:** Transfer of ₹6,000 from an account inactive for 45 days triggers rule.
- **Preconditions:** Days since last transaction = 45; account age > 30 days.
- **Test Data:** `amount: 6000`, `daysSinceLastActivity: 45`
- **Steps:**
  1. Evaluate `dormantSpikeRule(transactionData, context)`.
- **Expected Result:**
  - `triggered`: `true`
  - `score`: `25`
  - `ruleCode`: `"RULE_DORMANT_SPIKE"`
- **Test Type:** Unit / Rule
- **Priority:** High
- **Status:** Not Run

---

### TC-M5-009: Score Capping at 100 When Multiple Rules Exceed 100
- **Test Case ID:** `TC-M5-009`
- **Module ID:** `MOD-05`
- **Test Scenario:** Combination of rules yielding raw score > 100 caps strictly at 100.
- **Preconditions:** `RULE_AMT_EXTREME` (+35), `RULE_VELOCITY_HIGH` (+30), `RULE_BENEFICIARY_NEW` (+30), `RULE_DEVICE_NEW` (+25) all trigger (Raw: 120).
- **Test Data:** Cumulative rule triggers totaling 120 points.
- **Steps:**
  1. Pass triggered rules into `scorer.calculateFinalScore()`.
- **Expected Result:**
  - `rawScore`: `120`
  - `finalScore`: `100` (capped at 100)
  - `riskLevel`: `"HIGH"`
- **Test Type:** Unit / Mathematical
- **Priority:** Critical
- **Status:** Not Run

---

### TC-M5-010: Risk Tier Boundary Categorization (Low, Medium, High)
- **Test Case ID:** `TC-M5-010`
- **Module ID:** `MOD-05`
- **Test Scenario:** Verifies exact tier boundaries: 30 = LOW, 31 = MEDIUM, 70 = MEDIUM, 71 = HIGH.
- **Preconditions:** Scorer module loaded.
- **Test Data:** Scores `[0, 30, 31, 55, 70, 71, 100]`
- **Steps:**
  1. Test mapping for each score value.
- **Expected Result:**
  - Score 0 -> `LOW`
  - Score 30 -> `LOW`
  - Score 31 -> `MEDIUM`
  - Score 55 -> `MEDIUM`
  - Score 70 -> `MEDIUM`
  - Score 71 -> `HIGH`
  - Score 100 -> `HIGH`
- **Test Type:** Unit / Boundary
- **Priority:** Critical
- **Status:** Not Run
