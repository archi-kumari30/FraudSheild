# FraudShield — Fraud Engine Implementation Plan

## 1. Engine Objective & Boundaries
The Fraud Detection Engine is a deterministic, synchronous, in-memory evaluation subsystem written in pure JavaScript (Node.js). It evaluates payment transactions before ledger execution, computing a numerical risk score and assigning an action tier.

---

## 2. The 6 Approved Deterministic Rules

### Rule 1 — Extreme Amount
- **Identifier:** `RULE_AMT_EXTREME`
- **Weight:** `+35`
- **File:** `backend/src/fraud/rules/amountRule.js`
- **Trigger Logic:**
  - `amount > ₹50,000`
  - OR `amount > 5 × user's 30-day transaction average` (when history exists and average > 0)
- **Explanation:** Abnormal single-transfer amount exceeding extreme security cap or 5x customer baseline.

### Rule 2 — High Velocity
- **Identifier:** `RULE_VELOCITY_HIGH`
- **Weight:** `+30`
- **File:** `backend/src/fraud/rules/velocityRule.js`
- **Trigger Logic:**
  - `more than 3 transactions occur within 10 minutes` (`recent10MinTxCount > 3`)
- **Explanation:** Rapid burst of transactions indicating automated scripts or card testing.

### Rule 3 — New Device
- **Identifier:** `RULE_DEVICE_NEW`
- **Weight:** `+25`
- **File:** `backend/src/fraud/rules/deviceRule.js`
- **Trigger Logic:**
  - `device identifier is not known for the customer` (`isKnownDevice === false`)
- **Explanation:** Outflow initiated from an unrecognized client device identifier.

### Rule 4 — New Beneficiary
- **Identifier:** `RULE_BENEFICIARY_NEW`
- **Weight:** `+30`
- **File:** `backend/src/fraud/rules/beneficiaryRule.js`
- **Trigger Logic:**
  - `transaction amount > ₹10,000`
  - AND `beneficiary age < 24 hours` (`beneficiaryAgeHours !== null && beneficiaryAgeHours < 24`)
- **Explanation:** High-value transfer sent to a newly added recipient account.

### Rule 5 — Failed Attempt Burst
- **Identifier:** `RULE_FAIL_BURST`
- **Weight:** `+20`
- **File:** `backend/src/fraud/rules/failedAttemptsRule.js`
- **Trigger Logic:**
  - `at least 3 failed transaction attempts occur within 15 minutes` (`recentFailedCount >= 3`)
- **Explanation:** Multiple consecutive payment rejections or failures within 15 minutes.

### Rule 6 — Dormant Account Spike
- **Identifier:** `RULE_DORMANT_SPIKE`
- **Weight:** `+25`
- **File:** `backend/src/fraud/rules/dormantAccountRule.js`
- **Trigger Logic:**
  - `no transaction for at least 30 days` (`daysSinceLastActivity >= 30` or account age >= 30 days without transfers)
  - AND `current transaction amount > ₹5,000` (`amount > 5000`)
- **Explanation:** Sudden large withdrawal from a historically inactive account.

---

## 3. Risk Calculation & Tier Classification

### Formula
$$\text{finalScore} = \min(\text{totalRuleScore}, 100)$$

### Decision Tiers
| Score Range | Risk Level | System Action | Transaction Status | Ledger State |
| :---: | :---: | :---: | :---: | :--- |
| **0 – 30** | **LOW** | **APPROVED** | `APPROVED` | Sender `availableBalance` debited; Recipient `availableBalance` credited. |
| **31 – 70** | **MEDIUM** | **VERIFY** | `CUSTOMER_VERIFICATION_REQUIRED` | Sender `availableBalance` debited; Sender `heldBalance` credited (Escrow). Recipient untouched. Customer self-verification prompt. |
| **71 – 100** | **HIGH** | **BLOCKED** | `BLOCKED` | Zero balance modifications. Transfer immediately rejected. |

---

## 4. Context Collection Pipeline (`contextCollector.js`)
Gathers telemetry and historical metrics prior to rule evaluation:
1. **Device Recognition:** Checks whether `x-device-id` exists in the user's `UserDevice` registry.
2. **Beneficiary Age:** Queries `Beneficiary` creation timestamp to calculate `beneficiaryAgeHours`.
3. **10-Minute Velocity:** Queries transactions by sender within `now - 10 minutes`.
4. **15-Minute Failed Attempts:** Queries failed/blocked transactions by sender within `now - 15 minutes`.
5. **30-Day Historical Average:** Aggregates completed transaction amounts by sender over the prior 30 days.
6. **Dormancy Check:** Identifies the timestamp of the last completed transaction or user account creation.

---

## 5. Verification Demo Scenarios
1. **Scenario 1:** ₹2,000, Known Device, Known Beneficiary
   - Rules triggered: None
   - Score: 0 -> `LOW` -> `APPROVED`
2. **Scenario 2:** ₹15,000, New Device, New Beneficiary
   - Rules triggered: `RULE_DEVICE_NEW` (+25), `RULE_BENEFICIARY_NEW` (+30)
   - Score: 55 -> `MEDIUM` -> `CUSTOMER_VERIFICATION_REQUIRED` (Customer self-verification: "Confirm Payment" -> `APPROVED`; or "I Didn't Initiate This" -> `FLAGGED_FOR_REVIEW` escalated to Admin Queue)
3. **Scenario 3:** ₹60,000, New Device, New Beneficiary
   - Rules triggered: `RULE_AMT_EXTREME` (+35), `RULE_DEVICE_NEW` (+25), `RULE_BENEFICIARY_NEW` (+30)
   - Score: 90 -> `HIGH` -> `BLOCKED`
