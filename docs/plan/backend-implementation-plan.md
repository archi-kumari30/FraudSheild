# FraudShield — Backend Implementation Plan

## 1. Scope & Objective
Establish a modular Node.js monolith backend using Express, Mongoose, Joi, and bcrypt. The architecture enforces clean separation of concerns across controllers, domain services, data repositories, validation schemas, and an isolated fraud engine.

---

## 2. Directory Layout & Layer Responsibilities

```
backend/src/
├── controllers/            # HTTP Request handlers, status mapping, API response formatting
│   ├── authController.js
│   ├── walletController.js
│   ├── beneficiaryController.js
│   ├── transactionController.js
│   ├── reviewController.js
│   ├── alertController.js
│   ├── auditController.js
│   ├── deviceController.js
│   └── aiController.js
│
├── services/               # Core business orchestration & domain operations
│   ├── authService.js
│   ├── walletService.js
│   ├── beneficiaryService.js
│   ├── transactionService.js
│   ├── reviewService.js
│   ├── alertService.js
│   ├── auditService.js
│   ├── deviceService.js
│   └── aiInvestigationService.js
│
├── repositories/           # Direct data access & query operations
│   ├── userRepository.js
│   ├── walletRepository.js
│   ├── beneficiaryRepository.js
│   ├── transactionRepository.js
│   ├── deviceRepository.js
│   ├── alertRepository.js
│   └── auditRepository.js
│
├── models/                 # Mongoose schemas & indexes
│   ├── User.js
│   ├── Wallet.js
│   ├── Beneficiary.js
│   ├── UserDevice.js
│   ├── Transaction.js
│   ├── Alert.js
│   └── AuditLog.js
│
├── routes/                 # Express API routes
│   ├── authRoutes.js
│   ├── walletRoutes.js
│   ├── beneficiaryRoutes.js
│   ├── transactionRoutes.js
│   ├── reviewRoutes.js
│   ├── alertRoutes.js
│   ├── auditRoutes.js
│   ├── deviceRoutes.js
│   └── healthRoutes.js
│
├── middlewares/            # Express middlewares
│   ├── authMiddleware.js        # JWT verify & RBAC role enforcement ('customer' vs 'admin')
│   ├── deviceMiddleware.js      # Extract x-device-id, IP, User-Agent
│   ├── validateMiddleware.js    # Generic Joi request validation middleware
│   ├── errorHandler.js          # Centralized error handler
│   └── requestLogger.js         # HTTP logging
│
├── validators/             # Joi validation schemas
│   ├── authValidator.js
│   ├── walletValidator.js
│   ├── beneficiaryValidator.js
│   ├── transactionValidator.js
│   └── reviewValidator.js
│
├── fraud/                  # Independent fraud detection engine
│   ├── rules/
│   │   ├── amountRule.js
│   │   ├── velocityRule.js
│   │   ├── deviceRule.js
│   │   ├── beneficiaryRule.js
│   │   ├── failedAttemptsRule.js
│   │   └── dormantAccountRule.js
│   ├── fraudEngine.js
│   ├── riskCalculator.js
│   └── contextCollector.js
│
├── audit/                  # Audit subsystem
│   ├── auditLogger.js
│   └── auditEmitter.js
│
├── config/                 # Configuration
│   ├── db.js
│   └── env.js
│
└── utils/                  # Utilities
    ├── apiResponse.js
    └── token.js
```

---

## 3. Data Flow & Transaction Lifecycle Execution

```
[ POST /api/transactions ]
         │
         ▼
[ authMiddleware & deviceMiddleware ]
         │ (Validate JWT, extract senderId, role, x-device-id, IP)
         ▼
[ validateMiddleware (transactionValidator) ]
         │ (Validate amount > 0, recipientId valid ObjectId, note string)
         ▼
[ transactionController.createTransaction ]
         │
         ▼
[ transactionService.initiateTransfer ]
         │
         ├── 1. Verify sender != recipient
         ├── 2. Verify recipient existence via userRepository
         ├── 3. Verify sender availableBalance >= amount via walletRepository
         ├── 4. Collect context (contextCollector.js)
         ├── 5. Execute fraud evaluation (fraudEngine.evaluateTransaction)
         │
         ├── 6A. If LOW (0-30):
         │       - Debit sender availableBalance, credit recipient availableBalance
         │       - Status: APPROVED (HTTP 200)
         │
         ├── 6B. If MEDIUM (31-70):
         │       - Debit sender availableBalance, credit sender heldBalance (Escrow)
         │       - Recipient balance UNCHANGED
         │       - Create Alert & prompt customer for self-verification
         │       - Status: CUSTOMER_VERIFICATION_REQUIRED (HTTP 202)
         │
         ├── 6C. If HIGH (71-100):
         │       - ZERO balance changes
         │       - Create Alert & record audit log
         │       - Status: BLOCKED (HTTP 400)
         │
         ├── 7. Persist Transaction record with complete fraud breakdown
         └── 8. Dispatch AuditLog event
```

---

## 4. Customer Self-Verification & Escalation Lifecycle

```
[ POST /api/transactions/:id/confirm ]
         │
         ▼
[ authMiddleware (verify user owns transaction: senderId === user._id) ]
         │
         ▼
[ transactionService.confirmTransaction ]
         ├── 1. Atomic concurrency lock: transition status to 'PENDING'
         ├── 2. Pre-settlement security re-evaluation (fresh fraudEngine run)
         ├── 3A. If Acceptable:
         │       - Debit sender heldBalance, credit recipient availableBalance
         │       - Status -> APPROVED
         │       - Record audit log (CUSTOMER_VERIFIED, TRANSACTION_SETTLED)
         └── 3B. If Elevated to HIGH:
                 - Debit sender heldBalance, refund sender availableBalance
                 - Status -> BLOCKED
                 - Record audit log (TRANSACTION_BLOCKED)

[ POST /api/transactions/:id/escalate ]
         │
         ▼
[ authMiddleware (verify user owns transaction: senderId === user._id) ]
         │
         ▼
[ transactionService.escalateTransaction ]
         ├── Verify transaction status === 'CUSTOMER_VERIFICATION_REQUIRED'
         ├── Atomically set status -> 'FLAGGED_FOR_REVIEW'
         ├── Enqueue into Admin Review Queue
         └── Record audit log (TRANSACTION_ESCALATED)
```

---

## 5. Admin Review Lifecycle (Escalated Cases)

```
[ POST /api/admin/reviews/:id/resolve ]
         │
         ▼
[ authMiddleware (requireRole('admin')) ]
         │
         ▼
[ validateMiddleware (reviewValidator: decision APPROVE|REJECT, notes >= 10 chars) ]
         │
         ▼
[ reviewController.resolveReview ]
         │
         ▼
[ reviewService.resolveReview ]
         ├── Verify transaction status === 'FLAGGED_FOR_REVIEW'
         ├── If APPROVE:
         │   - Debit sender heldBalance, credit recipient availableBalance
         │   - Transaction status -> APPROVED
         ├── If REJECT:
         │   - Debit sender heldBalance, refund sender availableBalance
         │   - Transaction status -> REJECTED
         ├── Persist resolvedBy (adminId), resolvedAt, resolutionNotes
         └── Dispatch AuditLog event
```

---

## 5. Security & Validation Controls
- Joi schemas validate all request bodies, params, and queries.
- Passwords hashed with bcrypt (salt rounds = 10).
- Strict role checking (`customer` vs `admin`). Customers cannot access admin routes or investigation endpoints.
- Database operations on wallet balances utilize atomic Mongoose operations (`$inc`, with `{ availableBalance: { $gte: amount } }`) preventing double-spend and race conditions.
