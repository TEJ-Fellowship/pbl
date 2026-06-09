# 🎯 TRUE Model Context Protocol (MCP) Implementation

## Overview

This directory contains a **TRUE implementation** of the Model Context Protocol (MCP) using the official `@modelcontextprotocol/sdk`.

### What is MCP?

Model Context Protocol is a standard for connecting AI assistants (like Claude) to external tools and data sources. It uses JSON-RPC 2.0 over stdio (standard input/output) for communication.

**Official Spec:** https://modelcontextprotocol.io/

---

## 🏗️ Architecture

### Dual Interface Design

```
┌─────────────────────────────────────────────────────────────┐
│                    TOOL CORE LOGIC                           │
│                  (Tool Definitions)                          │
└─────────────────────┬───────────────────────────────────────┘
                      │
          ┌───────────┴───────────┐
          │                       │
          ▼                       ▼
┌─────────────────┐     ┌─────────────────┐
│   MCP Server    │     │   HTTP Server   │
│   (mcpServer.js)│     │   (server.js)   │
│                 │     │                 │
│ • stdio/JSON-RPC│     │ • REST API      │
│ • Claude Desktop│     │ • Web Frontend  │
└─────────────────┘     └─────────────────┘
          │                       │
          ▼                       ▼
┌─────────────────┐     ┌─────────────────┐
│ Claude Desktop  │     │  React Web App  │
└─────────────────┘     └─────────────────┘
```

### Key Components

1. **`mcpServer.js`** - TRUE MCP server implementing JSON-RPC 2.0
2. **`toolExecutor.js`** - Shared tool execution logic
3. **`server.js`** - HTTP wrapper for web clients
4. **`tools/`** - Tool definitions (16 tools)

---

## 🚀 Quick Start

### 1. Start MCP Server (for Claude Desktop)

```bash
cd backend
npm run mcp-server
```

Output:
```
🚀 Starting TRUE MCP Server for Foodmandu Support Agent
📡 Protocol: Model Context Protocol (JSON-RPC 2.0)
🔌 Transport: stdio (Standard Input/Output)
📦 Tools available: 16

Waiting for MCP client connection...
✅ MCP Server connected and ready!
```

### 2. Start HTTP Server (for Web App)

```bash
cd backend
npm run dev
```

### 3. Test with MCP Inspector

```bash
cd backend
npm run mcp-inspect
```

This opens a web UI to test your MCP server.

---

## 🔧 Claude Desktop Integration

### Step 1: Locate Config File

**macOS:**
```bash
~/Library/Application Support/Claude/claude_desktop_config.json
```

**Windows:**
```
%APPDATA%\Claude\claude_desktop_config.json
```

**Linux:**
```bash
~/.config/Claude/claude_desktop_config.json
```

### Step 2: Add Server Configuration

Edit the config file:

```json
{
  "mcpServers": {
    "foodmandu-support-agent": {
      "command": "node",
      "args": [
        "/ABSOLUTE/PATH/TO/backend/src/mcp/mcpServer.js"
      ]
    }
  }
}
```

**⚠️ Important:** Use the **absolute path** to `mcpServer.js` on your system!

**Example (Windows):**
```json
{
  "mcpServers": {
    "foodmandu-support-agent": {
      "command": "node",
      "args": [
        "C:\\Users\\asus\\Documents\\pbl\\PBL4\\FoodManduSupportAgent\\backend\\src\\mcp\\mcpServer.js"
      ]
    }
  }
}
```

### Step 3: Restart Claude Desktop

After editing the config:
1. Quit Claude Desktop completely
2. Relaunch Claude Desktop
3. Look for the 🔌 icon indicating MCP tools are connected

### Step 4: Test in Claude

Try asking:
```
Can you check the status of order FM100001?
```

Claude will use the `get_order_status` tool automatically!

---

## 📦 Available Tools (16 Total)

### Order Tracking Tools
1. **`get_order_status`** - Get current order status
2. **`get_order_details`** - Get complete order information
3. **`get_location_tracking`** - Track delivery person location
4. **`calculate_eta`** - Calculate estimated arrival time
5. **`get_driver_info`** - Get driver details
6. **`get_progress_tracking`** - Get order progress stages
7. **`get_route_info`** - Get delivery route details

### Support Tools
8. **`check_weather_delay`** - Check weather impact on delivery
9. **`validate_address`** - Validate Kathmandu Valley addresses
10. **`check_payment_status`** - Check eSewa/Khalti status
11. **`web_search_restaurant`** - Search restaurant info

### Regional & Cultural Tools
12. **`check_festival_schedule`** - Check Nepali festival dates
13. **`suggest_festival_food`** - Get festival food suggestions
14. **`get_regional_preferences`** - Get regional food preferences
15. **`get_current_weather`** - Get current weather
16. **`suggest_weather_based_food`** - Weather-based food suggestions

---

## 🧪 Testing Your MCP Server

### Method 1: MCP Inspector (Recommended)

```bash
npm run mcp-inspect
```

This opens `http://localhost:6000` with a web UI to:
- List all tools
- Call tools with test data
- View JSON-RPC messages
- Debug issues

### Method 2: Manual stdio Test

```bash
# Start server
npm run mcp-server

# In another terminal, send JSON-RPC request
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | node src/mcp/mcpServer.js
```

### Method 3: Claude Desktop

1. Configure Claude Desktop (see above)
2. Restart Claude
3. Ask: "What tools do you have access to?"
4. Claude should list your Foodmandu tools

---

## 📊 MCP vs HTTP Comparison

| Feature | MCP Server | HTTP Server |
|---------|------------|-------------|
| **Protocol** | JSON-RPC 2.0 | REST API |
| **Transport** | stdio | HTTP |
| **Client** | Claude Desktop | Web Browser |
| **Port** | N/A (stdio) | 5000 |
| **Format** | MCP spec | Custom JSON |
| **Tool Discovery** | `tools/list` | `GET /api/mcp/tools` |
| **Tool Execution** | `tools/call` | `POST /api/mcp/tools/call` |
| **Use Case** | AI assistants | Web frontend |

**Both use the same tool execution logic via `toolExecutor.js`!**

---

## 🔍 Troubleshooting

### "Server not found" in Claude Desktop

**Problem:** Claude can't find your MCP server

**Solutions:**
1. Check the path in `claude_desktop_config.json` is **absolute**
2. Verify `node` is in your PATH: `which node` (Mac/Linux) or `where node` (Windows)
3. Test manually: `node /absolute/path/to/mcpServer.js`
4. Check Claude Desktop logs:
   - macOS: `~/Library/Logs/Claude/`
   - Windows: `%APPDATA%\Claude\logs\`

### "Tools not appearing in Claude"

**Problem:** MCP server running but tools don't show

**Solutions:**
1. **Restart Claude Desktop** (not just reload)
2. Check server logs in terminal
3. Verify config JSON is valid (use https://jsonlint.com/)
4. Test with MCP Inspector first

### "Module not found" errors

**Problem:** Import errors when starting server

**Solutions:**
```bash
cd backend
npm install
```

Make sure `@modelcontextprotocol/sdk` is installed.

### "Permission denied" on macOS/Linux

**Problem:** Can't execute script

**Solution:**
```bash
chmod +x backend/src/mcp/mcpServer.js
```

---

## 🎓 How It Works

### 1. MCP Server Initialization

```javascript
// mcpServer.js
const server = new Server({
  name: "foodmandu-support-agent",
  version: "1.0.0"
}, {
  capabilities: { tools: {} }
});
```

### 2. Tool Registration

```javascript
// Register tools/list handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: allTools.map(t => ({
    name: t.name,
    description: t.description,
    inputSchema: t.inputSchema
  }))};
});
```

### 3. Tool Execution

```javascript
// Register tools/call handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const result = await executeToolHandler(name, args);
  return { content: [{ type: "text", text: JSON.stringify(result) }] };
});
```

### 4. Connection via stdio

```javascript
const transport = new StdioServerTransport();
await server.connect(transport);
```

Claude Desktop launches your server as a subprocess and communicates via stdin/stdout using JSON-RPC 2.0.

---

## 📚 Further Reading

- **MCP Documentation:** https://modelcontextprotocol.io/
- **MCP SDK on npm:** https://www.npmjs.com/package/@modelcontextprotocol/sdk
- **Example MCP Servers:** https://github.com/modelcontextprotocol/servers
- **Claude Desktop:** https://claude.ai/download

---

## 🤝 Contributing

### Adding a New Tool

1. Create tool file in `tools/`:
```javascript
// tools/myNewTool.js
export const myNewTool = {
  name: "my_new_tool",
  description: "Description",
  inputSchema: { type: "object", properties: {...} },
  handler: async (args) => {
    // Implementation
    return { success: true, data: {...} };
  }
};
```

2. Export in `tools/index.js`:
```javascript
import { myNewTool } from "./myNewTool.js";
export { myNewTool };
export const allTools = [..., myNewTool];
```

3. Add to `toolExecutor.js`:
```javascript
const toolHandlers = {
  // ...
  my_new_tool: myNewTool.handler,
};
```

4. Restart MCP server - tool is automatically available!

---

## ✅ Verification Checklist

- [x] MCP SDK installed: `@modelcontextprotocol/sdk`
- [x] MCP Server uses `Server` class from SDK
- [x] stdio transport implemented
- [x] JSON-RPC 2.0 protocol used
- [x] Tools registered via `setRequestHandler`
- [x] Can connect to Claude Desktop
- [x] HTTP API still works for web frontend
- [x] Shared tool executor for consistency
- [x] Documentation complete

**This is a TRUE MCP implementation! 🎉**

---

*Last Updated: $(date)*
*Version: 1.0.0*




