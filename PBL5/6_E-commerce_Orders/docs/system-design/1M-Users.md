# System Design for 1,000,000 Daily Users

## Executive Summary

This document outlines the scaling strategy to handle **1,000,000 daily users** (approximately 100,000-150,000 concurrent users during peak hours). This phase represents enterprise-scale architecture with global distribution, advanced database federation, auto-scaling infrastructure, and comprehensive monitoring.

## Scaling Challenges from 70K to 1M

### Key Bottlenecks Identified:
1. **Database Write Scalability**: Even multi-master replication has limits
2. **Event Processing Volume**: Millions of events per day
3. **Cache Coherence**: Maintaining consistency across global cache
4. **Cost Management**: Infrastructure costs scale linearly
5. **Operational Complexity**: Managing hundreds of services

## Enhanced Architecture for 1M Users

### Component Upgrades

#### 1. Global Load Balancing & API Gateway
- **Component**: Multi-Region API Gateway + Global Load Balancer
- **Regions**: 
  - **US-East**: Primary (Virginia)
  - **US-West**: Secondary (Oregon)
  - **EU-Central**: Tertiary (Frankfurt)
  - **Asia-Pacific**: Singapore (Optional)
- **Configuration**:
  - **GeoDNS**: Route53/CloudFlare with intelligent routing
  - **Latency-based routing**: Route to nearest region
  - **Failover**: Automatic failover between regions
  - **API Gateway**: Kong/AWS API Gateway per region
  - **Edge Computing**: CloudFlare Workers/AWS Lambda@Edge
- **Resources**: 4 regions × API Gateway = 4 instances (8 CPU, 16GB each)

#### 2. Application Layer - Global Kubernetes Federation

**Regional Deployment:**
- **US-East**: Full deployment (primary)
- **US-West**: Full deployment (secondary)
- **EU-Central**: Full deployment (tertiary)
- **Asia-Pacific**: Critical services only (optional)

**Service Scaling (Auto-scaling with predictive scaling):**
- **User Service**: 8-20 pods per region (HPA + VPA)
- **Product Service**: 16-40 pods per region
- **Order Service**: 16-40 pods per region
- **Inventory Service**: 12-30 pods per region
- **Payment Service**: 8-20 pods per region
- **Shipping Service**: 8-20 pods per region
- **Notification Service**: 8-20 pods per region
- **Analytics Service**: 12-30 pods per region
- **Fraud Detection Service**: 6-15 pods per region - NEW
- **Recommendation Service**: 8-20 pods per region - NEW

**Kubernetes Federation:**
- **Tool**: Kubefed or Crossplane
- **Purpose**: Unified management across regions
- **Features**: 
  - Global service discovery
  - Cross-cluster load balancing
  - Unified monitoring

**Total Resources**: 4 regions × ~300 CPU = 1,200 CPU, ~2,400GB RAM

#### 3. Cache Layer
- **Component**: Redis Cluster (Multi-Region) + CDN + Edge Cache
- **Configuration**:
  - **US-East**: 18 nodes (6 shards × 3 replicas)
  - **US-West**: 18 nodes (6 shards × 3 replicas)
  - **EU-Central**: 12 nodes (4 shards × 3 replicas)
  - **Asia-Pacific**: 6 nodes (2 shards × 3 replicas) - Optional
  - Max memory per node: 32GB
  - Total cache: 1,728GB
- **Cache Strategy**:
  - **L1**: Edge cache (CDN) - Static assets
  - **L2**: Regional Redis - Hot data
  - **L3**: Application cache - Very hot data
- **Cache Synchronization**:
  - Redis Replication across regions
  - Kafka-based cache invalidation
  - TTL-based expiration
- **CDN**: Multi-region CDN with edge computing
- **Resources**: 54 nodes × (8 CPU, 32GB RAM) = 432 CPU, 1,728GB RAM

#### 4. Database Layer

##### PostgreSQL (Federated Architecture)

**Option 1: Citus (Distributed PostgreSQL)**
- **Configuration**: 
  - Coordinator nodes: 3 (one per region)
  - Worker nodes: 30 per region (90 total)
  - Sharding: Hash-based on user_id/order_id
- **Benefits**: 
  - Automatic sharding
  - Distributed queries
  - Cross-shard transactions

**Option 2: AWS RDS Multi-Region**
- **Configuration**:
  - Primary: US-East (Aurora PostgreSQL)
  - Replicas: US-West, EU-Central (Global Database)
  - Read replicas: 10 per region
- **Benefits**:
  - Managed service
  - Automatic failover
  - Point-in-time recovery

**Option 3: Custom Sharding with PgBouncer**
- **Shards**: 50+ shards per region
- **Connection Pooling**: PgBouncer per shard
- **Sharding Key**: Composite (user_id + region)

**Recommended**: Citus for simplicity, or AWS RDS for managed service

**Total PostgreSQL Resources**: 
- Citus: 93 nodes × (8 CPU, 16GB) = 744 CPU, 1,488GB RAM
- Or AWS RDS: Managed service pricing

##### MongoDB (Global Sharded Cluster)

**Configuration:**
- **Shards**: 12 shards per region (48 total)
- **Replicas**: 3 replicas per shard (144 nodes total)
- **Sharding Keys**:
  - `order_history`: `user_id` + `created_at`
  - `analytics`: `date` + `category` + `region`
- **Replication**: Cross-region replication
- **Resources**: 144 nodes × (8 CPU, 16GB RAM) = 1,152 CPU, 2,304GB RAM

**Alternative**: MongoDB Atlas (Managed service)

#### 5. Message Queue
- **Component**: Kafka Cluster (Multi-Region with MirrorMaker 2.0)
- **Configuration**:
  - **US-East**: 15 brokers (Primary cluster)
  - **US-West**: 15 brokers (Secondary cluster)
  - **EU-Central**: 12 brokers (Tertiary cluster)
  - **Asia-Pacific**: 9 brokers (Optional)
  - **Replication**: MirrorMaker 2.0 for cross-region
  - **Partitions per Topic**: 100 (up from 36)
  - **Replication Factor**: 3 (within region)
  - **Retention**: 30 days
  - **Compression**: LZ4 or Zstandard
- **Topics**:
  - `order-events` (100 partitions, RF=3, cross-region)
  - `payment-events` (100 partitions, RF=3, cross-region)
  - `inventory-events` (100 partitions, RF=3, cross-region)
  - `notification-events` (100 partitions, RF=3, cross-region)
  - `analytics-events` (100 partitions, RF=3, cross-region)
  - `fraud-detection-events` (100 partitions, RF=3, cross-region)
  - `recommendation-events` (100 partitions, RF=3, cross-region)
  - `cache-invalidation-events` (100 partitions, RF=3)
  - `audit-events` (100 partitions, RF=3) - NEW
- **Resources**: 51 brokers × (8 CPU, 16GB RAM) = 408 CPU, 816GB RAM

**Alternative**: AWS MSK (Managed Kafka) or Confluent Cloud

### Architecture Diagram

```
                    ┌─────────────┐
                    │   Clients   │
                    │  (Global)   │
                    └──────┬──────┘
                           │
                           ↓
            ┌──────────────────────────────┐
            │    GeoDNS (Route53)           │
            │  (Intelligent routing)        │
            └──────┬────────────────────────┘
                   │
    ┌───────────────┼───────────────┬──────────────┐
    │               │               │              │
    ↓               ↓               ↓              ↓
┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐
│US-East  │   │US-West  │   │EU-Central│  │Asia-Pac │
│(Primary)│   │(Secondary)│ │(Tertiary)│  │(Optional)│
└────┬────┘   └────┬────┘   └────┬────┘   └────┬────┘
     │             │             │             │
     ↓             ↓             ↓             ↓
┌─────────────────────────────────────────────────┐
│    Edge Computing (CloudFlare Workers)          │
│  (Request routing, A/B testing, personalization)│
└──────┬──────────────────────────────────────────┘
       │
       ↓
┌─────────────────────────────────────────────────┐
│    API Gateway (Per Region)                       │
│  (Kong/AWS API Gateway + Rate Limiting)          │
└──────┬──────────────────────────────────────────┘
       │
       ↓
┌─────────────────────────────────────────────────┐
│    Kubernetes Federation (Global)                  │
│  ┌──────────────────────────────────────────┐   │
│  │  Microservices (Auto-scaled)              │   │
│  │  - All services with HPA + VPA            │   │
│  │  - Predictive scaling enabled             │   │
│  │  - Circuit breakers for resilience        │   │
│  └──────────┬────────────────────────────────┘   │
└─────────────┼────────────────────────────────────┘
              │
       ┌──────┴──────┐
       │             │
       ↓             ↓
┌─────────────┐ ┌─────────────┐
│  Redis      │ │  Kafka      │
│  Cluster    │ │  Cluster    │
│ (Per Region)│ │ (Per Region)│
│ 54 nodes    │ │ 51 brokers  │
└──────┬──────┘ └──────┬──────┘
       │               │
       │               ↓
       │      ┌───────────────┐
       │      │ Cross-Region │
       │      │  Replication  │
       │      └───────────────┘
       │
       ↓
┌─────────────────────────────────────────────────┐
│      Database Layer (Federated)                   │
│                                                   │
│  PostgreSQL (Citus or RDS Multi-Region)          │
│  ├─ US-East: Coordinator + 30 Workers            │
│  ├─ US-West: Coordinator + 30 Workers           │
│  └─ EU-Central: Coordinator + 30 Workers         │
│                                                   │
│  MongoDB (Global Sharded Cluster)                │
│  ├─ 12 shards × 3 replicas per region           │
│  └─ 144 nodes total                             │
└─────────────────────────────────────────────────┘
```

## Advanced Features

### 1. Predictive Auto-Scaling

```yaml
# Kubernetes Predictive Pod Autoscaler
apiVersion: autoscaling.k8s.io/v1
kind: PredictiveHorizontalPodAutoscaler
metadata:
  name: order-service-phpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: order-service
  minReplicas: 16
  maxReplicas: 40
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 50
        periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
      - type: Percent
        value: 100
        periodSeconds: 15
      - type: Pods
        value: 4
        periodSeconds: 15
      selectPolicy: Max
  prediction:
    predictionWindowSeconds: 3600
    predictionAlgorithm:
      algorithmType: "linear"
      behavior:
        scaleUp:
          stabilizationWindowSeconds: 0
          policies:
          - type: Percent
            value: 100
            periodSeconds: 15
```

### 2. Circuit Breaker Pattern

```javascript
// Circuit breaker for service calls
const CircuitBreaker = require('opossum');

const options = {
  timeout: 3000,
  errorThresholdPercentage: 50,
  resetTimeout: 30000,
};

const breaker = new CircuitBreaker(serviceCall, options);

breaker.on('open', () => {
  console.log('Circuit breaker opened');
  // Route to fallback service or cache
});

breaker.on('halfOpen', () => {
  console.log('Circuit breaker half-open');
});

breaker.on('close', () => {
  console.log('Circuit breaker closed');
});
```

### 3. Event Sourcing

```javascript
// Event sourcing for order state
class OrderEventStore {
  async appendEvent(orderId, event) {
    await kafka.producer.send({
      topic: 'order-events',
      messages: [{
        key: orderId,
        value: JSON.stringify({
          orderId,
          eventType: event.type,
          eventData: event.data,
          timestamp: new Date(),
        }),
      }],
    });
  }
  
  async getOrderState(orderId) {
    // Replay events to rebuild state
    const events = await this.getEvents(orderId);
    return events.reduce((state, event) => {
      return this.applyEvent(state, event);
    }, {});
  }
}
```

### 4. CQRS (Command Query Responsibility Segregation)

```javascript
// Separate read and write models
class OrderCommandHandler {
  async createOrder(command) {
    // Write to write database
    const order = await writeDb.orders.create(command);
    
    // Publish event
    await eventBus.publish('order.created', order);
    
    return order;
  }
}

class OrderQueryHandler {
  async getOrder(orderId) {
    // Read from read-optimized database
    return await readDb.orders.findById(orderId);
  }
  
  async getOrdersByUser(userId) {
    // Read from read-optimized database with indexes
    return await readDb.orders.findByUserId(userId);
  }
}
```

## Performance Targets

### Response Times (Per Region)
- **Product Search**: < 50ms (with edge cache)
- **Add to Cart**: < 20ms
- **Checkout**: < 500ms
- **Order Placement**: < 500ms
- **Order Status**: < 80ms

### Throughput
- **Peak Requests**: 25,000-50,000 requests/second (combined regions)
- **Concurrent Users**: 100,000-150,000
- **Orders per Second**: 2,500-5,000 orders/second
- **Events per Second**: 100,000+ events/second

### Availability
- **Uptime Target**: 99.99% (approximately 4.3 minutes downtime/month)
- **Regional Failover**: < 2 minutes
- **Disaster Recovery**: RTO < 15 minutes, RPO < 1 minute
- **Cross-Region Latency**: < 80ms (optimized routing)

## Cost Optimization Strategies

### 1. Spot Instances for Non-Critical Workloads
- Use spot instances for analytics, batch processing
- Savings: 60-70% on compute costs

### 2. Reserved Instances
- Reserve instances for stable workloads
- Savings: 30-40% on compute costs

### 3. Auto-Scaling Optimization
- Right-size instances based on actual usage
- Use vertical pod autoscaling (VPA)
- Savings: 20-30% on compute costs

### 4. Database Optimization
- Use read replicas for analytics
- Archive old data to cold storage
- Savings: 40-50% on storage costs

### 5. CDN Optimization
- Cache static assets aggressively
- Use edge computing for dynamic content
- Savings: 50-60% on bandwidth costs

## Monitoring & Observability

### Comprehensive Monitoring Stack

```yaml
# Prometheus + Grafana + AlertManager
# Jaeger for distributed tracing
# ELK Stack for logging
# Datadog/New Relic for APM
```

### Key Metrics
- **Business Metrics**:
  - Orders per second
  - Revenue per second
  - Conversion rate
  - Cart abandonment rate
- **Technical Metrics**:
  - Request rate per service
  - Error rate per service
  - Latency (P50, P95, P99, P99.9)
  - Database query performance
  - Cache hit rates
  - Kafka consumer lag
  - Regional performance
- **Infrastructure Metrics**:
  - CPU/Memory usage
  - Network throughput
  - Disk I/O
  - Database connections

## Cost Estimation (Monthly)

### Infrastructure Costs
- **Multi-Region Kubernetes**: $6,000/month (4 regions)
- **API Gateway (Multi-Region)**: $2,400/month
- **CDN + Edge Computing**: $1,000/month
- **Microservices (4 regions, auto-scaled)**: $24,000-36,000/month
- **Redis Cluster (54 nodes)**: $8,640/month
- **PostgreSQL (Citus or RDS)**: $18,000-25,000/month
- **MongoDB (144 nodes or Atlas)**: $14,400-20,000/month
- **Kafka Cluster (51 brokers or MSK)**: $8,160-12,000/month
- **Monitoring & Logging**: $2,000/month
- **Cross-Region Data Transfer**: $1,500/month
- **Backup & Disaster Recovery**: $1,000/month
- **Total**: ~$87,100-118,500/month

**Cost per User**: ~$0.09-0.12/month

## Migration Plan from 70K to 1M

### Phase 1: Database Federation (Weeks 1-4)
1. Evaluate Citus vs RDS vs Custom sharding
2. Set up distributed PostgreSQL
3. Migrate data to federated architecture
4. Test distributed queries

### Phase 2: Additional Regions (Weeks 5-8)
1. Set up EU-Central region
2. Deploy services to new region
3. Set up cross-region replication
4. Test regional failover

### Phase 3: Kafka Scaling (Weeks 9-10)
1. Scale Kafka to 100 partitions per topic
2. Add more brokers (15 per region)
3. Optimize consumer groups
4. Test high-throughput scenarios

### Phase 4: Advanced Features (Weeks 11-12)
1. Implement predictive auto-scaling
2. Set up circuit breakers
3. Implement event sourcing
4. Set up CQRS

### Phase 5: Optimization (Weeks 13-16)
1. Cost optimization (spot instances, reserved)
2. Performance tuning
3. Cache optimization
4. Database query optimization

### Rollback Plan
- Keep 70K architecture running
- Gradual traffic migration (5% → 25% → 50% → 100%)
- Feature flags for new features
- Comprehensive monitoring

## Success Criteria

✅ System handles 1,000,000 daily users  
✅ Global distribution working correctly  
✅ Response times < 500ms for checkout  
✅ 99.99% uptime achieved  
✅ Zero data loss  
✅ Cost per user < $0.15/month  
✅ Auto-scaling responsive to traffic  
✅ Disaster recovery tested and working

## Operational Excellence

### Runbooks
- Incident response procedures
- Database failover procedures
- Regional failover procedures
- Cache invalidation procedures

### On-Call Rotation
- 24/7 on-call coverage
- Escalation procedures
- Post-mortem process

### Capacity Planning
- Weekly capacity reviews
- Quarterly capacity planning
- Predictive capacity modeling

## Next Steps

Once validated for 1M users:
1. Continuous optimization
2. Cost reduction initiatives
3. Performance improvements
4. Feature enhancements

## References

- See [research-resources.md](./research-resources.md) for learning materials
- See [scalability-roadmap.md](./scalability-roadmap.md) for complete migration guide

