# System Workflow Analysis - Simple Summary

## E-commerce Order Processing System

**Target:** 1,000 Concurrent Users  
**Technologies:** Express.js, PostgreSQL, Redis, Kafka, Docker, React

---

## 📋 What Happens in the System (Simple Terms)

### 1. User Adds Items to Cart

- Frontend stores cart in **Redis** (key: `cart:{sessionId}`)
- If Redis fails, uses in-memory fallback
- Cart persists for 7 days

### 2. User Clicks "Checkout"

- Frontend sends order request to backend
- Backend does these steps **in order**:

#### Step 1: Get Cart from Redis

- Reads all items user added to cart

#### Step 2: Check Product Availability

- Queries database to verify products exist
- Checks if enough stock available
- Formula: `available = quantity - reserved_quantity`

#### Step 3: Sync Inventory to Redis Cache

- ⚠️ **PROBLEM:** This step has a race condition!
- Reads inventory from database
- Writes to Redis cache (`inventory:{productId}`)
- **Issue:** Two users can sync at same time, causing conflicts

#### Step 4: Reserve Inventory (Atomic)

- Uses **Lua script** in Redis (this is atomic - safe!)
- Decrements available inventory
- Tracks which order reserved what
- **If fails:** Releases any already reserved items

#### Step 5: Create Order in Database

- Creates order record (status: "pending")
- Creates order items
- Updates inventory in database
- Creates payment record (status: "pending")
- **Commits transaction** ✅

#### Step 6: Store Payment Info in Redis

- Stores payment status for quick access
- Key: `payment:{correlationId}`
- TTL: 24 hours

#### Step 7: Send to Kafka Queue

- Publishes payment request to Kafka topic "payments"
- **Fire-and-forget** (doesn't wait for result)
- If Kafka fails, rollback happens in background

#### Step 8: Return Response to User

- Returns **202 Accepted** (payment not done yet!)
- User sees "Payment Processing..."

---

### 3. Payment Processing (Background)

#### Payment Worker (Kafka Consumer)

- Listens to Kafka topic "payments"
- When message arrives:

1. **Parse Message**

   - Gets orderId, amount, correlationId

2. **Update Status to "processing"**

   - Updates Redis: `payment:{correlationId}` → status="processing"

3. **Start Database Transaction**

4. **Call Payment Gateway**

   - Simulated payment (1-3 second delay)
   - 95% success rate
   - ⚠️ **PROBLEM:** No check if already processed (duplicate risk!)

5. **If Payment Succeeds:**

   - Update order: status="confirmed"
   - Update payment: status="succeeded"
   - Update Redis: status="succeeded"
   - Commit transaction
   - ⚠️ **PROBLEM:** Offset auto-committed (might lose message on crash!)

6. **If Payment Fails:**
   - Rollback transaction
   - Release inventory (Redis + Database)
   - Update order: status="cancelled"
   - Update Redis: status="failed"
   - ⚠️ **PROBLEM:** Offset still committed (message lost!)

---

### 4. User Polls for Payment Status

- Frontend polls every **2 seconds**
- GET `/api/orders/payment-status/:correlationId`
- Backend reads from Redis
- ⚠️ **PROBLEM:** 1K users = 500 requests/second just for status!

- If status = "succeeded" → Navigate to order page
- If status = "failed" → Show error
- If timeout (60 seconds) → Navigate anyway

---

## 🔴 Root Causes of Payment System Issues

### Issue #1: No Idempotency Check

**What it means:** Same payment can be processed twice

**Why it happens:**

- Payment worker doesn't check if payment already processed
- If Kafka consumer crashes and restarts, processes same message again
- No idempotency key sent to payment gateway

**Impact:**

- Duplicate charges
- Inventory released twice
- Data inconsistency

**Fix:** Check Redis before processing: `if status === 'succeeded', skip`

---

### Issue #2: Kafka Offset Auto-Commit

**What it means:** Kafka marks message as "done" even if processing fails

**Why it happens:**

- KafkaJS auto-commits offsets every 5 seconds
- If payment fails, offset already committed
- Message lost, no retry

**Impact:**

- Failed payments never retried
- Messages lost on crash
- No guarantee of delivery

**Fix:** Disable auto-commit, manually commit only after success

---

### Issue #3: No Dead Letter Queue

**What it means:** Failed payments are just logged, not stored

**Why it happens:**

- Errors are logged but not saved
- No way to retry later
- No way to investigate

**Impact:**

- Lost revenue
- No visibility
- Cannot recover

**Fix:** Send failed messages to DLQ topic for later processing

---

### Issue #4: Transaction Timeout

**What it means:** Long payment gateway calls can timeout database transaction

**Why it happens:**

- Payment gateway takes 1-3 seconds
- Database transaction timeout: 30 seconds
- If gateway is slow, transaction times out

**Impact:**

- Inventory stuck
- Orders stuck
- Manual fix needed

**Fix:** Increase timeout or handle timeout gracefully

---

### Issue #5: No Circuit Breaker

**What it means:** Keeps calling payment gateway even when it's down

**Why it happens:**

- No circuit breaker pattern
- Every request fails when gateway is down
- Wastes resources

**Impact:**

- All payments fail
- High latency
- Poor user experience

**Fix:** Add circuit breaker (stop calling after X failures)

---

## 🔴 Root Causes of Kafka Queuing Issues

### Issue #1: Auto-Commit Offsets

**What it means:** Kafka marks messages as "done" automatically

**Why it happens:**

- Default behavior in KafkaJS
- Commits every 5 seconds
- Doesn't wait for processing to finish

**Impact:**

- Message loss
- Message duplication
- No control

**Fix:** Manual commit after successful processing

---

### Issue #2: No Consumer Lag Monitoring

**What it means:** Don't know if payments are backing up

**Why it happens:**

- No monitoring tools
- No metrics
- No alerts

**Impact:**

- Payments delayed
- System overload
- Poor experience

**Fix:** Add Prometheus + Grafana for monitoring

---

### Issue #3: Single Kafka Broker

**What it means:** Only one Kafka server (no backup)

**Why it happens:**

- docker-compose.yml has only one Kafka service
- No high availability
- Single point of failure

**Impact:**

- System down if Kafka crashes
- No redundancy
- Cannot scale

**Fix:** Add multiple Kafka brokers (cluster)

---

### Issue #4: No Retry Mechanism

**What it means:** Failed messages are lost, not retried

**Why it happens:**

- Errors are logged but not retried
- No retry logic
- No exponential backoff

**Impact:**

- Transient failures cause permanent loss
- Poor reliability

**Fix:** Add retry with exponential backoff, send to DLQ after max retries

---

## ❌ What's Missing for 1K Users

### 1. Frontend Polling Overhead

- **Problem:** 1K users polling every 2 seconds = 500 requests/second
- **Fix:** Use WebSocket or Server-Sent Events (SSE) for real-time updates

### 2. No Rate Limiting

- **Problem:** Users can spam requests, overload system
- **Fix:** Add rate limiting middleware (100 requests/minute per IP)

### 3. Database Connection Pool Too Small

- **Problem:** 100 connections might not be enough for 1K users
- **Fix:** Increase to 200, add connection pool monitoring

### 4. No Load Balancing

- **Problem:** Single backend instance, cannot scale
- **Fix:** Add load balancer (nginx), multiple backend instances

### 5. Redis Single Instance

- **Problem:** No high availability, single point of failure
- **Fix:** Redis cluster or sentinel for failover

### 6. No Monitoring

- **Problem:** Cannot detect issues, no visibility
- **Fix:** Prometheus + Grafana for metrics and alerts

### 7. No Health Checks

- **Problem:** Cannot detect if system is healthy
- **Fix:** Health check endpoint for load balancer

### 8. No Caching Strategy

- **Problem:** Products not cached, high database load
- **Fix:** Cache product listings, invalidate on updates

---

## ✅ Quick Fixes (Do These First)

### 1. Add Idempotency Check

```javascript
// Check if already processed before calling payment gateway
const existingStatus = await redisClient.hget(
  `payment:${correlationId}`,
  "status"
);
if (existingStatus === "succeeded") {
  return; // Skip, already done
}
```

### 2. Manual Offset Commit

```javascript
// Disable auto-commit
const consumer = kafka.consumer({
  groupId: CONSUMER_GROUP_ID,
  autoCommit: false, // ✅
});

// Commit only after success
await processPayment(paymentData);
await consumer.commitOffsets([{ topic, partition, offset }]);
```

### 3. Add Dead Letter Queue

```javascript
// Send failed messages to DLQ
catch (error) {
  await producer.send({
    topic: 'payments-dlq',
    messages: [{ key: orderId, value: JSON.stringify({...paymentData, error}) }]
  });
}
```

### 4. Fix Frontend Polling

```javascript
// Use exponential backoff instead of fixed 2 seconds
const delay = Math.min(2000 * Math.pow(1.5, attempt), 10000);
// Or use WebSocket for real-time updates
```

### 5. Add Rate Limiting

```javascript
const rateLimit = require("express-rate-limit");
app.use("/api", rateLimit({ windowMs: 60000, max: 100 }));
```

---

## 📊 System Capacity Analysis

### Current Capacity:

- **Database:** 100 connections (primary), 50 per replica
- **Kafka:** 3 partitions (can handle ~3 concurrent workers)
- **Redis:** Single instance, no connection pool
- **Backend:** Single instance, no load balancing

### For 1K Users:

- **Needed:** ~200 database connections
- **Needed:** Load balancer + 2-3 backend instances
- **Needed:** Kafka cluster (3 brokers)
- **Needed:** Redis cluster or sentinel
- **Needed:** Monitoring and alerting

---

## 🎯 Priority Actions

### Critical (Do Now):

1. ✅ Add idempotency check
2. ✅ Manual offset commit
3. ✅ Dead Letter Queue
4. ✅ Fix frontend polling

### High Priority (This Week):

1. ✅ Rate limiting
2. ✅ Health checks
3. ✅ Increase connection pools
4. ✅ Add circuit breaker

### Medium Priority (This Month):

1. ✅ Monitoring (Prometheus + Grafana)
2. ✅ WebSocket for real-time updates
3. ✅ Kafka cluster
4. ✅ Load balancer

---

## 📝 Summary

**Current State:**

- ✅ Good foundation with Kafka, Redis, Docker
- ⚠️ Missing critical production features
- ⚠️ Not ready for 1K users without fixes

**Main Issues:**

1. Payment system can process duplicates
2. Kafka messages can be lost
3. No retry mechanism
4. Frontend polling too aggressive
5. No monitoring or alerting

**Next Steps:**

1. Implement critical fixes (idempotency, offset commit, DLQ)
2. Add rate limiting and health checks
3. Set up monitoring
4. Test with load testing
5. Gradually scale infrastructure

---

**Status:** System works but needs fixes for production at 1K user scale.
