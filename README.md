# Kaam Setu 🛠️
> **“Your Work, Our Priority”**

A production-grade, connected hyperlocal service platform connecting customers who need reliable household trade services with nearby skilled and unskilled workers. Built as a fully functional, database-connected application with real-time WebSockets, role-based security, a fair matching engine, transparent quotation & negotiation in Indian Rupees (₹), and mutually verified booking execution.

---

## 📑 Table of Contents
1. [Overview & Core Value Proposition](#-overview--core-value-proposition)
2. [Technology Stack](#-technology-stack)
3. [System Architecture](#-system-architecture)
4. [Monorepo Directory Structure](#-monorepo-directory-structure)
5. [Complete Web Pages & User Journeys](#-complete-web-pages--user-journeys)
   - [Customer Application (`apps/customer`)](#1-customer-application-port-5173)
   - [Worker Pro Application (`apps/worker`)](#2-worker-pro-application-port-5174)
   - [Shared Backend Engines (`server`)](#3-shared-backend-engines-port-5000)
6. [How to Run on Another PC (Step-by-Step Setup)](#-how-to-run-on-another-pc-step-by-step-setup)
   - [System Prerequisites](#1-system-prerequisites)
   - [Cloning & Installation](#2-cloning--installation)
   - [Zero-Config Database Initialization](#3-zero-config-database-initialization)
   - [Launching All Services](#4-launching-all-services)
   - [Port Reference](#5-port-reference)
7. [Pre-Configured Demo Accounts](#-pre-configured-demo-accounts)
8. [Automated Verification & Security Test Suites](#-automated-verification--security-test-suites)
9. [Configuration & Environment Variables](#-configuration--environment-variables)
10. [Switching to PostgreSQL in Production](#-switching-to-postgresql-in-production)
11. [Deploying on Render](#-deploying-on-render)

---

## 💡 Overview & Core Value Proposition

Most home services platforms either act as lead-generation brokers (charging high commissions and hiding worker earnings) or static directory listings where customers have to make dozens of phone calls.

**Kaam Setu** solves this with an authentic, connected hyperlocal marketplace:
- **Instant Fair Matching**: Customers post a job, and the backend engine matches nearby eligible trade pros based on skills, location, availability, and background checks.
- **Transparent Quotes & Counteroffers**: Workers submit itemized trade quotes with arrival ETAs, scope inclusions, and exclusions in Indian Rupees (₹). Customers can accept or counteroffer in real-time.
- **Zero Double-Bookings**: Atomic database transactions guarantee that accepting one quote instantly rejects competing bids and prevents scheduling conflicts.
- **Mutually Verified Start Code**: Every booking generates a secure 4-digit start OTP provided exclusively to the customer. Workers cannot commence work or bill until the customer verifies the OTP upon arrival.
- **Direct & Authoritative Earnings**: Workers keep 100% of their quoted price, with earnings tracked directly from verified database records.

---

## 🛠️ Technology Stack

| Layer | Technologies Used |
|---|---|
| **Customer Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, Socket.IO Client |
| **Worker Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, Socket.IO Client |
| **Shared Backend** | Node.js, Express.js, TypeScript, Socket.IO Server |
| **Database & ORM** | Prisma ORM, SQLite (local zero-dependency default), PostgreSQL (production-ready) |
| **Authentication** | JSON Web Tokens (JWT), bcrypt password hashing, Role-Based Access Control (RBAC) |
| **Validation** | TypeScript type safety & schema validation |
| **Testing** | Node.js TSX integration test runner, HTTP assertions, concurrent transaction tests |

---

## 🏛️ System Architecture

```
+-------------------------------------------------------------------------------------------------+
|                                           KAAM SETU                                             |
+-----------------------------------------------+-------------------------------------------------+
|  Customer Portal (Port 5173)                  |  Worker Pro Portal (Port 5174)                  |
|  - 8 Trade Categories Discovery               |  - Online / Offline Instant Availability Toggle |
|  - 6-Step Service Request Wizard              |  - Real-Time Matched Job Offers Inbox           |
|  - Real-Time Quotes Feed via WebSockets       |  - Transparent Matching Reason Breakdown        |
|  - Live Counteroffer & Price Negotiation (₹)  |  - Itemized Trade Quote Submission (₹ & ETA)    |
|  - Confirmed Booking & Arrival Timeline       |  - 4-Digit Customer Start Code Verification     |
|  - 4-Digit Customer Start OTP Display         |  - Work Execution Lifecycle (En Route -> Done)  |
|  - 5-Star Rating & Verified Feedback          |  - Authoritative Gross Earnings & History (₹)   |
|  - In-App Notifications & Support Center      |  - Dispatch Radius (2-50km) & Rate Settings     |
+-----------------------------------------------+-------------------------------------------------+
                        \                                              /
                         \           REST API & WebSockets            /
                          \          (Bearer JWT Authentication)     /
                           v                                        v
+-------------------------------------------------------------------------------------------------+
|                               SHARED BACKEND SERVER (Port 5000)                                 |
|                                                                                                 |
|  [ Auth & RBAC Guard ]  [ Fair Matching Engine ]  [ Atomic Booking Tx ]  [ Socket Room Manager ]|
+-------------------------------------------------------------------------------------------------+
                                                |
                                        Prisma ORM Client
                                                |
                                                v
+-------------------------------------------------------------------------------------------------+
|                                     AUTHORITATIVE DATABASE                                      |
|  Users · CustomerProfiles · WorkerProfiles · JobRequests · JobOffers · Quotes · Bookings ·      |
|  QuoteNegotiations · Reviews · Notifications · SupportTickets                                  |
+-------------------------------------------------------------------------------------------------+
```

---

## 📂 Monorepo Directory Structure

```
KaamSetu/
├── apps/
│   ├── customer/                      # Kaam Setu Customer Web Application
│   │   ├── public/
│   │   │   ├── avatars/               # Authentic Indian SVG avatars (Aarav, Pooja, etc.)
│   │   │   └── logo.jpg               # Official Kaam Setu brand mark
│   │   ├── src/
│   │   │   ├── components/            # Header, Footer, DemoSwitcher, Toast
│   │   │   ├── context/               # AuthContext, SocketContext
│   │   │   ├── pages/                 # Home, Request, JobDetails, Bookings, etc.
│   │   │   ├── services/              # API client and backend fetchers
│   │   │   └── styles/                # Tailwind CSS configurations
│   │   ├── index.html
│   │   ├── package.json
│   │   └── vite.config.ts
│   │
│   └── worker/                        # Kaam Setu Pro Worker Web Application
│       ├── public/
│       │   ├── avatars/               # Authentic Indian SVG avatars (Suresh, Priya, etc.)
│       │   └── logo.jpg               # Official Kaam Setu brand mark
│       ├── src/
│       │   ├── components/            # Header, Footer, DemoSwitcher, Toast
│       │   ├── context/               # AuthContext, SocketContext
│       │   ├── pages/                 # Dashboard, Offers, Bookings, Earnings, etc.
│       │   ├── services/              # Worker API client and dispatch listeners
│       │   └── styles/                # Tailwind CSS configurations
│       ├── index.html
│       ├── package.json
│       └── vite.config.ts
│
├── server/                            # Shared Backend API & WebSocket Server
│   ├── src/
│   │   ├── config/                    # Environment variables & constants
│   │   ├── database/                  # Prisma client instance
│   │   ├── middleware/                # JWT auth guard, error handler, RBAC
│   │   ├── matching/                  # Fair Matching Engine algorithm
│   │   ├── sockets/                   # Socket.IO room manager & live emitter
│   │   ├── modules/
│   │   │   ├── auth/                  # Register, login, demo switcher endpoints
│   │   │   ├── jobs/                  # Job request creation & cancellation
│   │   │   ├── quotes/                # Quote submission, counteroffers, acceptance
│   │   │   ├── bookings/              # Status tracking & start OTP verification
│   │   │   ├── workers/               # Offers inbox, profile & earnings summary
│   │   │   ├── reviews/               # 5-star customer review submission
│   │   │   └── support/               # Ticketing and dispute resolution
│   │   ├── tests/
│   │   │   ├── e2eWorkflow.test.ts    # 12-step end-to-end booking flow test
│   │   │   └── securityAndScenarios.test.ts # RBAC and conflict rejection tests
│   │   ├── app.ts                     # Express application definition
│   │   └── server.ts                  # Server entrypoint with HTTP & Socket.IO
│   ├── prisma/
│   │   ├── schema.prisma              # SQLite schema (default zero-config)
│   │   ├── schema.postgresql.prisma   # PostgreSQL schema (production drop-in)
│   │   └── seed.ts                    # Realistic Indian seed data in INR (₹)
│   ├── package.json
│   └── tsconfig.json
│
├── packages/
│   ├── design-tokens/                 # Brand colors, spacing, borders, shadows
│   └── shared-types/                  # Shared TypeScript interfaces & Socket events
│
├── docs/                              # Comprehensive architectural documentation
│   ├── ARCHITECTURE.md                # System topology and sequence diagrams
│   ├── DATABASE.md                    # Relational data models and PostgreSQL guide
│   ├── API.md                         # Complete REST API reference
│   ├── NOTIFICATIONS.md               # Real-time WebSocket event contracts
│   └── SETUP.md                       # Quick developer setup guide
│
├── package.json                       # Root monorepo script coordinator
└── README.md
```

---

## 🖥️ Complete Web Pages & User Journeys

### 1. Customer Application (Port 5173)

#### 🔐 Landing Page & Authentication Gateway (`/`)
- **Seamless Gateway for New & Returning Users**: When an unauthenticated visitor opens the customer application, they are greeted by the **Kaam Setu Landing & Authentication Gateway**.
- **Role Switching**: Allows switching between Customer and Worker Pro portals with a single click.
- **Login / Registration Tabs**:
  - **Sign In**: Direct email and password authentication with immediate JWT issuance.
  - **Register as Customer**: Create a new customer profile with Full Name, Email, Phone, Password, Address, City (e.g. Mumbai, Delhi, Bengaluru), and Postal Code. All details are securely persisted to the central database, and the user is immediately transitioned to the Customer Dashboard.
  - **Quick 1-Click Demo Logins**: Fast-track buttons to test with pre-seeded personas (Aarav Sharma, Pooja Patel) without manual typing.
- **Logout**: An intuitive logout button in the navigation bar clears the local session and safely returns the user to the landing page.

#### 🏠 Customer Home Dashboard (`/`)
- **Brand Navigation Header**: Displays the official Kaam Setu logo, location indicator (e.g. *Powai, Mumbai 400076*), unread notifications bell, and the instant **Demo Switcher**.
- **Active Service Tracking Banner**: Automatically appears when a booking is in progress, showing the assigned pro's name, agreed price in ₹, service status, and the 4-digit start OTP.
- **Service Search & 8 Core Trade Categories**:
  - Plumbing (Est. ₹349)
  - Electrical Work (Est. ₹299)
  - Home Cleaning (Est. ₹499)
  - Appliance Repair (Est. ₹449)
  - Carpentry (Est. ₹399)
  - Painting (Est. ₹999)
  - AC Repair & Service (Est. ₹599)
  - Cooking & Household Help (Est. ₹349)
- **Recent Requests**: Quick cards for previously posted jobs with live quote counters.
- **Trust Badges**: Explanations of mutual start OTP verification, transparent negotiation, and zero hidden broker fees.

#### 📝 Service Request Creation Wizard (`/request`)
A guided 6-step wizard designed for quick, clear request creation:
1. **Step 1 — Category**: Select trade specialization.
2. **Step 2 — Details**: Input request title and detailed description of the problem.
3. **Step 3 — Location**: Provide street address, neighborhood (e.g. Mumbai, Bengaluru), postal code, and geo-coordinates. Exact address is kept private until a quote is accepted.
4. **Step 4 — Timing & Urgency**: Choose between *Immediate Dispatch (ASAP)* or *Scheduled for Later* with date/time picker.
5. **Step 5 — Budget**: Choose between *Open to Competitive Quotes* or specify an expected budget range in Indian Rupees (`₹ Min - ₹ Max`).
6. **Step 6 — Review & Submit**: Comprehensive review card before dispatching into the central Fair Matching Engine.

#### 📊 Live Job Request & Quotes Feed (`/jobs/:id`)
- **Live WebSocket Feed**: Real-time Socket.IO connection updates quotes instantly without refreshing the page.
- **Detailed Quote Cards**:
  - Worker name, verified trade badge, and authentic Indian portrait avatar.
  - Rating average (e.g. 4.9★) and completed job count.
  - Quoted price in Indian Rupees (`₹`).
  - Arrival ETA (e.g. `~20 mins`).
  - Included scope of work and clearly listed exclusions.
- **Interactive Actions**:
  - **Accept & Book**: Triggers an atomic transaction confirming the booking and rejecting competing bids.
  - **Counteroffer Modal**: Propose a revised price in ₹ and write a scope note.
  - **Reject**: Dismiss an unsuitable quote.

#### 🚗 Confirmed Booking & Arrival Tracker (`/bookings/:id`)
- **Service Progress Timeline**: Visual progression through 4 milestone steps:
  1. `Confirmed` — Booking accepted and worker notified.
  2. `On The Way` — Worker is en route to your address.
  3. `Work Started` — 4-digit OTP verified upon arrival; work in progress.
  4. `Completed` — Job finished.
- **Mutually Verified Start OTP**: Prominently displays the 4-digit security code. The worker cannot commence billing without entering this exact code.
- **Assigned Technician Card**: Phone number, verified badges, and trade specialization.
- **5-Star Review Form**: Upon job completion, allows customer to submit a star rating (1-5) and written feedback that updates the worker's authoritative rating.

#### 📋 My Requests List (`/my-requests`)
Overview of all open, quoted, and booked requests with status badges.

#### 📅 My Bookings List (`/bookings`)
Chronological history of active and completed bookings with agreed pricing in ₹.

#### 🔔 Notifications & Support (`/notifications`, `/support`)
- Live alerts for newly received quotes, counteroffers, and status changes.
- Direct support ticket submission for customer assistance and safety.

---

### 2. Worker Pro Application (Port 5174)

#### 🔐 Worker Pro Landing Page & Registration Gateway (`/`)
- **Dedicated Trade Pro Gateway**: Unauthenticated visitors are presented with the **Kaam Setu Pro Trade Onboarding Gateway**.
- **Sign In / Registration Flow**:
  - **Trade Pro Sign In**: Instant login with email and password.
  - **Register as Trade Specialist**: Complete registration form with Full Name, Email, Phone, Password, Primary Trade Specialization (Plumbing, Electrical, Cleaning, Appliances, Carpentry, Painting), Years of Experience, Hourly Rate in ₹, Minimum Callout Fee in ₹, and City. Creates the worker profile, verification badges, trade links, and base location in the database, immediately transitioning the worker to the Pro Dashboard.
  - **Quick 1-Click Pro Demos**: One-click logins for Suresh Kumar (Plumber), Priya Sharma (Electrician), Rajesh Verma (Cleaning), or Anita Roy (Appliances).
- **Logout & Session Control**: Dedicated logout button in the header and mobile drawer.

#### ⚡ Worker Dashboard (`/`)
- **Instant Availability Toggle**: Prominent button in the header and top banner allowing the worker to switch between `ONLINE` (ready for dispatch) and `OFFLINE` (unavailable).
- **Key Metrics Tiles**:
  - *New Offers*: Count of unread opportunities matching their trade.
  - *Active Jobs*: Current bookings in progress.
  - *Completed Jobs*: Total verified completed jobs.
  - *Total Gross Earnings*: Direct tally of lifetime earnings in Indian Rupee (`₹`).
- **Active Booking Highlight**: Quick access to manage execution of any active job.
- **Urgent Job Opportunities Preview**: Top matched requests nearby.

#### 📥 Job Opportunities Inbox (`/offers`)
- **Persistent Inbox**: Stores matched requests in the database so workers who were offline can review them upon reconnecting.
- **Transparent Match Score**: Shows matching percentage (e.g. `100% Match`) along with transparent reasons:
  - *✓ Specializes in trade category*
  - *✓ Located within service radius (e.g. 0.2 km)*
  - *✓ Currently active and online*
  - *✓ Verified credentials (Phone, ID, Trade License)*
- **Submit Quote Modal**:
  - Proposed price in Indian Rupees (`₹`).
  - Estimated arrival time in minutes.
  - Scope of work included.
  - Exclusions / extra parts policy.
  - Personal note to customer.
- **Counteroffer Response Modal**: Review customer's proposed price and submit a revised counter-response.
- **Decline**: Allows workers to pass on jobs they cannot take.

#### 🔨 Job Management & Execution (`/bookings`)
- Step-by-step execution controls for confirmed bookings:
  1. Click **"Mark On The Way"** when departing.
  2. Click **"Enter Start Code"** upon arrival — opens modal prompting for the customer's 4-digit OTP. The server validates the code and transitions status to `WORK_STARTED`.
  3. Click **"Mark Job Completed"** when work is finished — updates status to `COMPLETED` and credits earnings to the worker's record.

#### 💰 Authoritative Earnings Dashboard (`/earnings`)
- **Gross Earnings KPI**: Accurate sum calculated directly from `COMPLETED` booking records in the central database.
- **Average Ticket Value**: Computed average per completed job.
- **Itemized Work History**: Complete ledger of every completed job with customer name, completion date, and payout amount in `+₹`.

#### 📍 Availability & Coverage Settings (`/availability`)
- Interactive **Service Radius Slider**: Adjust travel coverage from `2 km` to `50 km`.
- **Preferred Hourly Rate**: Set hourly expectation in `₹`.
- **Base Visit / Callout Fee**: Set standard diagnostic fee in `₹`.

#### 👤 Worker Trade Profile (`/profile`)
- Displays verified credentials and badges:
  - Phone Number Verified
  - Government ID Document Verified
  - Trade Skill Certification Verified
  - Background Check Cleared
- Completed job counter and verified rating score.
- Editable professional bio.

---

### 3. Shared Backend Engines (Port 5000)

1. **Fair Matching Engine (`server/src/matching/matchingEngine.ts`)**:
   - Calculates a multi-factor score: Trade specialization (40 pts), Active online status (25 pts), Proximity within radius (20 pts), Verified credentials (10 pts), Experience (5 pts).
   - Grants new providers a neutral baseline score to guarantee fair distribution of opportunities without rating bias.
2. **Atomic Booking Transaction Manager (`server/src/modules/quotes/quotesController.ts`)**:
   - Uses `prisma.$transaction()` to atomically mark the selected quote as `ACCEPTED`, create the authoritative `Booking` record with an auto-generated 4-digit OTP, mark the `JobRequest` as `BOOKED`, and reject all competing quotes.
3. **Real-Time Socket.IO Broadcaster (`server/src/sockets/socketManager.ts`)**:
   - Authenticates connections via JWT and organizes clients into private rooms (`user:id`, `job:id`, `booking:id`).
   - Dispatches instant events: `job.offer.created`, `quote.created`, `quote.counteroffered`, `quote.accepted`, `booking.status.updated`.

---

## 💻 How to Run on Your PC (Step-by-Step Setup)

Follow these exact steps to run Kaam Setu on your machine or a fresh PC:

### 1. System Prerequisites
Ensure the target machine has:
- **Node.js**: v18.0.0 or higher (v20+ recommended). Check with `node -v`.
- **npm**: v9.0.0 or higher. Check with `npm -v`.
- **Git**: Installed and available in terminal. Check with `git --version`.
- Compatible with **Windows**, **macOS**, and **Linux**.

### 2. Cloning & Installation
Open a terminal and run:
```bash
# Clone the repository
git clone https://github.com/Jain07Himanshu/KaamSetu.git

# Enter project root
cd KaamSetu

# Install all monorepo dependencies across root, server, apps, and packages
npm install
```

### 3. Zero-Config Database Initialization
Kaam Setu comes pre-configured with SQLite for zero-dependency local development. No PostgreSQL server installation is required out-of-the-box:
```bash
# Generate Prisma client, push database schema, and seed demo accounts
npm run db:setup
```
*This command runs:*
- `prisma generate` (generates type-safe database client)
- `prisma db push` (creates `server/prisma/dev.db` with all tables)
- `prisma seed` (loads 8 trade categories, demo Indian customers, verified workers, and sample completed bookings)

### 4. Launching All Services

Open three separate terminal windows in the project directory:

#### Terminal 1 — Shared Backend API & WebSocket Server
```bash
cd server
npm run dev
```
*Server will start on `http://localhost:5000` with API at `/api` and Socket.IO active.*

#### Terminal 2 — Kaam Setu Customer Application
```bash
cd apps/customer
npm run dev
```
*Customer application opens on `http://localhost:5173`.*

#### Terminal 3 — Kaam Setu Pro Worker Application
```bash
cd apps/worker
npm run dev
```
*Worker application opens on `http://localhost:5174`.*

---

### 5. Port Reference

| Service | Port / URL | Purpose |
|---|---|---|
| **Customer App** | [http://localhost:5173](http://localhost:5173) | Service discovery, request wizard, live quotes, booking tracker |
| **Worker App** | [http://localhost:5174](http://localhost:5174) | Availability toggle, job inbox, quotation, execution, earnings |
| **Backend API** | [http://localhost:5000/api](http://localhost:5000/api) | Authoritative REST API endpoints |
| **WebSocket** | `ws://localhost:5000` | Bidirectional real-time Socket.IO channel |

---

## 👥 Pre-Configured Demo Accounts

Use the **Demo Switcher** pill in the navigation header of either application to switch accounts with one click, or log in manually with the following credentials:

| Portal | Name | Email | Password | Role / Details |
|---|---|---|---|---|
| **Customer** | Aarav Sharma | `aarav.customer@kaamsetu.demo` | `password123` | B-402 Hiranandani Gardens, Powai, Mumbai |
| **Customer** | Pooja Patel | `pooja.customer@kaamsetu.demo` | `password123` | 120 Green Glen Layout, Bellandur, Bengaluru |
| **Worker** | Suresh Kumar | `suresh.plumber@kaamsetu.demo` | `password123` | Master Plumber (10 yrs exp, 4.9★, Mumbai) |
| **Worker** | Priya Sharma | `priya.electric@kaamsetu.demo` | `password123` | Certified Electrician (7 yrs exp, 4.8★) |
| **Worker** | Rajesh Verma | `rajesh.cleaning@kaamsetu.demo` | `password123` | Deep Cleaning Specialist (5 yrs exp, 4.9★) |
| **Worker** | Anita Roy | `anita.appliances@kaamsetu.demo` | `password123` | Appliance & AC Tech (6 yrs exp, 4.7★) |

---

## 🧪 Automated Verification & Security Test Suites

Kaam Setu includes complete integration and security verification suites that test all business rules and atomic transactions:

```bash
cd server

# Run Customer & Worker registration, database persistence & auth verification test
npx tsx src/tests/authRegistration.test.ts

# Run 12-step complete end-to-end booking lifecycle test
npx tsx src/tests/e2eWorkflow.test.ts

# Run security access controls, double-booking rejection & cancellation test
npx tsx src/tests/securityAndScenarios.test.ts
```

### Test Assertions Verified:
- ✅ Customer registration & JWT authentication
- ✅ Service request creation with Mumbai geo-coordinates
- ✅ Fair Matching Engine scoring & persisted offer dispatch
- ✅ Worker quote submission in INR (₹) & real-time notification
- ✅ Customer counteroffer & worker counter-response
- ✅ Atomic quote acceptance & competing quote rejection
- ✅ Mutually verified 4-digit start OTP validation (rejects invalid codes, accepts correct code)
- ✅ Status progression: `CONFIRMED` → `ON_THE_WAY` → `WORK_STARTED` → `COMPLETED`
- ✅ 5-star customer review & authoritative rating recalculation
- ✅ Authoritative gross earnings calculation from completed jobs
- ✅ Role-based authorization: Customers blocked from worker endpoints (403) and vice-versa
- ✅ Double-acceptance prevented: Conflicting acceptances rejected with 400
- ✅ Job cancellation workflows

---

## ⚙️ Configuration & Environment Variables

### Backend (`server/.env`):
```env
PORT=5000
NODE_ENV=development
DATABASE_URL="file:./dev.db"
JWT_SECRET="kaam-setu-secure-jwt-secret-key-2026"
JWT_EXPIRES_IN="7d"
CORS_ORIGIN="http://localhost:5173,http://localhost:5174"
```

### Customer App (`apps/customer/.env`):
```env
VITE_API_URL="http://localhost:5000/api"
VITE_SOCKET_URL="http://localhost:5000"
```

### Worker App (`apps/worker/.env`):
```env
VITE_API_URL="http://localhost:5000/api"
VITE_SOCKET_URL="http://localhost:5000"
```

---

## 🐘 Switching to PostgreSQL in Production

For production deployment with a managed PostgreSQL instance:

1. Replace `DATABASE_URL` in `server/.env`:
   ```env
   DATABASE_URL="postgresql://username:password@db-host:5432/kaamsetu?schema=public"
   ```
2. Swap the schema provider in `server/prisma/schema.prisma` from `sqlite` to `postgresql`, or copy `server/prisma/schema.postgresql.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
3. Run migrations and re-seed:
   ```bash
   npx prisma migrate deploy
   npm run prisma:seed
   ```

---

## 🚀 Deploying on Render

Kaam Setu is fully configured for deployment on [Render](https://render.com) using either the 1-click Blueprint (`render.yaml`) or the Render Web UI.

Detailed step-by-step instructions with environment variable references are available in:
👉 [**docs/RENDER_DEPLOYMENT.md**](docs/RENDER_DEPLOYMENT.md)

---

## 📄 License & Hackathon Details
- **Hackathon**: VecanVerse Hackathon
- **Team Name**: VadaPav Variables
- **Team Members**:
  - Himanshu B. Jain
  - Rishikesh R. Deherkar
  - Paran Das
  - Pabitra Das
- **License**: Licensed under the [MIT License](LICENSE).
