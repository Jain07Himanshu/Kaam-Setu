# Kaam Setu — Shared Backend API Reference

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


---

## 11. Customer Emergency Contacts (`/customers/emergency-contacts`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/customers/emergency-contacts` | List up to 3 trusted emergency contacts (sorted by priority) | Yes (Customer) |
| `POST` | `/customers/emergency-contacts` | Add new emergency contact (validates 10-digit Indian mobile) | Yes (Customer) |
| `PUT` | `/customers/emergency-contacts/:id` | Update contact details or priority notification order | Yes (Customer) |
| `DELETE` | `/customers/emergency-contacts/:id` | Remove an emergency contact | Yes (Customer) |
| `POST` | `/customers/emergency-contacts/:id/send-otp` | Trigger mobile verification OTP for contact | Yes (Customer) |
| `POST` | `/customers/emergency-contacts/:id/verify-otp` | Validate 6-digit OTP to set `isVerified=true` | Yes (Customer) |

---

## 12. Customer Care & Helpline Directory (`/customers/care-config`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/customers/care-config` | Fetch central helpline number, email, and 24/7 national emergency services | No / Public |

---

## 13. Worker Verification & Compliance (`/worker/verification`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/worker/verification/send-phone-otp` | Send 6-digit phone verification OTP | Yes (Worker) |
| `POST` | `/worker/verification/verify-phone-otp` | Verify worker phone OTP (5-minute expiry) | Yes (Worker) |
| `POST` | `/worker/verification/identity` | Upload Aadhaar/Voter/PAN/DL/Passport (stored masked `••••-••••-9012`) | Yes (Worker) |
| `GET` | `/worker/verification/identity` | Get worker's current identity verification status | Yes (Worker) |
| `POST` | `/worker/verification/skills` | Upload trade skill certificates or course completion evidence | Yes (Worker) |
| `GET` | `/worker/verification/skills` | List submitted trade skill documents | Yes (Worker) |
| `GET` | `/worker/verification/status` | Complete compliance summary dashboard | Yes (Worker) |

---

## 14. Worker Rights & Dignity Charter (`/worker/terms`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/worker/terms/charter` | Fetch latest Worker Rights Charter (Code on Social Security 2020) | Yes (Worker) |
| `POST` | `/worker/terms/accept` | Record timestamped legal acceptance (zero commission deduction terms) | Yes (Worker) |
| `GET` | `/worker/terms/status` | Check if worker has signed the current active charter | Yes (Worker) |

---

## 15. Visiting & Diagnostic Charges (`/workers/visiting-charges`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/workers/me/visiting-charges` | Fetch worker's visiting fee amount, adjustability, and terms | Yes (Worker) |
| `PUT` | `/workers/me/visiting-charges` | Set visiting fee, toggle deduction against final invoice, edit terms | Yes (Worker) |
| `POST` | `/bookings/:id/visiting-charge-acknowledgement` | Customer explicitly acknowledges visiting fee before booking | Yes (Customer) |

---

## 16. Recognition of Prior Learning (RPL) & Credibility (`/worker/rpl`, `/workers/:id/credibility`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/worker/rpl/applications` | Worker submits RPL portfolio (years exp, trade category, references) | Yes (Worker) |
| `GET` | `/worker/rpl/applications` | List worker's RPL submission history and assessment review status | Yes (Worker) |
| `GET` | `/workers/:id/credibility` | Comprehensive credibility profile: trust checks, multicategory ratings, badges | No / Public |

---

## 17. Safety & Emergency Response Engine (`/safety`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/safety/sos` | Trigger emergency SOS panic broadcast (telephony calls + SMS alerts dispatched) | Yes |
| `GET` | `/safety/events` | List emergency incident logs for customer | Yes |
| `POST` | `/safety/:id/cancel` | Cancel or resolve SOS incident with mandatory audit reason | Yes |
| `POST` | `/safety/bookings/:bookingId/checkin/init` | Initialize scheduled safety milestones for an active booking | Yes |
| `POST` | `/safety/checkin/:id/acknowledge` | Customer responds "I am Safe" to check-in milestone | Yes |
| `POST` | `/safety/checkin/:id/escalate` | Trigger automated escalation for unacknowledged check-in | Yes |
| `GET` | `/safety/bookings/:bookingId/status` | Get live safety status, active SOS state, and check-in timeline | Yes |

---

## 18. Certificate Verification Engine (`/certificates`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/certificates/verify-qr` | Cryptographic QR payload verification adapter (ITI, NSDC, Skill India) | Yes |
| `POST` | `/certificates/digilocker-fetch` | DigiLocker document fetch and verification adapter | Yes |
| `GET` | `/certificates/worker/:workerId` | Public verified credentials list for worker | No / Public |

---

## 19. Duplicate Account Detection & Flagging (`/duplicate-detection`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/duplicate-detection/pre-check` | Risk-based evaluation of phone/email/device/ID before registration | No / Internal |

---

## 20. Admin Management & Verification Queues (`/admin`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/admin/identity/queue` | Review pending Aadhaar/PAN/Voter/Passport uploads | Yes (Admin) |
| `PATCH` | `/admin/identity/:id` | Approve or reject identity document with reviewer notes | Yes (Admin) |
| `GET` | `/admin/skills/queue` | Review submitted trade skill proofs | Yes (Admin) |
| `PATCH` | `/admin/skills/:id` | Approve or reject trade certificates | Yes (Admin) |
| `GET` | `/admin/rpl/applications` | Review Recognition of Prior Learning applications | Yes (Admin) |
| `PATCH` | `/admin/rpl/applications/:id` | Approve RPL application and grant `RPL_RECOGNIZED` badge | Yes (Admin) |
| `GET` | `/admin/duplicates/queue` | Audit flagged duplicate accounts | Yes (Admin) |
| `PATCH` | `/admin/duplicates/:id/resolve`| Resolve or dismiss duplicate risk flag | Yes (Admin) |
| `GET` | `/admin/safety/incidents` | Comprehensive audit trail of all SOS alerts and telephony call logs | Yes (Admin) |
