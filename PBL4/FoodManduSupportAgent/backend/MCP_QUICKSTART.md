# 🚀 MCP Quick Start Guide

Get your TRUE Model Context Protocol server running in 5 minutes!

---

## Prerequisites

- Node.js installed
- Claude Desktop installed (optional, for testing)

---

## Step 1: Install Dependencies

```bash
cd backend
npm install
```

Verify MCP SDK is installed:
```bash
npm list @modelcontextprotocol/sdk
```

Should show: `@modelcontextprotocol/sdk@1.20.2`

---

## Step 2: Start the MCP Server

```bash
npm run mcp-server
```

You should see:
```
🚀 Starting TRUE MCP Server for Foodmandu Support Agent
📡 Protocol: Model Context Protocol (JSON-RPC 2.0)
🔌 Transport: stdio (Standard Input/Output)
📦 Tools available: 16

Waiting for MCP client connection...
✅ MCP Server connected and ready!
```

**Keep this terminal running!**

---

## Step 3: Test with MCP Inspector

Open a new terminal:

```bash
cd backend
npm run mcp-inspect
```

This will:
1. Start the MCP Inspector
2. Open your browser to http://localhost:6000
3. Show your server in the inspector

### In the Inspector:

1. Click **"Connect"**
2. Click **"List Tools"** - should show 16 tools
3. Select a tool (e.g., `get_order_status`)
4. Fill in test data:
   ```json
   {
     "orderId": "FM100001"
   }
   ```
5. Click **"Call Tool"**
6. See the response!

---

## Step 4: Connect to Claude Desktop (Optional)

### Find Your Absolute Path

```bash
# On Mac/Linux:
pwd

# On Windows (in PowerShell):
Get-Location

# Example output:
# C:\Users\asus\Documents\pbl\PBL4\FoodManduSupportAgent
```

### Create/Edit Claude Config

**macOS:**
```bash
nano ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

**Windows:**
```powershell
notepad %APPDATA%\Claude\claude_desktop_config.json
```

**Linux:**
```bash
nano ~/.config/Claude/claude_desktop_config.json
```

### Add This Configuration

Replace `/ABSOLUTE/PATH` with your actual path:

```json
{
  "mcpServers": {
    "foodmandu": {
      "command": "node",
      "args": [
        "/ABSOLUTE/PATH/TO/backend/src/mcp/mcpServer.js"
      ]
    }
  }
}
```

**Windows Example:**
```json
{
  "mcpServers": {
    "foodmandu": {
      "command": "node",
      "args": [
        "C:\\Users\\asus\\Documents\\pbl\\PBL4\\FoodManduSupportAgent\\backend\\src\\mcp\\mcpServer.js"
      ]
    }
  }
}
```

**Mac/Linux Example:**
```json
{
  "mcpServers": {
    "foodmandu": {
      "command": "node",
      "args": [
        "/Users/yourname/projects/FoodManduSupportAgent/backend/src/mcp/mcpServer.js"
      ]
    }
  }
}
```

### Restart Claude Desktop

1. **Completely quit** Claude Desktop (not just close window)
2. **Relaunch** Claude Desktop
3. Look for 🔌 or "Tools" icon

### Test in Claude

Try these prompts:

```
What tools do you have access to?
```

```
Can you check the status of order FM100001?
```

```
What's the current weather in Kathmandu?
```

```
Validate this address: Thamel, Kathmandu
```

Claude should use your MCP tools automatically! 🎉

---

## Troubleshooting

### "Command not found: node"

**Solution:** Add Node.js to PATH

```bash
# Check node location
which node  # Mac/Linux
where node  # Windows

# Add to Claude config with full path
{
  "mcpServers": {
    "foodmandu": {
      "command": "/usr/local/bin/node",  # Use actual path
      "args": ["..."]
    }
  }
}
```

### "ENOENT: no such file or directory"

**Problem:** Wrong path in config

**Solution:** 
1. Copy the **absolute path** exactly
2. Use forward slashes `/` on all platforms (JSON accepts this)
3. Or escape backslashes on Windows: `C:\\Users\\...`

### "Server not responding"

**Solution:**
1. Test manually: `node /path/to/mcpServer.js`
2. Check for errors
3. Verify all dependencies installed: `npm install`

### Claude Desktop doesn't show tools

**Solution:**
1. Check Claude Desktop logs:
   - Mac: `~/Library/Logs/Claude/mcp*.log`
   - Windows: `%APPDATA%\Claude\logs\`
2. Look for error messages
3. Verify JSON is valid: https://jsonlint.com/

---

## What's Next?

✅ **You now have TRUE MCP running!**

### Explore:

1. **Read Full Docs:** `backend/src/mcp/README_MCP.md`
2. **Add Custom Tools:** See "Contributing" section
3. **Monitor Logs:** Watch MCP server terminal for debug info
4. **Test All Tools:** Use MCP Inspector to try each tool
5. **Integrate:** Use tools in your Claude conversations!

---

## Available Tools Reference

| Tool | Description | Example |
|------|-------------|---------|
| `get_order_status` | Order status | `"orderId": "FM100001"` |
| `get_location_tracking` | Track delivery | `"orderId": "FM100001"` |
| `calculate_eta` | Estimate arrival | `"orderId": "FM100001"` |
| `check_weather_delay` | Weather impact | `"location": "Kathmandu"` |
| `validate_address` | Check address | `"address": "Thamel"` |
| `web_search_restaurant` | Search restaurant | `"restaurantName": "Momo Hut"` |
| `check_festival_schedule` | Festival dates | `{}` (no args) |
| `suggest_festival_food` | Festival foods | `"festival": "Dashain"` |
| `get_current_weather` | Current weather | `"location": "Kathmandu"` |

See full list in docs!

---

## Success! 🎉

You're now running a **TRUE Model Context Protocol server** that:

✅ Uses official MCP SDK  
✅ Implements JSON-RPC 2.0  
✅ Connects via stdio transport  
✅ Works with Claude Desktop  
✅ Provides 16 powerful tools  

**Welcome to the MCP ecosystem!** 🚀




