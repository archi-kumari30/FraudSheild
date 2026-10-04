# FraudShield

> Real-Time Rule-Based Fraud Detection & Prevention Platform

FraudShield is a fintech web application designed to evaluate, flag, and prevent suspicious digital payment transactions in real time using a deterministic backend rule engine and an on-demand Google Gemini AI investigation co-pilot.

---

## Architecture Overview

FraudShield follows a strictly decoupled MERN architecture:
- **`backend/`**: Node.js & Express REST API server, Mongoose models, deterministic heuristic rule engine, and on-demand Gemini AI service.
- **`frontend/`**: React SPA (Vite + Tailwind CSS), customer digital wallet portal, and administrative fraud analyst dashboard.
- **`docs/`**: Complete specifications, SRS, developer context, master implementation plan, per-module implementation plans, edge cases, and test cases.

---

## Current Status: Module 1 Complete

- **Module 1 — Project Setup & Infrastructure:** Initialized and verified.
- **Next Module:** Module 2 — Authentication & Authorization (RBAC).

---

## Local Setup & Development

### Prerequisites
- Node.js (LTS v18+ or v20+)
- MongoDB running locally on `mongodb://localhost:27017`

### 1. Backend Setup
```bash
cd backend
npm install
npm run dev
```
Health Check: `http://localhost:5000/api/health`

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Client URL: `http://localhost:5173`

### 3. Running Backend Tests
```bash
cd backend
npm test
```
