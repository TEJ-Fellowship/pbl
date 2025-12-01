# Kafka Payment System Setup Guide

This document describes the Kafka-based asynchronous payment processing system implemented for the e-commerce application.

## Overview

The payment system uses Kafka as a message queue to decouple payment processing from the checkout flow, enabling:
- **Fast checkout responses** (202 Accepted) - users don't wait for payment processing
- **Reliable payment processing** - messages persist in Kafka even if workers are down
- **Horizontal scalability** - multiple payment workers can process payments concurrently
- **Optimized for 1K users daily** - configured with appropriate partitions and consumer groups

## Architecture

```
┌─────────────┐
│   Frontend  │
└──────┬──────┘
       │ POST /checkout
       ▼
┌─────────────────┐      ┌──────────┐      ┌──────────────────┐
│  Order Service  │─────▶│  Kafka   │─────▶│ Payment Worker   │
│  (Producer)     │      │ (Queue)  │      │   (Consumer)     │
└─────────────────┘      └──────────┘      └──────────────────┘
       │                                          │
       │ 202 Accepted                             │
       │ + correlationId                           │ Process Payment
       │                                          │ Update Redis
       ▼                                          ▼
┌─────────────┐                          ┌─────────────┐
│   Redis     │◀─────────────────────────│  Database   │
│ (Status)    │                          │  (Orders)   │
└─────────────┘                          └─────────────┘
```

## Setup Instructions

### 1. Start Kafka with Docker Compose

```bash
cd /home/ganesh/project/pbl/PBL5/6_E-commerce_Orders
docker compose up -d
```

This will start:
- Redis (port 6379)
- RedisInsight (port 8001)
- Kafka (port 9092) - KRaft mode (no ZooKeeper needed)

### 2. Verify Kafka is Running

```bash
# Check Kafka container
docker ps | grep kafka

# Check Kafka logs
docker logs kafka

# List Kafka topics (inside container)
docker exec -it kafka bash -c "kafka-topics --bootstrap-server localhost:9092 --list"
```

### 3. Start Backend Services

The backend automatically starts the payment worker when the main server starts. Alternatively, you can run them separately:

```bash
# Terminal 1: Main API server
cd backend
npm start

# Terminal 2: Payment worker (optional - runs automatically with main server)
npm run start:worker
```

### 4. Start Frontend

```bash
cd frontend
npm run dev
```

## Configuration

### Kafka Configuration (docker-compose.yml)

- **Partitions**: 3 (allows up to 3 concurrent payment workers)
- **Replication Factor**: 1 (single-node setup for development)
- **Retention**: 7 days
- **Compression**: GZIP

### Payment Worker Configuration

- **Consumer Group**: `payment-workers-group`
- **Max In-Flight Requests**: 5 per partition
- **Session Timeout**: 30 seconds
- **Heartbeat Interval**: 3 seconds

### Redis Payment Status

Payment status is stored in Redis with the key pattern: `payment:{correlationId}`

- **TTL**: 24 hours for successful payments, 7 days for failed payments
- **Status values**: `pending`, `processing`, `succeeded`, `failed`

## API Endpoints

### POST /api/orders/checkout

Creates an order and queues payment for processing.

**Request:**
```json
{
  "shippingAddress": {
    "name": "John Doe",
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "USA"
  },
  "paymentMethod": "simulated"
}
```

**Response (202 Accepted):**
```json
{
  "success": true,
  "message": "Order created, payment processing",
  "order": {
    "id": "order-uuid",
    "total_amount": "99.99",
    "status": "pending",
    "payment_status": "pending",
    "items": 2
  },
  "payment": {
    "correlationId": "correlation-uuid",
    "status": "pending"
  }
}
```

### GET /api/orders/payment-status/:correlationId

Get the current status of a payment.

**Response:**
```json
{
  "success": true,
  "payment": {
    "correlationId": "correlation-uuid",
    "status": "succeeded",
    "orderId": "order-uuid",
    "amount": "99.99",
    "transactionId": "txn_xxx",
    "processedAt": "2024-01-01T12:00:00.000Z"
  }
}
```

## Payment Flow

1. **User clicks checkout** → Frontend sends POST /checkout
2. **Order created** → Order saved to database with `pending` status
3. **Payment queued** → Payment request published to Kafka topic `payments`
4. **Immediate response** → Backend returns 202 Accepted with `correlationId`
5. **Frontend polls** → Frontend polls `/payment-status/:correlationId` every 2 seconds
6. **Payment worker** → Consumer picks up message from Kafka
7. **Payment processed** → Worker calls payment gateway (simulated)
8. **Status updated** → Worker updates Redis and database
9. **Frontend notified** → Polling detects status change, navigates to order page

## Scaling for 1K Users

The system is optimized to handle 1K users daily with the following configurations:

### Kafka
- **3 partitions** - allows 3 concurrent payment workers
- **GZIP compression** - reduces network overhead
- **7-day retention** - sufficient for debugging and replay

### Payment Workers
- **Consumer group** - enables horizontal scaling
- **Max 5 in-flight requests** - balances throughput and memory
- **Idempotent processing** - safe to retry on failures

### Redis
- **Connection pooling** - handles concurrent requests efficiently
- **TTL on payment status** - prevents memory bloat

### Database
- **Connection pool** - max 100 connections for primary DB
- **Transaction isolation** - ensures data consistency

## Monitoring

### Check Payment Worker Status

```bash
# View payment worker logs
docker logs -f <backend-container>

# Or if running directly
# Check console output for payment processing messages
```

### Check Kafka Consumer Lag

```bash
docker exec -it kafka bash -c "kafka-consumer-groups --bootstrap-server localhost:9092 --group payment-workers-group --describe"
```

### Check Redis Payment Status

```bash
# Connect to Redis
docker exec -it redis-cache redis-cli

# List all payment keys
KEYS payment:*

# Get specific payment status
HGETALL payment:{correlationId}
```

## Troubleshooting

### Kafka Not Starting

```bash
# Check Kafka logs
docker logs kafka

# Restart Kafka
docker compose restart kafka

# Check if port 9092 is available
netstat -tuln | grep 9092
```

### Payment Worker Not Processing

1. Check if Kafka is running: `docker ps | grep kafka`
2. Check if topic exists: `docker exec -it kafka bash -c "kafka-topics --bootstrap-server localhost:9092 --list"`
3. Check payment worker logs for errors
4. Verify Redis connection

### Payments Stuck in Pending

1. Check payment worker is running
2. Check Kafka consumer lag
3. Check payment worker logs for errors
4. Manually process stuck payments (if needed)

## Production Considerations

For production deployment:

1. **Multi-broker Kafka cluster** - for high availability
2. **TLS encryption** - secure Kafka communication
3. **ACLs** - access control for Kafka topics
4. **Dead Letter Queue (DLQ)** - handle failed payments
5. **Monitoring** - Prometheus + Grafana for metrics
6. **Idempotency keys** - for payment gateway calls
7. **Retry logic** - exponential backoff for transient failures
8. **Circuit breakers** - prevent cascading failures

## Testing

### Manual Test

1. Add items to cart
2. Go to checkout
3. Fill shipping address
4. Complete order
5. Observe payment status polling
6. Verify order appears after payment succeeds

### Load Test

Use k6 to test with 1K concurrent users:

```bash
cd k6
k6 run load-test.js
```

## References

- [Kafka Documentation](https://kafka.apache.org/documentation/)
- [kafkajs Documentation](https://kafka.js.org/)
- [KRaft Mode](https://kafka.apache.org/documentation/#kraft)

