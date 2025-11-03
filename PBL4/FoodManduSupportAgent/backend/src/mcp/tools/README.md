# MCP Tools Directory Structure

This directory contains all MCP tools split into separate files for easier debugging and maintenance.

## 📁 File Structure

```
tools/
├── index.js                 # Main entry point - exports all tools
├── utils.js                 # Shared utility functions
├── getOrderStatus.js       # Tool: Get order status
├── getLocationTracking.js  # Tool: Get location tracking
├── calculateETA.js         # Tool: Calculate ETA
├── getOrderDetails.js      # Tool: Get order details
├── getDriverInfo.js        # Tool: Get driver information
├── getProgressTracking.js  # Tool: Get progress tracking
└── getRouteInfo.js         # Tool: Get route information
```

## 🔧 How It Works

### 1. **Shared Utilities** (`utils.js`)

Contains helper functions used by all tools:

- `loadOrders()` - Loads orders from JSON file
- `findOrder(orderId)` - Finds an order by ID or order number

### 2. **Individual Tools**

Each tool is in its own file with:

- Tool definition (name, description, inputSchema)
- Handler function (async function that processes the request)

### 3. **Index File** (`index.js`)

Exports all tools for easy importing:

```javascript
import { getOrderStatus, calculateETA } from "./tools/index.js";
```

## 📝 Adding a New Tool

1. Create a new file: `getMyNewTool.js`
2. Import utilities: `import { findOrder } from "./utils.js";`
3. Export the tool object with `name`, `description`, `inputSchema`, and `handler`
4. Add export to `index.js`

Example:

```javascript
// tools/getMyNewTool.js
import { findOrder } from "./utils.js";

export const getMyNewTool = {
  name: "get_my_new_tool",
  description: "Description of the tool",
  inputSchema: { /* ... */ },
  handler: async ({ param1 }) => {
    const order = findOrder(param1);
    // Tool logic
    return { success: true, data: { ... } };
  }
};
```

Then add to `index.js`:

```javascript
import { getMyNewTool } from "./getMyNewTool.js";
export { getMyNewTool };
export const allTools = [..., getMyNewTool];
```

## 🐛 Debugging

Each tool is now isolated in its own file, making it easier to:

- Set breakpoints for specific tools
- Modify tool behavior without affecting others
- Test tools independently
- Understand tool logic at a glance

## 📦 Usage

Import from the main index:

```javascript
// Import all tools
import { allTools } from "./tools/index.js";

// Import specific tools
import { getOrderStatus, calculateETA } from "./tools/index.js";
```

The old `tools.js` file is kept for backward compatibility but just re-exports from `tools/index.js`.
