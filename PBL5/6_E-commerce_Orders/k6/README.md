# k6 Load Testing - Products & Cart Operations

This directory contains k6 load testing scripts focused on **products** and **cart operations** only.

## 🚀 Quick Start

### Run Load Test

```bash
cd /home/ganesh/project/pbl/PBL5/6_E-commerce_Orders/k6
k6 run load-test.js
```

### Quick Smoke Test

```bash
k6 run smoke-test.js
```

## 📋 Test Configuration

### Duration
- **Total Test Duration**: 2 minutes (120 seconds)
- **Stages**:
  - Ramp-up: 0 → 20 users (20s)
  - Normal load: 20 users (40s)
  - Spike: 20 → 50 users (20s)
  - Sustained spike: 50 users (20s)
  - Ramp-down: 50 → 0 users (20s)

### Tested Scenarios

1. **Browse Products** (100% of users)
   - GET `/api/products?page=1&limit=20`

2. **View Product Details** (100% of users who found products)
   - GET `/api/products/:id`

3. **Browse Categories** (30% of users)
   - GET `/api/products/categories`

4. **Add to Cart** (70% of users)
   - POST `/api/cart/add`

5. **View Cart** (70% of users who added items)
   - GET `/api/cart`

6. **Update Cart** (40% of users with items in cart)
   - PUT `/api/cart/update`

7. **Health Check** (10% of iterations)
   - GET `/api/health`

### ⚠️ Note on Checkout

**Checkout operations are NOT included in this load test.**  
Checkout is assumed to have passed testing separately and is excluded to focus on products and cart performance.

## 📊 Performance Thresholds

The test will **FAIL** if:
- ❌ 95th percentile response time > 1000ms
- ❌ 99th percentile response time > 2000ms
- ❌ Error rate > 1%
- ❌ Product page duration (95th percentile) > 800ms
- ❌ Cart operation duration (95th percentile) > 500ms

## 🔧 Configuration

### Change Base URL

```bash
# Backend on port 3000 (default)
k6 run load-test.js

# Backend on different port
BASE_URL=http://localhost:3001 k6 run load-test.js

# Through nginx on port 80
BASE_URL=http://localhost k6 run load-test.js
```

## ✅ Prerequisites

1. **Backend server running**:
   ```bash
   curl http://localhost:3000/api/health
   ```

2. **k6 installed**:
   ```bash
   k6 version
   ```

## 📈 Understanding Results

### Key Metrics

- **http_req_duration**: Response time for all HTTP requests
- **http_req_failed**: Percentage of failed requests
- **product_page_duration**: Time to load product pages
- **cart_operation_duration**: Time for cart operations (add, view, update)
- **vus**: Virtual users (concurrent users)
- **iterations**: Total number of test iterations

### Example Output

```
✓ browse products status 200
✓ product detail status 200
✓ add to cart status 200 or 201
✓ view cart status 200
✓ update cart status 200

checks.........................: 95.00% ✓ 1900   ✗ 100
http_req_duration..............: avg=245ms min=50ms med=200ms max=1200ms p(95)=680ms
http_req_failed................: 0.50%   ✓ 10    ✗ 1990
product_page_duration..........: avg=12ms min=1ms med=8ms max=391ms p(95)=25ms
cart_operation_duration........: avg=128ms min=90ms med=116ms max=987ms p(95)=208ms
```

## 🐛 Troubleshooting

### "API health check failed"
**Solution**: Make sure backend is running
```bash
curl http://localhost:3000/api/health
```

### "Connection refused"
**Solution**: Check the port number
```bash
BASE_URL=http://localhost:3001 k6 run load-test.js
```

### High Error Rate
**Possible Causes**:
- Backend not handling load
- Database connection issues
- Redis not running

**Debug Steps**:
1. Check backend logs
2. Verify database is accessible
3. Check Redis connection
4. Reduce load in test (lower `target` in stages)

## 📝 Files

- `load-test.js` - Main load test (2 minutes, products + cart)
- `smoke-test.js` - Quick smoke test (10 seconds, basic validation)

