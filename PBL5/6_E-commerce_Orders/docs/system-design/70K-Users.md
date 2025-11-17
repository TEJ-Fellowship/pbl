# System Design for 70,000 Daily Users

## Executive Summary

This document outlines the scaling strategy to handle **70,000 daily users** (approximately 7,000-10,500 concurrent users during peak hours). This phase focuses on multi-region deployment, advanced database replication, and enhanced event-driven architecture.

## Scaling Challenges from 50K to 70K

### Key Bottlenecks Identified:
1. **Geographic Latency**: Single region causes 200-500ms latency for distant users
2. **Database Write Bottleneck**: Even with sharding, write operations are saturated
3. **Event Processing**: Kafka consumers can't keep up with event volume
4. **Cache Coherence**: Multi-region cache synchronization is complex
5. **Disaster Recovery**: Single region is a single point of failure

## Enhanced Architecture for 70K Users

### Component Upgrades

#### 1. Global Load Balancing & API Gateway
- **Component**: Multi-region API Gateway + Global Load Balancer
- **Regions**: 
  - **Primary**: US-East (existing)
  - **Secondary**: US-West (new)
  - **Tertiary**: EU-Central (new) - Optional
- **Configuration**:
  - GeoDNS routing (Route53/CloudFlare)
  - Latency-based routing
  - Failover between regions
  - Regional API Gateway instances
- **Resources**: 3 regions × API Gateway = 3 instances (4 CPU, 8GB each)

#### 2. Application Layer - Multi-Region Kubernetes

**Regional Deployment:**
- **US-East**: Primary region (full deployment)
- **US-West**: Secondary region (full deployment)
- **EU-Central**: Read replicas + critical services only

**Service Distribution:**
- **User Service**: 4-8 pods per region
- **Product Service**: 8-16 pods per region
- **Order Service**: 8-16 pods per region
- **Inventory Service**: 6-12 pods per region
- **Payment Service**: 4-8 pods per region
- **Shipping Service**: 4-8 pods per region
- **Notification Service**: 4-8 pods per region
- **Analytics Service**: 6-12 pods per region

**Cross-Region Communication:**
- **Synchronous**: gRPC with circuit breakers
- **Asynchronous**: Kafka cross-region replication
- **Service Mesh**: Istio multi-cluster

**Total Resources**: 3 regions × ~150 CPU = 450 CPU, ~900GB RAM

#### 3. Cache Layer
- **Component**: Redis Cluster (Multi-Region) + CDN
- **Configuration**:
  - **US-East**: 12 nodes (4 shards × 3 replicas)
  - **US-West**: 12 nodes (4 shards × 3 replicas)
  - **EU-Central**: 6 nodes (2 shards × 3 replicas) - Optional
  - Max memory per node: 16GB
  - Total cache: 480GB (US-East + US-West)
- **Cache Synchronization**:
  - Redis Replication across regions
  - Cache invalidation via Kafka events
  - Regional cache warming
- **CDN**: Multi-region CDN with edge caching
- **Resources**: 30 nodes × (4 CPU, 16GB RAM) = 120 CPU, 480GB RAM

#### 4. Database Layer

##### PostgreSQL (Multi-Master Replication)

**Primary Region (US-East):**
- **Shard 1**: Users (Primary + 4 Replicas)
- **Shard 2**: Products (Primary + 4 Replicas)
- **Shard 3**: Orders (6 shards, each with Primary + 2 Replicas)

**Secondary Region (US-West):**
- **Shard 1**: Users (Read Replica + Standby)
- **Shard 2**: Products (Read Replica + Standby)
- **Shard 3**: Orders (Read Replicas for all 6 shards)

**Multi-Master Setup:**
- Use PostgreSQL streaming replication
- Or use Citus for distributed PostgreSQL
- Or use AWS RDS Multi-AZ with read replicas

**Connection Pooling:**
- PgBouncer per region
- Cross-region connection routing

**Total PostgreSQL Resources**: 
- US-East: 26 shards × (4 CPU, 8GB) + 78 replicas × (2 CPU, 4GB) = 260 CPU, 520GB RAM
- US-West: 26 read replicas × (2 CPU, 4GB) = 52 CPU, 104GB RAM
- **Total**: 312 CPU, 624GB RAM

##### MongoDB (Multi-Region Replication)

**Configuration:**
- **US-East**: 6 shards × 3 replicas = 18 nodes (Primary)
- **US-West**: 6 shards × 3 replicas = 18 nodes (Secondary - Read)
- **Replication**: Cross-region replication for disaster recovery

**Sharding:**
- Shard by `user_id` for order history
- Shard by `date` for analytics

**Resources**: 36 nodes × (4 CPU, 8GB RAM) = 144 CPU, 288GB RAM

#### 5. Message Queue
- **Component**: Kafka Cluster (Multi-Region)
- **Configuration**:
  - **US-East**: 9 brokers (Primary cluster)
  - **US-West**: 9 brokers (Secondary cluster)
  - **Replication**: MirrorMaker 2.0 for cross-region replication
  - **Partitions per Topic**: 36 (up from 24)
  - **Replication Factor**: 3 (within region)
  - **Retention**: 30 days
- **Topics**:
  - `order-events` (36 partitions, RF=3, cross-region replicated)
  - `payment-events` (36 partitions, RF=3, cross-region replicated)
  - `inventory-events` (36 partitions, RF=3, cross-region replicated)
  - `notification-events` (36 partitions, RF=3, cross-region replicated)
  - `analytics-events` (36 partitions, RF=3, cross-region replicated)
  - `fraud-detection-events` (36 partitions, RF=3, cross-region replicated)
  - `recommendation-events` (36 partitions, RF=3, cross-region replicated)
  - `cache-invalidation-events` (36 partitions, RF=3) - NEW
- **Resources**: 18 brokers × (4 CPU, 8GB RAM) = 72 CPU, 144GB RAM

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
            │  (Latency-based routing)      │
            └──────┬────────────────────────┘
                   │
        ┌──────────┼──────────┐
        │          │          │
        ↓          ↓          ↓
┌───────────┐ ┌───────────┐ ┌───────────┐
│  US-East  │ │ US-West   │ │ EU-Central│
│  (Primary)│ │(Secondary)│ │ (Optional)│
└─────┬─────┘ └─────┬─────┘ └─────┬─────┘
      │            │             │
      ↓            ↓             ↓
┌─────────────────────────────────────┐
│    API Gateway (Per Region)          │
└──────┬───────────────────────────────┘
       │
       ↓
┌─────────────────────────────────────┐
│    Kubernetes Cluster (Per Region)   │
│  ┌──────────────────────────────┐   │
│  │  Microservices (Auto-scaled) │   │
│  │  - All services replicated   │   │
│  └──────────┬───────────────────┘   │
└─────────────┼───────────────────────┘
              │
       ┌──────┴──────┐
       │             │
       ↓             ↓
┌─────────────┐ ┌─────────────┐
│  Redis      │ │  Kafka      │
│  Cluster    │ │  Cluster    │
│ (Per Region)│ │ (Per Region)│
└──────┬──────┘ └──────┬──────┘
       │               │
       │               ↓
       │      ┌───────────────┐
       │      │ Cross-Region │
       │      │  Replication  │
       │      └───────────────┘
       │
       ↓
┌─────────────────────────────────────┐
│      Database Layer                  │
│                                     │
│  PostgreSQL (Multi-Region)          │
│  ├─ US-East: Primary + Replicas     │
│  └─ US-West: Read Replicas          │
│                                     │
│  MongoDB (Multi-Region)             │
│  ├─ US-East: Primary Shards         │
│  └─ US-West: Secondary Replicas    │
└─────────────────────────────────────┘
```

## Multi-Region Data Synchronization

### Database Replication Strategy

```javascript
// Read preference based on region
class DatabaseRouter {
  constructor(region) {
    this.region = region;
    this.primaryRegion = 'us-east';
  }
  
  async query(sql, params, isRead = false) {
    if (isRead && this.region !== this.primaryRegion) {
      // Route reads to local read replica
      return this.localReadPool.query(sql, params);
    } else if (!isRead) {
      // Route writes to primary region
      return this.primaryWritePool.query(sql, params);
    } else {
      // Read from primary region
      return this.primaryReadPool.query(sql, params);
    }
  }
}
```

### Kafka Cross-Region Replication

```bash
# MirrorMaker 2.0 configuration
# Replicate topics from US-East to US-West
connect-mirror-maker.sh \
  --consumer.config consumer.properties \
  --producer.config producer.properties \
  --clusters us-east,us-west \
  --replication-factor 3
```

## Event-Driven Architecture Enhancement

### Saga Pattern with Multi-Region Support

```javascript
// Distributed saga orchestrator
class OrderSagaOrchestrator {
  async processOrder(orderData) {
    const sagaId = generateId();
    
    try {
      // Step 1: Reserve inventory (async via Kafka)
      await this.publishEvent('inventory-events', {
        sagaId,
        type: 'reserve',
        orderData,
      });
      
      // Step 2: Process payment (async via Kafka)
      await this.publishEvent('payment-events', {
        sagaId,
        type: 'process',
        orderData,
      });
      
      // Step 3: Create shipment (async via Kafka)
      await this.publishEvent('shipping-events', {
        sagaId,
        type: 'create',
        orderData,
      });
      
      // Monitor saga completion
      await this.waitForSagaCompletion(sagaId);
      
    } catch (error) {
      // Compensating transactions
      await this.compensate(sagaId);
    }
  }
  
  async compensate(sagaId) {
    // Rollback all operations
    await Promise.all([
      this.publishEvent('inventory-events', { sagaId, type: 'release' }),
      this.publishEvent('payment-events', { sagaId, type: 'refund' }),
      this.publishEvent('shipping-events', { sagaId, type: 'cancel' }),
    ]);
  }
}
```

## Performance Targets

### Response Times (Per Region)
- **Product Search**: < 60ms (local region)
- **Add to Cart**: < 30ms (local region)
- **Checkout**: < 600ms (may route to primary for writes)
- **Order Placement**: < 600ms
- **Order Status**: < 100ms (local read replica)

### Throughput
- **Peak Requests**: 3,500-7,000 requests/second (combined regions)
- **Concurrent Users**: 7,000-10,500
- **Orders per Second**: 350-700 orders/second

### Availability
- **Uptime Target**: 99.99% (approximately 4.3 minutes downtime/month)
- **Regional Failover**: < 5 minutes
- **Disaster Recovery**: RTO < 30 minutes, RPO < 5 minutes
- **Cross-Region Latency**: < 100ms (US-East to US-West)

## Disaster Recovery Plan

### Failover Strategy

```javascript
// Health check and failover
class RegionHealthMonitor {
  async checkRegionHealth(region) {
    const health = await Promise.all([
      this.checkDatabase(region),
      this.checkKafka(region),
      this.checkRedis(region),
    ]);
    
    return health.every(h => h.status === 'healthy');
  }
  
  async failoverToSecondary() {
    // Update GeoDNS to route to US-West
    await this.updateDNS('api.example.com', 'us-west-lb');
    
    // Promote US-West read replicas to primary
    await this.promoteReplicas('us-west');
    
    // Notify monitoring systems
    await this.sendAlert('Region failover initiated');
  }
}
```

### Backup Strategy
- **Database Backups**: 
  - Continuous backup (point-in-time recovery)
  - Cross-region backup replication
  - Daily snapshots to S3/object storage
- **Application State**: 
  - Kafka topic replication
  - Redis snapshot replication

## Monitoring & Observability

### Multi-Region Monitoring

```yaml
# Prometheus federation for multi-region
# US-East Prometheus scrapes all regions
global:
  external_labels:
    region: us-east
    cluster: primary

scrape_configs:
  - job_name: 'federate-us-west'
    honor_labels: true
    metrics_path: '/federate'
    params:
      'match[]':
        - '{job=~".*"}'
    static_configs:
      - targets:
        - 'prometheus-us-west:9090'
```

### Key Metrics
- Regional request distribution
- Cross-region latency
- Database replication lag
- Kafka replication lag
- Cache hit rates per region
- Regional error rates
- Failover events

## Cost Estimation (Monthly)

### Infrastructure Costs
- **Multi-Region Kubernetes**: $1,500/month (3 regions)
- **API Gateway (Multi-Region)**: $600/month
- **CDN (Multi-Region)**: $200/month
- **Microservices (3 regions)**: $6,000-9,000/month
- **Redis Cluster (30 nodes)**: $2,400/month
- **PostgreSQL (Multi-Region)**: $4,680/month
- **MongoDB (36 nodes)**: $2,160/month
- **Kafka Cluster (18 brokers)**: $1,440/month
- **Monitoring & Logging**: $500/month
- **Cross-Region Data Transfer**: $300/month
- **Total**: ~$20,180-23,180/month

## Migration Plan from 50K to 70K

### Phase 1: Secondary Region Setup (Weeks 1-2)
1. Set up US-West infrastructure
2. Deploy read replicas for databases
3. Set up Kafka MirrorMaker
4. Test cross-region connectivity

### Phase 2: Application Deployment (Weeks 3-4)
1. Deploy microservices to US-West
2. Configure service discovery
3. Set up cross-region service mesh
4. Test failover scenarios

### Phase 3: Database Multi-Master (Weeks 5-6)
1. Set up PostgreSQL streaming replication
2. Configure read replicas in US-West
3. Test read/write splitting
4. Monitor replication lag

### Phase 4: Cache Synchronization (Week 7)
1. Set up Redis replication
2. Implement cache invalidation events
3. Test cache coherence
4. Monitor cache performance

### Phase 5: GeoDNS & Routing (Week 8)
1. Configure GeoDNS
2. Set up latency-based routing
3. Test regional routing
4. Monitor regional performance

### Rollback Plan
- Keep single-region infrastructure
- Gradual traffic migration (10% → 50% → 100%)
- Regional health monitoring
- Automatic failback to primary

## Success Criteria

✅ System handles 70,000 daily users  
✅ Multi-region deployment successful  
✅ Regional latency < 100ms  
✅ Failover time < 5 minutes  
✅ Zero data loss during failover  
✅ 99.99% uptime achieved  
✅ Cost per user < $0.30/month

## Next Steps

Once validated for 70K users:
1. Monitor multi-region performance
2. Optimize cross-region communication
3. Prepare for 1M users (see [1M-Users.md](./1M-Users.md))

## References

- See [research-resources.md](./research-resources.md) for learning materials
- See [scalability-roadmap.md](./scalability-roadmap.md) for complete migration guide

