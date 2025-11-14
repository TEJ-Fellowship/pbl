# Testing Strategy - Tier-1 E-commerce Order Processing System

## Overview

This document outlines comprehensive testing strategies for verifying:
- Database replication and sync
- Redis caching behavior (hit/miss)
- NGINX load balancing
- Order processing flow
- Inventory management
- Payment processing

## Prerequisites

1. All three PostgreSQL databases configured and replicating
2. Redis server running
3. NGINX load balancer configured
4. Node.js backend servers running
5. Test data seeded in databases

## 1. Database Replication Testing

### 1.1 Verify Replication Setup

```sql
-- On PRIMARY database
SELECT * FROM pg_publication;
SELECT * FROM pg_publication_tables;

-- On REPLICA 1 and REPLICA 2
SELECT * FROM pg_subscription;
SELECT * FROM pg_stat_subscription;
```

**Expected Result:**
- Publication exists on PRIMARY
- Subscriptions exist on both replicas
- Subscription state should be "active"

### 1.2 Test Write-to-Primary, Read-from-Replica

**Test Script:**
```bash
# 1. Write to PRIMARY
curl -X POST http://localhost/api/products \
  -H "Content-Type: application/json" \
  -d '{"title": "Test Product", "price": 99.99, "sku": "TEST-001", "stock": 100}'

# 2. Wait 1 second for replication
sleep 1

# 3. Read from REPLICA (should see new product)
curl http://localhost/api/products?search=Test
```

**Expected Result:**
- Product appears in search results
- Replication lag < 100ms

### 1.3 Monitor Replication Lag

```sql
-- On REPLICA 1
SELECT 
    subname,
    pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), received_lsn)) as lag
FROM pg_stat_subscription;

-- On REPLICA 2
SELECT 
    subname,
    pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), received_lsn)) as lag
FROM pg_stat_subscription;
```

**Expected Result:**
- Lag should be < 100ms under normal load
- Lag increases during high write load but recovers quickly

### 1.4 Test Replica Failover

**Test Steps:**
1. Stop REPLICA 1
2. Verify application still works (uses REPLICA 2)
3. Restart REPLICA 1
4. Verify it catches up with replication

**Expected Result:**
- Application continues functioning
- No errors in logs
- REPLICA 1 syncs when restarted

## 2. Redis Cache Testing

### 2.1 Test Cache Hit/Miss

**Test Script:**
```bash
# First request (cache miss)
time curl http://localhost/api/products > /dev/null

# Second request (cache hit - should be faster)
time curl http://localhost/api/products > /dev/null
```

**Expected Result:**
- First request: ~200-500ms (database query)
- Second request: ~10-50ms (cache hit)
- Response includes `"fromCache": true` in second request

### 2.2 Monitor Cache Statistics

```bash
# Connect to Redis CLI
redis-cli

# Check cache keys
KEYS product:*
KEYS products:*

# Check memory usage
INFO memory

# Check hit/miss ratio (if using Redis with stats)
INFO stats
```

**Expected Result:**
- Cache keys exist for frequently accessed products
- Memory usage within limits
- Hit rate > 60% for product listings

### 2.3 Test Cache Invalidation

**Test Script:**
```bash
# 1. Cache a product
curl http://localhost/api/products/550e8400-e29b-41d4-a716-446655440001

# 2. Update product (should invalidate cache)
curl -X PUT http://localhost/api/products/550e8400-e29b-41d4-a716-446655440001 \
  -H "Content-Type: application/json" \
  -d '{"price": 199.99}'

# 3. Fetch again (should get fresh data)
curl http://localhost/api/products/550e8400-e29b-41d4-a716-446655440001
```

**Expected Result:**
- Updated price appears in response
- Cache refreshed automatically

### 2.4 Test Shopping Cart in Redis

```bash
# Add item to cart
curl -X POST http://localhost/api/cart/add \
  -H "Content-Type: application/json" \
  -H "X-Session-ID: test-session-123" \
  -d '{"productId": "550e8400-e29b-41d4-a716-446655440001", "quantity": 2}'

# Get cart (should be in Redis)
curl -H "X-Session-ID: test-session-123" http://localhost/api/cart

# Verify in Redis
redis-cli
> HGETALL cart:test-session-123
```

**Expected Result:**
- Cart data stored in Redis
- TTL set to 7 days
- Cart persists across requests

## 3. NGINX Load Balancing Testing

### 3.1 Test Request Distribution

**Test Script:**
```bash
# Make 20 requests and check which server handled each
for i in {1..20}; do
  curl -s http://localhost/api/health | jq '.server'
done
```

**Expected Result:**
- Requests distributed across all active servers
- Round-robin distribution (if using round-robin method)

### 3.2 Test Health Check and Failover

**Test Steps:**
1. Start 2 Node.js servers (ports 3001, 3002)
2. Make requests - verify both servers receive traffic
3. Stop server on port 3001
4. Make requests - verify all traffic goes to port 3002
5. Restart server on port 3001
6. Verify traffic distributes again

**Expected Result:**
- No 502 errors during failover
- Traffic automatically routes to healthy servers
- Failed server removed from pool
- Server rejoins pool when healthy

### 3.3 Test Rate Limiting

```bash
# Make 150 requests quickly (limit is 100/min)
for i in {1..150}; do
  curl -s http://localhost/api/products > /dev/null &
done
wait

# Check logs for rate limit errors
sudo tail -n 50 /var/log/nginx/ecommerce_error.log | grep "503"
```

**Expected Result:**
- First 100 requests succeed
- Remaining requests get 503 (rate limited)
- Rate limit resets after 1 minute

### 3.4 Test Sticky Sessions (if using IP hash)

```bash
# Make multiple requests from same IP
for i in {1..10}; do
  curl http://localhost/api/cart
done
```

**Expected Result:**
- All requests go to same backend server
- Session data persists correctly

## 4. Order Processing Flow Testing

### 4.1 Test Complete Order Flow

**Test Script:**
```bash
SESSION_ID="test-order-$(date +%s)"

# 1. Add items to cart
curl -X POST http://localhost/api/cart/add \
  -H "Content-Type: application/json" \
  -H "X-Session-ID: $SESSION_ID" \
  -d '{"productId": "550e8400-e29b-41d4-a716-446655440001", "quantity": 2}'

# 2. View cart
curl -H "X-Session-ID: $SESSION_ID" http://localhost/api/cart

# 3. Create order (checkout)
curl -X POST http://localhost/api/orders/checkout \
  -H "Content-Type: application/json" \
  -H "X-Session-ID: $SESSION_ID" \
  -d '{
    "shippingAddress": {
      "street": "123 Test St",
      "city": "Test City",
      "state": "TS",
      "zipCode": "12345",
      "country": "USA"
    },
    "paymentMethod": "simulated"
  }'

# 4. Verify order created
ORDER_ID="<from previous response>"
curl -H "X-Session-ID: $SESSION_ID" http://localhost/api/orders/$ORDER_ID

# 5. Verify cart cleared
curl -H "X-Session-ID: $SESSION_ID" http://localhost/api/cart
```

**Expected Result:**
- Order created with status "confirmed"
- Payment status "succeeded"
- Cart cleared after checkout
- Inventory decremented
- Order items created correctly

### 4.2 Test Inventory Reservation

**Test Script:**
```bash
# 1. Check initial stock
curl http://localhost/api/products/550e8400-e29b-41d4-a716-446655440001 | jq '.product.inventory'

# 2. Reserve inventory (create order)
curl -X POST http://localhost/api/orders/checkout \
  -H "Content-Type: application/json" \
  -H "X-Session-ID: test-inventory-$(date +%s)" \
  -d '{
    "shippingAddress": {...},
    "paymentMethod": "simulated"
  }'

# 3. Check stock again (should be decremented)
curl http://localhost/api/products/550e8400-e29b-41d4-a716-446655440001 | jq '.product.inventory'
```

**Expected Result:**
- Stock decremented by order quantity
- Reserved quantity updated
- Available quantity = quantity - reserved_quantity

### 4.3 Test Payment Failure Rollback

**Test Script:**
```bash
# Simulate payment failure (modify payment processing to fail)
# Then create order

# Verify:
# 1. Order status = "cancelled"
# 2. Inventory released
# 3. Stock restored
```

**Expected Result:**
- Order cancelled on payment failure
- Inventory released back to available
- No overselling

### 4.4 Test Concurrent Orders (Race Condition)

**Test Script:**
```bash
# Create 10 concurrent orders for same product with limited stock
for i in {1..10}; do
  curl -X POST http://localhost/api/orders/checkout \
    -H "Content-Type: application/json" \
    -H "X-Session-ID: concurrent-$i" \
    -d '{...}' &
done
wait

# Verify no overselling occurred
```

**Expected Result:**
- Only available stock sold
- No negative inventory
- Failed orders return "Insufficient stock" error

## 5. Performance Testing

### 5.1 Load Test with Apache Bench

```bash
# Test product listing endpoint
ab -n 1000 -c 10 http://localhost/api/products

# Test checkout endpoint
ab -n 100 -c 5 -p checkout.json -T application/json \
  -H "X-Session-ID: load-test" \
  http://localhost/api/orders/checkout
```

**Expected Result:**
- Response time < 2s for 95% of requests
- No errors
- Throughput > 50 requests/second

### 5.2 Stress Test

```bash
# Use k6 or Artillery for stress testing
k6 run stress-test.js
```

**Expected Result:**
- System handles 100 concurrent users
- Response times acceptable
- No data corruption
- Database connections stable

## 6. Integration Testing Checklist

- [ ] Database replication working (< 100ms lag)
- [ ] Cache hit rate > 60%
- [ ] Load balancing distributes requests
- [ ] Health checks remove failed servers
- [ ] Order creation works end-to-end
- [ ] Inventory properly reserved/released
- [ ] Payment failure rolls back correctly
- [ ] No overselling under concurrent load
- [ ] Cart persists in Redis
- [ ] Session management works
- [ ] Rate limiting prevents abuse
- [ ] Error handling graceful

## 7. Monitoring and Observability

### Key Metrics to Monitor

1. **Database:**
   - Replication lag
   - Connection pool usage
   - Query execution time
   - Slow queries

2. **Redis:**
   - Memory usage
   - Hit/miss ratio
   - Connection count
   - Evictions

3. **Application:**
   - Request rate
   - Response time (P50, P95, P99)
   - Error rate
   - Active connections

4. **NGINX:**
   - Requests per second
   - Upstream response times
   - Active connections
   - Rate limit hits

### Tools

- **Prometheus + Grafana**: Metrics collection and visualization
- **Redis CLI**: Cache inspection
- **PostgreSQL logs**: Database monitoring
- **NGINX logs**: Access and error logs
- **Application logs**: Winston or similar

## 8. Automated Testing

### Unit Tests
```bash
npm test
```

### Integration Tests
```bash
npm run test:integration
```

### E2E Tests
```bash
npm run test:e2e
```

## 9. Test Data Setup

Before running tests, seed test data:

```sql
-- Insert test products
INSERT INTO products (id, title, price, sku, stock) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'Test Product 1', 99.99, 'TEST-001', 100),
  ('550e8400-e29b-41d4-a716-446655440002', 'Test Product 2', 149.99, 'TEST-002', 50);

-- Insert inventory
INSERT INTO inventory (product_id, quantity) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 100),
  ('550e8400-e29b-41d4-a716-446655440002', 50);
```

## 10. Troubleshooting

### Common Issues

1. **Replication lag high**
   - Check network latency
   - Monitor PRIMARY write load
   - Check for long-running transactions

2. **Cache not working**
   - Verify Redis connection
   - Check cache key patterns
   - Monitor memory usage

3. **Load balancing not working**
   - Verify all servers running
   - Check NGINX configuration
   - Verify health checks

4. **Orders failing**
   - Check inventory availability
   - Verify payment processing
   - Check database transactions

## References

- [PostgreSQL Replication Monitoring](https://www.postgresql.org/docs/current/monitoring-replication.html)
- [Redis Monitoring](https://redis.io/docs/management/optimization/monitoring/)
- [NGINX Load Balancing](https://nginx.org/en/docs/http/load_balancing.html)

