# Kaam Setu 🛠️
> **“Your Work, Our Priority”**

A connected hyperlocal service platform connecting customers who need reliable household trade services with nearby skilled and unskilled workers. Built as a fully functional, database-connected application with real-time WebSockets, role-based security, a fair matching engine, transparent quotation & negotiation in Indian Rupees (₹), and mutually verified booking execution.

---

## 🌟 Key Capabilities & Features

### 1. Two Distinct Connected Applications
- **Kaam Setu Customer (`apps/customer` on port 5173)**:
  - 8 Household trade categories (Plumbing, Electrical, Cleaning, Appliance Repair, Carpentry, Painting, AC Repair, Household).
  - 6-Step Service Request Creation Wizard (Category, Description, Geo-Location in Mumbai/Bengaluru, Urgency ASAP/Scheduled, INR Budget range, Review).
  - Real-Time Quotations Feed via Socket.IO — incoming quotes appear without page refresh in Indian Rupees (₹).
  - Side-by-side comparison of proposed prices, arrival ETAs, scope inclusions, and verified trade badges.
  - Interactive Counteroffer & Negotiation module.
  - Live Booking & Service Tracker (`Confirmed` → `On The Way` → `Work Started` → `Completed`).
  - **Mutually Verified Start Code**: 4-digit start OTP displayed to customer, required by worker to commence work safely.
  - Verified Star Rating (1-5) and Customer Review submission.
  - Durable in-app notification center and support ticketing.

- **Kaam Setu Pro Worker (`apps/worker` on port 5174)**:
  - High-efficiency mobile & desktop trade interface.
  - **Instant Availability Switch**: One-click Online/Offline toggle with real-time indicator.
  - **Durable Job Offers Inbox**: Event-driven dispatch with transparent Match Score (e.g. 96%) and clear explanation list.
  - Offline Worker Guarantee: Unread offers remain in the database for reconnection retrieval.
  - Formal Trade Quote submission with arrival ETA, scope, exclusions, and notes in INR (₹).
  - Customer Counteroffer alerts and quick reply.
  - Service execution lifecycle controls:
    - Mark "On The Way".
    - Prompt for and verify customer's 4-digit Start OTP before billing.
    - Mark "Job Completed".
  - **Authoritative Gross Earnings Dashboard**: Tallied directly from completed database records in Indian Rupee (₹).
  - Dispatch Radius slider (2 km to 50 km) and hourly/base rate configuration.
  - Public Trade Profile with authentic Indian personas and tiered verification badges (Phone, ID, Skill Certificate, Background Check).

### 2. Fair Matching Engine (`server/src/matching/matchingEngine.ts`)
- Transparent scoring algorithm evaluating trade category specialization, active online availability, distance within worker service radius, trade verifications, and experience.
- Neutral, penalty-free baseline for new providers to ensure fair opportunities without ratings bias.
- Provides readable matching reasons displayed directly in the worker inbox.

### 3. Mutual Safety & Access Protection
- Protected customer address: full street address is kept hidden until a quote is accepted.
- Atomic quote acceptance: database transaction marks accepted quote `ACCEPTED` and rejects competing quotes to eliminate double-booking conflicts.
- Mutually verified start OTP: protects against premature billing.

---

## 🎨 Brand Identity & Design System

The application is styled with the exact design system colors:
- **Primary Green:** `#2A7C13` (buttons, active navigation, key status accents)
- **Secondary Green:** `#76C457` (progress indicators, subtle highlights)
- **Soft Cream:** `#FFF8CF` (warm card accents, highlight banners)
- **Warm Beige:** `#FBE6C2` (supporting cards, demo switcher pill)
- **Charcoal:** `#1F2937` (high-contrast readable typography)
- **Surface:** `#FDFBF7` / `#FFFFFF` (clean, calm, modern card surfaces)

---

## 🏗️ Monorepo Architecture

```
hyperlocal/
├── apps/
│   ├── customer/            # React + TypeScript + Vite + Tailwind (Port 5173)
│   └── worker/              # React + TypeScript + Vite + Tailwind (Port 5174)
├── server/
│   ├── src/
│   │   ├── app.ts           # Express application & route configuration
│   │   ├── server.ts        # HTTP Server + Socket.IO initialization
│   │   ├── matching/        # Fair Matching Engine
│   │   ├── sockets/         # Socket.IO room manager & event broadcaster
│   │   ├── middleware/      # JWT Authentication & Role-Based Access Guard
│   │   └── modules/         # Auth, Jobs, Offers, Quotes, Bookings, Workers, Reviews
│   ├── prisma/
│   │   ├── schema.prisma    # SQLite schema (default zero-dependency local)
│   │   ├── schema.postgresql.prisma # PostgreSQL schema (production drop-in)
│   │   └── seed.ts          # Idempotent realistic seed data
│   └── tests/
│       ├── e2eWorkflow.test.ts          # 12-step end-to-end booking flow test
│       └── securityAndScenarios.test.ts # Security, double-booking, and cancellation
├── packages/
│   ├── shared-types/        # Common TypeScript interfaces & socket event contracts
│   └── design-tokens/       # Color palette, spacing, radii, and shadows
└── docs/
    ├── ARCHITECTURE.md      # Architecture diagrams & component breakdown
    ├── DATABASE.md          # ER diagram & PostgreSQL migration guide
    ├── API.md               # Complete REST API reference
    ├── NOTIFICATIONS.md     # Real-time WebSocket event contracts
    └── SETUP.md             # Step-by-step developer setup
```

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Database & Seed Data
```bash
npm run db:setup
```
*Creates `dev.db`, pushes Prisma schema, and loads demo categories, customers, and workers.*

### 3. Run the Applications

#### Option A: Run services individually
- **Terminal 1 (Backend API & Socket.IO):**
  ```bash
  cd server
  npm run dev
  ```
- **Terminal 2 (Customer App):**
  ```bash
  cd apps/customer
  npm run dev
  ```
- **Terminal 3 (Worker App):**
  ```bash
  cd apps/worker
  npm run dev
  ```

#### Option B: Access Ports
- **Customer App:** [http://localhost:5173](http://localhost:5173)
- **Worker App:** [http://localhost:5174](http://localhost:5174)
- **Backend API:** [http://localhost:5000/api](http://localhost:5000/api)

---

## 👥 Pre-Configured Demo Accounts

Use the **Demo Switcher** in the top navigation bar of either application to instantly switch accounts without entering passwords:

| Role | Name | Email | Password | Trade / Notes |
|---|---|---|---|---|
| **Customer** | Aarav Sharma | `aarav.customer@kaamsetu.demo` | `password123` | B-402 Hiranandani Gardens, Powai Mumbai |
| **Customer** | Pooja Patel | `pooja.customer@kaamsetu.demo` | `password123` | 120 Green Glen Layout, Bellandur Bengaluru |
| **Worker** | Suresh Kumar | `suresh.plumber@kaamsetu.demo` | `password123` | Master Plumber (10 yrs, 4.9★, 42 jobs) |
| **Worker** | Priya Sharma | `priya.electric@kaamsetu.demo` | `password123` | Certified Electrician (7 yrs, 4.8★) |
| **Worker** | Rajesh Verma | `rajesh.cleaning@kaamsetu.demo` | `password123` | Deep Cleaning Specialist (5 yrs, 4.9★) |
| **Worker** | Anita Roy | `anita.appliances@kaamsetu.demo` | `password123` | Appliance & AC Technician (6 yrs, 4.7★) |

---

## 🧪 Automated End-to-End & Security Tests

Run the comprehensive test suites to verify that business logic, security constraints, and database transactions pass 100%:

```bash
cd server
npx tsx src/tests/e2eWorkflow.test.ts
npx tsx src/tests/securityAndScenarios.test.ts
```

### Test Coverage Highlights:
- ✅ Customer registration & JWT authentication
- ✅ Service request creation with geo-coordinates
- ✅ Fair Matching Engine scoring & persisted offer dispatch
- ✅ Worker quote submission & real-time notification
- ✅ Customer counteroffer & worker response
- ✅ Atomic quote acceptance & competing quote rejection
- ✅ Mutually verified start OTP security validation
- ✅ Status progression: `CONFIRMED` → `ON_THE_WAY` → `WORK_STARTED` → `COMPLETED`
- ✅ 5-star customer review & authoritative rating recalculation
- ✅ Authoritative gross earnings calculation from completed jobs
- ✅ Role-based authorization: Customers cannot access worker endpoints and vice-versa
- ✅ Conflicting quote acceptance prevention
- ✅ Job cancellation workflows
