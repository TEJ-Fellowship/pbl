# 🔧 MCP (Model Context Protocol) Implementation Guide

## Overview

The FoodMandu Support Agent now includes a complete **MCP (Model Context Protocol)** implementation that breaks down order tracking features into granular, reusable tools. This allows for modular, composable order tracking operations.

---

## 📋 MCP Tools Breakdown

### 1. **Order Status Tool** (`get_order_status`)

- **Purpose**: Get the current status of an order
- **Input**: `{ orderId: string }`
- **Output**: Order status, current stage, raw status code
- **Use Case**: Quick status checks, status updates

### 2. **Location Tracking Tool** (`get_location_tracking`)

- **Purpose**: Get real-time location of delivery person
- **Input**: `{ orderId: string, userLat?: number, userLng?: number }`
- **Output**: Delivery person coordinates, destination, restaurant location
- **Use Case**: Live map tracking, location updates

### 3. **ETA Calculator Tool** (`calculate_eta`)

- **Purpose**: Calculate estimated time of arrival
- **Input**: `{ orderId: string }`
- **Output**: ETA in minutes, elapsed time, estimated delivery time
- **Use Case**: Delivery time estimates, time-based notifications

### 4. **Order Details Tool** (`get_order_details`)

- **Purpose**: Get complete order information
- **Input**: `{ orderId: string }`
- **Output**: Items, pricing, customer info, restaurant info
- **Use Case**: Order summary, order management

### 5. **Driver Information Tool** (`get_driver_info`)

- **Purpose**: Get driver/delivery person details
- **Input**: `{ orderId: string }`
- **Output**: Driver name, phone, vehicle info, ratings
- **Use Case**: Contact driver, driver information display

### 6. **Progress Tracking Tool** (`get_progress_tracking`)

- **Purpose**: Get order progress stages and timeline
- **Input**: `{ orderId: string }`
- **Output**: Progress steps, timeline, current stage
- **Use Case**: Progress bars, timeline display

### 7. **Route Information Tool** (`get_route_info`)

- **Purpose**: Get route details including road coordinates
- **Input**: `{ orderId: string, userLat?: number, userLng?: number }`
- **Output**: Route coordinates, distance, duration
- **Use Case**: Map routing, route visualization

---

## 🏗️ Architecture

### Backend Structure

```
backend/
├── src/
│   ├── mcp/
│   │   ├── tools.js          # MCP tool definitions
│   │   └── server.js          # MCP server wrapper
│   ├── controllers/
│   │   └── mcpController.js   # HTTP endpoints for MCP tools
│   └── routes/
│       └── qaRoutes.js        # Updated with MCP routes
```

### Frontend Structure

```
frontend/
├── src/
│   ├── services/
│   │   └── mcpClient.js      # MCP client service
│   ├── hooks/
│   │   └── useMCPTools.js    # React hook for MCP tools
│   └── components/
│       └── TrackOrderFlashcard.jsx  # Updated to use MCP tools
```

---

## 🚀 API Endpoints

### List Available Tools

```http
GET /api/mcp/tools
```

**Response:**

```json
{
  "success": true,
  "tools": [
    {
      "name": "get_order_status",
      "description": "Get the current status of an order by order ID",
      "inputSchema": { ... }
    },
    ...
  ],
  "count": 7
}
```

### Call Single Tool

```http
POST /api/mcp/tools/call
Content-Type: application/json

{
  "tool": "get_order_status",
  "args": {
    "orderId": "FM123"
  }
}
```

**Response:**

```json
{
  "success": true,
  "tool": "get_order_status",
  "data": {
    "orderId": "FM123",
    "status": "Order is on the Way",
    "currentStage": 3
  }
}
```

### Batch Call Tools

```http
POST /api/mcp/tools/batch
Content-Type: application/json

{
  "calls": [
    { "tool": "get_order_status", "args": { "orderId": "FM123" } },
    { "tool": "calculate_eta", "args": { "orderId": "FM123" } }
  ]
}
```

**Response:**

```json
{
  "success": true,
  "results": [
    {
      "tool": "get_order_status",
      "success": true,
      "data": { ... }
    },
    {
      "tool": "calculate_eta",
      "success": true,
      "data": { ... }
    }
  ]
}
```

---

## 💻 Usage Examples

### Frontend: Using MCP Client Service

```javascript
import * as mcpClient from "./services/mcpClient.js";

// Single tool call
const status = await mcpClient.getOrderStatus("FM123");

// Location tracking
const location = await mcpClient.getLocationTracking("FM123", 27.71, 85.33);

// Comprehensive tracking (combines multiple tools)
const tracking = await mcpClient.getComprehensiveTracking(
  "FM123",
  27.71,
  85.33
);
```

### Frontend: Using React Hook

```javascript
import { useMCPTools } from "./hooks/useMCPTools.js";

function MyComponent() {
  const { getOrderStatus, calculateETA, loading, error } = useMCPTools();

  useEffect(() => {
    const fetchData = async () => {
      const status = await getOrderStatus("FM123");
      const eta = await calculateETA("FM123");
    };
    fetchData();
  }, []);
}
```

### Backend: Direct Tool Usage

```javascript
import { handleToolCall } from "./mcp/server.js";

// Call a tool
const result = await handleToolCall("get_order_status", {
  orderId: "FM123",
});
```

---

## 🔄 Integration with Existing Code

The MCP implementation is **fully backward compatible**:

1. **Existing API Endpoints**: Still work as before

   - `GET /api/track` - Direct tracking endpoint
   - `GET /api/orders` - List all orders
   - `GET /api/orders/:orderId` - Get order by ID

2. **MCP Tools**: New modular approach

   - `POST /api/mcp/tools/call` - Call individual tool
   - `POST /api/mcp/tools/batch` - Call multiple tools
   - `GET /api/mcp/tools` - List available tools

3. **Frontend Component**: Toggle between MCP and Direct API
   - Development mode shows toggle button
   - Automatically falls back to direct API if MCP fails

---

## 🎯 Benefits of MCP Approach

1. **Modularity**: Each feature is a separate tool
2. **Composability**: Combine tools for complex operations
3. **Reusability**: Tools can be used across different contexts
4. **Extensibility**: Easy to add new tools
5. **Testability**: Each tool can be tested independently
6. **AI Integration**: MCP tools are compatible with AI assistants

---

## 📦 Installation & Setup

### Backend Dependencies

Already installed:

```bash
npm install @modelcontextprotocol/sdk
```

### Frontend Dependencies

No additional dependencies needed (uses native fetch API).

---

## 🔧 Configuration

### Environment Variables

No special configuration required. The MCP server uses the same backend configuration as the rest of the application.

### API Base URL

Frontend automatically detects API URL from:

- `VITE_API_URL` environment variable, or
- Falls back to `http://localhost:5000/api`

---

## 🧪 Testing

### Test MCP Tools Directly

```bash
# List tools
curl http://localhost:5000/api/mcp/tools

# Get order status
curl -X POST http://localhost:5000/api/mcp/tools/call \
  -H "Content-Type: application/json" \
  -d '{"tool": "get_order_status", "args": {"orderId": "FM123"}}'

# Calculate ETA
curl -X POST http://localhost:5000/api/mcp/tools/call \
  -H "Content-Type: application/json" \
  -d '{"tool": "calculate_eta", "args": {"orderId": "FM123"}}'
```

### Test in Frontend

1. Start backend: `cd backend && npm start`
2. Start frontend: `cd frontend && npm run dev`
3. Open tracking component
4. In development mode, toggle between MCP and Direct API
5. Check browser console for tool calls

---

## 🚀 Future Enhancements

1. **WebSocket Support**: Real-time tool updates
2. **Tool Caching**: Cache tool responses for performance
3. **Tool Versioning**: Support multiple versions of tools
4. **Tool Permissions**: Fine-grained access control
5. **Tool Analytics**: Track tool usage and performance
6. **AI Assistant Integration**: Connect MCP tools to AI assistants

---

## 📝 Tool Development Guide

### Adding a New Tool

1. **Define Tool in `tools.js`**:

```javascript
export const myNewTool = {
  name: "my_new_tool",
  description: "Description of what the tool does",
  inputSchema: {
    type: "object",
    properties: {
      param1: { type: "string", description: "..." }
    },
    required: ["param1"]
  },
  handler: async ({ param1 }) => {
    // Tool logic
    return {
      success: true,
      data: { ... }
    };
  }
};
```

2. **Register Tool in `server.js`**:

```javascript
import { myNewTool } from "./tools.js";

// Add to switch case
case "my_new_tool":
  result = await myNewTool.handler(args);
  break;

// Add to getAvailableTools()
{
  name: "my_new_tool",
  description: "...",
  inputSchema: myNewTool.inputSchema
}
```

3. **Add Frontend Client Method** (optional):

```javascript
export const myNewTool = async (param1) => {
  return await callTool("my_new_tool", { param1 });
};
```

---

## 🐛 Troubleshooting

### Tool Not Found

- Check tool name spelling
- Verify tool is registered in `server.js`
- Check API endpoint is accessible

### Tool Execution Fails

- Check backend logs for errors
- Verify input parameters match schema
- Ensure order data exists in database

### Frontend MCP Client Errors

- Verify API base URL is correct
- Check CORS settings in backend
- Verify network connectivity

---

## 📚 References

- [Model Context Protocol Documentation](https://modelcontextprotocol.io)
- [MCP SDK Documentation](https://github.com/modelcontextprotocol/sdk)

---

## ✨ Summary

The MCP implementation provides:

✅ **7 Order Tracking Tools** - Modular, reusable operations  
✅ **HTTP API Endpoints** - RESTful access to MCP tools  
✅ **Frontend Client** - Easy-to-use service and React hook  
✅ **Backward Compatible** - Works alongside existing API  
✅ **Production Ready** - Error handling and fallbacks

**Enjoy your modular order tracking system! 🎉**
