# System Design for 10,000 Daily Users

## Executive Summary

This document outlines the scaling strategy to handle **10,000 daily users** (approximately 1,000-1,500 concurrent users during peak hours). This phase focuses on horizontal scaling, database read replicas, and enhanced caching.

## Scaling Challenges from 1K to 10K

### Key Bottlenecks Identified:
1. **Database Read Load**: Single PostgreSQL instances will become bottlenecks
2. **Application Server Capacity**: 2 servers may not handle 10x traffic
3. **Redis Memory**: Need more cache capacity
4. **Kafka Throughput**: Single broker may struggle with higher message volume
5. **Network Bandwidth**: Increased traffic requires better network capacity

## Enhanced Architecture for 10K Users

### Component Upgrades

#### 1. Load Balancer Layer
- **Component**: Nginx (Enhanced configuration)
- **Upgrades**:
  - Health checks every 3 seconds (more frequent)
  - Sticky sessions for cart management
  - Gzip compression enabled
  - HTTP/2 support
- **Resources**: 2 instances (2 CPU, 4GB RAM each) - High availability

#### 2. Application Layer
- **Component**: Node.js/Express
- **Scaling**: **4 instances** (up from 2)
- **Configuration**:
  - Connection pooling: 30 connections per PostgreSQL DB
  - Request timeout: 45 seconds
  - Rate limiting: 200 requests/minute per IP
  - Cluster mode: 4 workers per instance
- **Resources per instance**: 4 CPU, 8GB RAM
- **Total**: 16 CPU, 32GB RAM

#### 3. Cache Layer
- **Component**: Redis Cluster (3 nodes)
- **Configuration**:
  - Max memory per node: 4GB
  - Total cache: 12GB
  - Replication: Master-slave (1 master, 2 replicas per shard)
  - Persistence: RDB + AOF on all nodes
- **Use Cases** (Expanded):
  - All previous use cases
  - User session clustering
  - Distributed rate limiting
  - Real-time analytics cache
- **Resources**: 3 nodes × (2 CPU, 4GB RAM) = 6 CPU, 12GB RAM

#### 4. Database Layer

##### PostgreSQL (Read Replicas Added)

**Primary Databases (Write Operations)**
- **DB1 Primary**: Users, Authentication
- **DB2 Primary**: Products, Inventory
- **DB3 Primary**: Orders (active)

**Read Replicas (Read Operations)**
- **DB1 Replica 1**: Read-only copy of DB1
- **DB2 Replica 1**: Read-only copy of DB2
- **DB3 Replica 1**: Read-only copy of DB3

**Configuration**:
- **Primary**: 4 CPU, 8GB RAM per DB
- **Replica**: 2 CPU, 4GB RAM per DB
- **Connection Pooling**:
  - Primary: 30 connections (writes)
  - Replica: 50 connections (reads)
- **Replication Lag**: < 100ms target

**Total PostgreSQL Resources**: 18 CPU, 36GB RAM

**Read/Write Splitting Strategy**:
```javascript
// Route reads to replicas, writes to primary
const readPool = new Pool({
  host: 'db1-replica-host',
  // ... read-only config
});

const writePool = new Pool({
  host: 'db1-primary-host',
  // ... write config
});
```

##### MongoDB (Replica Set)
- **Configuration**: 3-node replica set (1 primary, 2 secondaries)
- **Purpose**: Order history, analytics
- **Resources**: 3 nodes × (2 CPU, 4GB RAM) = 6 CPU, 12GB RAM
- **Read Preference**: Secondary preferred (for analytics queries)

#### 5. Message Queue
- **Component**: Kafka Cluster (3 brokers)
- **Configuration**:
  - **Brokers**: 3 (for high availability)
  - **Replication Factor**: 3 (each partition replicated 3x)
  - **Partitions per Topic**: 6 (up from 3)
  - **Retention**: 14 days
- **Topics** (Enhanced):
  - `order-events` (6 partitions, RF=3)
  - `payment-events` (6 partitions, RF=3)
  - `inventory-events` (6 partitions, RF=3)
  - `notification-events` (6 partitions, RF=3)
  - `analytics-events` (6 partitions, RF=3) - NEW
- **Resources**: 3 brokers × (2 CPU, 4GB RAM) = 6 CPU, 12GB RAM

### Architecture Diagram

```
┌─────────────┐
│   Clients   │
│  (Web/Mobile)│
└──────┬──────┘
       │ HTTPS
       ↓
┌─────────────────────────────────────┐
│    Nginx Load Balancer (HA)          │
│  (2 instances, health checks)        │
└──────┬───────────────────────────────┘
       │
       ├──┬──┬──┬──┐
       ↓  ↓  ↓  ↓
┌────┐┌────┐┌────┐┌────┐
│App1││App2││App3││App4│
└─┬──┘└─┬──┘└─┬──┘└─┬──┘
  │     │     │     │
  └─────┴─────┴─────┘
       │
  ┌────┴────┐
  │         │
  ↓         ↓
┌─────────┐ ┌─────────┐
│  Redis  │ │  Kafka │
│ Cluster │ │ Cluster│
│ (3 nodes)│ │(3 brokers)│
└────┬────┘ └────┬────┘
     │           │
     │           ↓
     │    ┌───────────────┐
     │    │  Consumers    │
     │    │ (Microservices)│
     │    └───────────────┘
     │
     ↓
┌─────────────────────────────────────┐
│      Database Layer                 │
│                                     │
│  PostgreSQL DB1 (Primary)           │
│  └─ DB1 Replica (Read)              │
│                                     │
│  PostgreSQL DB2 (Primary)           │
│  └─ DB2 Replica (Read)              │
│                                     │
│  PostgreSQL DB3 (Primary)           │
│  └─ DB3 Replica (Read)              │
│                                     │
│  MongoDB Replica Set (3 nodes)     │
│  └─ Primary + 2 Secondaries          │
└─────────────────────────────────────┘
```

## Performance Targets

### Response Times
- **Product Search**: < 150ms (improved with read replicas)
- **Add to Cart**: < 80ms
- **Checkout**: < 1.5 seconds
- **Order Placement**: < 1.5 seconds
- **Order Status**: < 300ms

### Throughput
- **Peak Requests**: 500-1,000 requests/second
- **Concurrent Users**: 1,000-1,500
- **Orders per Second**: 50-100 orders/second

### Availability
- **Uptime Target**: 99.9% (approximately 43 minutes downtime/month)
- **Database Backup**: Daily automated backups + Point-in-time recovery
- **Disaster Recovery**: RTO: 2 hours, RPO: 1 hour

## Database Optimization Strategies

### 1. Read Replica Routing

```javascript
// Automatic read/write splitting
class DatabaseRouter {
  async query(sql, params, isRead = false) {
    const pool = isRead ? this.readPool : this.writePool;
    return pool.query(sql, params);
  }
  
  // Auto-detect SELECT queries
  async execute(sql, params) {
    const isRead = sql.trim().toUpperCase().startsWith('SELECT');
    return this.query(sql, params, isRead);
  }
}
```

### 2. Connection Pooling Enhancement

```javascript
// PgBouncer for connection pooling
// Reduces connection overhead
const pool = new Pool({
  host: 'pgbouncer-host', // Instead of direct DB connection
  port: 6432, // PgBouncer port
  max: 100, // More connections through pooler
  // ...
});
```

### 3. Query Optimization

```sql
-- Add indexes for common queries
CREATE INDEX idx_orders_user_date ON orders(user_id, created_at DESC);
CREATE INDEX idx_orders_status_date ON orders(status, created_at DESC);
CREATE INDEX idx_products_category_price ON products(category_id, price);
CREATE INDEX idx_inventory_product_warehouse ON inventory(product_id, warehouse_id);

-- Partial indexes for active orders
CREATE INDEX idx_orders_active ON orders(user_id, created_at DESC) 
WHERE status IN ('pending', 'confirmed', 'processing');
```

### 4. MongoDB Optimization

```javascript
// Create indexes for order history queries
db.orders.createIndex({ user_id: 1, created_at: -1 });
db.orders.createIndex({ status: 1, created_at: -1 });
db.orders.createIndex({ "metadata.tracking_number": 1 });

// Use aggregation pipeline for analytics
db.orders.aggregate([
  { $match: { created_at: { $gte: startDate } } },
  { $group: { _id: "$status", count: { $sum: 1 } } }
]);
```

## Enhanced Caching Strategy

### Redis Cluster Configuration

```javascript
// Redis Cluster client
const Redis = require('ioredis');
const cluster = new Redis.Cluster([
  { host: 'redis-node-1', port: 6379 },
  { host: 'redis-node-2', port: 6379 },
  { host: 'redis-node-3', port: 6379 },
], {
  redisOptions: {
    password: 'password',
  },
  enableReadyCheck: true,
  maxRetriesPerRequest: 3,
});
```

### Cache Warming Strategy

```javascript
// Pre-load frequently accessed data
async function warmCache() {
  // Top 1000 products
  const topProducts = await db.query(`
    SELECT * FROM products 
    ORDER BY views DESC 
    LIMIT 1000
  `);
  
  for (const product of topProducts) {
    await redis.setex(`product:${product.id}`, 3600, JSON.stringify(product));
  }
}
```

## Kafka Consumer Groups

### Consumer Group Strategy

```javascript
// Multiple consumer instances for parallel processing
// Consumer Group: order-processors
// - Instance 1: Partitions 0, 1, 2
// - Instance 2: Partitions 3, 4, 5

const consumer = kafka.consumer({ 
  groupId: 'order-processors',
  maxInFlightRequests: 5,
  sessionTimeout: 30000,
});
```

### Consumer Lag Monitoring

```javascript
// Monitor consumer lag
async function checkConsumerLag() {
  const admin = kafka.admin();
  const offsets = await admin.fetchOffsets({
    groupId: 'order-processors',
    topics: [{ topic: 'order-events' }],
  });
  
  // Alert if lag > 1000 messages
  if (offsets[0].high > 1000) {
    alert('High consumer lag detected!');
  }
}
```

## Monitoring & Alerting

### Enhanced Metrics

1. **Database Replication Lag**
   - Monitor: `pg_stat_replication` lag
   - Alert: If lag > 1 second

2. **Cache Hit Ratio**
   - Target: > 80% hit rate
   - Alert: If hit rate < 70%

3. **Kafka Consumer Lag**
   - Target: < 100 messages
   - Alert: If lag > 1000 messages

4. **Application Server Load**
   - CPU: Alert if > 80%
   - Memory: Alert if > 85%
   - Response time: Alert if P95 > 1 second

### Recommended Tools
- **APM**: New Relic or Datadog (application performance monitoring)
- **Logging**: ELK Stack (Elasticsearch, Logstash, Kibana)
- **Metrics**: Prometheus + Grafana
- **Alerting**: PagerDuty or Opsgenie

## Cost Estimation (Monthly)

### Infrastructure Costs
- **Load Balancer (HA)**: $40/month
- **4 App Servers** (4 CPU, 8GB each): $320/month
- **Redis Cluster** (3 nodes): $180/month
- **PostgreSQL** (3 primary + 3 replicas): $540/month
- **MongoDB Replica Set** (3 nodes): $180/month
- **Kafka Cluster** (3 brokers): $180/month
- **Monitoring Tools**: $100/month
- **Total**: ~$1,540/month

## Migration Plan from 1K to 10K

### Phase 1: Database Read Replicas (Week 1)
1. Set up PostgreSQL streaming replication
2. Configure read/write splitting in application
3. Test read replica performance
4. Monitor replication lag

### Phase 2: Application Scaling (Week 2)
1. Deploy 2 additional app servers
2. Update Nginx configuration
3. Test load balancing
4. Monitor server performance

### Phase 3: Redis Cluster (Week 3)
1. Set up Redis cluster
2. Migrate cache data
3. Update application Redis client
4. Test cache distribution

### Phase 4: Kafka Cluster (Week 4)
1. Add 2 more Kafka brokers
2. Increase replication factor to 3
3. Rebalance partitions
4. Test high availability

### Rollback Plan
- Keep 1K architecture running in parallel
- Gradual traffic migration (10% → 50% → 100%)
- Monitor for 1 week before full cutover

## Success Criteria

✅ System handles 10,000 daily users without degradation  
✅ Response times improved (checkout < 1.5s)  
✅ Database replication lag < 100ms  
✅ Cache hit rate > 80%  
✅ Zero data loss  
✅ 99.9% uptime achieved  
✅ Cost per user < $0.15/month

## Next Steps

Once validated for 10K users:
1. Monitor for 4-6 weeks
2. Identify optimization opportunities
3. Prepare for 30K users (see [30K-Users.md](./30K-Users.md))

## References

- See [research-resources.md](./research-resources.md) for learning materials
- See [scalability-roadmap.md](./scalability-roadmap.md) for complete migration guide

