# HyperLocal — Real-Time Events & Notifications

## 1. Socket.IO Event Architecture

HyperLocal uses **Socket.IO** for real-time bidirectional communication between the central server and connected clients.

### Connection & Authentication:
- Handshake carries the JWT token via `socket.handshake.auth.token` or `socket.handshake.query.token`.
- The server authenticates the token and automatically joins the socket into authorized private rooms:
  - `user:${userId}` — Private alerts for the specific user.
  - `role:${role}` — Role-level broadcasts (e.g., `role:CUSTOMER`, `role:WORKER`).
  - `customer:${customerId}` — Customer-specific request updates.
  - `worker:${workerId}` — Worker-specific job offers and bookings.
  - `job:${jobId}` — Specific service request negotiation room.
  - `booking:${bookingId}` — Specific active booking execution tracking room.

---

## 2. Event Specification

| Event Name | Emitter | Audience Room | Payload Data | Triggered When |
|---|---|---|---|---|
| `job.created` | Server | `customer:${customerId}` | `{ jobRequest }` | Customer submits request |
| `job.offer.created` | Server | `worker:${workerId}` | `{ offer, matchScore, matchReasons }` | Matching engine finds eligible worker |
| `quote.created` | Server | `customer:${customerId}`, `job:${jobId}` | `{ quote, jobRequestId }` | Worker submits trade quote |
| `quote.counteroffered` | Server | Recipient + `job:${jobId}` | `{ quote, negotiation }` | Customer or worker sends counteroffer |
| `quote.accepted` | Server | `worker:${workerId}`, `job:${jobId}` | `{ quoteId, bookingId }` | Customer accepts quote |
| `booking.confirmed` | Server | Both Customer & Worker rooms | `{ booking }` | Booking is atomically created |
| `booking.status.updated`| Server | `booking:${bookingId}`, both parties | `{ bookingId, status, booking }` | Worker marks On The Way, Start Work, or Completed |
| `worker.availability.changed` | Server | `role:CUSTOMER` | `{ workerId, isAvailable }` | Worker toggles online/offline |
| `review.received` | Server | `user:${workerUserId}` | `{ review }` | Customer rates completed booking |

---

## 3. Durability & Reconnection Recovery

A WebSocket connection alone is **not** treated as guaranteed storage:
1. **Database-First Pattern**: Every notification is first saved as a durable record in the `Notification` table with an unread timestamp.
2. **Instant Broadcast**: The notification is then dispatched via Socket.IO.
3. **Offline Worker Guarantee**: If a worker is offline when a job is requested, the durable `JobOffer` record remains in status `PENDING`. When the worker logs in or reconnects, `GET /api/worker/offers?status=PENDING` retrieves the pending offers without losing opportunities.
4. **Toast Alerts**: Active client applications display unobtrusive toast alerts at the bottom right that allow one-click navigation directly to the corresponding request, quote, or booking.
