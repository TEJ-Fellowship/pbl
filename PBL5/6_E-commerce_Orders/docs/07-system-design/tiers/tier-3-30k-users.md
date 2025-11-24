# System Design for 30,000 Daily Users

## Executive Summary

This document outlines the scaling strategy to handle **30,000 daily users** (approximately 3,000-4,500 concurrent users during peak hours). This phase introduces microservices architecture, database sharding, and advanced caching strategies.

## Scaling Challenges from 10K to 30K

### Key Bottlenecks Identified:
1. **Monolithic Application**: Single codebase becomes harder to scale independently
2. **Database Write Bottleneck**: Even with replicas, write operations are limited
3. **Cache Capacity**: Need distributed caching across regions
4. **Service Dependencies**: Tight coupling limits independent scaling
5. **Deployment Complexity**: All services deploy together

## Enhanced Architecture for 30K Users

### Component Upgrades

#### 1. Load Balancer Layer
- **Component**: Nginx + API Gateway (Kong or AWS API Gateway)
- **Upgrades**:
  - API Gateway for microservices routing
  - Request rate limiting per service
  - Authentication/Authorization at gateway level
  - Request/Response transformation
- **Resources**: 2 API Gateway instances (4 CPU, 8GB RAM each)

#### 2. Application Layer - Microservices Architecture

**Service Decomposition:**
- **User Service**: Authentication, profiles, addresses
- **Product Service**: Catalog, search, categories
- **Order Service**: Order creation, status management
- **Inventory Service**: Stock management, reservations
- **Payment Service**: Payment processing, refunds
- **Shipping Service**: Fulfillment, tracking
- **Notification Service**: Email, SMS, push notifications
- **Analytics Service**: Real-time metrics, reporting

**Scaling per Service:**
- **User Service**: 2 instances (2 CPU, 4GB each)
- **Product Service**: 4 instances (4 CPU, 8GB each) - High traffic
- **Order Service**: 4 instances (4 CPU, 8GB each) - High traffic
- **Inventory Service**: 3 instances (4 CPU, 8GB each)
- **Payment Service**: 2 instances (2 CPU, 4GB each)
- **Shipping Service**: 2 instances (2 CPU, 4GB each)
- **Notification Service**: 2 instances (2 CPU, 4GB each)
- **Analytics Service**: 2 instances (4 CPU, 8GB each)

**Total Application Resources**: 23 instances, ~92 CPU, ~184GB RAM

#### 3. Cache Layer
- **Component**: Redis Cluster (6 nodes) + CDN
- **Configuration**:
  - Redis: 6 nodes (3 shards × 2 replicas)
  - Max memory per node: 8GB
  - Total cache: 48GB
  - CDN: CloudFlare or AWS CloudFront
- **Use Cases**:
  - All previous use cases
  - Service response caching
  - CDN for static assets (images, CSS, JS)
- **Resources**: 6 nodes × (4 CPU, 8GB RAM) = 24 CPU, 48GB RAM

#### 4. Database Layer

##### PostgreSQL (Sharding Strategy)

**Sharding by Function:**
- **Shard 1**: Users, Authentication (Primary + 2 Replicas)
- **Shard 2**: Products, Categories (Primary + 2 Replicas)
- **Shard 3**: Orders (Shard by user_id hash) (Primary + 2 Replicas)
  - Orders 0-33%: Shard 3A
  - Orders 34-66%: Shard 3B
  - Orders 67-100%: Shard 3C

**Sharding Implementation:**
```javascript
// Shard selection based on user_id
function getOrderShard(userId) {
  const hash = hashUserId(userId);
  const shardIndex = hash % 3;
  return `orders_shard_${shardIndex}`;
}
```

**Configuration per Shard:**
- Primary: 4 CPU, 8GB RAM
- Replicas: 2 CPU, 4GB RAM each
- Total: 9 shards × (4 CPU, 8GB) + 18 replicas × (2 CPU, 4GB) = 72 CPU, 144GB RAM

**Connection Pooling:**
- Use PgBouncer for connection pooling
- Max connections per shard: 50

##### MongoDB (Sharded Cluster)
- **Configuration**: 3 shards × 3 replicas = 9 nodes
- **Sharding Key**: `user_id` (for order history)
- **Purpose**: Order history, analytics, logs
- **Resources**: 9 nodes × (2 CPU, 4GB RAM) = 18 CPU, 36GB RAM

**Sharding Strategy:**
```javascript
// MongoDB sharding by user_id
sh.enableSharding("ecommerce");
sh.shardCollection("ecommerce.orders", { user_id: 1 });
```

#### 5. Message Queue
- **Component**: Kafka Cluster (5 brokers)
- **Configuration**:
  - **Brokers**: 5 (for higher throughput)
  - **Replication Factor**: 3
  - **Partitions per Topic**: 12 (up from 6)
  - **Retention**: 30 days
- **Topics**:
  - `order-events` (12 partitions, RF=3)
  - `payment-events` (12 partitions, RF=3)
  - `inventory-events` (12 partitions, RF=3)
  - `notification-events` (12 partitions, RF=3)
  - `analytics-events` (12 partitions, RF=3)
  - `fraud-detection-events` (12 partitions, RF=3) - NEW
- **Resources**: 5 brokers × (4 CPU, 8GB RAM) = 20 CPU, 40GB RAM

### Architecture Diagram

```
┌─────────────┐
│   Clients   │
└──────┬──────┘
       │
       ↓
┌─────────────────────────────────────┐
│    CDN (Static Assets)               │
│  (CloudFlare/AWS CloudFront)         │
└──────────────────────────────────────┘
       │
       ↓
┌─────────────────────────────────────┐
│    API Gateway (Kong/AWS)            │
│  (Auth, Rate Limiting, Routing)      │
└──────┬───────────────────────────────┘
       │
       ├─────────────────────────────────────┐
       │                                     │
       ↓                                     ↓
┌──────────────┐                    ┌──────────────┐
│   Nginx      │                    │   Nginx      │
│ Load Balancer│                    │ Load Balancer│
└──────┬───────┘                    └──────┬───────┘
       │                                     │
       ├──────────┬──────────┬──────────┐   │
       ↓          ↓          ↓          ↓   │
┌─────────┐ ┌─────────┐ ┌─────────┐ ┌──────┐│
│User Svc │ │Product │ │Order   │ │Inv   ││
│(2 inst) │ │Svc(4)  │ │Svc(4)  │ │Svc(3)││
└────┬────┘ └────┬────┘ └────┬────┘ └──┬───┘│
     │           │           │         │    │
     └───────────┴───────────┴─────────┘    │
              │                              │
         ┌────┴────┐                    ┌────┴────┐
         │         │                    │         │
         ↓         ↓                    ↓         ↓
    ┌─────────┐ ┌─────────┐      ┌─────────┐ ┌─────────┐
    │  Redis  │ │  Kafka  │      │Payment │ │Shipping│
    │ Cluster │ │ Cluster │      │Svc(2)  │ │Svc(2)  │
    │(6 nodes)│ │(5 brokers)│    └────┬────┘ └────┬────┘
    └────┬────┘ └────┬────┘          │           │
         │           │                │           │
         │           ↓                │           │
         │    ┌───────────────┐       │           │
         │    │  Consumers    │       │           │
         │    │ (All Services)│       │           │
         │    └───────────────┘       │           │
         │                            │           │
         ↓                            ↓           ↓
┌─────────────────────────────────────────────────────┐
│           Database Layer (Sharded)                    │
│                                                       │
│  PostgreSQL Shard 1 (Users)                          │
│  ├─ Primary + 2 Replicas                             │
│                                                       │
│  PostgreSQL Shard 2 (Products)                       │
│  ├─ Primary + 2 Replicas                             │
│                                                       │
│  PostgreSQL Shard 3 (Orders)                         │
│  ├─ Shard 3A (Primary + 2 Replicas)                  │
│  ├─ Shard 3B (Primary + 2 Replicas)                  │
│  └─ Shard 3C (Primary + 2 Replicas)                  │
│                                                       │
│  MongoDB Sharded Cluster (3 shards × 3 replicas)     │
│  └─ Order History, Analytics                         │
└─────────────────────────────────────────────────────┘
```

## Microservices Communication

### Service-to-Service Communication

**Synchronous (REST/gRPC):**
- Direct HTTP calls for real-time operations
- gRPC for high-performance internal calls
- Circuit breakers for fault tolerance

**Asynchronous (Kafka):**
- Event-driven communication
- Saga pattern for distributed transactions
- Event sourcing for audit trails

### API Gateway Routing

```yaml
# Kong API Gateway Configuration
services:
  - name: user-service
    url: http://user-service:3001
    routes:
      - name: user-routes
        paths: ["/api/users"]
  
  - name: product-service
    url: http://product-service:3002
    routes:
      - name: product-routes
        paths: ["/api/products"]
  
  - name: order-service
    url: http://order-service:3003
    routes:
      - name: order-routes
        paths: ["/api/orders"]
```

## Database Sharding Implementation

### Order Sharding by User ID

```javascript
// Shard router
class OrderShardRouter {
  constructor() {
    this.shards = [
      { name: 'orders_shard_a', pool: poolA },
      { name: 'orders_shard_b', pool: poolB },
      { name: 'orders_shard_c', pool: poolC },
    ];
  }
  
  getShard(userId) {
    const hash = this.hashUserId(userId);
    const shardIndex = hash % this.shards.length;
    return this.shards[shardIndex];
  }
  
  async createOrder(userId, orderData) {
    const shard = this.getShard(userId);
    return shard.pool.query(
      'INSERT INTO orders ...',
      [userId, orderData]
    );
  }
  
  // Cross-shard query (for admin)
  async getAllOrders(filters) {
    const results = await Promise.all(
      this.shards.map(shard => 
        shard.pool.query('SELECT * FROM orders WHERE ...', filters)
      )
    );
    return results.flat();
  }
}
```

### MongoDB Sharding

```javascript
// MongoDB sharding configuration
sh.enableSharding("ecommerce");

// Shard by user_id
sh.shardCollection("ecommerce.order_history", { user_id: 1 });

// Create compound index
db.order_history.createIndex({ user_id: 1, created_at: -1 });
```

## Performance Targets

### Response Times
- **Product Search**: < 100ms (with CDN and caching)
- **Add to Cart**: < 50ms
- **Checkout**: < 1 second
- **Order Placement**: < 1 second
- **Order Status**: < 200ms

### Throughput
- **Peak Requests**: 1,500-3,000 requests/second
- **Concurrent Users**: 3,000-4,500
- **Orders per Second**: 150-300 orders/second

### Availability
- **Uptime Target**: 99.95% (approximately 22 minutes downtime/month)
- **Service Level Objectives (SLO)**:
  - Order Service: 99.9% availability
  - Payment Service: 99.95% availability
  - Product Service: 99.9% availability

## Service Mesh (Optional but Recommended)

### Istio or Linkerd
- **Purpose**: Service discovery, load balancing, security
- **Features**:
  - Automatic mTLS between services
  - Circuit breakers
  - Retry policies
  - Distributed tracing

## Monitoring & Observability

### Distributed Tracing
- **Tool**: Jaeger or Zipkin
- **Purpose**: Track requests across microservices
- **Implementation**: OpenTelemetry

### Service Health Checks
```javascript
// Health check endpoint per service
app.get('/health', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date(),
    dependencies: {
      database: await checkDatabase(),
      redis: await checkRedis(),
      kafka: await checkKafka(),
    },
  };
  res.json(health);
});
```

### Metrics per Service
- Request rate
- Error rate
- Latency (P50, P95, P99)
- Database connection pool usage
- Cache hit rate

## Cost Estimation (Monthly)

### Infrastructure Costs
- **API Gateway**: $100/month
- **CDN**: $50/month
- **23 Microservice Instances**: $1,840/month
- **Redis Cluster (6 nodes)**: $480/month
- **PostgreSQL Sharded (9 shards + 18 replicas)**: $2,160/month
- **MongoDB Sharded (9 nodes)**: $540/month
- **Kafka Cluster (5 brokers)**: $400/month
- **Monitoring & Logging**: $200/month
- **Total**: ~$5,770/month

## Migration Plan from 10K to 30K

### Phase 1: Microservices Extraction (Weeks 1-4)
1. Extract User Service (Week 1)
2. Extract Product Service (Week 2)
3. Extract Order Service (Week 3)
4. Extract remaining services (Week 4)

### Phase 2: Database Sharding (Weeks 5-6)
1. Set up PostgreSQL sharding infrastructure
2. Migrate data to shards
3. Update application shard routing
4. Test cross-shard queries

### Phase 3: MongoDB Sharding (Week 7)
1. Convert replica set to sharded cluster
2. Enable sharding on collections
3. Migrate data
4. Test shard balancing

### Phase 4: CDN Integration (Week 8)
1. Set up CDN
2. Migrate static assets
3. Configure cache headers
4. Test CDN performance

### Rollback Plan
- Keep monolithic version running
- Feature flags for gradual migration
- Canary deployments (5% → 25% → 50% → 100%)

## Success Criteria

✅ System handles 30,000 daily users  
✅ Microservices independently scalable  
✅ Database sharding working correctly  
✅ Response times < 1s for checkout  
✅ Service availability > 99.9%  
✅ Zero data loss during migration  
✅ Cost per user < $0.20/month

## Next Steps

Once validated for 30K users:
1. Monitor microservices performance
2. Optimize service communication
3. Prepare for 50K users (see [50K-Users.md](./50K-Users.md))

## References

- See [research-resources.md](./research-resources.md) for learning materials
- See [scalability-roadmap.md](./scalability-roadmap.md) for complete migration guide

