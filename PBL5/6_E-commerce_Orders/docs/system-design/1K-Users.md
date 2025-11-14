# System Design for 1,000 Daily Users (Startup Phase)

## Executive Summary

This document outlines the system design for handling **1,000 daily users** (approximately 100-150 concurrent users during peak hours). This is the foundation phase where we establish a solid, cost-effective architecture that can scale incrementally.

## Current System Evaluation

### Your Proposed Architecture

```
Client → Nginx (Load Balancer) → 2 Node/Express Servers → Redis (Cache) → 3 PostgreSQL DBs + MongoDB
                                                              ↓
                                                          Kafka (Queue)
```

### Is This Sufficient for 1K Users?

**✅ YES, with optimizations** - Your architecture is well-designed for 1K users, but needs some enhancements:

#### Strengths:

1. ✅ Load balancing with Nginx (good for redundancy)
2. ✅ Redis caching (reduces database load)
3. ✅ Kafka for async processing (prevents blocking)
4. ✅ Separation of concerns (PostgreSQL for structured, MongoDB for orders)

#### Areas Needing Attention:

1. ⚠️ **Database Connection Pooling**: Need proper connection pooling to handle 3 PostgreSQL DBs efficiently
2. ⚠️ **Redis Configuration**: Ensure Redis is properly configured for persistence and memory limits
3. ⚠️ **Kafka Setup**: Single Kafka broker might be sufficient, but need proper topic partitioning
4. ⚠️ **Monitoring**: Basic monitoring should be in place from day 1

## Recommended Architecture for 1K Users

### Component Specifications

#### 1. Load Balancer Layer

- **Component**: Nginx
- **Configuration**:
  - Round-robin or least-connections algorithm
  - Health checks every 5 seconds
  - SSL termination
  - Static file serving (reduce load on app servers)
- **Resources**: 1 instance (2 CPU, 2GB RAM)

#### 2. Application Layer

- **Component**: Node.js/Express (2 instances)
- **Configuration**:
  - Cluster mode enabled (utilize all CPU cores)
  - Connection pooling: 20 connections per PostgreSQL DB
  - Request timeout: 30 seconds
  - Rate limiting: 100 requests/minute per IP
- **Resources per instance**: 2 CPU, 4GB RAM
- **Total**: 4 CPU, 8GB RAM

#### 3. Cache Layer

- **Component**: Redis (Single instance with persistence)
- **Configuration**:
  - Max memory: 2GB
  - Eviction policy: allkeys-lru
  - Persistence: RDB snapshots every 5 minutes + AOF
  - TTL for cache entries: 1 hour default
- **Use Cases**:
  - Product catalog caching (frequent searches)
  - Session storage
  - Shopping cart data
  - Inventory locks (10-minute TTL)
- **Resources**: 2 CPU, 2GB RAM

#### 4. Database Layer

##### PostgreSQL (3 instances)

- **DB1**: Users, Authentication, Profiles
- **DB2**: Products, Inventory, Categories
- **DB3**: Orders (current/active), Order Items
- **Configuration per DB**:
  - Max connections: 100
  - Connection pooler: PgBouncer (optional but recommended)
  - Shared buffers: 256MB
  - Effective cache size: 1GB
- **Resources per DB**: 2 CPU, 4GB RAM
- **Total**: 6 CPU, 12GB RAM

##### MongoDB (1 instance)

- **Purpose**: Order history, analytics data, logs
- **Configuration**:
  - Replica set: Single node (for now, upgrade to replica set later)
  - WiredTiger cache: 1GB
  - Journal enabled
- **Resources**: 2 CPU, 4GB RAM

#### 5. Message Queue

- **Component**: Kafka (Single broker, 3 partitions per topic)
- **Topics**:
  - `order-events` (3 partitions)
  - `payment-events` (3 partitions)
  - `inventory-events` (3 partitions)
  - `notification-events` (3 partitions)
- **Configuration**:
  - Retention: 7 days
  - Replication factor: 1 (upgrade to 3 for 10K+)
- **Resources**: 2 CPU, 4GB RAM

### Architecture Diagram

```
┌─────────────┐
│   Clients   │
│  (Web/Mobile)│
└──────┬──────┘
       │ HTTPS
       ↓
┌─────────────────────────────────────┐
│         Nginx Load Balancer          │
│  (SSL Termination, Static Files)     │
└──────┬───────────────────────────────┘
       │
       ├──────────────┬──────────────┐
       ↓              ↓              ↓
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ Node/Express│  │ Node/Express│  │  (Future)   │
│  Server 1   │  │  Server 2   │  │             │
└──────┬──────┘  └──────┬──────┘  └─────────────┘
       │                │
       └────────┬───────┘
                │
       ┌────────┴────────┐
       │                 │
       ↓                 ↓
┌─────────────┐   ┌─────────────┐
│    Redis    │   │    Kafka    │
│   (Cache)   │   │   (Queue)   │
└──────┬──────┘   └──────┬──────┘
       │                 │
       │                 ↓
       │         ┌───────────────┐
       │         │  Consumers    │
       │         │ (Payment,     │
       │         │  Shipping,    │
       │         │  Notification)│
       │         └───────────────┘
       │
       ↓
┌─────────────────────────────────────┐
│         Database Layer               │
│  ┌──────────┐  ┌──────────┐        │
│  │PostgreSQL│  │PostgreSQL│        │
│  │   DB1    │  │   DB2    │        │
│  │ (Users)  │  │(Products)│        │
│  └──────────┘  └──────────┘        │
│  ┌──────────┐  ┌──────────┐        │
│  │PostgreSQL│  │ MongoDB  │        │
│  │   DB3    │  │(History) │        │
│  │ (Orders) │  │          │        │
│  └──────────┘  └──────────┘        │
└─────────────────────────────────────┘
```

## Performance Targets

### Response Times

- **Product Search**: < 200ms (with Redis cache)
- **Add to Cart**: < 100ms
- **Checkout**: < 2 seconds
- **Order Placement**: < 2 seconds
- **Order Status**: < 500ms

### Throughput

- **Peak Requests**: 50-100 requests/second
- **Concurrent Users**: 100-150
- **Orders per Second**: 5-10 orders/second

### Availability

- **Uptime Target**: 99.5% (approximately 3.6 hours downtime/month)
- **Database Backup**: Daily automated backups
- **Disaster Recovery**: Basic backup restoration (RTO: 4 hours, RPO: 24 hours)

## Database Schema Distribution

### PostgreSQL DB1 (Users & Authentication)

```sql
-- Users table
users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  password_hash VARCHAR(255),
  name VARCHAR(255),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

-- User addresses
addresses (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  street VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(100),
  zip_code VARCHAR(20),
  country VARCHAR(100),
  is_default BOOLEAN
)
```

### PostgreSQL DB2 (Products & Inventory)

```sql
-- Products table
products (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  description TEXT,
  price DECIMAL(10,2),
  sku VARCHAR(100) UNIQUE,
  category_id UUID,
  image_url VARCHAR(500),
  created_at TIMESTAMP
)

-- Categories
categories (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  parent_id UUID
)

-- Inventory
inventory (
  product_id UUID PRIMARY KEY REFERENCES products(id),
  warehouse_id UUID,
  quantity INT,
  reserved_quantity INT DEFAULT 0,
  updated_at TIMESTAMP
)
```

### PostgreSQL DB3 (Orders - Active)

```sql
-- Orders (active/current orders)
orders (
  id UUID PRIMARY KEY,
  user_id UUID,
  total_amount DECIMAL(10,2),
  status VARCHAR(50), -- pending/confirmed/processing/shipped/delivered/cancelled
  shipping_address_id UUID,
  payment_id UUID,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

-- Order items
order_items (
  id UUID PRIMARY KEY,
  order_id UUID REFERENCES orders(id),
  product_id UUID,
  quantity INT,
  price_at_purchase DECIMAL(10,2)
)
```

### MongoDB (Order History & Analytics)

```javascript
// Order history (archived after 30 days from PostgreSQL)
{
  _id: ObjectId,
  order_id: UUID,
  user_id: UUID,
  total_amount: Number,
  status: String,
  items: [{
    product_id: UUID,
    quantity: Number,
    price: Number
  }],
  created_at: ISODate,
  completed_at: ISODate,
  metadata: {
    payment_method: String,
    shipping_carrier: String,
    tracking_number: String
  }
}
```

## Caching Strategy

### Redis Cache Keys

1. **Product Catalog**

   - `product:{id}` - TTL: 1 hour
   - `products:category:{category_id}:page:{page}` - TTL: 30 minutes
   - `products:search:{query_hash}` - TTL: 15 minutes

2. **User Sessions**

   - `session:{session_id}` - TTL: 24 hours
   - `user:{user_id}:profile` - TTL: 1 hour

3. **Shopping Cart**

   - `cart:{user_id}` - TTL: 7 days (or until checkout)

4. **Inventory Locks**

   - `inventory_lock:{product_id}` - TTL: 10 minutes
   - `inventory:{product_id}` - TTL: 5 minutes (for flash sales)

5. **Rate Limiting**
   - `rate_limit:{ip}:{endpoint}` - TTL: 1 minute

## Kafka Topics Configuration

### Topic: `order-events`

- **Partitions**: 3
- **Replication Factor**: 1
- **Retention**: 7 days
- **Events**:
  - `order.created`
  - `order.confirmed`
  - `order.cancelled`
  - `order.shipped`
  - `order.delivered`

### Topic: `payment-events`

- **Partitions**: 3
- **Events**:
  - `payment.initiated`
  - `payment.succeeded`
  - `payment.failed`
  - `payment.refunded`

### Topic: `inventory-events`

- **Partitions**: 3
- **Events**:
  - `inventory.reserved`
  - `inventory.released`
  - `inventory.updated`
  - `inventory.low_stock`

### Topic: `notification-events`

- **Partitions**: 3
- **Events**:
  - `email.order_confirmation`
  - `email.shipping_update`
  - `sms.order_status`

## Connection Pooling Strategy

### PostgreSQL Connection Pooling

Since you can only connect to 3 PostgreSQL databases per computer, use connection pooling:

```javascript
// Using pg-pool for each database
const pool1 = new Pool({
  host: "db1-host",
  database: "users_db",
  user: "user",
  password: "password",
  max: 20, // Maximum 20 connections per pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

const pool2 = new Pool({
  host: "db2-host",
  database: "products_db",
  // ... similar config
});

const pool3 = new Pool({
  host: "db3-host",
  database: "orders_db",
  // ... similar config
});
```

**Total Connections**: 20 × 3 = 60 connections (well within limits)

## Monitoring & Observability

### Essential Metrics to Monitor

1. **Application Metrics**

   - Request rate (requests/second)
   - Response time (P50, P95, P99)
   - Error rate (4xx, 5xx)
   - Active connections

2. **Database Metrics**

   - Connection pool usage
   - Query execution time
   - Slow queries (> 1 second)
   - Database size growth

3. **Redis Metrics**

   - Memory usage
   - Hit rate (cache hit ratio)
   - Evictions
   - Connection count

4. **Kafka Metrics**
   - Consumer lag
   - Message throughput
   - Topic size
   - Partition leader elections

### Recommended Tools

- **Application Monitoring**: Prometheus + Grafana (lightweight)
- **Logging**: Winston (Node.js) + centralized log aggregation
- **Error Tracking**: Sentry (free tier available)
- **Uptime Monitoring**: UptimeRobot (free tier)

## Cost Estimation (Monthly)

### Infrastructure Costs (Cloud Provider Example)

- **Load Balancer**: $20/month
- **2 App Servers** (2 CPU, 4GB each): $80/month
- **Redis** (2GB): $30/month
- **3 PostgreSQL DBs** (2 CPU, 4GB each): $180/month
- **MongoDB** (2 CPU, 4GB): $60/month
- **Kafka** (2 CPU, 4GB): $60/month
- **Total**: ~$430/month

_Note: Costs vary by provider and can be reduced with reserved instances_

## Security Considerations

1. **Authentication**: JWT tokens with 24-hour expiration
2. **Rate Limiting**: Per IP and per user
3. **SQL Injection**: Use parameterized queries (Sequelize ORM)
4. **XSS Protection**: Input sanitization
5. **HTTPS**: SSL/TLS for all communications
6. **Database**: Encrypted connections, least privilege access
7. **Secrets Management**: Environment variables (consider Vault for 10K+)

## Deployment Strategy

### Initial Deployment

1. **Blue-Green Deployment**: Not necessary for 1K users, but good practice
2. **Database Migrations**: Version-controlled migrations
3. **Rollback Plan**: Keep previous version ready
4. **Health Checks**: Automated health check endpoints

### CI/CD Pipeline

- **Build**: Automated testing on push
- **Deploy**: Manual approval for production
- **Monitoring**: Automated alerts on deployment

## Success Criteria

✅ System handles 1,000 daily users without degradation  
✅ Response times meet targets (< 2s for checkout)  
✅ Zero data loss (all orders persisted)  
✅ 99.5% uptime achieved  
✅ No overselling (inventory properly managed)  
✅ Cost-effective infrastructure (< $500/month)

## Next Steps

Once you've validated this architecture for 1K users:

1. Monitor performance metrics for 2-4 weeks
2. Identify bottlenecks
3. Prepare for scaling to 10K users (see [10K-Users.md](./10K-Users.md))

## References

- See [research-resources.md](./research-resources.md) for detailed learning materials
- See [scalability-roadmap.md](./scalability-roadmap.md) for migration guide
