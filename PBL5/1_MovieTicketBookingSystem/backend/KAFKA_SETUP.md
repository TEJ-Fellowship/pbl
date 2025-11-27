# Kafka Integration Setup Guide

## Overview

Kafka integration allows booking requests to be queued and processed asynchronously, improving system scalability during traffic spikes.

## Architecture

```
Client Request → API Endpoint → Kafka Producer → Kafka Topic
                                                    ↓
                                            Kafka Consumer → Redis (Booking Processing)
```

## Setup Steps

### 1. Start Kafka Services

```bash
# Start Redis, Kafka, and Zookeeper
docker-compose up -d

# Verify services are running
docker ps
```

### 2. Environment Configuration

Add to your `.env` file:

```env
# Kafka Configuration
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=movie-booking-service
KAFKA_GROUP_ID=booking-processor-group
KAFKA_TOPIC_BOOKINGS=booking-requests

# Kafka Mode: 'direct' (immediate processing) or 'kafka' (queue via Kafka)
KAFKA_MODE=kafka
```

### 3. Modes

#### Direct Mode (Default)

- Bookings are processed immediately
- Synchronous response
- Set `KAFKA_MODE=direct` or omit the variable

#### Kafka Mode

- Bookings are queued to Kafka
- Asynchronous processing
- Returns `202 Accepted` immediately
- Set `KAFKA_MODE=kafka`

## Usage

### Direct Mode (Immediate Processing)

```bash
# Set mode
export KAFKA_MODE=direct

# Start server
npm run dev

# Create booking (processed immediately)
curl -X POST http://localhost:3001/api/bookings \
  -H "Content-Type: application/json" \
  -d '{"seat_ids": ["seat1", "seat2"]}'
```

### Kafka Mode (Queued Processing)

```bash
# Set mode
export KAFKA_MODE=kafka

# Start server (consumer starts automatically)
npm run dev

# Create booking (queued to Kafka)
curl -X POST http://localhost:3001/api/bookings \
  -H "Content-Type: application/json" \
  -d '{"seat_ids": ["seat1", "seat2"]}'

# Response: 202 Accepted with request_id
# Check booking status:
curl http://localhost:3001/api/bookings/{booking_id}
```

## Testing

### 1. Test Kafka Connection

```bash
# Check if Kafka is running
docker exec -it movie-booking-kafka kafka-topics --bootstrap-server localhost:9092 --list
```

### 2. Monitor Kafka Messages

```bash
# Consume messages from topic (for debugging)
docker exec -it movie-booking-kafka kafka-console-consumer \
  --bootstrap-server localhost:9092 \
  --topic booking-requests \
  --from-beginning
```

### 3. Load Testing with Kafka

```bash
# Set Kafka mode
export KAFKA_MODE=kafka

# Start server
npm run dev

# Run load test
npm run load-test
```

## Kafka Topics

- **booking-requests**: Queue for booking requests
  - Partitions: 3 (configurable)
  - Replication: 1 (single broker for local dev)

## Consumer Behavior

- Automatically starts when `KAFKA_MODE=kafka`
- Processes messages from `booking-requests` topic
- Handles failures gracefully (logs errors, continues processing)
- Idempotent processing (uses request_id)

## Troubleshooting

### Kafka Not Starting

```bash
# Check logs
docker logs movie-booking-kafka
docker logs movie-booking-zookeeper

# Restart services
docker-compose restart kafka zookeeper
```

### Consumer Not Processing

- Check server logs for consumer connection errors
- Verify `KAFKA_MODE=kafka` is set
- Check if topic exists: `docker exec -it movie-booking-kafka kafka-topics --bootstrap-server localhost:9092 --list`

### Messages Not Being Consumed

- Check consumer group status
- Verify Redis is running and connected
- Check server logs for processing errors

## Performance Benefits

- **Traffic Spikes**: Queue absorbs sudden load increases
- **Decoupling**: API responds immediately, processing happens async
- **Scalability**: Can run multiple consumers for parallel processing
- **Reliability**: Messages persist in Kafka, can replay on failure

## Next Steps

1. Add Dead Letter Queue (DLQ) for failed messages
2. Implement consumer scaling (multiple consumer instances)
3. Add monitoring/metrics for Kafka operations
4. Implement message retry logic with exponential backoff
