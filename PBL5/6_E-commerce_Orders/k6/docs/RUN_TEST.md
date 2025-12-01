# 🚀 Run k6 Load Test - Quick Command

## Single Command to Run Load Test

```bash
cd /home/ganesh/project/pbl/PBL5/6_E-commerce_Orders/k6 && k6 run load-test.js
```

## Alternative: Run from Project Root

```bash
cd /home/ganesh/project/pbl/PBL5/6_E-commerce_Orders
k6 run k6/load-test.js
```

## If Backend is on Different Port

```bash
# Backend on port 3000
BASE_URL=http://localhost:3000 k6 run k6/load-test.js

# Backend through nginx on port 80
BASE_URL=http://localhost k6 run k6/load-test.js
```

## Quick Smoke Test (Verify Setup First)

```bash
cd /home/ganesh/project/pbl/PBL5/6_E-commerce_Orders/k6
k6 run smoke-test.js
```

---

## ✅ Before Running

1. **Ensure backend is running**:
   ```bash
   curl http://localhost:3001/api/health
   ```

2. **Verify k6 is installed**:
   ```bash
   k6 version
   ```

---

## 📊 Test Duration

- **Full Load Test**: ~4 minutes
- **Smoke Test**: 10 seconds

---

## 📈 What You'll See

- Real-time metrics (requests/sec, response times)
- Threshold checks (✓ pass / ✗ fail)
- Final summary with all performance metrics

---

**That's it! Just run the command above to start load testing.** 🎯

