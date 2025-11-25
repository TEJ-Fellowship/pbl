# Seat-Only Redis API (Load Testing)

Simplified Redis-only booking system for load testing and scaling.

## Setup

1. **Start Redis:**
   ```bash
   sudo docker run -d --name movie-booking-redis -p 6379:6379 redis:7-alpine
   ```

2. **Seed Redis with dummy seats:**
   ```bash
   node backend/scripts/seedRedis.js
   ```
   This creates 1000 seats (seat1, seat2, ..., seat1000)

## API Endpoints

### 1. Create Booking
```http
POST /api/bookings
Content-Type: application/json

{
  "seat_ids": ["seat1", "seat2", "seat3"]
}
```

**Response:**
```json
{
  "id": "booking-uuid",
  "seat_ids": ["seat1", "seat2", "seat3"],
  "status": "pending",
  "total_amount": 300,
  "created_at": "2024-01-01T00:00:00.000Z"
}
```

### 2. Get Booking
```http
GET /api/bookings/:id
```

### 3. Process Payment
```http
POST /api/payments/process
Content-Type: application/json

{
  "booking_id": "booking-uuid",
  "amount": 300,
  "payment_method": "credit_card",
  "idempotency_key": "optional-unique-key"
}
```

**Response:**
```json
{
  "payment_id": "payment-uuid",
  "booking_id": "booking-uuid",
  "amount": 300,
  "status": "success",
  "transaction_id": "txn_...",
  "receipt": {
    "booking_id": "booking-uuid",
    "seats": ["seat1", "seat2", "seat3"],
    "total_amount": 300,
    "confirmed_at": "2024-01-01T00:00:00.000Z"
  }
}
```

### 4. Get All Bookings (for testing)
```http
GET /api/bookings
```

### 5. Cancel Booking
```http
DELETE /api/bookings/:id
```

## Redis Data Structure

- `available_seats` → SET of available seat IDs
- `booked_seats` → SET of booked seat IDs
- `booking:{id}` → Booking data (JSON, TTL: 5min pending, 1hr confirmed)
- `booking:pending` → SET of pending booking IDs
- `booking:confirmed` → SET of confirmed booking IDs
- `lock:seat:{id}` → Lock tokens (TTL: 5min)
- `payment:{id}` → Payment data (JSON, TTL: 1hr)

## Flow

1. **Booking:** User sends seat_ids → Redis checks availability → Locks acquired → Booking created → Response
2. **Payment:** User sends booking_id → Redis updates status → Seats moved to booked → Locks released → Response
3. **Cancel:** User cancels → Locks released → Booking deleted → Seats back to available

## Load Testing

Perfect for load testing:
- No PostgreSQL queries (all Redis)
- Fast responses (< 50ms)
- Handles high concurrency
- Simple API (just seat_ids)

