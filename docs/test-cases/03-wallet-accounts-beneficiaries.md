# Module 3 Test Cases: Wallet, Accounts & Beneficiaries
## Project: FraudShield — Real-Time Rule-Based Fraud Detection & Prevention Platform

---

### Document Information
- **Module ID:** `MOD-03`
- **Module Name:** Wallet, Accounts & Beneficiaries
- **Document Path:** `docs/test-cases/03-wallet-accounts-beneficiaries.md`
- **Version:** 1.0.0
- **Status:** Complete / Ready for Execution
- **Parent Documents (Sources of Truth):**
  - `docs/FraudShield_SRS.md`
  - `docs/context.md`
  - `docs/implementation-plan.md`
  - `docs/plan/03-wallet-accounts-beneficiaries.md`
  - `docs/edge-cases/03-wallet-accounts-beneficiaries.md`

---

## 1. Overview

This document specifies the test cases for **Module 3: Wallet, Accounts & Beneficiaries**. It validates automatic wallet provisioning, balance retrieval, test deposits, beneficiary address book workflows, and ownership boundaries.

---

## 2. Test Cases Specification

### TC-M3-001: Automatic Wallet Provisioning on Customer Registration
- **Test Case ID:** `TC-M3-001`
- **Module ID:** `MOD-03`
- **Test Scenario:** Registering a new customer automatically initializes an internal wallet.
- **Preconditions:** New customer registration payload.
- **Test Data:** Customer registration for `bob@example.com`
- **Steps:**
  1. Register customer via `POST /api/auth/register`.
  2. Query `wallets` collection for `userId = customer.id`.
- **Expected Result:**
  - Wallet exists in database.
  - `availableBalance` equals `10000` (₹10,000 initial simulated balance).
  - `heldBalance` equals `0`.
  - `currency` equals `'INR'`.
- **Test Type:** Integration
- **Priority:** High
- **Status:** Not Run

---

### TC-M3-002: Customer Retrieves Own Wallet Balances (`GET /api/wallet`)
- **Test Case ID:** `TC-M3-002`
- **Module ID:** `MOD-03`
- **Test Scenario:** Authenticated customer retrieves their current available and held balances.
- **Preconditions:** Customer authenticated with active wallet.
- **Test Data:** Header `Authorization: Bearer <customer_jwt>`
- **Steps:**
  1. Send `GET /api/wallet`.
  2. Inspect response data.
- **Expected Result:**
  - Status Code: `200 OK`
  - Payload matches: `{ "success": true, "data": { "availableBalance": 10000, "heldBalance": 0, "currency": "INR" } }`
- **Test Type:** API
- **Priority:** High
- **Status:** Not Run

---

### TC-M3-003: Simulated Test Deposit Succeeds
- **Test Case ID:** `TC-M3-003`
- **Module ID:** `MOD-03`
- **Test Scenario:** Customer deposits simulated funds into `availableBalance`.
- **Preconditions:** Authenticated customer with starting balance ₹10,000.
- **Test Data:** `{ "amount": 5000 }`
- **Steps:**
  1. Send `POST /api/wallet/deposit` with amount 5000.
  2. Inspect response and query `GET /api/wallet`.
- **Expected Result:**
  - Status Code: `200 OK`
  - `availableBalance` updates to `15000` (₹15,000).
  - `heldBalance` remains `0`.
- **Test Type:** API / Integration
- **Priority:** High
- **Status:** Not Run

---

### TC-M3-004: Negative and Zero Deposit Rejection
- **Test Case ID:** `TC-M3-004`
- **Module ID:** `MOD-03`
- **Test Scenario:** Deposit requests with <= 0 amounts are rejected.
- **Preconditions:** Authenticated customer.
- **Test Data:** Payloads: `{ "amount": 0 }` and `{ "amount": -1000 }`
- **Steps:**
  1. Send `POST /api/wallet/deposit` with amount 0.
  2. Send `POST /api/wallet/deposit` with amount -1000.
- **Expected Result:**
  - Status Code: `400 Bad Request` in both cases.
  - Balance remains unchanged.
- **Test Type:** API / Security
- **Priority:** High
- **Status:** Not Run

---

### TC-M3-005: Add Valid Beneficiary
- **Test Case ID:** `TC-M3-005`
- **Module ID:** `MOD-03`
- **Test Scenario:** Customer adds an existing customer as a saved beneficiary.
- **Preconditions:** Two registered customers: Sender and Recipient (`charlie@example.com`).
- **Test Data:** `{ "recipientEmail": "charlie@example.com", "nickname": "Charlie Personal" }`
- **Steps:**
  1. Send `POST /api/beneficiaries` with test payload.
  2. Inspect response body and database record.
- **Expected Result:**
  - Status Code: `201 Created`
  - Response contains beneficiary record with `recipientAccountId`, `nickname`, and `createdAt` timestamp.
- **Test Type:** API / Integration
- **Priority:** High
- **Status:** Not Run

---

### TC-M3-006: Self-Beneficiary Rejection
- **Test Case ID:** `TC-M3-006`
- **Module ID:** `MOD-03`
- **Test Scenario:** Customer attempts to add their own account as a beneficiary.
- **Preconditions:** Authenticated customer with email `self@example.com`.
- **Test Data:** `{ "recipientEmail": "self@example.com", "nickname": "My Own Account" }`
- **Steps:**
  1. Send `POST /api/beneficiaries`.
- **Expected Result:**
  - Status Code: `400 Bad Request`
  - Error: `"Cannot add yourself as a beneficiary"`.
- **Test Type:** Business Logic / Security
- **Priority:** High
- **Status:** Not Run

---

### TC-M3-007: Duplicate Beneficiary Rejection
- **Test Case ID:** `TC-M3-007`
- **Module ID:** `MOD-03`
- **Test Scenario:** Adding the same beneficiary twice is rejected.
- **Preconditions:** Beneficiary already added.
- **Test Data:** Duplicate beneficiary payload.
- **Steps:**
  1. Send `POST /api/beneficiaries` with identical recipient.
- **Expected Result:**
  - Status Code: `409 Conflict`
  - Error: `"Beneficiary already added"`.
- **Test Type:** API
- **Priority:** Medium
- **Status:** Not Run

---

### TC-M3-008: Delete Beneficiary
- **Test Case ID:** `TC-M3-008`
- **Module ID:** `MOD-03`
- **Test Scenario:** Customer deletes an existing beneficiary from their address book.
- **Preconditions:** Beneficiary exists for authenticated user.
- **Test Data:** `DELETE /api/beneficiaries/:beneficiaryId`
- **Steps:**
  1. Send delete request.
  2. Query `GET /api/beneficiaries`.
- **Expected Result:**
  - Status Code: `200 OK`
  - Beneficiary no longer returned in list.
- **Test Type:** API
- **Priority:** Medium
- **Status:** Not Run
