# Movie Ticket Booking System (Backend)

## What it does
- Booking service with Kafka + Redis for seat locking and async processing.
- Stripe Payment Intent + webhooks to confirm bookings.
- Minimal load test (Artillery) for booking flow.

## Quick start
1) Install deps: `npm install`
2) Env file at repo root (`.env`): set `KAFKA_BROKERS`, `REDIS_HOST/PORT`, `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `KAFKA_MODE=kafka`
3) Ensure Kafka & Redis are running.
4) Seed data & clear topics: `npm run seed:redis`
5) Start server: `npm start` (serves API + `frontend/payment.html`)

## Key endpoints
- `POST /api/bookings` → returns `request_id` (202). Poll `GET /api/bookings/request/:requestId` or `GET /api/bookings/:id`.
- `GET /api/payments/config` → Stripe publishable key.
- `POST /api/payments/webhook` → Stripe webhook (raw body).
- `GET /api/bookings/:id` → booking status (`pending/confirmed/failed`).
- Frontend pay page: `http://localhost:3001/payment.html?booking_id=<id>`

## Payment flow (Stripe)
1) Booking created → Payment Intent created (metadata has booking_id).
2) Frontend calls `stripe.confirmCardPayment` with `client_secret`.
3) Stripe sends `payment_intent.succeeded` webhook → booking marked `confirmed`.

## Load testing (booking only)
- Config: `backend/load-test.yml` (phases 50→100→200→300 RPS).
- Run: `npm run load-test`
- Seed before testing to clear Kafka topics/Redis: `npm run seed:redis`

## Notes
- Seed script deletes & recreates Kafka topics; run only when Kafka is up.
- Consumers: default 16 instances for 30 partitions (single process).
- `fromBeginning: false` on consumers to avoid replaying old messages.

