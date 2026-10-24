# HyperLocal — Local Setup & Development Guide

Follow these steps to run HyperLocal locally on your machine.

---

## 1. Prerequisites

- **Node.js**: v18.0.0 or higher (v20+ recommended, tested on Node v24)
- **npm**: v9.0.0 or higher (or pnpm / yarn)
- **Git**

---

## 2. Quick Start (Zero-Config SQLite Default)

### Step 1: Install Dependencies
From the repository root:
```bash
npm install
```

### Step 2: Database Setup & Seed Data
Initialize the database and load realistic demonstration accounts across categories:
```bash
npm run db:setup
```
This runs:
1. `prisma generate` (generates the Prisma Client)
2. `prisma db push` (syncs schema with SQLite database `server/prisma/dev.db`)
3. `prisma seed` (creates 8 service categories, 2 demo customers, 4 verified trade pros, and sample history)

---

## 3. Running the Applications

Open three terminal windows (or run them via npm):

### Terminal 1 — Shared Backend API & Socket.IO
```bash
cd server
npm run dev
```
*Backend runs on `http://localhost:5000`*

### Terminal 2 — Customer Application
```bash
cd apps/customer
npm run dev
```
*Customer app opens at `http://localhost:5173`*

### Terminal 3 — Worker Application
```bash
cd apps/worker
npm run dev
```
*Worker app opens at `http://localhost:5174`*

---

## 4. Pre-configured Demo Accounts

Use the **Demo Switcher** pill located in the header of both applications for instant 1-click switching without typing passwords:

### Customers:
1. **Alex Johnson** — `alex.customer@hyperlocal.demo` / `password123`
2. **Sarah Mehta** — `sarah.customer@hyperlocal.demo` / `password123`

### Verified Trade Workers:
1. **Suresh Kumar** (Master Plumber, 10+ yrs) — `suresh.plumber@hyperlocal.demo` / `password123`
2. **Priya Sharma** (Certified Electrician, 7+ yrs) — `priya.electric@hyperlocal.demo` / `password123`
3. **Rajesh Verma** (Deep Cleaning Specialist) — `rajesh.cleaning@hyperlocal.demo` / `password123`
4. **Anita Roy** (Appliance & AC Tech) — `anita.appliances@hyperlocal.demo` / `password123`

---

## 5. Running Automated Verification Tests

To verify the complete 12-step booking workflow, atomic quote acceptance, role security permissions, and cancellation:
```bash
cd server
npx tsx src/tests/e2eWorkflow.test.ts
npx tsx src/tests/securityAndScenarios.test.ts
```
Both test suites will execute and verify database state and API response codes.
