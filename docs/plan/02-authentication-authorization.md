# Module 2 Implementation Plan: Authentication & Authorization (RBAC)
## Project: FraudShield — Real-Time Rule-Based Fraud Detection & Prevention Platform

---

### Document Information
- **Module ID:** `MOD-02`
- **Module Name:** Authentication & Authorization
- **Document Path:** `docs/plan/02-authentication-authorization.md`
- **Version:** 1.0.0
- **Status:** Pending Stakeholder Approval
- **Parent Documents (Sources of Truth):**
  - `docs/FraudShield_SRS.md` (Approved v1.0.0)
  - `docs/context.md` (Approved v1.0.0)
  - `docs/implementation-plan.md` (Approved v1.0.0)

---

## 1. Module Objective

The objective of **Module 2 (Authentication & Authorization)** is to implement secure, stateless user identity management and role-based access control (RBAC). It establishes the cryptographic foundation for authenticating requests and strictly enforces boundary isolation between the two approved roles: `customer` and `admin`.

---

## 2. Scope

### In-Scope:
- User model and Mongoose schema storing identity, credentials, role, and active status.
- Secure password hashing using `bcrypt` (minimum 10 salt rounds) and comparison logic.
- Stateless JSON Web Token (JWT) generation, signing, and verification utilities.
- Centralized authentication middleware (`authenticateToken`) validating incoming `Bearer <token>` headers.
- Role-based authorization middleware guard (`authorizeRole(['admin'])`) blocking unauthorized roles with HTTP 403.
- Public customer registration endpoint (`POST /api/auth/register`).
- Public authentication endpoint (`POST /api/auth/login`).
- Authenticated profile inspection endpoint (`GET /api/auth/me`).
- Database seed script (`npm run seed:admin`) to provision the default administrator account from environment variables.
- Input validation using schema validators (`express-validator`).

### Out-of-Scope for Module 2:
- Wallet creation, balance tracking, or deposit capabilities (belongs to Module 3).
- Beneficiary address books (belongs to Module 3).
- Device tracking telemetry extraction (belongs to Module 4).
- Fraud rule evaluation or transaction checks (belongs to Module 5 & 6).
- Customer portal or Admin dashboard React views (belongs to Module 10 & 11).
- Unapproved roles (`fraud_analyst`, `super_admin`, `support_agent`).

---

## 3. Dependencies

- **Preceding Modules:** Module 1 (`MOD-01`: Project Setup & Infrastructure — Express app, MongoDB connection, configuration loader, error handling).
- **External Libraries:** `bcrypt`, `jsonwebtoken`, `express-validator`.

---

## 4. Backend Work

- Create User Mongoose schema in `backend/src/models/User.js`.
- Implement password hashing hooks / helper methods using `bcrypt.hash()` and `bcrypt.compare()`.
- Implement JWT utility in `backend/src/utils/token.js` (`generateToken`, `verifyToken`).
- Implement `backend/src/middleware/authMiddleware.js`:
  - `authenticateToken`: extracts Bearer token from `Authorization` header, verifies signature and expiration, attaches decoded payload to `req.user`.
  - `authorizeRole`: higher-order middleware checking `req.user.role` against permitted roles.
- Implement `backend/src/controllers/authController.js` managing registration, login, and profile fetching.
- Implement `backend/src/routes/authRoutes.js` mounting endpoints under `/api/auth`.
- Implement `backend/src/scripts/seedAdmin.js` reading `ADMIN_NAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` to create the initial admin account safely.

---

## 5. Frontend Work

- None in this module. Frontend authentication views and state management are implemented in Module 10 (Customer Portal) and Module 11 (Analyst Dashboard).

---

## 6. Database Work

### Collection: `users`
- Attributes:
  - `name`: String, required, trimmed.
  - `email`: String, required, unique, lowercase, trimmed, indexed.
  - `passwordHash`: String, required.
  - `role`: String, enum: `['customer', 'admin']`, default: `'customer'`.
  - `isActive`: Boolean, default: `true`.
  - `createdAt`: Date, default: `Date.now`.
  - `updatedAt`: Date, default: `Date.now`.
- Indexes: Unique index on `email`.

---

## 7. API Work

| Method | Path | Access | Description |
| :--- | :--- | :---: | :--- |
| `POST` | `/api/auth/register` | Public | Registers a new customer account (cannot self-assign `admin`). |
| `POST` | `/api/auth/login` | Public | Authenticates credentials and returns JWT + user details. |
| `GET` | `/api/auth/me` | Authenticated | Returns profile of currently authenticated user. |

---

## 8. Security Considerations

- **SEC-M2-01 (Password Security):** Passwords must never be stored, logged, or serialized in plain text. Use bcrypt with salt rounds >= 10.
- **SEC-M2-02 (Credential Sanitization):** Database queries returning user data must exclude `passwordHash` (e.g., `select('-passwordHash')`).
- **SEC-M2-03 (Role Tampering Prevention):** Registration payload `role` attribute is strictly ignored or forced to `'customer'`. Admin accounts can only be provisioned via server seed script.
- **SEC-M2-04 (Token Signature & Expiration):** JWTs signed with `JWT_SECRET` from environment variables with fixed lifespan (24h).
- **SEC-M2-05 (Timing Attack Resilience):** Invalid email and invalid password attempts return identical generic error: `"Invalid email or password"`.

---

## 9. Validation Requirements

- **Registration Validation:**
  - `name`: Non-empty string, 2–100 characters.
  - `email`: Valid email format, lowercase.
  - `password`: Minimum 8 characters, containing at least one number and one letter.
- **Login Validation:**
  - `email`: Valid email format.
  - `password`: Non-empty string.
- Unknown fields in request body are rejected.

---

## 10. Error Handling

- Duplicate email registration: Caught via unique index or pre-check, returns HTTP 409 Conflict.
- Invalid credentials: Returns HTTP 401 Unauthorized with `"Invalid email or password"`.
- Missing or invalid Bearer token: Returns HTTP 401 Unauthorized with `"Access token required or invalid"`.
- Token expired: Returns HTTP 401 Unauthorized with `"Token expired"`.
- Role forbidden: Returns HTTP 403 Forbidden with `"Access denied: insufficient permissions"`.

---

## 11. Files and Folders Expected to Be Created

```
backend/
├── src/
│   ├── models/
│   │   └── User.js
│   ├── controllers/
│   │   └── authController.js
│   ├── middleware/
│   │   └── authMiddleware.js
│   ├── routes/
│   │   └── authRoutes.js
│   ├── utils/
│   │   └── token.js
│   └── scripts/
│       └── seedAdmin.js
└── tests/
    └── auth.test.js
```

---

## 12. Files and Features Explicitly Out of Scope

- Prohibited files: `Wallet.js`, `Beneficiary.js`, `Device.js`, `Transaction.js`, `fraudEngine.js`, `Alert.js`, `geminiService.js`, `AuditLog.js`.
- Prohibited features: Password reset emails, SMS MFA, third-party OAuth, role definitions beyond `customer` and `admin`.

---

## 13. Implementation Sequence

1. Define User Mongoose schema with email indexing and password hashing methods.
2. Implement JWT generation and verification utilities.
3. Implement `authenticateToken` and `authorizeRole` middleware.
4. Implement input validation middleware schemas for registration and login.
5. Implement `authController` methods (`register`, `login`, `getProfile`).
6. Mount `authRoutes` in Express application (`app.js`).
7. Implement admin seed script (`seedAdmin.js`).
8. Create automated integration test suite (`auth.test.js`).

---

## 14. Completion Criteria

1. Customer registration succeeds with valid payload and returns HTTP 201 with JWT.
2. Duplicate registration attempt fails with HTTP 409.
3. Registration payload attempting to pass `role: 'admin'` produces a user with `role: 'customer'`.
4. Login with correct credentials returns valid JWT and user metadata (without `passwordHash`).
5. Login with invalid password or email returns HTTP 401.
6. `GET /api/auth/me` with valid token returns user profile; missing token returns HTTP 401.
7. Route guarded with `authorizeRole(['admin'])` permits admin user and rejects customer with HTTP 403.
8. Admin seed script successfully creates administrator account in MongoDB.
9. 100% of automated tests in `tests/auth.test.js` pass.
