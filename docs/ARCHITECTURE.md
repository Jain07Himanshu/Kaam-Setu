# Kaam Setu — System Architecture

**Tagline:** “Your Work, Our Priority”

## 1. High-Level Overview

Kaam Setu is designed as a connected monorepo containing two distinct user applications served by a single shared backend and authoritative central database:

1. **Kaam Setu Customer (`apps/customer`)** — Dedicated client application running on `http://localhost:5173` for homeowners and residents requesting household services.
2. **Kaam Setu Pro Worker (`apps/worker`)** — Dedicated client application running on `http://localhost:5174` for verified local trade pros receiving real-time job offers, submitting quotes, and managing job execution.
3. **Shared Backend (`server`)** — Express + TypeScript + Socket.IO API server running on `http://localhost:5000`.
4. **Authoritative Relational Database** — SQLite default for local zero-dependency development (`prisma/dev.db`) and PostgreSQL configuration for production deployment (`prisma/schema.postgresql.prisma`).
5. **Shared Packages (`packages/*`)** — Shared design tokens and shared TypeScript contracts between backend and frontends.

---

## 2. Core Architectural Decisions

```
+-------------------------------------------------------------------------+
|                                KAAM SETU                                |
+------------------------------------+------------------------------------+
|  apps/customer (Port 5173)         |  apps/worker (Port 5174)           |
|  - Service Request Wizard          |  - Instant Job Offer Receiving     |
|  - Real-time Quotes & Counteroffers|  - Quotation & Negotiation Engine  |
|  - Booking & Arrival Tracker       |  - Start Code OTP Verification     |
|  - 4-Digit Customer Start OTP      |  - Dispatch Radius & Availability  |
|  - Verified Reviews & Feedback     |  - Authoritative Earnings Tally    |
+------------------------------------+------------------------------------+
                   \                                  /
                    \   REST API & WebSockets        /
                     \  (Bearer JWT Auth)           /
                      v                            v
+-------------------------------------------------------------------------+
|                  SHARED BACKEND SERVER (Port 5000)                      |
|                                                                         |
|  +--------------------+   +--------------------+   +------------------+ |
|  | Auth & Role Guard  |   | Fair Matching Engine|  | Sockets Manager  | |
|  +--------------------+   +--------------------+   +------------------+ |
|  | Jobs & Quotes      |   | Bookings & OTP     |   | Durable Alerts   | |
|  +--------------------+   +--------------------+   +------------------+ |
+-------------------------------------------------------------------------+
                                    |
                            Prisma ORM Client
                                    |
                                    v
+-------------------------------------------------------------------------+
|                     AUTHORITATIVE DATABASE                              |
|  Users, WorkerProfiles, CustomerProfiles, JobRequests, JobOffers,       |
|  Quotes, QuoteNegotiations, Bookings, Reviews, Notifications, Support   |
+-------------------------------------------------------------------------+
```

### Monorepo Separation of Concerns
- **Separate Frontends**: Customer and Worker applications operate independently in their own directories with dedicated state machines, routes, and navigation tailored to their specific needs.
- **Shared Authority**: Neither frontend simulates state in `localStorage` or memory. Every quotation, counteroffer, booking status transition, review, and notification is persisted to the authoritative database via the shared backend.
- **Fair Matching Engine**: Scoring algorithm that computes real-time worker suitability based on trade specialization, online availability, geographic proximity, trade verifications, and experience without penalizing new honest workers.
- **Event-Driven Push via Socket.IO**: Sockets are authenticated via JWT. Users automatically join private channels (`user:${id}`, `customer:${id}`, `worker:${id}`, `job:${jobId}`, `booking:${bookingId}`). When quotes or offers are generated, they are persisted to the database first and then broadcast over WebSockets.

---

## 3. Brand Identity & Design System

The system strictly adheres to the mandated color palette:
- **Primary Green (`#2A7C13`)**: Primary actions, confirmed booking statuses, key icons, selected tabs.
- **Secondary Green (`#76C457`)**: Progress indicators, subtle borders, accent highlights.
- **Soft Cream (`#FFF8CF`)**: Warm background accents, highlight banners, notification badges.
- **Warm Beige (`#FBE6C2`)**: Supporting cards, demo switcher pill, trust badges.
- **Charcoal (`#1F2937`)**: Typography, high contrast readability.
- **Surface (`#FDFBF7` / `#FFFFFF`)**: Clean, calm, modern card surfaces.
