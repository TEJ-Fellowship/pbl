# 🧪 Testing MCP Tools - Complete Guide

## Method 1: Using the Test Script (Recommended)

### Step 1: Run the Test Script

```bash
cd backend
node test-mcp-tools.js
```

This will test all 7 tools with a sample order ID (`FM100001`).

### Step 2: Change the Order ID (Optional)

Edit `backend/test-mcp-tools.js` and change the `testOrderId` variable to test with different orders:

```javascript
const testOrderId = "FM100002"; // Use any order ID from orders.json
```

---

## Method 2: Testing via HTTP API

### Step 1: Start the Backend Server

```bash
cd backend
npm start
```

You should see:

```
🚀 Server running on port 5000
```

### Step 2: Test Using cURL

#### Test 1: List All Available Tools

```bash
curl http://localhost:5000/api/mcp/tools
```

Expected response:

```json
{
  "success": true,
  "tools": [...],
  "count": 7
}
```

#### Test 2: Get Order Status

```bash
curl -X POST http://localhost:5000/api/mcp/tools/call \
  -H "Content-Type: application/json" \
  -d '{"tool": "get_order_status", "args": {"orderId": "FM100001"}}'
```

Expected response:

```json
{
  "success": true,
  "tool": "get_order_status",
  "data": {
    "orderId": "FM100001",
    "status": "Order Ready for Delivery",
    ...
  }
}
```

#### Test 3: Get Location Tracking

```bash
curl -X POST http://localhost:5000/api/mcp/tools/call \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "get_location_tracking",
    "args": {
      "orderId": "FM100001",
      "userLat": 27.7100,
      "userLng": 85.3300
    }
  }'
```

#### Test 4: Calculate ETA

```bash
curl -X POST http://localhost:5000/api/mcp/tools/call \
  -H "Content-Type: application/json" \
  -d '{"tool": "calculate_eta", "args": {"orderId": "FM100001"}}'
```

#### Test 5: Get Order Details

```bash
curl -X POST http://localhost:5000/api/mcp/tools/call \
  -H "Content-Type: application/json" \
  -d '{"tool": "get_order_details", "args": {"orderId": "FM100001"}}'
```

#### Test 6: Get Driver Info

```bash
curl -X POST http://localhost:5000/api/mcp/tools/call \
  -H "Content-Type: application/json" \
  -d '{"tool": "get_driver_info", "args": {"orderId": "FM100001"}}'
```

#### Test 7: Get Progress Tracking

```bash
curl -X POST http://localhost:5000/api/mcp/tools/call \
  -H "Content-Type: application/json" \
  -d '{"tool": "get_progress_tracking", "args": {"orderId": "FM100001"}}'
```

#### Test 8: Get Route Info

```bash
curl -X POST http://localhost:5000/api/mcp/tools/call \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "get_route_info",
    "args": {
      "orderId": "FM100001",
      "userLat": 27.7100,
      "userLng": 85.3300
    }
  }'
```

#### Test 9: Batch Call (Multiple Tools)

```bash
curl -X POST http://localhost:5000/api/mcp/tools/batch \
  -H "Content-Type: application/json" \
  -d '{
    "calls": [
      {"tool": "get_order_status", "args": {"orderId": "FM100001"}},
      {"tool": "calculate_eta", "args": {"orderId": "FM100001"}},
      {"tool": "get_location_tracking", "args": {"orderId": "FM100001"}}
    ]
  }'
```

---

## Method 3: Testing via Frontend

### Step 1: Start Both Servers

**Terminal 1 - Backend:**

```bash
cd backend
npm start
```

**Terminal 2 - Frontend:**

```bash
cd frontend
npm run dev
```

### Step 2: Open Browser Console

1. Open `http://localhost:5173`
2. Press `F12` to open Developer Tools
3. Go to the **Console** tab

### Step 3: Test Tools via Browser Console

```javascript
// Test getOrderStatus
const status = await fetch("http://localhost:5000/api/mcp/tools/call", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    tool: "get_order_status",
    args: { orderId: "FM100001" },
  }),
}).then((r) => r.json());
console.log(status);

// Test calculateETA
const eta = await fetch("http://localhost:5000/api/mcp/tools/call", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    tool: "calculate_eta",
    args: { orderId: "FM100001" },
  }),
}).then((r) => r.json());
console.log(eta);
```

### Step 4: Test via Tracking Component

1. Enter an order ID (e.g., "FM100001")
2. Click "Track Order"
3. The component should automatically use MCP tools
4. Check the Network tab in DevTools to see API calls
5. In development mode, you'll see a toggle button to switch between MCP and Direct API

---

## Method 4: Testing Individual Tool Files

### Direct Import Test

Create a test file `test-single-tool.js`:

```javascript
import { getOrderStatus } from "./src/mcp/tools/getOrderStatus.js";

const result = await getOrderStatus.handler({ orderId: "FM100001" });
console.log(result);
```

Run:

```bash
node test-single-tool.js
```

---

## Method 5: Using Postman or Thunder Client

### Setup

1. **Base URL**: `http://localhost:5000/api`
2. **Method**: `POST`
3. **Headers**:
   - `Content-Type: application/json`

### Test Endpoints

1. **List Tools**: `GET http://localhost:5000/api/mcp/tools`
2. **Call Tool**: `POST http://localhost:5000/api/mcp/tools/call`
   ```json
   {
     "tool": "get_order_status",
     "args": {
       "orderId": "FM100001"
     }
   }
   ```
3. **Batch Call**: `POST http://localhost:5000/api/mcp/tools/batch`
   ```json
   {
     "calls": [
       { "tool": "get_order_status", "args": { "orderId": "FM100001" } },
       { "tool": "calculate_eta", "args": { "orderId": "FM100001" } }
     ]
   }
   ```

---

## ✅ Expected Results

### Success Response Format

All tools should return:

```json
{
  "success": true,
  "tool": "tool_name",
  "data": {
    // Tool-specific data
  },
  "timestamp": "2025-01-21T10:00:00.000Z"
}
```

### Error Response Format

```json
{
  "success": false,
  "tool": "tool_name",
  "error": "Error message",
  "timestamp": "2025-01-21T10:00:00.000Z"
}
```

---

## 🐛 Troubleshooting

### Issue: "Order not found"

**Solution**: Verify the order ID exists in `backend/src/dummy data/orders.json`

```bash
# Check if order exists
grep -i "FM100001" backend/src/dummy\ data/orders.json
```

### Issue: "Cannot find module"

**Solution**: Make sure you're in the correct directory and modules are installed

```bash
cd backend
npm install
node test-mcp-tools.js
```

### Issue: "Tool not found"

**Solution**: Verify the tool name is correct (check spelling)

```bash
# List available tools
curl http://localhost:5000/api/mcp/tools
```

### Issue: Port 5000 already in use

**Solution**: Change the port in `.env` or stop the conflicting process

```bash
# Find process using port 5000
netstat -ano | findstr :5000

# Kill process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

### Issue: CORS errors in browser

**Solution**: Check CORS settings in `backend/src/index.js`

---

## 📊 Quick Verification Checklist

- [ ] Backend server starts without errors
- [ ] `/api/mcp/tools` returns list of 7 tools
- [ ] Each tool can be called individually
- [ ] Tools return `success: true` for valid order IDs
- [ ] Tools return `success: false` for invalid order IDs
- [ ] Batch call works with multiple tools
- [ ] Frontend component can use MCP tools
- [ ] Test script runs all tests successfully

---

## 🎯 Quick Test Commands

```bash
# Quick test all tools
cd backend && node test-mcp-tools.js

# Test API endpoint
curl http://localhost:5000/api/mcp/tools

# Test single tool
curl -X POST http://localhost:5000/api/mcp/tools/call \
  -H "Content-Type: application/json" \
  -d '{"tool": "get_order_status", "args": {"orderId": "FM100001"}}'
```

---

## 💡 Tips

1. **Use the test script first** - It's the fastest way to verify all tools
2. **Check server logs** - Look for errors or warnings in the terminal
3. **Test with different order IDs** - Some orders might be in different states
4. **Use browser DevTools** - Network tab shows all API calls
5. **Test edge cases** - Try invalid order IDs, missing parameters, etc.

---

**Happy Testing! 🚀**
