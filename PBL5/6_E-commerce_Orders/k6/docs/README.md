# k6 Load Testing Setup

This directory contains k6 load testing scripts for the E-commerce Order Processing System.

## Prerequisites

1. **k6 installed** - You mentioned k6 is already installed on your Linux system
2. **Backend server running** - The backend should be running on `http://localhost:3001` (or configure via environment variable)
3. **Database and Redis** - Ensure PostgreSQL and Redis are running

## Quick Start

### 1. Verify k6 Installation

```bash
k6 version
```

### 2. Ensure Backend is Running

```bash
# In the backend directory
cd backend
npm start

# Or if using docker-compose
cd ../
docker-compose up -d
```

### 3. Verify API is Accessible

```bash
curl http://localhost:3001/api/health
```

Expected response:
```json
{
  "success": true,
  "message": "API is healthy",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 4. Run Load Test

**Basic test (default configuration):**
```bash
cd k6
k6 run load-test.js
```

**With custom base URL (if backend is on different port):**
```bash
BASE_URL=http://localhost:3000 k6 run load-test.js
```

**With nginx (if nginx is running on port 80):**
```bash
BASE_URL=http://localhost k6 run load-test.js
```

## Test Configuration

The load test script (`load-test.js`) includes:

### Test Stages (Ramp-up Pattern)
- **Ramp-up**: 0 → 20 users over 30 seconds
- **Normal Load**: 20 users for 1 minute
- **Spike**: 20 → 50 users over 30 seconds (simulating flash sale)
- **Sustained Spike**: 50 users for 30 seconds
- **Ramp-down**: 50 → 10 users over 30 seconds
- **Low Load**: 10 users for 30 seconds
- **Complete**: 10 → 0 users over 20 seconds

**Total Test Duration**: ~4 minutes

### Simulated User Scenarios

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

7. **Checkout** (30% of users with items in cart)
   - POST `/api/orders/checkout`

8. **Health Check** (10% of iterations)
   - GET `/api/health`

### Performance Thresholds

The test will **FAIL** if:
- ❌ 95th percentile response time > 1000ms
- ❌ 99th percentile response time > 2000ms
- ❌ Error rate > 1%
- ❌ Product page duration (95th percentile) > 800ms
- ❌ Cart operation duration (95th percentile) > 500ms
- ❌ Checkout duration (95th percentile) > 2000ms

The test will **PASS** if all thresholds are met.

## Customization

### Change Base URL

Set environment variable:
```bash
BASE_URL=http://localhost:3000 k6 run load-test.js
```

Or modify the `BASE_URL` constant in `load-test.js`:
```javascript
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';
```

### Adjust Load Pattern

Edit the `stages` in `load-test.js`:
```javascript
export const options = {
  stages: [
    { duration: '30s', target: 10 },  // Ramp to 10 users
    { duration: '1m', target: 10 },     // Stay at 10
    { duration: '30s', target: 0 },     // Ramp down
  ],
  // ...
};
```

### Adjust Thresholds

Edit the `thresholds` in `load-test.js`:
```javascript
thresholds: {
  http_req_duration: ['p(95)<500'],  // Stricter: 95% < 500ms
  http_req_failed: ['rate<0.005'],   // Stricter: < 0.5% errors
  // ...
},
```

## Understanding Results

### Key Metrics

- **http_req_duration**: Response time for all HTTP requests
  - `avg`: Average response time
  - `min`: Minimum response time
  - `med`: Median (50th percentile)
  - `p(90)`: 90th percentile
  - `p(95)`: 95th percentile
  - `p(99)`: 99th percentile
  - `max`: Maximum response time

- **http_req_failed**: Percentage of failed requests
- **vus**: Virtual users (concurrent users)
- **iterations**: Total number of test iterations
- **data_received/data_sent**: Network traffic

### Example Output

```
✓ browse products status 200
✓ browse products has data
✓ product detail status 200
✓ add to cart status 200 or 201
✓ checkout status 200 or 201

checks.........................: 95.00% ✓ 1900   ✗ 100
data_received..................: 2.5 MB  10 kB/s
data_sent......................: 450 kB  1.8 kB/s
http_req_duration..............: avg=245ms min=50ms med=200ms max=1200ms p(90)=450ms p(95)=680ms p(99)=980ms
http_req_failed................: 0.50%   ✓ 10    ✗ 1990
iterations.....................: 200     0.8/s
vus............................: 20      min=0    max=50
```

## Troubleshooting

### Error: "API health check failed"

**Solution**: Make sure backend is running
```bash
# Check if backend is running
curl http://localhost:3001/api/health

# If not running, start it
cd backend
npm start
```

### Error: "Connection refused"

**Solution**: Check the port number
```bash
# Backend might be on port 3000 instead of 3001
BASE_URL=http://localhost:3000 k6 run load-test.js
```

### High Error Rate

**Possible Causes**:
1. Backend not handling load (check server logs)
2. Database connection issues
3. Redis not running (caching disabled, but should still work)
4. Rate limiting (nginx or backend)

**Debug Steps**:
1. Check backend logs for errors
2. Verify database is accessible
3. Check Redis connection
4. Reduce load in test (lower `target` in stages)

### Slow Response Times

**Possible Causes**:
1. Database queries not optimized
2. Missing indexes
3. No caching (Redis not running)
4. Backend server resource limits

**Debug Steps**:
1. Check database query performance
2. Verify Redis is running and caching
3. Monitor server CPU/memory usage
4. Check for slow queries in database logs

## Advanced Usage

### Run with Different Scenarios

Create multiple test files for different scenarios:
- `smoke-test.js` - Light load (1-5 users)
- `load-test.js` - Normal load (current)
- `stress-test.js` - High load (100+ users)
- `spike-test.js` - Sudden traffic spike

### Generate HTML Report

```bash
k6 run --out json=results.json load-test.js
# Then use k6-to-influxdb or other tools to visualize
```

### Run in CI/CD

```bash
# Exit with error code if thresholds fail
k6 run load-test.js
```

## Notes

- **Session Management**: Each virtual user gets a unique session ID
- **Think Time**: Random delays between actions simulate real user behavior
- **No Data Pollution**: Tests use session-based carts, so data is isolated per VU
- **Safe for Staging**: Tests are designed to be safe for staging environments

## Support

For issues or questions:
1. Check backend logs: `cd backend && npm start`
2. Verify API endpoints: `curl http://localhost:3001/api/health`
3. Check k6 documentation: https://k6.io/docs/

