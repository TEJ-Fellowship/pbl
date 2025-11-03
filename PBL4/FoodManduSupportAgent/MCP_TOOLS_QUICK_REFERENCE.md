# 🔧 MCP Tools Quick Reference

## Available Tools

| Tool Name               | Purpose                      | Required Args | Optional Args        |
| ----------------------- | ---------------------------- | ------------- | -------------------- |
| `get_order_status`      | Get order status             | `orderId`     | -                    |
| `get_location_tracking` | Get delivery person location | `orderId`     | `userLat`, `userLng` |
| `calculate_eta`         | Calculate delivery ETA       | `orderId`     | -                    |
| `get_order_details`     | Get complete order info      | `orderId`     | -                    |
| `get_driver_info`       | Get driver information       | `orderId`     | -                    |
| `get_progress_tracking` | Get progress stages          | `orderId`     | -                    |
| `get_route_info`        | Get route coordinates        | `orderId`     | `userLat`, `userLng` |

---

## Quick Examples

### Backend API Call

```bash
# Get order status
curl -X POST http://localhost:5000/api/mcp/tools/call \
  -H "Content-Type: application/json" \
  -d '{"tool": "get_order_status", "args": {"orderId": "FM123"}}'

# Get location with user coordinates
curl -X POST http://localhost:5000/api/mcp/tools/call \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "get_location_tracking",
    "args": {
      "orderId": "FM123",
      "userLat": 27.7100,
      "userLng": 85.3300
    }
  }'
```

### Frontend JavaScript

```javascript
import * as mcpClient from "./services/mcpClient.js";

// Get status
const status = await mcpClient.getOrderStatus("FM123");

// Get location
const location = await mcpClient.getLocationTracking("FM123", 27.71, 85.33);

// Get ETA
const eta = await mcpClient.calculateETA("FM123");

// Comprehensive tracking (all tools combined)
const tracking = await mcpClient.getComprehensiveTracking(
  "FM123",
  27.71,
  85.33
);
```

### React Hook

```javascript
import { useMCPTools } from "./hooks/useMCPTools.js";

function MyComponent() {
  const { getOrderStatus, calculateETA, loading, error } = useMCPTools();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const status = await getOrderStatus("FM123");
        const eta = await calculateETA("FM123");
        console.log(status, eta);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);
}
```

---

## Tool Response Formats

### `get_order_status`

```json
{
  "success": true,
  "data": {
    "orderId": "FM123",
    "orderNumber": "ORD-2025-000001",
    "status": "Order is on the Way",
    "rawStatus": "on_the_way",
    "currentStage": 3,
    "timestamp": "2025-01-21T10:00:00Z"
  }
}
```

### `get_location_tracking`

```json
{
  "success": true,
  "data": {
    "orderId": "FM123",
    "deliveryPerson": {
      "lat": 27.7136,
      "lng": 85.327,
      "lastUpdated": "2025-01-21T10:00:00Z"
    },
    "destination": {
      "lat": 27.71,
      "lng": 85.33
    },
    "restaurant": {
      "lat": 27.7172,
      "lng": 85.324
    }
  }
}
```

### `calculate_eta`

```json
{
  "success": true,
  "data": {
    "orderId": "FM123",
    "eta": 2,
    "elapsedMinutes": 6,
    "estimatedDeliveryTime": "2025-01-21T10:08:00Z",
    "orderPlacedAt": "2025-01-21T10:00:00Z",
    "status": "on_the_way",
    "currentStage": 3
  }
}
```

---

## Batch Operations

```javascript
// Call multiple tools at once
const results = await mcpClient.batchCallTools([
  { tool: "get_order_status", args: { orderId: "FM123" } },
  { tool: "calculate_eta", args: { orderId: "FM123" } },
  { tool: "get_location_tracking", args: { orderId: "FM123" } },
]);

// Results array contains responses for each tool
results.forEach((result) => {
  console.log(result.tool, result.success, result.data);
});
```

---

## Error Handling

All tools return responses in this format:

```json
{
  "success": true | false,
  "data": { ... } | null,
  "error": "Error message" | null
}
```

Always check `success` before using `data`:

```javascript
const result = await mcpClient.getOrderStatus("FM123");
if (result.success) {
  console.log("Status:", result.data.status);
} else {
  console.error("Error:", result.error);
}
```

---

## Tips

1. **Use `getComprehensiveTracking()`** for full tracking data in one call
2. **Batch multiple calls** when you need several pieces of data
3. **Handle errors gracefully** - always check `success` flag
4. **Provide user coordinates** when available for better location tracking
5. **Cache responses** for better performance in production
