# Stripe Integration Setup Guide

Complete step-by-step guide to set up and test Stripe integration.

---

## Prerequisites

- Docker Desktop running
- Node.js installed
- Stripe account (free test account)

---

## Step 1: Start Docker Services (Redis, Kafka, Zookeeper)

Start all required services:

```bash
cd /home/swikar-ramdam/Desktop/PBL5/pbl/PBL5/1_MovieTicketBookingSystem
docker-compose up -d
```

**Verify services are running:**

```bash
docker-compose ps
```

You should see:

- ✅ `movie-booking-redis` (running)
- ✅ `movie-booking-zookeeper` (running)
- ✅ `movie-booking-kafka` (running)

**If services fail to start:**

- Check Docker Desktop is running
- Check ports 6380, 2181, 9092 are not in use

---

## Step 2: Seed Redis with Seats

Populate Redis with available seats:

```bash
cd backend
npm run seed:redis
```

**Expected output:**

```
✅ Redis connected
🧹 Recreating Kafka topic...
✅ Kafka topic recreated with 30 partitions
📦 Generated 150000 seat IDs
🧹 Clearing existing data...
✅ Added 150000 seats to available_seats
✅ Redis seeded successfully
```

**What this does:**

- Clears old booking data
- Creates 150,000 seats (seat1, seat2, ..., seat150000)
- Recreates Kafka topic with correct partitions

---

## Step 3: Get Stripe API Keys

1. **Go to Stripe Dashboard:**

   - https://dashboard.stripe.com/test/apikeys
   - Make sure you're in **Test mode** (toggle in top right)

2. **Copy your keys:**

   - **Secret key**: `sk_test_...` (starts with `sk_test_`)
   - **Publishable key**: `pk_test_...` (starts with `pk_test_`)

3. **Note:** Keep these keys secure! Never commit them to git.

---

## Step 4: Add Stripe Keys to .env

Open your `.env` file in the project root and add:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY_HERE

# Optional (for webhook testing later)
STRIPE_WEBHOOK_SECRET=

# Optional (has default)
STRIPE_API_VERSION=2024-11-20.acacia
```

**Replace:**

- `YOUR_SECRET_KEY_HERE` with your actual secret key
- `YOUR_PUBLISHABLE_KEY_HERE` with your actual publishable key

---

## Step 5: Verify Stripe Configuration

Test if Stripe is configured correctly:

```bash
cd backend
npm run test:stripe
```

**Expected output:**

```
🧪 Testing Stripe Integration Setup...

📋 Configuration Check:
   STRIPE_SECRET_KEY: ✅ Set
   STRIPE_PUBLISHABLE_KEY: ✅ Set
   STRIPE_WEBHOOK_SECRET: ⚠️  Not set (optional for now)
   STRIPE_API_VERSION: 2024-11-20.acacia

✅ Stripe is configured and ready!
```

**If you see "❌ Not set":**

- Check your `.env` file is in the project root
- Verify keys are correct (no extra spaces)
- Make sure keys start with `sk_test_` and `pk_test_`

---

## Step 6: Start the Server

### Option A: Development Mode (with auto-reload)

```bash
cd backend
npm run dev
```

### Option B: PM2 Mode (production-like, multi-core)

```bash
cd backend
npm run start:pm2:dev
```

**Expected output:**

```
✅ Redis connecting...
✅ Redis ready (connection pool active)
✅ Kafka admin connected
✅ Created Kafka topics: booking-requests (30 partitions each)
✅ Created Kafka topics: payment-intent-requests (10 partitions each)
✅ All 8 Kafka consumers started successfully
✅ Payment Intent consumers started successfully
Server running on port 3001
Kafka mode: kafka
```

**If you see errors:**

- **Redis connection failed**: Check `docker-compose ps` - Redis should be running
- **Kafka connection failed**: Check Kafka container is running
- **Stripe errors**: Run `npm run test:stripe` to verify keys

---

## Step 7: Test the Integration

### Test 1: Create a Booking

```bash
curl -X POST http://localhost:3001/api/bookings \
  -H "Content-Type: application/json" \
  -d '{"seat_ids": ["seat1", "seat2", "seat3"]}'
```

**Expected response:**

```json
{
  "message": "Booking request queued for processing",
  "request_id": "some-uuid",
  "note": "Check booking status using GET /api/bookings/:id after processing"
}
```

### Test 2: Check Booking Status

Wait a few seconds, then:

```bash
# Get all bookings
curl http://localhost:3001/api/bookings

# Or get specific booking (use booking_id from above)
curl http://localhost:3001/api/bookings/:booking_id
```

**Expected response:**

```json
{
  "id": "booking-uuid",
  "seat_ids": ["seat1", "seat2", "seat3"],
  "status": "pending",
  "total_amount": 300,
  "payment_intent_id": "pi_xxx",
  "client_secret": "pi_xxx_secret_yyy",
  "created_at": "2024-..."
}
```

**What to check:**

- ✅ `status`: "pending"
- ✅ `payment_intent_id`: Should exist (starts with `pi_`)
- ✅ `client_secret`: Should exist (for frontend payment)

---

## Step 8: Test Webhook (Optional - Later)

### Install Stripe CLI

**Linux/Mac:**

```bash
brew install stripe/stripe-cli/stripe
```

**Or download:** https://stripe.com/docs/stripe-cli

### Login to Stripe CLI

```bash
stripe login
```

### Forward Webhooks to Your Server

```bash
stripe listen --forward-to localhost:3001/api/payments/webhook
```

**Expected output:**

```
> Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxx
```

### Add Webhook Secret to .env

Copy the `whsec_...` value and add to `.env`:

```env
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

### Test Payment

Use Stripe test card in your frontend:

- **Card**: `4242 4242 4242 4242`
- **Expiry**: Any future date (e.g., `12/25`)
- **CVC**: Any 3 digits (e.g., `123`)

When payment succeeds, you should see:

- Booking status changes to `"confirmed"` in Redis
- Seats moved to `booked_seats`
- Webhook logs in terminal

---

## Troubleshooting

### Issue: Docker services won't start

**Solution:**

```bash
# Check if Docker Desktop is running
docker ps

# Restart services
docker-compose down
docker-compose up -d
```

### Issue: Redis connection failed

**Solution:**

```bash
# Check Redis is running
docker-compose ps

# Check Redis port (should be 6380)
docker-compose logs redis

# Restart Redis
docker-compose restart redis
```

### Issue: Kafka connection failed

**Solution:**

```bash
# Check Kafka is running
docker-compose ps

# Check Kafka logs
docker-compose logs kafka

# Restart Kafka
docker-compose restart kafka
```

### Issue: Stripe keys not working

**Solution:**

1. Verify keys in `.env` are correct
2. Make sure you're using **test mode** keys (start with `sk_test_` and `pk_test_`)
3. Run `npm run test:stripe` to verify
4. Check `.env` file is in project root (not in `backend/` folder)

### Issue: Payment Intent not created

**Solution:**

1. Check server logs for errors
2. Verify `KAFKA_MODE=kafka` in `.env` (or use default)
3. Check Kafka consumers are running (should see logs in terminal)
4. Verify Stripe keys are set correctly

---

## Quick Reference

| Command                 | Purpose                 |
| ----------------------- | ----------------------- |
| `docker-compose up -d`  | Start all services      |
| `docker-compose ps`     | Check service status    |
| `docker-compose down`   | Stop all services       |
| `npm run seed:redis`    | Seed Redis with seats   |
| `npm run test:stripe`   | Verify Stripe config    |
| `npm run dev`           | Start server (dev mode) |
| `npm run start:pm2:dev` | Start server (PM2 mode) |

---

## Next Steps

After setup is complete:

1. ✅ Test booking creation
2. ✅ Verify Payment Intent creation
3. ✅ Test webhook (optional)
4. ✅ Integrate with frontend
5. ✅ Use `client_secret` in frontend for payment

---

## Summary Checklist

- [ ] Docker services running (Redis, Kafka, Zookeeper)
- [ ] Redis seeded with seats
- [ ] Stripe keys added to `.env`
- [ ] Stripe configuration verified (`npm run test:stripe`)
- [ ] Server started successfully
- [ ] Booking creation tested
- [ ] Payment Intent creation verified
- [ ] Webhook secret added (optional)

---

**You're all set! 🎉**
