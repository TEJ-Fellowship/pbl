# System Design for 50,000 Daily Users

## Executive Summary

This document outlines the scaling strategy to handle **50,000 daily users** (approximately 5,000-7,500 concurrent users during peak hours). This phase focuses on containerization, orchestration, advanced caching, and multi-region deployment preparation.

## Scaling Challenges from 30K to 50K

### Key Bottlenecks Identified:
1. **Deployment Complexity**: Managing 23+ microservices manually is error-prone
2. **Resource Utilization**: Fixed server sizes lead to waste
3. **Geographic Latency**: Single region causes high latency for distant users
4. **Cache Invalidation**: Distributed cache invalidation becomes complex
5. **Database Connection Limits**: Even with sharding, connection pools are maxed

## Enhanced Architecture for 50K Users

### Component Upgrades

#### 1. Load Balancer & API Gateway
- **Component**: Kubernetes Ingress + API Gateway
- **Upgrades**:
  - Kubernetes-native load balancing
  - Auto-scaling based on metrics
  - Multi-region routing
  - Advanced rate limiting per user/service
- **Resources**: Managed service or 3 instances (4 CPU, 8GB each)

#### 2. Application Layer - Containerized Microservices

**Containerization:**
- **Platform**: Kubernetes (K8s)
- **Container Registry**: Docker Hub or private registry
- **Orchestration**: Kubernetes for auto-scaling, health checks, rolling updates

**Service Scaling (Auto-scaling enabled):**
- **User Service**: 3-6 pods (HPA: CPU > 70%)
- **Product Service**: 6-12 pods (HPA: CPU > 70%)
- **Order Service**: 6-12 pods (HPA: CPU > 70%)
- **Inventory Service**: 4-8 pods (HPA: CPU > 70%)
- **Payment Service**: 3-6 pods (HPA: CPU > 70%)
- **Shipping Service**: 3-6 pods (HPA: CPU > 70%)
- **Notification Service**: 3-6 pods (HPA: CPU > 70%)
- **Analytics Service**: 4-8 pods (HPA: CPU > 70%)

**Kubernetes Configuration:**
```yaml
# Example HPA for Order Service
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: order-service-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: order-service
  minReplicas: 6
  maxReplicas: 12
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

**Resources**: Dynamic based on load (estimated: 100-150 CPU, 200-300GB RAM)

#### 3. Cache Layer
- **Component**: Redis Cluster (9 nodes) + CDN + Application-level caching
- **Configuration**:
  - Redis: 9 nodes (3 shards × 3 replicas)
  - Max memory per node: 16GB
  - Total cache: 144GB
  - CDN: Multi-region CDN (CloudFlare/AWS CloudFront)
  - Application Cache: In-memory caching for frequently accessed data
- **Cache Layers**:
  1. **CDN**: Static assets, images
  2. **Redis**: Database queries, sessions, cart
  3. **Application**: In-memory cache (Node.js cache)
- **Resources**: 9 nodes × (4 CPU, 16GB RAM) = 36 CPU, 144GB RAM

#### 4. Database Layer

##### PostgreSQL (Enhanced Sharding)

**Sharding Strategy:**
- **Shard 1**: Users (Primary + 3 Replicas) - 4 nodes
- **Shard 2**: Products (Primary + 3 Replicas) - 4 nodes
- **Shard 3**: Orders (6 shards by user_id hash)
  - Each shard: Primary + 2 Replicas
  - Total: 18 nodes for orders

**Connection Pooling:**
- **PgBouncer**: Per-shard connection poolers
- **Max connections per pooler**: 200
- **Total connections**: 200 × 26 shards = 5,200 connections (managed)

**Read Replicas:**
- Additional read replicas for analytics queries
- Separate read-only replicas for reporting

**Total PostgreSQL Resources**: 26 shards × (4 CPU, 8GB) + 78 replicas × (2 CPU, 4GB) = 260 CPU, 520GB RAM

##### MongoDB (Enhanced Sharding)
- **Configuration**: 6 shards × 3 replicas = 18 nodes
- **Sharding Keys**:
  - `order_history`: `user_id` + `created_at`
  - `analytics`: `date` + `category`
- **Resources**: 18 nodes × (4 CPU, 8GB RAM) = 72 CPU, 144GB RAM

#### 5. Message Queue
- **Component**: Kafka Cluster (7 brokers)
- **Configuration**:
  - **Brokers**: 7 (for higher throughput and redundancy)
  - **Replication Factor**: 3
  - **Partitions per Topic**: 24 (up from 12)
  - **Retention**: 30 days
  - **Compression**: LZ4 or Snappy
- **Topics**:
  - `order-events` (24 partitions, RF=3)
  - `payment-events` (24 partitions, RF=3)
  - `inventory-events` (24 partitions, RF=3)
  - `notification-events` (24 partitions, RF=3)
  - `analytics-events` (24 partitions, RF=3)
  - `fraud-detection-events` (24 partitions, RF=3)
  - `recommendation-events` (24 partitions, RF=3) - NEW
- **Resources**: 7 brokers × (4 CPU, 8GB RAM) = 28 CPU, 56GB RAM

### Architecture Diagram

```
┌─────────────┐
│   Clients   │
│ (Global)    │
└──────┬──────┘
       │
       ↓
┌─────────────────────────────────────┐
│    Global CDN (Multi-Region)         │
│  (Static Assets, Images)              │
└──────┬───────────────────────────────┘
       │
       ↓
┌─────────────────────────────────────┐
│    API Gateway (Multi-Region)        │
│  (Kong/AWS + Geo-routing)            │
└──────┬───────────────────────────────┘
       │
       ↓
┌─────────────────────────────────────┐
│    Kubernetes Cluster                │
│  ┌──────────────────────────────┐   │
│  │  Ingress Controller          │   │
│  └──────────┬───────────────────┘   │
│             │                        │
│  ┌──────────┴───────────────────┐   │
│  │  Microservices (Auto-scaled) │   │
│  │  - User Service (3-6 pods)   │   │
│  │  - Product Service (6-12)     │   │
│  │  - Order Service (6-12)       │   │
│  │  - Inventory Service (4-8)    │   │
│  │  - Payment Service (3-6)     │   │
│  │  - Shipping Service (3-6)     │   │
│  │  - Notification Service (3-6) │   │
│  │  - Analytics Service (4-8)    │   │
│  └──────────┬───────────────────┘   │
│             │                        │
└─────────────┼────────────────────────┘
              │
       ┌──────┴──────┐
       │             │
       ↓             ↓
┌─────────────┐ ┌─────────────┐
│  Redis      │ │  Kafka      │
│  Cluster    │ │  Cluster    │
│ (9 nodes)   │ │ (7 brokers) │
└──────┬──────┘ └──────┬──────┘
       │               │
       │               ↓
       │      ┌───────────────┐
       │      │  Consumers    │
       │      │ (K8s Pods)    │
       │      └───────────────┘
       │
       ↓
┌─────────────────────────────────────┐
│      Database Layer                  │
│                                     │
│  PostgreSQL (26 shards + 78 replicas)│
│  ├─ Users Shard (1 + 3 replicas)    │
│  ├─ Products Shard (1 + 3 replicas) │
│  └─ Orders Shards (6 × 3 nodes)     │
│                                     │
│  MongoDB (6 shards × 3 replicas)    │
│  └─ 18 nodes total                  │
└─────────────────────────────────────┘
```

## Kubernetes Deployment Strategy

### Deployment Manifests

```yaml
# Example: Order Service Deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: order-service
spec:
  replicas: 6
  selector:
    matchLabels:
      app: order-service
  template:
    metadata:
      labels:
        app: order-service
    spec:
      containers:
      - name: order-service
        image: order-service:latest
        ports:
        - containerPort: 3000
        resources:
          requests:
            cpu: 500m
            memory: 1Gi
          limits:
            cpu: 2000m
            memory: 4Gi
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-secrets
              key: url
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
```

### Service Mesh Integration

```yaml
# Istio VirtualService for order-service
apiVersion: networking.istio.io/v1alpha3
kind: VirtualService
metadata:
  name: order-service
spec:
  hosts:
  - order-service
  http:
  - match:
    - headers:
        user-type:
          exact: premium
    route:
    - destination:
        host: order-service
        subset: premium
      weight: 100
  - route:
    - destination:
        host: order-service
        subset: standard
      weight: 100
```

## Advanced Caching Strategies

### Multi-Layer Caching

```javascript
// Layer 1: Application-level cache
const NodeCache = require('node-cache');
const appCache = new NodeCache({ stdTTL: 300 }); // 5 minutes

// Layer 2: Redis cache
const redis = require('redis');
const redisClient = redis.createCluster([...]);

// Layer 3: CDN (handled by API Gateway)

async function getProduct(productId) {
  // Check application cache
  let product = appCache.get(`product:${productId}`);
  if (product) return product;
  
  // Check Redis cache
  product = await redisClient.get(`product:${productId}`);
  if (product) {
    product = JSON.parse(product);
    appCache.set(`product:${productId}`, product);
    return product;
  }
  
  // Fetch from database
  product = await db.query('SELECT * FROM products WHERE id = ?', [productId]);
  
  // Store in both caches
  await redisClient.setex(`product:${productId}`, 3600, JSON.stringify(product));
  appCache.set(`product:${productId}`, product);
  
  return product;
}
```

### Cache Invalidation Strategy

```javascript
// Cache invalidation on product update
async function updateProduct(productId, updates) {
  // Update database
  await db.query('UPDATE products SET ... WHERE id = ?', [productId, updates]);
  
  // Invalidate caches
  await Promise.all([
    redisClient.del(`product:${productId}`),
    redisClient.del(`products:category:*`), // Pattern invalidation
    appCache.del(`product:${productId}`),
  ]);
  
  // Publish cache invalidation event
  await kafka.producer.send({
    topic: 'cache-invalidation',
    messages: [{
      key: productId,
      value: JSON.stringify({ type: 'product', id: productId }),
    }],
  });
}
```

## Database Connection Management

### PgBouncer Configuration

```ini
# pgbouncer.ini
[databases]
users_db = host=db1-primary port=5432 dbname=users
products_db = host=db2-primary port=5432 dbname=products
orders_shard_a = host=db3a-primary port=5432 dbname=orders

[pgbouncer]
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 200
reserve_pool_size = 20
```

### Connection Pool in Application

```javascript
// Use PgBouncer for connection pooling
const pool = new Pool({
  host: 'pgbouncer-host',
  port: 6432,
  database: 'users_db',
  max: 50, // Connections to PgBouncer (not DB)
  idleTimeoutMillis: 30000,
});
```

## Performance Targets

### Response Times
- **Product Search**: < 80ms (with multi-layer caching)
- **Add to Cart**: < 40ms
- **Checkout**: < 800ms
- **Order Placement**: < 800ms
- **Order Status**: < 150ms

### Throughput
- **Peak Requests**: 2,500-5,000 requests/second
- **Concurrent Users**: 5,000-7,500
- **Orders per Second**: 250-500 orders/second

### Availability
- **Uptime Target**: 99.95% (approximately 22 minutes downtime/month)
- **Service Level Objectives**:
  - Order Service: 99.95% availability
  - Payment Service: 99.99% availability
  - Product Service: 99.95% availability
- **Recovery Time Objective (RTO)**: < 15 minutes
- **Recovery Point Objective (RPO)**: < 5 minutes

## Monitoring & Observability

### Kubernetes Monitoring

```yaml
# Prometheus Operator for K8s
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: order-service
spec:
  selector:
    matchLabels:
      app: order-service
  endpoints:
  - port: http
    interval: 30s
    path: /metrics
```

### Distributed Tracing

```javascript
// OpenTelemetry integration
const { NodeTracerProvider } = require('@opentelemetry/node');
const { JaegerExporter } = require('@opentelemetry/exporter-jaeger');

const tracerProvider = new NodeTracerProvider();
tracerProvider.addSpanProcessor(
  new BatchSpanProcessor(new JaegerExporter())
);
tracerProvider.register();
```

### Key Metrics
- Pod CPU/Memory usage
- Request rate per service
- Error rate per service
- Database connection pool usage
- Cache hit rates (all layers)
- Kafka consumer lag
- Database replication lag

## Cost Estimation (Monthly)

### Infrastructure Costs
- **Kubernetes Cluster**: $500/month (managed K8s)
- **API Gateway**: $200/month
- **CDN**: $100/month
- **Microservices (Auto-scaled)**: $2,000-3,000/month
- **Redis Cluster (9 nodes)**: $720/month
- **PostgreSQL (26 shards + 78 replicas)**: $3,120/month
- **MongoDB (18 nodes)**: $1,080/month
- **Kafka Cluster (7 brokers)**: $560/month
- **Monitoring & Logging**: $300/month
- **Total**: ~$8,580-9,580/month

## Migration Plan from 30K to 50K

### Phase 1: Containerization (Weeks 1-2)
1. Dockerize all microservices
2. Create Kubernetes manifests
3. Set up container registry
4. Test container deployments

### Phase 2: Kubernetes Migration (Weeks 3-4)
1. Set up Kubernetes cluster
2. Deploy services to K8s
3. Configure auto-scaling
4. Test rolling updates

### Phase 3: Database Scaling (Weeks 5-6)
1. Add more order shards (3 → 6)
2. Increase read replicas
3. Set up PgBouncer
4. Test shard routing

### Phase 4: Advanced Caching (Week 7)
1. Expand Redis cluster (6 → 9 nodes)
2. Implement multi-layer caching
3. Set up cache invalidation
4. Test cache performance

### Phase 5: Kafka Scaling (Week 8)
1. Add Kafka brokers (5 → 7)
2. Increase partitions (12 → 24)
3. Test throughput
4. Monitor consumer lag

### Rollback Plan
- Keep previous infrastructure running
- Blue-green deployment in K8s
- Canary deployments (10% → 50% → 100%)
- Feature flags for gradual rollout

## Success Criteria

✅ System handles 50,000 daily users  
✅ Auto-scaling working correctly  
✅ Response times < 800ms for checkout  
✅ Service availability > 99.95%  
✅ Zero downtime deployments  
✅ Cost per user < $0.20/month  
✅ Kubernetes cluster stable

## Next Steps

Once validated for 50K users:
1. Monitor auto-scaling behavior
2. Optimize resource allocation
3. Prepare for 70K users (see [70K-Users.md](./70K-Users.md))

## References

- See [research-resources.md](./research-resources.md) for learning materials
- See [scalability-roadmap.md](./scalability-roadmap.md) for complete migration guide

