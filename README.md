# Kaam Setu 🛠️
> **“Your Work, Our Priority”**

A production-grade, connected hyperlocal service platform connecting customers who need reliable household trade services with nearby skilled and unskilled workers. Built as a fully functional, database-connected application with real-time WebSockets, role-based security, a fair matching engine, transparent quotation & negotiation in Indian Rupees (₹), mutually verified booking execution, and a comprehensive **Customer Safety, Worker Verification, Credibility & Protection System**.

---

## 📑 Table of Contents
1. [Overview & Core Value Proposition](#-overview--core-value-proposition)
2. [Customer Safety, Worker Verification & Credibility Architecture](#-customer-safety-worker-verification--credibility-architecture)
   - [Customer Safety & Support](#1-customer-safety--support)
   - [Worker Verification & Dignity Protection](#2-worker-verification--dignity-protection)
   - [Worker Credibility & Recognition of Prior Learning (RPL)](#3-worker-credibility--recognition-of-prior-learning-rpl)
   - [Transparent Pricing & Visiting Charges](#4-transparent-pricing--visiting-charges)
   - [Safety & Emergency Response Engine](#5-safety--emergency-response-engine)
   - [Certificate Authentication Engine](#6-certificate-authentication-engine)
   - [Duplicate Account Prevention](#7-duplicate-account-prevention)
   - [Admin Verification & Compliance Queues](#8-admin-verification--compliance-queues)
3. [Technology Stack](#-technology-stack)
4. [System Architecture](#-system-architecture)
5. [Monorepo Directory Structure](#-monorepo-directory-structure)
6. [Complete Web Pages & User Journeys](#-complete-web-pages--user-journeys)
   - [Customer Application (`apps/customer`)](#1-customer-application-port-5173)
   - [Worker Pro Application (`apps/worker`)](#2-worker-pro-application-port-5174)
   - [Unified Single-Site Access (Render Drop-in)](#3-unified-single-site-access)
   - [Shared Backend Engines (`server`)](#4-shared-backend-engines-port-5000)
7. [How to Run on Another PC (Step-by-Step Setup)](#-how-to-run-on-another-pc-step-by-step-setup)
   - [System Prerequisites](#1-system-prerequisites)
   - [Cloning & Installation](#2-cloning--installation)
   - [Zero-Config Database Initialization](#3-zero-config-database-initialization)
   - [Launching All Services](#4-launching-all-services)
   - [Port Reference](#5-port-reference)
8. [Pre-Configured Demo Accounts](#-pre-configured-demo-accounts)
9. [Automated Verification & Security Test Suites](#-automated-verification--security-test-suites)
10. [Configuration & Environment Variables](#-configuration--environment-variables)
11. [Switching to PostgreSQL in Production](#-switching-to-postgresql-in-production)
12. [Deploying on Render](#-deploying-on-render)
13. [License & Hackathon Details](#-license--hackathon-details)

---

## 💡 Overview & Core Value Proposition

Most home services platforms either act as lead-generation brokers (charging high commissions and hiding worker earnings) or static directory listings where customers have to make dozens of phone calls.

**Kaam Setu** solves this with an authentic, connected hyperlocal marketplace:
- **Instant Fair Matching**: Customers post a job, and the backend engine matches nearby eligible trade pros based on skills, location, availability, and background checks.
- **Transparent Quotes & Counteroffers**: Workers submit itemized trade quotes with arrival ETAs, scope inclusions, and exclusions in Indian Rupees (₹). Customers can accept or counteroffer in real-time.
- **Zero Double-Bookings**: Atomic database transactions guarantee that accepting one quote instantly rejects competing bids and prevents scheduling conflicts.
- **Mutually Verified Start Code**: Every booking generates a secure 4-digit start OTP provided exclusively to the customer. Workers cannot commence work or bill until the customer verifies the OTP upon arrival.
- **Direct & Authoritative Earnings**: Workers keep 100% of their quoted price, with earnings tracked directly from verified database records.
- **Complete Safety & Credibility Shield**: Proactive customer safety with emergency voice broadcasts, worker dignity charters under Indian labor law, RPL for unorganized trades, and visiting fee transparency.

---

## 🛡️ Customer Safety, Worker Verification & Credibility Architecture

### 1. Customer Safety & Support
- **Emergency Contacts**: Register up to 3 trusted contacts with Indian mobile number validation (`+91` or 10-digit formats). Contacts can be verified via SMS OTP and ranked in priority notification order. Emergency contact details are strictly partitioned and never exposed to workers.
- **Customer Care**: Dedicated telephone support via configurable `CUSTOMER_CARE_PHONE` environment variable. Integrated support desk with 8 issue categories (Worker Dispute, Delay, Pricing, Safety, etc.) and direct access to 24/7 National Helplines:
  - `112`: National Emergency Helpline
  - `100`: Police Control Room
  - `1091`: Women Helpline
  - `108`: Ambulance & Medical Emergency

### 2. Worker Verification & Dignity Protection
- **Mobile OTP Verification**: 6-digit phone verification with a 5-minute expiry window, powered by an SMS gateway provider abstraction (`MockSmsProvider`, `Fast2SmsProvider`, `TwilioSmsProvider`).
- **Government Identity Verification**: Secure upload of Aadhaar, Voter ID, PAN, Driving License, or Passport. Identity numbers are encrypted/hashed for lookups and permanently masked for storage and display (e.g. `••••-••••-9012`).
- **Worker Rights & Dignity Charter**: Formal platform commitment explicitly citing the **Code on Social Security 2020** (India). Guarantees zero arbitrary fee deductions, transparent payouts, dispute representation, and dignity of labor. Workers cryptographically sign and timestamp their acceptance.

### 3. Worker Credibility & Recognition of Prior Learning (RPL)
- **Recognition of Prior Learning (RPL)**: Tailored for informal and unorganized trade specialists who possess decades of craftsmanship without formal academic diplomas. Workers submit trade experience, portfolio descriptions, and peer references for administrative review.
- **Genuine Experience Badges**: Calculated strictly server-side from authoritative completed booking records in the central database. Badges cannot be purchased or self-assigned:
  - `FIRST_JOB`: First Verified Job Completed
  - `JOBS_10`: 10 Verified Jobs Milestone
  - `JOBS_25`: 25 Verified Jobs Milestone
  - `EXPERIENCED_PRO`: Experienced Professional
  - `RPL_RECOGNIZED`: Skill Assessed & Recognized via RPL
  - `CERT_*`: Formally Verified Trade Certification
- **Multicategory Ratings**: Instead of a vague single star, ratings are collected across 4 key dimensions:
  1. *Service Quality* (1-5★)
  2. *Punctuality* (1-5★)
  3. *Professionalism* (1-5★)
  4. *Communication* (1-5★)
  - Automatically recalculates worker aggregate ratings upon review submission.

### 4. Transparent Pricing & Visiting Charges
- **Worker-Defined Visiting / Diagnostic Charges**: Workers can specify an upfront inspection fee (e.g. ₹150–₹350) and toggle whether the amount is **100% adjustable against the final labor invoice** if the customer proceeds with the work.
- **Pre-Booking Customer Warning & Modal**: Clear fee disclosure before booking confirmation. Customers must explicitly view and acknowledge the visiting charge before accepting a quote, eliminating doorstep disputes.

### 5. Safety & Emergency Response Engine
- **One-Touch Emergency SOS**: Big Red SOS button instantly accessible during any active booking or from the dedicated Safety Centre.
- **Proactive Telephony Voice Dispatch**: Pluggable telephony adapter (`ITelephonyProvider`) supporting Twilio, Exotel, and an offline development simulator (`MockTelephonyProvider`). Dispatches automated bilingual emergency phone calls and SMS alerts to the customer's top priority emergency contacts with live incident coordinates.
- **Scheduled Safety Check-in Milestones**: Proactive automated check-ins scheduled throughout the service lifecycle:
  - Milestone 1: Worker En Route
  - Milestone 2: Worker Arrival
  - Milestone 3: Work Started
  - Milestone 4: Overdue Completion Timeout
- **3-Stage Escalation Matrix**:
  - *Stage 1 (Reminder)*: In-app prompt asking "Are you safe?".
  - *Stage 2 (Warning)*: High-priority push banner with 5-minute countdown.
  - *Stage 3 (Escalation)*: Automated alerts dispatched to customer's emergency contacts and platform safety response desk.

### 6. Certificate Authentication Engine
- **QR Code Cryptographic Verification**: Scans and parses cryptographically signed QR payloads issued by national vocational bodies (ITI, NSDC, Skill India).
- **DigiLocker Integration Adapter**: Extensible adapter for instant verification of government-issued trade credentials.

### 7. Duplicate Account Prevention
- **Risk-Based Identity Flagging**: Cross-checks phone number hashes, email normalization, device footprints, and masked government ID numbers during registration.
- **No Hard Bans for Family Numbers**: Distinguishes between shared household mobile numbers (common in Indian working-class families) and fraudulent duplicates. Flags accounts as `LOW`, `MEDIUM`, or `HIGH` risk for administrator review without abruptly blocking registrations.

### 8. Admin Verification & Compliance Queues
Dedicated administrative review and resolution workflows:
- Identity document approval queue (with reviewer audit notes)
- Skill evidence & trade certificate verification queue
- Recognition of Prior Learning (RPL) assessment queue
- Duplicate account risk audit queue
- Safety incident logs and emergency telephony call records

---

## 🛠️ Technology Stack

| Layer | Technologies Used |
|---|---|
| **Customer Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, Socket.IO Client |
| **Worker Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, Socket.IO Client |
| **Shared Backend** | Node.js, Express.js, TypeScript, Socket.IO Server |
| **Database & ORM** | Prisma ORM, SQLite (local zero-dependency default), PostgreSQL (production drop-in) |
| **Authentication** | JSON Web Tokens (JWT), bcrypt password hashing, Role-Based Access Control (RBAC) |
| **Safety & Telephony** | Telephony provider abstraction (Twilio / Exotel / Mock Voice Engine) |
| **SMS Gateway** | SMS provider abstraction (Fast2SMS / Twilio / Mock SMS Engine) |
| **Validation** | TypeScript type safety & schema validation |
| **Testing** | Node.js TSX test runner, HTTP assertions, concurrent transaction & safety verification suites |

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
|  - Emergency SOS Trigger & Contact Dispatch   |  - Worker Rights Charter (Code on Social Sec.)  |
|  - 3-Stage Safety Check-ins ("I am Safe")     |  - Identity (Aadhaar/PAN) & Skill Verification  |
|  - Visiting Charge Pre-Booking Modal          |  - RPL Portfolio Application & Badges Gallery   |
|  - Multicategory Reviews (4 Dimensions)       |  - Visiting / Diagnostic Charge Configuration   |
|  - Emergency Contacts & Customer Care Desk    |  - Authoritative Gross Earnings & History (₹)   |
+-----------------------------------------------+-------------------------------------------------+
                        \                                              /
                         \           REST API & WebSockets            /
                          \          (Bearer JWT Authentication)     /
                           v                                        v
+-------------------------------------------------------------------------------------------------+
|                               SHARED BACKEND SERVER (Port 5000)                                 |
|                                                                                                 |
|  [ Auth & RBAC Guard ]    [ Fair Matching Engine ]        [ Atomic Booking Tx ]                 |
|  [ Safety Response Core ] [ Telephony Voice Dispatcher ]  [ Socket Room Manager ]               |
|  [ Badges Engine ]        [ RPL Assessment Pipeline ]     [ Duplicate Account Risk Analyzer ]   |
+-------------------------------------------------------------------------------------------------+
                                                |
                                        Prisma ORM Client
                                                |
                                                v
+-------------------------------------------------------------------------------------------------+
|                                     AUTHORITATIVE DATABASE                                      |
|  Users · CustomerProfiles · WorkerProfiles · JobRequests · JobOffers · Quotes · Bookings ·      |
|  QuoteNegotiations · Reviews · Notifications · SupportTickets · CustomerEmergencyContacts ·     |
|  SafetyEvents · SafetyCheckIns · EmergencyCallLogs · WorkerIdentityDocuments ·                  |
|  WorkerSkillEvidences · WorkerTermsAcceptances · WorkerRPLApplications · WorkerBadges ·         |
|  VisitingCharges · BookingChargeAcknowledgements · CertificateVerificationRecords ·             |
|  DuplicateAccountFlags · CustomerCareSettings                                                   |
+-------------------------------------------------------------------------------------------------+
```

---

## 📂 Monorepo Directory Structure

```
KaamSetu/
├── apps/
│   ├── customer/                      # Kaam Setu Customer Web Application (also Unified Portal)
│   │   ├── public/
│   │   │   ├── avatars/               # Authentic Indian SVG avatars (Aarav, Pooja, Suresh, etc.)
│   │   │   └── logo.jpg               # Official Kaam Setu brand mark
│   │   ├── src/
│   │   │   ├── components/            # Header, WorkerHeader, Footer, DemoSwitcher, Toast
│   │   │   ├── context/               # AuthContext, SocketContext
│   │   │   ├── pages/                 # Home, Request, JobDetails, BookingDetails, Bookings,
│   │   │   │                          # EmergencyContacts, CustomerCare, SafetyCentre,
│   │   │   │   └── worker/            # Unified Worker Pages: VerificationCentre,
│   │   │   │                          # WorkerRightsTerms, VisitingChargesSettings, RplAndBadges
│   │   │   ├── services/              # API client and backend fetchers
│   │   │   └── styles/                # Tailwind CSS configurations
│   │   ├── index.html
│   │   ├── package.json
│   │   └── vite.config.ts
│   │
│   └── worker/                        # Standalone Kaam Setu Pro Worker Web Application
│       ├── public/
│       │   ├── avatars/               # Authentic Indian SVG avatars (Suresh, Priya, etc.)
│       │   └── logo.jpg               # Official Kaam Setu brand mark
│       ├── src/
│       │   ├── components/            # Header, Footer, DemoSwitcher, Toast
│       │   ├── context/               # AuthContext, SocketContext
│       │   ├── pages/                 # Dashboard, Offers, Bookings, Earnings, VerificationCentre,
│       │   │                          # WorkerRightsTerms, VisitingChargesSettings, RplAndBadges
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
│   │   │   ├── customers/             # Emergency contacts & customer care config
│   │   │   ├── duplicateDetection/    # Risk-based duplicate account analyzer
│   │   │   ├── jobs/                  # Job request creation & cancellation
│   │   │   ├── quotes/                # Quote submission, counteroffers, acceptance
│   │   │   ├── bookings/              # Status tracking & start OTP verification
│   │   │   ├── workers/               # Offers inbox, profile, earnings & SMS provider
│   │   │   ├── credibility/           # Badges engine & RPL application workflows
│   │   │   ├── pricing/               # Visiting charges & booking fee acknowledgements
│   │   │   ├── safety/                # SOS triggers, telephony provider & safety check-ins
│   │   │   ├── certificates/          # QR and DigiLocker verification adapters
│   │   │   ├── admin/                 # Verification queues, RPL reviews & safety audits
│   │   │   ├── reviews/               # 4-axis multicategory reviews
│   │   │   └── support/               # Ticketing and dispute resolution
│   │   ├── utils/
│   │   │   └── security.ts            # Indian phone normalization, masking, lookup hashing
│   │   ├── tests/
│   │   │   ├── authRegistration.test.ts      # Customer & Worker registration verification
│   │   │   ├── e2eWorkflow.test.ts           # 12-step end-to-end booking flow test
│   │   │   ├── securityAndScenarios.test.ts  # RBAC, conflicts & cancellation tests
│   │   │   └── safetyAndCredibility.test.ts  # 14-scenario safety, RPL & credibility suite
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
├── docs/                              # Architectural and deployment documentation
│   ├── ARCHITECTURE.md                # System topology and sequence diagrams
│   ├── DATABASE.md                    # Relational data models and PostgreSQL guide
│   ├── API.md                         # Complete REST API reference (20 endpoints)
│   ├── NOTIFICATIONS.md               # Real-time WebSocket event contracts
│   ├── RENDER_DEPLOYMENT.md           # Step-by-step single-service Render deployment
│   └── SETUP.md                       # Quick developer setup guide
│
├── package.json                       # Root monorepo script coordinator
└── README.md
```

---

## 🖥️ Complete Web Pages & User Journeys

### 1. Customer Application (Port 5173)

#### 🔐 Landing Page & Authentication Gateway (`/`)
- **Dual Role Switching**: Instant tab switching between Customer and Worker Pro portals.
- **Registration**: Full Name, Email, Phone, Password, Address, City (Mumbai, Delhi, Bengaluru, etc.), and Postal Code. Automatically screens for duplicates and logs into the Customer Dashboard.
- **1-Click Demo Logins**: Test instantly with pre-seeded personas: Aarav Sharma or Pooja Patel.

#### 🏠 Customer Home Dashboard (`/`)
- **Brand Header & Demo Switcher**: Instant switching between accounts.
- **Active Service Banner**: Live tracking card with assigned technician name, agreed price in ₹, service status, and the 4-digit start OTP.
- **Emergency Contacts Quick Access**: Status of emergency contacts setup.
- **8 Core Trade Categories**: Plumbing (₹349), Electrical (₹299), Cleaning (₹499), Appliances (₹449), Carpentry (₹399), Painting (₹999), AC Repair (₹599), and Cooking (₹349).

#### 📝 Service Request Creation Wizard (`/request`)
A guided 6-step wizard: Category Selection ➔ Problem Details ➔ Location & Geo-coordinates ➔ Urgency (Immediate / Scheduled) ➔ Budget Expectation (₹) ➔ Review & Instant Dispatch.

#### 📊 Live Job Request & Quotes Feed (`/jobs/:id`)
- **Live WebSocket Feed**: Real-time quotes appear automatically without page refresh.
- **Quote Cards**: Quoted price in ₹, worker's rating, arrival ETA, scope inclusions/exclusions, and verified badges.
- **Visiting Charge Notice**: Displays worker's diagnostic fee and whether it is adjustable against the total bill.
- **Interactive Actions**: Accept & Book (triggers atomic lock), Counteroffer (propose revised ₹ amount), or Reject.

#### 🚗 Confirmed Booking & Safety Hub (`/bookings/:id`)
- **Service Progress Timeline**: `Confirmed` ➔ `On The Way` ➔ `Work Started` ➔ `Completed`.
- **Pre-Booking Visiting Fee Modal**: Displays explicit warning of the worker's diagnostic charge with mandatory acknowledgement.
- **Mutually Verified Start OTP**: Prominently displays the 4-digit security code that the worker must verify to commence billing.
- **Emergency SOS Panic Button**: Big Red SOS button allowing instant trigger of emergency calls and SMS alerts to trusted contacts.
- **Proactive Safety Check-in Milestone**: Interactive "Are you safe?" prompt with "I am Safe" confirmation button.
- **4-Axis Multicategory Review Form**: Sliders for Service Quality, Punctuality, Professionalism, and Communication upon job completion.

#### 🛡️ Emergency Contacts Manager (`/emergency-contacts`)
- Register up to 3 trusted emergency contacts.
- Validate 10-digit Indian mobile numbers (`+91`).
- Send and verify SMS OTP for each contact.
- Re-order priority notification rankings.
- Complete privacy protection: Emergency contacts are strictly private and never visible to trade workers.

#### 📞 Customer Care & Helplines (`/customer-care`)
- Tap-to-call central helpline (`CUSTOMER_CARE_PHONE`).
- Support ticket creation across 8 categories with live resolution tracker.
- 24/7 National Emergency Helplines directory (112, 100, 1091, 108).

#### 🚨 Safety Centre (`/safety-centre`)
- Dedicated safety cockpit with one-touch SOS trigger.
- Live dispatch preview showing registered contacts to be called.
- Resolution & cancellation modal with mandatory incident audit notes.
- Historical safety incident log.

---

### 2. Worker Pro Application (Port 5174)

#### 🔐 Worker Pro Landing Page & Registration Gateway (`/`)
- Complete onboarding with trade specialization, years of experience, hourly rate in ₹, callout fee in ₹, and city.
- 1-Click Pro Demo logins: Suresh Kumar (Plumber), Priya Sharma (Electrician), Rajesh Verma (Cleaning), Anita Roy (Appliances).

#### ⚡ Worker Dashboard (`/`)
- **Instant Availability Toggle**: Switch between `ONLINE` (ready for dispatch) and `OFFLINE` (paused).
- **KPI Metrics**: New Offers, Active Jobs, Completed Jobs, Gross Lifetime Earnings in ₹.
- **Active Booking Highlight**: Quick execution actions for ongoing assignments.

#### 📥 Job Opportunities Inbox (`/offers`)
- Persistent inbox of matched jobs with transparent matching breakdown (Trade, Proximity, Online Status, Verified Credentials).
- Itemized quote submission modal: Proposed price in ₹, arrival ETA in minutes, scope description, exclusions, and worker note.

#### 🔨 Job Management & Execution (`/bookings`)
- `Mark On The Way`: Alerts customer of technician departure.
- `Enter Start Code`: Modal prompting for the customer's 4-digit OTP. The server validates the code and unlocks `WORK_STARTED`.
- `Mark Job Completed`: Finalizes job and credits full earnings in ₹ to the worker's ledger.

#### 🛡️ Verification & Compliance Centre (`/verification`)
- **Mobile OTP Verification**: Verifies phone number with 5-minute security OTP.
- **Government Identity Document**: Upload Aadhaar, Voter ID, PAN, DL, or Passport with secure preview and server-side masking.
- **Skill Certificates**: Upload trade diplomas with QR code authentication support.

#### 📜 Worker Rights & Dignity Charter (`/worker/rights` or `/worker/terms`)
- Transparent charter upholding worker protections under the **Code on Social Security 2020**.
- Guarantees zero platform commission deductions, timely direct payments, and dispute representation.
- Timestamped digital acceptance record.

#### 🏅 Recognition of Prior Learning (RPL) & Badges (`/rpl` or `/worker/rpl`)
- **RPL Portfolio Application**: Experienced craftsmen without formal degrees submit years of trade experience, self-assessment summaries, and peer references for verification.
- **Credibility Badges Showcase**: Displays verified milestone badges (First Job, 10 Jobs, 25 Jobs, Experienced Pro, RPL Certified, ITI Certified).

#### 💰 Visiting Charges Settings (`/visiting-charges`)
- Configure diagnostic/visiting fee in Indian Rupees (₹).
- Toggle whether the fee is **100% adjustable against the final bill** when service is performed.
- Editable customer policy terms with real-time customer preview.

#### 💵 Authoritative Earnings Dashboard (`/earnings`)
- Gross earnings calculated directly from database `COMPLETED` booking records.
- Itemized ledger of every completed job with customer details and ₹ payout.

---

### 3. Unified Single-Site Access

For seamless production deployment (e.g., on Render), `apps/customer` serves as a **Single Unified Web Application**:
- Allows accessing both **Customer** and **Worker** workflows from one domain.
- Top navigation includes direct switching buttons:
  - In Customer View: Click **"Worker Pro View"** to manage job offers, verification, RPL, and earnings.
  - In Worker View: Click **"Customer View"** to switch back to booking household services.
  - Or use the **Demo Switcher** pill to switch personas in 1 click.

---

### 4. Shared Backend Engines (Port 5000)

1. **Fair Matching Engine (`server/src/matching/matchingEngine.ts`)**:
   - Multi-factor algorithm: Trade specialization (40 pts), Active status (25 pts), Proximity (20 pts), Verified credentials (10 pts), Experience (5 pts).
   - Equal opportunity baseline ensures newer workers receive fair job dispatches.
2. **Atomic Booking Transaction Manager (`server/src/modules/quotes/quotesController.ts`)**:
   - Uses `prisma.$transaction()` to atomically mark the selected quote as `ACCEPTED`, generate the 4-digit start OTP, create the `Booking`, and reject competing quotes.
3. **Safety & Emergency Voice Engine (`server/src/modules/safety/`)**:
   - Handles SOS panic triggers, emergency contact dispatches, bilingual voice message calls, and 3-stage safety check-in escalations.
4. **Authoritative Badges Engine (`server/src/modules/credibility/badgesEngine.ts`)**:
   - Automatically inspects completed bookings and customer reviews upon job completion to dynamically award verified milestone and credibility badges.
5. **Real-Time Socket.IO Broadcaster (`server/src/sockets/socketManager.ts`)**:
   - Dispatches instant events: `job.offer.created`, `quote.created`, `quote.counteroffered`, `quote.accepted`, `booking.status.updated`, `safety.sos.triggered`.

---

## 💻 How to Run on Your PC (Step-by-Step Setup)

### 1. System Prerequisites
- **Node.js**: v18.0.0 or higher (v20+ recommended). Check with `node -v`.
- **npm**: v9.0.0 or higher. Check with `npm -v`.
- **Git**: Installed and available in terminal. Check with `git --version`.

### 2. Cloning & Installation
```bash
# Clone the repository
git clone https://github.com/Jain07Himanshu/KaamSetu.git

# Enter project root
cd KaamSetu

# Install all monorepo dependencies
npm install
```

### 3. Zero-Config Database Initialization
Kaam Setu comes pre-configured with SQLite for zero-dependency local development:
```bash
# Generate Prisma client, push database schema, and seed demo accounts
npm run db:setup
```
*This command runs:*
- `prisma generate` (generates type-safe database client)
- `prisma db push` (creates `server/prisma/dev.db` with all 29 relational tables)
- `prisma seed` (loads trade categories, verified worker profiles, demo accounts, and credibility badges)

### 4. Launching All Services

Open three separate terminal windows in the project directory:

#### Terminal 1 — Shared Backend API & WebSocket Server
```bash
cd server
npm run dev
```
*Server starts on `http://localhost:5000` with API at `/api` and Socket.IO active.*

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
| **Customer App** | [http://localhost:5173](http://localhost:5173) | Service discovery, request wizard, live quotes, booking tracker, safety hub |
| **Worker App** | [http://localhost:5174](http://localhost:5174) | Availability toggle, job inbox, quotation, execution, earnings, verification |
| **Backend API** | [http://localhost:5000/api](http://localhost:5000/api) | Authoritative REST API endpoints |
| **WebSocket** | `ws://localhost:5000` | Bidirectional real-time Socket.IO channel |

---

## 👥 Pre-Configured Demo Accounts

Use the **Demo Switcher** pill in the navigation header of either application to switch accounts with one click, or log in manually with the following credentials:

| Portal | Name | Email | Password | Role / Details |
|---|---|---|---|---|
| **Customer** | Aarav Sharma | `aarav.customer@kaamsetu.demo` | `password123` | B-402 Hiranandani Gardens, Powai, Mumbai |
| **Customer** | Pooja Patel | `pooja.customer@kaamsetu.demo` | `password123` | 120 Green Glen Layout, Bellandur, Bengaluru |
| **Worker** | Suresh Kumar | `suresh.plumber@kaamsetu.demo` | `password123` | Master Plumber (10 yrs exp, 5.0★, Mumbai) |
| **Worker** | Priya Sharma | `priya.electric@kaamsetu.demo` | `password123` | Certified Electrician (7 yrs exp, 4.8★) |
| **Worker** | Rajesh Verma | `rajesh.cleaning@kaamsetu.demo` | `password123` | Deep Cleaning Specialist (5 yrs exp, 4.9★) |
| **Worker** | Anita Roy | `anita.appliances@kaamsetu.demo` | `password123` | Appliance & AC Tech (6 yrs exp, 4.7★) |

---

## 🧪 Automated Verification & Security Test Suites

Kaam Setu includes complete integration, security, and safety verification suites:

```bash
# Run ALL test suites sequentially with one command
npm test
```

Or run individual test suites from `server/`:
```bash
cd server

# 1. Customer & Worker registration, database persistence & auth verification test
npx tsx src/tests/authRegistration.test.ts

# 2. 12-step complete end-to-end booking lifecycle test
npx tsx src/tests/e2eWorkflow.test.ts

# 3. Security access controls, double-booking rejection & cancellation test
npx tsx src/tests/securityAndScenarios.test.ts

# 4. Comprehensive 14-scenario Customer Safety, Worker Verification, RPL & Credibility test
npx tsx src/tests/safetyAndCredibility.test.ts
```

### Verified Test Scenarios:
- ✅ Customer & Worker registration with password hashing and JWT issuance
- ✅ Duplicate account detection: Evaluates risk score without permanent hard bans for shared family numbers
- ✅ Emergency Contacts: Indian mobile validation, max 3 enforcement, OTP verification
- ✅ Customer Care & Helplines: Configurable care phone and 24/7 emergency directory
- ✅ Worker Mobile Verification: 6-digit phone OTP with 5-minute expiry
- ✅ Government Identity Verification: Aadhaar/PAN upload with secure masking (`••••-••••-9012`)
- ✅ Worker Rights & Dignity Charter: Digital acceptance of Code on Social Security 2020 legal protections
- ✅ Visiting / Diagnostic Charges: Worker fee configuration and mandatory pre-booking customer acknowledgement
- ✅ Safety Check-in Milestones: Scheduled milestones with 3-stage escalation and "I am Safe" response
- ✅ Emergency SOS Panic System: Outbound emergency telephony calls and SMS alerts logged via telephony service
- ✅ Certificate Verification Engine: QR code cryptographic validation adapter
- ✅ Recognition of Prior Learning (RPL): Application submission and administrative approval
- ✅ Dynamic Credibility Badges: Automatic calculation of milestone badges (First Job, 10 Jobs, 25 Jobs)
- ✅ 4-Axis Multicategory Reviews: Star ratings across Quality, Punctuality, Professionalism, and Communication
- ✅ Full Role-Based Access Control: Customers forbidden from worker endpoints (403) and vice-versa
- ✅ Atomic Quote Acceptance: Double-acceptance rejected with 400; competing quotes auto-rejected
- ✅ Mutually Verified 4-Digit Start OTP: Invalid OTP rejected with 400; correct code transitions to `WORK_STARTED`

---

## ⚙️ Configuration & Environment Variables

### Backend (`server/.env`):
```env
PORT=5000
NODE_ENV=development
DATABASE_URL="file:./dev.db"
JWT_SECRET="hyperlocal_dev_super_secret_jwt_key_2026_change_in_prod"
JWT_EXPIRES_IN="7d"

# Customer Care Settings
CUSTOMER_CARE_PHONE="+91 1800 522 6738"
CUSTOMER_CARE_EMAIL="care@kaamsetu.in"

# Safety & Telephony Emergency Voice Dispatch (MOCK | EXOTEL | TWILIO)
TELEPHONY_PROVIDER="MOCK"
TELEPHONY_API_KEY="mock_telephony_secret"
TELEPHONY_ACCOUNT_SID="mock_sid"
TELEPHONY_FROM_PHONE="+918000012345"
EMERGENCY_VOICE_FILE_URL="/audio/emergency-alert-hindi-english.mp3"

# Worker Verification SMS Gateway (MOCK | FAST2SMS | TWILIO)
SMS_PROVIDER="MOCK"
SMS_API_KEY="mock_sms_api_key"
SMS_SENDER_ID="KMSETU"

CLIENT_URL_CUSTOMER="http://localhost:5173"
CLIENT_URL_WORKER="http://localhost:5174"
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
2. The server build script automatically detects PostgreSQL and prepares the schema. Or manually copy `server/prisma/schema.postgresql.prisma` to `server/prisma/schema.prisma`.
3. Push schema and seed:
   ```bash
   npx prisma db push
   npm run prisma:seed
   ```

---

## 🚀 Deploying on Render

Kaam Setu is configured as a **Single Unified Full-Stack Application** on [Render](https://render.com). You only need to deploy **ONE Web Service** and **ONE PostgreSQL Database**:

1. **Create PostgreSQL Database on Render**:
   - Name: `kaamsetu-postgres`
   - Plan: `Free`
2. **Create Web Service on Render**:
   - Connect repo: `https://github.com/Jain07Himanshu/KaamSetu.git`
   - Runtime: `Node`
   - Build Command:
     ```bash
     npm install --include=dev && npm run build
     ```
   - Start Command:
     ```bash
     npm run deploy:prod --workspace=@hyperlocal/server
     ```
   - Health Check Path: `/api/health`
   - Environment Variables:
     - `NODE_ENV`: `production`
     - `DATABASE_URL`: *(Connect from Render PostgreSQL)*
     - `JWT_SECRET`: *(A secure random string)*
     - `CUSTOMER_CARE_PHONE`: `+91 1800 522 6738`
     - `TELEPHONY_PROVIDER`: `MOCK`
     - `SMS_PROVIDER`: `MOCK`

Detailed instructions are available in [**docs/RENDER_DEPLOYMENT.md**](docs/RENDER_DEPLOYMENT.md).

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
