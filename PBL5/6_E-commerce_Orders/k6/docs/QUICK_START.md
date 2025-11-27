# Quick Start - k6 Load Testing

## 🚀 Run Load Test (One Command)

```bash
cd /home/ganesh/project/pbl/PBL5/6_E-commerce_Orders/k6
k6 run load-test.js
```

## ✅ Prerequisites Check

Before running, ensure:

1. **Backend is running**:

   ```bash
   # Check if backend is accessible
   curl http://localhost:3000/api/health
   ```

2. **k6 is installed**:
   ```bash
   k6 version
   # Should show: k6 v1.4.2 or similar
   ```

## 📋 Test Commands

### Full Load Test (Recommended)

```bash
cd k6
k6 run load-test.js
```

### Quick Smoke Test (Verify Setup)

```bash
cd k6
k6 run smoke-test.js
```

### Custom Base URL

```bash
# If backend is on port 3000
BASE_URL=http://localhost:3000 k6 run load-test.js

# If using nginx on port 80
BASE_URL=http://localhost k6 run load-test.js
```

## 📊 What the Test Does

- **Duration**: ~4 minutes
- **Max Users**: 50 concurrent users
- **Scenarios**: Browse products, view details, add to cart, checkout
- **Thresholds**: Tests will fail if performance degrades

## ⚠️ Troubleshooting

### "API health check failed"

```bash
# Start backend first
cd ../backend
npm start
```

### "Connection refused"

```bash
# Check what port backend is on
# Then use: BASE_URL=http://localhost:PORT k6 run load-test.js
```

## 📈 Expected Output

You should see:

- ✅ Real-time metrics (requests/sec, response times)
- ✅ Threshold checks (pass/fail)
- ✅ Summary at the end with all metrics

Test **PASSES** if all thresholds are green ✓
Test **FAILS** if any threshold is red ✗
