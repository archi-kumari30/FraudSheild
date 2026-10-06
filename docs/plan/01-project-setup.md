# Module 1 Implementation Plan: Project Setup & Infrastructure
## Project: FraudShield — Real-Time Rule-Based Fraud Detection & Prevention Platform

---

### Document Information
- **Module ID:** `MOD-01`
- **Module Name:** Project Setup & Infrastructure
- **Document Path:** `docs/plan/01-project-setup.md`
- **Version:** 1.0.0
- **Status:** Pending Stakeholder Approval
- **Parent Documents (Sources of Truth):**
  - `docs/FraudShield_SRS.md` (Approved v1.0.0)
  - `docs/context.md` (Approved v1.0.0)
  - `docs/implementation-plan.md` (Approved v1.0.0)

---

## 1. Module Objective

The objective of **Module 1 (Project Setup & Infrastructure)** is to initialize the clean, isolated foundational architecture for both the backend (Node.js/Express) and frontend (React/Vite) applications without introducing business logic or domain models prematurely. 

This establishes:
1. Physical repository decoupling between `backend/` and `frontend/`.
2. Secure environment variable configuration and validation.
3. Resilient MongoDB connection management with clean connection/disconnection lifecycles.
4. Baseline Express application setup with standardized security headers, CORS origin restrictions, body parsers, and centralized error handling.
5. Automated testing infrastructure using Jest and Supertest.
6. Frontend build tooling, Tailwind CSS styling configuration, and centralized Axios HTTP client.

---

## 2. Scope

### In-Scope for Module 1:
- Repository directory structure initialization (`backend/`, `frontend/`).
- Backend `package.json` initialization with approved runtime and development dependencies.
- Frontend `package.json` initialization via Vite React with Tailwind CSS.
- Environment configuration templates (`.env.example`) and loaders with validation.
- MongoDB connection utility with connection event listeners, retry handling, and test teardown hooks.
- Global Express application setup with:
  - CORS middleware tied to frontend URL.
  - Helmet HTTP security headers.
  - JSON and URL-encoded request body parsing.
  - Baseline rate limiter.
  - Standardized JSON response formatting utility (`successResponse`, `errorResponse`).
  - Standardized 404 Route Not Found handler.
  - Centralized global error handling middleware.
- Base Health Check endpoint: `GET /api/health`.
- Jest and Supertest test environment configuration for backend.
- Initial health check automated test suite.
- Frontend base Tailwind setup, typography, and Axios client instance with interceptors.

### Explicitly Out-of-Scope for Module 1:
- User models, authentication routes, or JWT issuance (belongs to Module 2).
- Wallet schemas, balances, or beneficiary models (belongs to Module 3).
- Device tracking models or transaction middleware (belongs to Module 4).
- Fraud detection rules, scorers, or risk tiers (belongs to Module 5).
- Transaction processing or escrow logic (belongs to Module 6).
- Alert models, review queues, or incident statuses (belongs to Module 7).
- Gemini API integration or AI prompt services (belongs to Module 8).
- Audit log models or loggers (belongs to Module 9).
- Customer portal views or React state providers (belongs to Module 10).
- Analyst dashboard views or review modals (belongs to Module 11).

---

## 3. Dependencies

- **Preceding Modules:** None. Module 1 is the initial architectural bootstrap.
- **System Prerequisites:**
  - Node.js LTS (v18.x or v20.x).
  - npm (v9.x or v10.x).
  - MongoDB instance (local or MongoDB Atlas connection string).

---

## 4. Backend Setup Requirements

The backend is an isolated Node.js/Express REST API server residing strictly within `backend/`.

### 4.1 Server Lifecycle & Entry Points
- `src/server.js`: Process entry point responsible for:
  - Loading environment variables.
  - Invoking database connection.
  - Starting the HTTP server listener on `process.env.PORT`.
  - Handling operating system process signals (`SIGINT`, `SIGTERM`) for graceful teardown.
- `src/app.js`: Isolated Express application factory responsible for:
  - Attaching middleware (Helmet, CORS, body parsers, logging).
  - Mounting baseline routes (`/api/health`).
  - Attaching 404 handler and global error middleware.
  - Exported independently for Supertest execution without binding to physical network ports.

### 4.2 Error Handling & Uniform Responses
- Standardized API response format for all JSON endpoints:
  - Success: `{ success: true, data: { ... }, message: "..." }`
  - Failure: `{ success: false, error: { message: "...", code: "..." } }`
- Global error handler catching unhandled exceptions, casting errors, and operational errors without leaking stack traces when `NODE_ENV === 'production'`.

---

## 5. Frontend Setup Requirements

The frontend is an isolated Single Page Application (SPA) residing strictly within `frontend/`.

### 5.1 Build System & Tooling
- Initialized with **Vite** using the standard React template (`vite create . --template react`).
- **Tailwind CSS** configured with PostCSS and Autoprefixer.
- Custom Tailwind theme configurations matching fintech branding:
  - Slate neutral palettes for structural layouts.
  - Emerald badges for `APPROVED` states.
  - Amber badges for `CUSTOMER_VERIFICATION_REQUIRED` and `FLAGGED_FOR_REVIEW` states.
  - Rose/Red badges for `BLOCKED` states.

### 5.2 HTTP Communication Foundation
- Centralized Axios client instance configured at `frontend/src/api/axiosClient.js`:
  - Base URL driven by `VITE_API_URL` (defaulting to `http://localhost:5000/api`).
  - Standard timeout of 10,000ms.
  - Request interceptor attaching standard headers (`Content-Type: application/json`).
  - Response interceptor transforming standardized responses and formatting network errors.

---

## 6. Required Packages & Justification

### 6.1 Backend Dependencies

| Package | Type | Justification / Role in Project |
| :--- | :---: | :--- |
| `express` | Production | Core lightweight HTTP web application framework. |
| `mongoose` | Production | Official MongoDB Object Data Modeling (ODM) library for schemas and connections. |
| `dotenv` | Production | Loads environment variables from `.env` file into `process.env`. |
| `cors` | Production | Enforces Cross-Origin Resource Sharing restrictions to authorized frontend origin. |
| `helmet` | Production | Sets essential HTTP security headers (X-Frame-Options, X-Content-Type-Options, etc.). |
| `express-rate-limit` | Production | Baseline IP rate limiter protecting public endpoints against brute force and DoS. |
| `morgan` | Production | HTTP request logger for development visibility. |
| `nodemon` | Development | Auto-reloads backend server during local development upon file change. |
| `jest` | Development | Standard JavaScript test runner and assertion framework. |
| `supertest` | Development | Programmatic HTTP assertion library for integration testing Express applications. |
| `cross-env` | Development | Sets environment variables across Windows and Unix platforms reliably. |

### 6.2 Frontend Dependencies

| Package | Type | Justification / Role in Project |
| :--- | :---: | :--- |
| `react` | Production | Core UI rendering library. |
| `react-dom` | Production | DOM renderer for React. |
| `react-router-dom` | Production | Declarative client-side routing and protected route management. |
| `axios` | Production | Promise-based HTTP client for consuming backend REST APIs. |
| `lucide-react` | Production | Lightweight, clean UI icon library for dashboard status indicators. |
| `vite` | Development | Next-generation frontend build tool and local dev server. |
| `@vitejs/plugin-react` | Development | Official Vite React plugin providing Fast Refresh and JSX support. |
| `tailwindcss` | Development | Utility-first CSS framework for responsive UI styling. |
| `postcss` | Development | CSS transformation tool used by Tailwind. |
| `autoprefixer` | Development | Adds vendor prefixes to CSS rules automatically. |

> **Prohibited Packages in Module 1:**
> No Python runtimes, no machine learning packages, no Kafka clients, no Redis clients, no Web3/blockchain SDKs, no payment gateway SDKs (Stripe, Razorpay), and no premature model/routing packages.

---

## 7. Environment Configuration Requirements

### 7.1 Backend Environment Configuration (`backend/.env.example`)
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/fraudshield

# Security & CORS
CORS_ORIGIN=http://localhost:5173
JWT_SECRET=replace_with_a_secure_random_secret_at_least_32_characters_long
JWT_EXPIRES_IN=24h

# Default Admin Seed Credentials (for Module 2 seeding)
ADMIN_NAME=System Administrator
ADMIN_EMAIL=admin@fraudshield.internal
ADMIN_PASSWORD=AdminSecurePassword123!

# AI Configuration (Module 8 integration)
GEMINI_API_KEY=your_gemini_api_key_here
```

### 7.2 Frontend Environment Configuration (`frontend/.env.example`)
```env
# API Gateway Endpoint
VITE_API_URL=http://localhost:5000/api
```

### 7.3 Configuration Validation Module (`backend/src/config/index.js`)
- On server startup, validates that essential environment variables (`PORT`, `MONGODB_URI`, `JWT_SECRET`) are present.
- If missing, exits process immediately with code 1 and a descriptive configuration error message.

---

## 8. Physical Backend / Frontend Separation

The directory structure maintains strict physical decoupling:

```
FraudShield/
├── backend/            # Self-contained Node.js project (own package.json, own node_modules)
├── frontend/           # Self-contained Vite React project (own package.json, own node_modules)
└── docs/               # Project-wide documentation, SRS, context, and plans
```

### Isolation Guarantees:
- `backend/` and `frontend/` have separate `package.json` files and separate dependency graphs.
- Frontend code cannot import backend code directly; communication is strictly over network HTTP/JSON.
- Frontend `.env` only exposes `VITE_` variables; backend `.env` is never accessible to the client.

---

## 9. Expected Folder Structure (Module 1 Scope)

Upon completion of Module 1, the repository file layout will strictly match:

```
FraudShield/
├── docs/
│   ├── FraudShield_SRS.md
│   ├── context.md
│   ├── implementation-plan.md
│   └── plan/
│       └── 01-project-setup.md
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js                      # MongoDB connection & lifecycle management
│   │   │   └── index.js                   # Environment configuration loader & validator
│   │   ├── middleware/
│   │   │   ├── errorHandler.js            # Centralized error handler & 404 handler
│   │   │   └── requestLogger.js           # Development request logging middleware
│   │   ├── routes/
│   │   │   └── healthRoutes.js            # GET /api/health endpoint
│   │   ├── utils/
│   │   │   └── apiResponse.js             # Standard success and error payload builders
│   │   ├── app.js                         # Express app configuration & middleware pipeline
│   │   └── server.js                      # HTTP server listener & graceful shutdown
│   ├── tests/
│   │   ├── setup.js                       # Jest test environment setup & teardown hooks
│   │   └── health.test.js                 # Automated tests for GET /api/health & error handler
│   ├── .env.example                       # Backend template environment configuration
│   ├── .gitignore                         # Ignores node_modules, .env, coverage
│   └── package.json                       # Backend scripts and dependencies
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── axiosClient.js             # Configured Axios client with base URL & interceptors
│   │   ├── App.jsx                        # Base React landing component verifying setup
│   │   ├── index.css                      # Tailwind base, components, and utilities
│   │   └── main.jsx                       # React DOM root entry
│   ├── .env.example                       # Frontend template environment configuration
│   ├── .gitignore                         # Ignores node_modules, dist, .env
│   ├── index.html                         # SPA HTML entry point
│   ├── package.json                       # Frontend scripts and dependencies
│   ├── postcss.config.js                  # PostCSS plugins (Tailwind, Autoprefixer)
│   ├── tailwind.config.js                 # Tailwind CSS theme extension
│   └── vite.config.js                     # Vite build and dev server configuration
│
└── README.md                              # Top-level workspace overview & setup guide
```

---

## 10. API & Server Configuration Requirements

### 10.1 Middleware Pipeline in `app.js`
1. `helmet()`: Basic security headers.
2. `cors({ origin: config.corsOrigin, credentials: true })`: CORS verification.
3. `express.json({ limit: '10kb' })`: Guard against oversized payload attacks.
4. `express.urlencoded({ extended: true, limit: '10kb' })`.
5. Request logger (active in development).
6. Rate limiting on `/api/` endpoints (100 requests per 15 minutes window for baseline protection).
7. Routes mounting: `app.use('/api', healthRoutes)`.
8. 404 handler: Catches all unmatched routes and returns standard JSON 404 error.
9. Centralized error handling middleware `(err, req, res, next)`.

### 10.2 Health Check Endpoint Specification
- **Method & Path:** `GET /api/health`
- **Access:** Public (no authentication required)
- **Response Status:** `200 OK`
- **Response Schema:**
```json
{
  "success": true,
  "message": "FraudShield API is running",
  "data": {
    "status": "healthy",
    "timestamp": "2026-10-04T09:30:00.000Z",
    "environment": "development",
    "database": "connected"
  }
}
```

---

## 11. Database Connection Requirements

### 11.1 Connection Strategy (`backend/src/config/db.js`)
- Uses `mongoose.connect(config.mongodbUri)` with standard options.
- Implements event listeners on `mongoose.connection`:
  - `connected`: Logs successful database connection.
  - `error`: Logs connection error details.
  - `disconnected`: Logs database disconnection notice.
- Exports two core functions:
  1. `connectDB()`: Establishes connection on application launch.
  2. `disconnectDB()`: Safely closes connections during test teardown and process exit.

### 11.2 Graceful Process Termination
- In `server.js`, registers listeners for `SIGINT` and `SIGTERM`:
  - Closes HTTP server first to reject new traffic.
  - Calls `disconnectDB()` to cleanly close MongoDB connections.
  - Exits Node process with code 0.

---

## 12. Security Requirements

- **SEC-M1-01 (Secrets Isolation):** All credentials (`MONGODB_URI`, `JWT_SECRET`, `GEMINI_API_KEY`) reside exclusively in `.env`. Both `backend/.gitignore` and `frontend/.gitignore` must explicitly ignore `.env`.
- **SEC-M1-02 (CORS Strictness):** CORS origin must not use wildcard `*` in production. It must match `process.env.CORS_ORIGIN`.
- **SEC-M1-03 (HTTP Security Headers):** Use Helmet to prevent clickjacking (`X-Frame-Options`), MIME sniffing (`X-Content-Type-Options`), and cross-site scripting filters.
- **SEC-M1-04 (Payload Limiting):** JSON body parsing restricted to `10kb` to thwart memory exhaustion DoS vectors.
- **SEC-M1-05 (Error Masking):** The centralized error handler must hide internal stack traces from responses when `NODE_ENV === 'production'`.

---

## 13. Development Scripts

### 13.1 Backend Scripts (`backend/package.json`)
```json
{
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js",
    "test": "cross-env NODE_ENV=test jest --runInBand --detectOpenHandles --forceExit",
    "test:watch": "cross-env NODE_ENV=test jest --watch",
    "test:coverage": "cross-env NODE_ENV=test jest --coverage"
  }
}
```

### 13.2 Frontend Scripts (`frontend/package.json`)
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

---

## 14. Testing Setup

### 14.1 Backend Test Runner Configuration
- Framework: **Jest** + **Supertest**.
- Configuration: `backend/jest.config.js` or inline `package.json` config.
- Test Environment: `node`.
- Test Files Pattern: `tests/**/*.test.js`.
- Test Timeout: 10,000ms.

### 14.2 Module 1 Test Suite (`tests/health.test.js`)
Tests to implement and pass in Module 1:
1. `GET /api/health` returns HTTP 200 with `status: "healthy"` and database state.
2. `GET /api/unmatched-route` returns HTTP 404 with standardized error JSON.
3. Express error middleware correctly catches simulated server errors and returns HTTP 500 with standardized error JSON.

---

## 15. Module Completion Criteria

Module 1 is strictly deemed **Complete** when all of the following conditions are satisfied:
1. `backend/` and `frontend/` directories exist with valid `package.json` configurations.
2. All required dependencies install cleanly via `npm install` without conflicts.
3. Backend starts successfully on configured `PORT` and connects to MongoDB.
4. `GET /api/health` responds with HTTP 200 and healthy JSON payload.
5. All automated backend tests in `tests/health.test.js` pass (100% green).
6. Frontend dev server boots cleanly with Vite and renders a base status screen.
7. Tailwind CSS classes compile and render styled components properly in the browser.
8. Axios client successfully queries backend health check endpoint.
9. No unauthorized files, models, or business logic code from subsequent modules exist.

---

## 16. Files That Will Be Created During Implementation

The following files—and ONLY these files—will be created during the physical execution of Module 1:

### Root Level:
1. `README.md`

### Backend (`backend/`):
2. `backend/package.json`
3. `backend/.env.example`
4. `backend/.gitignore`
5. `backend/src/config/index.js`
6. `backend/src/config/db.js`
7. `backend/src/utils/apiResponse.js`
8. `backend/src/middleware/errorHandler.js`
9. `backend/src/middleware/requestLogger.js`
10. `backend/src/routes/healthRoutes.js`
11. `backend/src/app.js`
12. `backend/src/server.js`
13. `backend/tests/setup.js`
14. `backend/tests/health.test.js`

### Frontend (`frontend/`):
15. `frontend/package.json`
16. `frontend/.env.example`
17. `frontend/.gitignore`
18. `frontend/index.html`
19. `frontend/vite.config.js`
20. `frontend/postcss.config.js`
21. `frontend/tailwind.config.js`
22. `frontend/src/index.css`
23. `frontend/src/api/axiosClient.js`
24. `frontend/src/App.jsx`
25. `frontend/src/main.jsx`

---

## 17. Files That Must NOT Be Created in This Module

To preserve module isolation, the following files are strictly **PROHIBITED** from being created during Module 1:

- **No User/Auth Files:** `User.js`, `authController.js`, `authRoutes.js`, `authMiddleware.js`, `jwt.js`.
- **No Wallet Files:** `Wallet.js`, `Beneficiary.js`, `walletController.js`, `walletRoutes.js`.
- **No Device Files:** `Device.js`, `deviceMiddleware.js`, `deviceRegistry.js`.
- **No Fraud Engine Files:** `fraudEngine.js`, rule evaluators (`amtExtreme.js`, `velocityHigh.js`, etc.), `scorer.js`.
- **No Transaction Files:** `Transaction.js`, `transactionController.js`, `escrowService.js`.
- **No Alert/Review Files:** `Alert.js`, `Review.js`, `reviewController.js`.
- **No Gemini AI Files:** `geminiClient.js`, `geminiService.js`, `piiSanitizer.js`.
- **No Audit Files:** `AuditLog.js`, `auditLogger.js`.
- **No Feature Pages/Components:** `LoginPage.jsx`, `Dashboard.jsx`, `ReviewQueue.jsx`, `SendMoneyModal.jsx`.

---

## 18. Risks & Constraints

1. **MongoDB Connection Availability:** If a local MongoDB daemon is not running on the host machine, tests or local startup could fail. 
   - *Mitigation:* Document exact connection string requirements in `.env.example`; implement graceful connection failure logging in `db.js`.
2. **Port Collisions:** Default ports `5000` (backend) or `5173` (Vite) may already be bound by other system processes.
   - *Mitigation:* Allow dynamic port overrides via environment variables (`PORT=5001`).
3. **CORS Misconfiguration:** Development requests from Vite (`http://localhost:5173`) failing due to mismatched CORS origins.
   - *Mitigation:* Explicitly bind `CORS_ORIGIN=http://localhost:5173` in backend `.env.example` and pass it to Express CORS middleware.
4. **Scope Creep / Premature Schema Definition:** Risk of defining partial User or Transaction schemas in Module 1.
   - *Mitigation:* Explicitly ban creation of any Mongoose models until Modules 2 and beyond.
