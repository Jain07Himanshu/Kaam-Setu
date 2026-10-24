# HyperLocal — Shared Backend API Reference

**Base URL:** `http://localhost:5000/api`

All authenticated endpoints require an `Authorization: Bearer <token>` header.

---

## 1. Authentication (`/auth`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/auth/register` | Register new customer or worker | No |
| `POST` | `/auth/login` | Login with email and password | No |
| `POST` | `/auth/demo-login` | Quick demo sign-in for testing | No |
| `GET` | `/auth/me` | Fetch currently authenticated user profile | Yes |

---

## 2. Service Categories (`/categories`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/categories` | List all active trade service categories | No |
| `GET` | `/categories/:slug` | Get specific category details | No |

---

## 3. Service Requests (`/jobs`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/jobs` | Customer creates new service request & triggers matching | Yes (Customer) |
| `GET` | `/jobs/my-requests` | Customer retrieves all their service requests | Yes (Customer) |
| `GET` | `/jobs/:id` | Get job details, quotes, and booking | Yes |
| `PATCH` | `/jobs/:id/cancel` | Customer cancels request | Yes (Customer) |

---

## 4. Worker Offers Inbox (`/worker/offers`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/worker/offers` | Worker retrieves job offers (`?status=PENDING\|QUOTED\|DECLINED\|ALL`) | Yes (Worker) |
| `GET` | `/worker/offers/:id` | Get single offer details | Yes (Worker) |
| `POST` | `/worker/offers/:id/decline` | Worker declines a job offer | Yes (Worker) |

---

## 5. Quotes & Negotiation (`/quotes`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/quotes` | Worker submits a formal trade quote | Yes (Worker) |
| `POST` | `/quotes/:id/counteroffer` | Submit a counteroffer (customer or worker) | Yes |
| `POST` | `/quotes/:id/accept` | Customer accepts quote -> creates atomic `Booking` | Yes (Customer) |
| `POST` | `/quotes/:id/reject` | Customer rejects quote | Yes (Customer) |

---

## 6. Bookings & Service Tracking (`/bookings`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/bookings` | List user's active and completed bookings | Yes |
| `GET` | `/bookings/:id` | Get booking details (customer sees Start OTP) | Yes |
| `PATCH` | `/bookings/:id/status` | Worker updates status: `ON_THE_WAY`, `WORK_STARTED` (requires `startOtp`), `COMPLETED` | Yes (Worker) |

---

## 7. Worker Availability & Earnings (`/workers`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/workers` | Public directory of workers with filters | No |
| `GET` | `/workers/:id` | Public worker profile, reviews, verified badges | No |
| `PATCH` | `/workers/me/availability` | Worker toggles `isAvailable` (true/false) | Yes (Worker) |
| `PATCH` | `/workers/me` | Worker updates bio, skills, service radius, rates | Yes (Worker) |
| `GET` | `/workers/me/earnings` | Authoritative earnings summary derived from completed jobs | Yes (Worker) |

---

## 8. Notifications (`/notifications`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/notifications` | List user's notifications and unread count | Yes |
| `PATCH` | `/notifications/:id/read` | Mark single notification as read | Yes |
| `POST` | `/notifications/read-all` | Mark all notifications as read | Yes |

---

## 9. Reviews & Feedback (`/reviews`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/reviews` | Customer rates completed booking (1-5 stars + text) | Yes (Customer) |

---

## 10. Support & Safety (`/support`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/support` | Create support inquiry or safety dispute ticket | Yes |
| `GET` | `/support` | List user's support tickets | Yes |
