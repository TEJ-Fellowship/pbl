# **Scaling Task Division - Post Mentor Feedback**

## **Mentor's Key Advice**

- Focus on scaling the booking system (core functionality)
- Skip intermediate user flow steps (user creation, movie selection, etc.)
- Use Redis as primary storage for bookings
- Use Docker for local Redis development
- Consider Kafka for request queueing (if time permits)
- Research how real systems handle payments (timing, cart vs immediate payment)

**Current Approach:** Seat-only booking, Redis-first storage, load testing ready

---

## **COMPLETED WORK**

### **Swikar ✅**

**Redis Implementation**

- Redis primary storage for bookings/payments
- Distributed locking (prevents double-bookings)
- Redis SETs for seat tracking (`available_seats`, `booked_seats`)
- Status sets (`booking:pending`, `booking:confirmed`)

**Infrastructure**

- Docker Redis setup
- Redis seeding script
- Environment configuration (local vs cloud)

**Load Testing**

- Artillery configuration
- Dynamic seat ID generation
- Test scenarios (booking-only + booking+payment)
- Performance metrics analysis

**Code Files**

- `bookingsController.js` - Redis-first booking
- `paymentsController.js` - Redis-first payment
- `redisLock.js` - Distributed locking
- `seedRedis.js` - Redis seeding
- `artillery-processor.js` - Test data generation
- `load-test.yml` - Load test config

**Performance**

- 10,000+ concurrent requests handled
- ~16ms avg response time (normal), ~300ms (peak)
- 8,100+ conflicts prevented

---

## **REMAINING TASKS**

### **Swikar**

**Phase 1: Kafka Integration (Priority)** ✅

- Docker Kafka setup
- Kafka producer for booking requests
- Kafka consumer for booking processing
- Queue management during traffic spikes
- Load testing with Kafka

**Phase 2: Redis Optimization**

- Connection pooling
- Pipeline operations for batch writes
- Memory usage monitoring
- Performance tuning

**Phase 3: Documentation**

- Redis data structures documentation
- Architecture diagrams
- Load testing procedures

---

### **Mahesh**

**Phase 1: Payment Research & Implementation**

- Research real-world payment handling:
  - Immediate payment vs cart/later payment
  - Payment timing between booking and confirmation
  - Idempotency handling
  - Payment retry mechanisms
  - Refund/cancellation flows
- Implement payment strategy based on research
- Payment status management
- Payment failure handling

**Phase 2: Data Persistence (If Needed)**

- Async sync from Redis to PostgreSQL
- Background job for data persistence
- Sync failure handling and retries
- Data consistency checks

**Phase 3: API & Testing**

- Input validation for booking/payment endpoints
- Error handling improvements
- Rate limiting middleware
- Integration tests for Redis operations
- Concurrent booking test scenarios
- Failure scenario testing (Redis down, etc.)

**Phase 4: Monitoring**

- Redis operation logging
- Booking success/failure rate tracking
- Lock acquisition monitoring
- Health check endpoints

---

## **PRIORITY TIMELINE**

### **Week 1: Core Scaling**

- **Swikar:** Kafka integration
- **Mahesh:** Payment research + implementation

### **Week 2: Optimization**

- **Swikar:** Redis optimization
- **Mahesh:** Data persistence + API enhancements

### **Week 3: Polish**

- **Swikar:** Documentation
- **Mahesh:** Testing + Monitoring

---

## **CURRENT STATUS**

**✅ Working:**

- Redis-first booking/payment
- Distributed locking
- Seat availability tracking
- Load testing infrastructure

**📊 Metrics:**

- Throughput: 10,000+ requests
- Response: ~16ms avg, ~300ms peak
- Conflicts prevented: 8,100+
- Success rate: 0 failed VUs

**🔧 Stack:**

- Primary Storage: Redis
- Locking: Redis distributed locks
- Load Testing: Artillery
- Container: Docker Redis

---

## **IMMEDIATE NEXT STEPS**

1. **Swikar:** Start Kafka Docker setup
2. **Mahesh:** Begin payment handling research
3. **Both:** Sync on payment strategy after research

---

**Last Updated:** Post mentor feedback  
**Status:** Redis complete, Kafka + Payment research pending
