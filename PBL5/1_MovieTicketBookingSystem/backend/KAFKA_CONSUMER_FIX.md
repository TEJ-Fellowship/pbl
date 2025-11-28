# Kafka Consumer Fixes

## Issues Found & Fixed

### 1. **Pipeline Result Parsing** ✅ FIXED

- **Issue**: Pipeline results weren't being parsed correctly
- **Fix**: Added proper error handling and result format checking
- **Location**: `backend/services/kafkaConsumer.js` lines 46-75

### 2. **Consumer Message Processing** ✅ FIXED

- **Issue**: Consumer was reading messages but not processing them correctly
- **Fix**: Added detailed logging and error handling
- **Location**: `backend/services/kafkaConsumer.js` lines 204-260

### 3. **Consumer Group Offset** ⚠️ NEEDS RESET

- **Issue**: Consumer group has consumed all messages (LAG = 0) but bookings weren't created
- **Solution**: Reset consumer group to reprocess messages OR test with new messages

## Testing Steps

### Step 1: Reset Consumer Group (if needed)

```bash
# Reset consumer group to reprocess old messages
node backend/scripts/resetConsumerGroup.js
```

### Step 2: Ensure Services Are Running

```bash
# Check Docker services
docker ps | grep -E "kafka|redis|zookeeper"

# Should see:
# - movie-booking-kafka
# - movie-booking-redis
# - movie-booking-zookeeper
```

### Step 3: Start Backend Server

```bash
cd backend
npm run dev
```

**Expected output:**

```
✅ Kafka producer connected
✅ Kafka consumer connected (group: booking-processor-group)
✅ Subscribed to Kafka topic: booking-requests
🔄 Starting message consumption...
✅ Kafka booking consumer started and running
```

### Step 4: Test with Single Request

```bash
# Send a test booking request
curl -X POST http://localhost:3001/api/bookings \
  -H "Content-Type: application/json" \
  -d '{"seat_ids":["seat1","seat2"]}'

# Should return 202 Accepted (queued)
```

**Check server logs** - you should see:

```
📨 Processing message: ... (partition: X, offset: Y)
🔄 Processing booking request: { request_id: ..., seat_ids: [...] }
✅ Booking <id> created successfully
✅ Booking <id> processed in Xms
```

### Step 5: Verify Booking Was Created

```bash
# Check available seats decreased
docker exec movie-booking-redis redis-cli SCARD available_seats
# Should be less than 150000

# Check booking exists
docker exec movie-booking-redis redis-cli KEYS "booking:*" | head -5
```

### Step 6: Run Quick Load Test

```bash
cd backend
npx artillery run load-test.yml
```

**Expected:**

- Test completes in ~30 seconds
- Console shows bookings being processed
- Available seats decrease

## Key Changes Made

1. **Better Pipeline Result Parsing**

   - Handles Redis v5 result format: `[[error, result], ...]`
   - Proper error checking for each seat check

2. **Enhanced Logging**

   - Logs every message received
   - Logs booking processing steps
   - Shows processing time
   - Logs errors with full context

3. **Error Handling**

   - Catches and logs all errors
   - Continues processing even if one message fails
   - Shows detailed error messages

4. **Consumer Configuration**
   - `fromBeginning: false` - only process NEW messages
   - Better consumer settings for performance

## Troubleshooting

### Consumer Not Processing Messages

**Check consumer group status:**

```bash
docker exec movie-booking-kafka kafka-consumer-groups \
  --bootstrap-server localhost:9092 \
  --group booking-processor-group \
  --describe
```

**If LAG > 0 but no processing:**

- Check server logs for errors
- Verify Redis is connected
- Check if consumer is actually running

### Messages Queued But Not Processed

**Reset consumer group:**

```bash
node backend/scripts/resetConsumerGroup.js
```

**Or use a new consumer group:**

- Change `KAFKA_GROUP_ID` in `.env` to a new value
- Restart server

### No Bookings Created

**Check:**

1. Are messages being received? (check logs)
2. Are seats available? (check Redis)
3. Are there errors in processing? (check logs)
4. Is Redis connected? (check logs)

## Next Steps

Once verified working:

1. Re-enable batch processing for better performance
2. Add consumer lag monitoring
3. Add retry logic for failed messages
4. Add Dead Letter Queue (DLQ) for permanently failed messages
