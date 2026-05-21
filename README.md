# Prowider — Mini Lead Distribution System

A full-stack lead distribution platform built with **Next.js 14**, **MongoDB Atlas**, and **Server-Sent Events**.

## Live Demo
>https://minileaddistrubutions.vercel.app

---

## Tech Stack
- **Frontend & Backend:** Next.js 14 (App Router)
- **Database:** MongoDB Atlas (via Mongoose)
- **Real-time:** Server-Sent Events (SSE)
- **Deployment:** Vercel + MongoDB Atlas

---

## Local Setup

```bash
# 1. Clone
git clone https://github.com/Shivampatil87/Mini_Lead_Distrubution
cd prowider-lead-distribution

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.local.example .env.local
# Edit .env.local and add your MongoDB Atlas URI

# 4. Run dev server
npm run dev

# 5. Seed the database (first time only)
# Visit: http://localhost:3000/test-tools
# Click "Re-Seed Database"
```

---

## Routes

| Route | Description |
|---|---|
| `/` | Home page with assignment rules overview |
| `/request-service` | Customer enquiry form |
| `/dashboard` | Real-time provider dashboard |
| `/test-tools` | Webhook simulation & testing panel |

---

## Allocation Algorithm

### Mandatory Providers
- **Service 1** → Provider 1 always assigned
- **Service 2** → Provider 5 always assigned
- **Service 3** → Provider 1 AND Provider 4 always assigned

### Fair Pool (Round-Robin)
Each service has a fair pool of eligible providers:
- Service 1 pool: [P2, P3, P4]
- Service 2 pool: [P6, P7, P8]
- Service 3 pool: [P2, P3, P5, P6, P7, P8]

The system selects from the pool using a **persistent round-robin index** stored in MongoDB (`AllocationState` collection). After each assignment, the index advances and is saved — so it survives server restarts.

Each lead gets exactly **3 providers total** = mandatory + fair pool fills.

---

## Concurrency Handling

Concurrency is managed using **optimistic locking** on the `AllocationState` document:

1. Read `AllocationState` with its `version` field
2. Compute next round-robin index and select providers
3. Attempt atomic update: `updateOne({ serviceId, version: N }, { $set: { lastIndex }, $inc: { version: 1 } })`
4. If `modifiedCount === 0`, another request modified it first → **retry** (up to 10 times with jitter)

This ensures no two concurrent requests use the same round-robin slot.

---

## Webhook Idempotency

Every webhook call must include a unique `eventId`. The system:

1. Checks `WebhookEvent` collection for the `eventId` (unique index)
2. If found → returns `200` with `alreadyProcessed: true` (no action taken)
3. If not found → inserts the `eventId` first (atomic, unique constraint prevents races), then resets quotas

This means calling the same webhook 100 times only resets quota **once**.

---

## Duplicate Lead Prevention

A **compound unique index** on `{ phone, serviceId }` in the `Lead` collection enforces the rule at the database level — not just frontend validation. Duplicate submissions return a `409 Conflict` error.

---

## Real-Time Updates

The dashboard uses **Server-Sent Events (SSE)**:
- Client connects to `/api/events` which holds an open HTTP stream
- When a new lead is created, the server emits a `NEW_LEAD` event
- When quota is reset via webhook, the server emits a `QUOTA_RESET` event
- The dashboard refetches provider data automatically on each event

---

## Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
