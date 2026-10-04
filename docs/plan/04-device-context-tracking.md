# Module 4 Implementation Plan: Device & Context Tracking
## Project: FraudShield — Real-Time Rule-Based Fraud Detection & Prevention Platform

---

### Document Information
- **Module ID:** `MOD-04`
- **Module Name:** Device & Context Tracking
- **Document Path:** `docs/plan/04-device-context-tracking.md`
- **Version:** 1.0.0
- **Status:** Pending Stakeholder Approval
- **Parent Documents (Sources of Truth):**
  - `docs/FraudShield_SRS.md` (Approved v1.0.0)
  - `docs/context.md` (Approved v1.0.0)
  - `docs/implementation-plan.md` (Approved v1.0.0)

---

## 1. Module Objective

The objective of **Module 4 (Device & Context Tracking)** is to capture, normalize, and record client device and network session telemetry associated with user activity, maintaining a historical device registry per user account. This enables the fraud detection engine in Module 5 to deterministically evaluate whether an incoming transaction originates from a recognized or unrecognized device (`RULE_DEVICE_NEW`).

> **Critical Architecture Clarification:** The `x-device-id` value generated and persisted by the frontend is an application-level device identifier for fraud-rule evaluation. It is **NOT** a secure cryptographic device fingerprint and must not be treated as proof of device identity.

---

## 2. Scope

### In-Scope:
- Device Context extraction middleware (`deviceContextMiddleware.js`):
  - Extracts application-level device identifier from incoming `x-device-id` header.
  - Extracts browser / client User-Agent header.
  - Resolves client IP address (supporting proxy forwarding headers `x-forwarded-for`).
  - Attaches normalized `req.deviceContext` object to Express request.
- `UserDevice` model and Mongoose schema storing:
  - `userId` (ref: `'User'`).
  - `deviceId` (string identifier).
  - `userAgent` (string).
  - `ipAddress` (string).
  - `firstSeenAt` (Date).
  - `lastSeenAt` (Date).
- Device service (`deviceService.js`):
  - `isKnownDevice(userId, deviceId)`: queries whether `deviceId` has previously been registered for `userId`.
  - `registerDevice(userId, deviceContext)`: records or updates device timestamp in registry upon successful login or transaction.
  - `getUserDevices(userId)`: lists known devices for authenticated customer profile inspection.
- Device inspection endpoint (`GET /api/devices`) for authenticated users.

### Out-of-Scope for Module 4:
- Triggering fraud rules or calculating risk scores (belongs to Module 5).
- Transaction submission or balance holds (belongs to Module 6).
- Advanced third-party canvas / audio fingerprinting libraries or commercial threat intelligence APIs.
- Hardware-based biometrics or GPS telemetry.

---

## 3. Dependencies

- **Preceding Modules:**
  - Module 1 (`MOD-01`: Express infrastructure, DB connection).
  - Module 2 (`MOD-02`: Authentication middleware, user identity).

---

## 4. Backend Work

- Implement `backend/src/models/UserDevice.js` schema.
- Implement `backend/src/middleware/deviceContextMiddleware.js`:
  - Validates format of `x-device-id`. If missing, generates a fallback session token or flags as unsupplied.
  - Captures IP address and User-Agent.
- Implement `backend/src/services/deviceService.js`:
  - Core query methods for historical device matching.
- Implement `backend/src/controllers/deviceController.js`.
- Implement `backend/src/routes/deviceRoutes.js`.
- Mount routes under `/api/devices`.

---

## 5. Frontend Work

- None in this module. The frontend utility that generates persistent UUIDs in `localStorage` and attaches `x-device-id` via Axios interceptors is integrated in Module 10 (Customer Portal).

---

## 6. Database Work

### Collection: `user_devices`
- Attributes:
  - `userId`: ObjectId, ref: `'User'`, required, indexed.
  - `deviceId`: String, required, trimmed, index: true.
  - `userAgent`: String, default: `'unknown'`.
  - `ipAddress`: String, default: `'unknown'`.
  - `firstSeenAt`: Date, default: `Date.now`.
  - `lastSeenAt`: Date, default: `Date.now`.
- Indexes:
  - Compound unique index on `{ userId: 1, deviceId: 1 }` ensuring fast lookup and unique association.

---

## 7. API Work

| Method | Path | Access | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/devices` | Customer | Lists all registered devices associated with the authenticated user account. |

---

## 8. Security Considerations

- **SEC-M4-01 (Header Sanitization):** Values supplied in `x-device-id` must be sanitized to prevent header injection or NoSQL injection payloads. Only alphanumeric, hyphens, and underscores allowed (UUID format preferred).
- **SEC-M4-02 (Application-Level Scope):** Code must never assume `x-device-id` proves user identity or replaces cryptographic JWT authentication.
- **SEC-M4-03 (Data Privacy):** IP addresses and User-Agent strings stored solely for fraud detection auditability and must not be exposed to unauthorized parties.

---

## 9. Validation Requirements

- `x-device-id` Header Validation:
  - String, 10–100 characters, alphanumeric with hyphens/underscores.
  - Malformed or injection payloads in `x-device-id` header sanitized or flagged as invalid.

---

## 10. Error Handling

- Invalid/malformed device header: Sanitized to `"invalid-device-id"` and flagged for evaluation without crashing request.
- Database query failure during device check: Log error and fail safely (defaults to treat as new device to prevent security bypass).

---

## 11. Files and Folders Expected to Be Created

```
backend/
├── src/
│   ├── models/
│   │   └── UserDevice.js
│   ├── middleware/
│   │   └── deviceContextMiddleware.js
│   ├── services/
│   │   └── deviceService.js
│   ├── controllers/
│   │   └── deviceController.js
│   └── routes/
│       └── deviceRoutes.js
└── tests/
    └── device.test.js
```

---

## 12. Files and Features Explicitly Out of Scope

- Prohibited files: `fraudEngine.js`, `Transaction.js`, `Alert.js`.
- Prohibited features: Real device fingerprinting platforms (FingerprintJS Pro), hardware telemetry, geo-IP lookup microservices.

---

## 13. Implementation Sequence

1. Define `UserDevice` Mongoose schema with compound `{ userId, deviceId }` index.
2. Implement `deviceContextMiddleware` extracting headers and populating `req.deviceContext`.
3. Implement `deviceService` methods (`isKnownDevice`, `registerDevice`, `getUserDevices`).
4. Implement `deviceController` and `deviceRoutes`.
5. Mount `deviceContextMiddleware` globally on API pipeline in `app.js`.
6. Write automated tests (`device.test.js`).

---

## 14. Completion Criteria

1. Requests with `x-device-id` have normalized `deviceContext` attached to `req`.
2. First-time request from a device registers `deviceId` in database.
3. Subsequent check with the same `deviceId` returns `isKnownDevice === true`.
4. Check with an unseen `deviceId` returns `isKnownDevice === false`.
5. User can query `GET /api/devices` to see their registered devices.
6. 100% of automated tests in `tests/device.test.js` pass.
