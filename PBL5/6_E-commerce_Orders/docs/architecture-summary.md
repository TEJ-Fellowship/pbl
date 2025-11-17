# Architecture Summary - Tier-1 E-commerce Order Processing System

## System Overview

This document provides a comprehensive overview of the Tier-1 implementation of the E-commerce Order Processing System, designed to handle 1,000 daily users with a scalable architecture that can grow to support 1M+ users.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Clients                               │
│                   (Web/Mobile Browsers)                       │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                    NGINX Load Balancer                      │
│  - Round-robin / Least connections                           │
│  - Health checks (5s interval)                              │
│  - Rate limiting (100 req/min API, 10 req/min checkout)     │
│  - SSL termination (production)                            │
└──────────────────────────┬──────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ↓                  ↓                  ↓
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Node Server 1│  │ Node Server 2│  │ Node Server 3│
│  Port 3001   │  │  Port 3002  │  │  Port 3003  │
│  (Current)   │  │  (Future)   │  │  (Future)   │
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       │                 │                  │
       └─────────────────┼──────────────────┘
                         │
              ┌──────────┴──────────┐
              │                     │
              ↓                     ↓
      ┌──────────────┐      ┌──────────────┐
      │    Redis     │      │   Kafka      │
      │   (Cache)    │      │  (Queue)     │
      │              │      │  (Future)    │
      └──────┬───────┘      └──────────────┘
             │
             ↓
┌─────────────────────────────────────────────────────────────┐
│              PostgreSQL Database Cluster                     │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  PRIMARY DB (Write Source of Truth)                 │    │
│  │  - All CREATE, UPDATE, DELETE operations            │    │
│  │  - Products, Categories, Inventory, Orders           │    │
│  └──────────────┬──────────────────────────────────────┘    │
│                 │                                            │
│     ┌───────────┴───────────┐                              │
│     │                         │                              │
│     ↓                         ↓                              │
│  ┌──────────┐          ┌──────────┐                       │
│  │ REPLICA 1│          │ REPLICA 2│                       │
│  │  (Read)  │          │  (Read)  │                       │
│  │ Round-   │          │ Round-   │                       │
│  │ robin    │          │ robin    │                       │
│  └──────────┘          └──────────┘                       │
│                                                               │
│  Sync: PostgreSQL Logical Replication (WAL streaming)       │
│  Lag: < 100ms typical                                        │
└─────────────────────────────────────────────────────────────┘
```

## Component Details

### 1. NGINX Load Balancer

**Purpose:** Distribute incoming requests across multiple Node.js servers

**Configuration:**
- **Method:** Round-robin (default), configurable to least-connections or IP-hash
- **Health Checks:** Automatic removal of unhealthy servers
- **Rate Limiting:** 
  - API endpoints: 100 requests/minute per IP
  - Checkout: 10 requests/minute per IP
- **SSL/TLS:** Ready for production HTTPS

**Scaling:**
- Currently: 1 server (port 3001)
- Ready for: 3 servers (ports 3001, 3002, 3003)
- Simply uncomment server entries in `nginx.conf`

### 2. Node.js/Express Application Servers

**Purpose:** Handle API requests, business logic, database operations

**Features:**
- RESTful API endpoints
- Automatic read/write database routing
- Redis caching integration
- Session management (guest sessions)
- Error handling and logging

**Scaling:**
- Stateless design allows horizontal scaling
- Each server can handle 100-150 concurrent users
- 3 servers = 300-450 concurrent users capacity

### 3. Redis Cache Layer

**Purpose:** Reduce database load, improve response times

**Cache Strategy:**
- **Product Catalog:** 1-hour TTL
- **Product Listings:** 30-minute TTL
- **Categories:** 1-hour TTL
- **Shopping Cart:** 7-day TTL (or until checkout)
- **Inventory:** 5-minute TTL (for flash sales)

**Cache Patterns:**
- **Cache-Aside:** Application manages cache
- **Write-Through:** Updates cache on writes
- **TTL-based Expiration:** Automatic cache invalidation

### 4. PostgreSQL Database Cluster

#### Primary Database (Write)
- **Role:** Source of truth for all data
- **Operations:** CREATE, UPDATE, DELETE
- **Connection Pool:** 20 connections max
- **Replication:** Publishes changes via WAL

#### Replica Databases (Read)
- **Role:** Handle all SELECT queries
- **Operations:** READ-ONLY
- **Load Balancing:** Round-robin between replicas
- **Sync:** Subscribes to PRIMARY via logical replication

**Replication Strategy:**
- **Method:** PostgreSQL Logical Replication
- **Mechanism:** WAL (Write-Ahead Log) streaming
- **Lag:** < 100ms under normal load
- **Failover:** Manual promotion (automatic in future tiers)

## Data Flow

### Read Operations (GET)

```
Client → NGINX → Node.js → Redis (check cache)
                              ↓ (cache miss)
                              PostgreSQL Replica → Response
                              ↓ (cache write)
                              Redis → Client
```

### Write Operations (POST/PUT/DELETE)

```
Client → NGINX → Node.js → PostgreSQL Primary → WAL
                                              ↓
                                    Logical Replication
                                              ↓
                                    Replica 1 & Replica 2
                                              ↓
                                    Cache Invalidation
                                              ↓
                                    Response → Client
```

### Order Processing Flow

```
1. Add to Cart
   Client → Node.js → Redis (cart storage)

2. Checkout
   Client → Node.js → Redis (inventory reservation - atomic)
                    → PostgreSQL Primary (create order)
                    → Simulate Payment
                    → If success:
                       - Update order status
                       - Decrement inventory
                       - Clear cart
                    → If failure:
                       - Cancel order
                       - Release inventory
                       - Keep cart
```

## Database Schema

### Core Tables

1. **categories** - Product categories
2. **products** - Product catalog
3. **inventory** - Stock levels and reservations
4. **orders** - Order records
5. **order_items** - Order line items
6. **payments** - Payment records (simulated)

### Key Relationships

- Products → Categories (many-to-one)
- Products → Inventory (one-to-one)
- Orders → Order Items (one-to-many)
- Orders → Payments (one-to-one)

## Caching Strategy

### Cache Keys

```
product:{id}                    → Product details
products:page:{n}:...           → Product listings
categories:all                  → All categories
cart:{sessionId}                → Shopping cart
inventory:{productId}           → Inventory levels
inventory_lock:{productId}      → Inventory locks
```

### Cache Invalidation

- **Product updates:** Delete `product:{id}` and `products:*` patterns
- **Order creation:** Clear cart cache
- **Inventory updates:** Update `inventory:{productId}`

## Session Management

- **Type:** Guest sessions (no authentication in Tier-1)
- **Storage:** Session ID in HTTP header (`X-Session-ID`) or cookie
- **Generation:** Auto-generated UUID if not provided
- **Persistence:** 7 days (cart TTL)

## Inventory Management

### Reservation Process

1. **Check Availability:** Query database or Redis cache
2. **Atomic Reservation:** Lua script in Redis (prevents race conditions)
3. **Database Update:** Decrement quantity, increment reserved_quantity
4. **Lock TTL:** 10 minutes (auto-release if order not confirmed)

### Release Process

- **On Payment Failure:** Release all reserved inventory
- **On Timeout:** Auto-release after 10 minutes
- **On Cancellation:** Release reserved inventory

## Performance Targets

### Response Times
- Product listing: < 200ms (with cache)
- Product details: < 100ms (with cache)
- Add to cart: < 100ms
- Checkout: < 2 seconds
- Order status: < 500ms

### Throughput
- Peak requests: 50-100 requests/second
- Concurrent users: 100-150
- Orders per second: 5-10

### Availability
- Uptime target: 99.5%
- Database backup: Daily automated
- Disaster recovery: RTO 4 hours, RPO 24 hours

## Scalability Features

### Current (Tier-1)
- ✅ 1-3 Node.js servers (NGINX load balanced)
- ✅ 1 Primary + 2 Replica databases
- ✅ Redis caching
- ✅ Read/write splitting

### Future (Tier-2+)
- 🔄 Kafka for async processing
- 🔄 Microservices architecture
- 🔄 Database sharding
- 🔄 Multi-region deployment

## Security Considerations

1. **Rate Limiting:** Prevents abuse
2. **Input Validation:** All inputs sanitized
3. **SQL Injection:** Parameterized queries (Sequelize)
4. **HTTPS:** Ready for SSL/TLS
5. **Session Security:** HTTP-only cookies

## Monitoring & Observability

### Key Metrics

1. **Application:**
   - Request rate
   - Response time (P50, P95, P99)
   - Error rate
   - Active connections

2. **Database:**
   - Replication lag
   - Connection pool usage
   - Query execution time
   - Slow queries

3. **Redis:**
   - Memory usage
   - Hit/miss ratio
   - Connection count
   - Evictions

4. **NGINX:**
   - Requests per second
   - Upstream response times
   - Active connections
   - Rate limit hits

## Deployment

### Prerequisites
- PostgreSQL 12+ (3 instances)
- Redis 6+
- Node.js 18+
- NGINX (optional)

### Steps
1. Apply database schema to PRIMARY
2. Set up replication (see `database/replication-setup.md`)
3. Configure environment variables
4. Start Redis
5. Start Node.js servers
6. Configure NGINX (optional)

## Testing

See `testing-strategy.md` for comprehensive testing guide covering:
- Database replication
- Cache hit/miss
- Load balancing
- Order processing
- Inventory management

## Documentation

- **Database Schema:** `backend/database/schema.sql`
- **Replication Setup:** `backend/database/replication-setup.md`
- **NGINX Config:** `nginx/nginx.conf`
- **Testing Strategy:** `docs/testing-strategy.md`
- **API Documentation:** `backend/README.md`

## Next Steps

1. ✅ Set up database replication
2. ✅ Configure NGINX load balancer
3. ✅ Run comprehensive tests
4. ✅ Monitor performance metrics
5. 🔄 Prepare for Tier-2 (Kafka, microservices)

## References

- [PostgreSQL Logical Replication](https://www.postgresql.org/docs/current/logical-replication.html)
- [Redis Best Practices](https://redis.io/docs/manual/patterns/)
- [NGINX Load Balancing](https://nginx.org/en/docs/http/load_balancing.html)
- [System Design Documentation](../docs/system-design/)

