# 🎯 Using Your TRUE MCP Server

## Quick Commands Reference

### Start MCP Server (for Claude Desktop)
```bash
cd backend
npm run mcp-server
```

### Test with MCP Inspector
```bash
cd backend
npm run mcp-inspect
```

### Start HTTP Server (for Web App)
```bash
cd backend
npm run dev
```

---

## 🔧 Claude Desktop Setup (Step-by-Step)

### 1. Find Your Absolute Path
```bash
# Mac/Linux:
cd /path/to/your/project/backend/src/mcp
pwd
# Copy the output + /mcpServer.js

# Windows (PowerShell):
cd C:\path\to\your\project\backend\src\mcp
Get-Location
# Copy the output + \mcpServer.js
```

### 2. Edit Claude Desktop Config

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

### 3. Add Configuration

Paste this (replace the path with YOUR path from step 1):

```json
{
  "mcpServers": {
    "foodmandu-support": {
      "command": "node",
      "args": [
        "PUT_YOUR_ABSOLUTE_PATH_HERE/mcpServer.js"
      ]
    }
  }
}
```

**Windows Example:**
```json
{
  "mcpServers": {
    "foodmandu-support": {
      "command": "node",
      "args": [
        "C:\\Users\\asus\\Documents\\pbl\\PBL4\\FoodManduSupportAgent\\backend\\src\\mcp\\mcpServer.js"
      ]
    }
  }
}
```

**Mac Example:**
```json
{
  "mcpServers": {
    "foodmandu-support": {
      "command": "node",
      "args": [
        "/Users/yourname/projects/FoodManduSupportAgent/backend/src/mcp/mcpServer.js"
      ]
    }
  }
}
```

### 4. Restart Claude Desktop
- **Quit completely** (not just close window)
- **Relaunch** Claude Desktop
- Look for 🔌 icon

---

## 💬 Try These Prompts in Claude

```
What tools do you have access to?
```

```
Check the status of order FM100001
```

```
What's the current weather in Kathmandu? Will it delay deliveries?
```

```
Can you deliver to Thamel, Kathmandu?
```

```
Find information about Momo Hut restaurant
```

```
What are the traditional foods for Dashain festival?
```

```
What food would be good in this weather?
```

```
Check the payment gateway status for eSewa
```

---

## 🐛 Troubleshooting

### "Server not found"
**Check:** Is the path in config absolute and correct?
```bash
# Test manually
node /your/absolute/path/to/mcpServer.js
```

### "No tools showing in Claude"
**Solution:** Restart Claude Desktop completely
1. Quit Claude (Cmd+Q on Mac, Alt+F4 on Windows)
2. Relaunch

### "Command not found: node"
**Solution:** Use full path to node
```bash
# Find node location
which node  # Mac/Linux
where node  # Windows

# Use in config:
{
  "command": "/usr/local/bin/node",  // Your actual path
  "args": [...]
}
```

### Check Logs
**macOS:**
```bash
tail -f ~/Library/Logs/Claude/mcp*.log
```

**Windows:**
```powershell
Get-Content $env:APPDATA\Claude\logs\mcp*.log -Wait
```

---

## 📊 Available Tools Summary

| Category | Tools | Example Usage |
|----------|-------|---------------|
| **Order Tracking** | 7 tools | Track orders, ETAs, locations |
| **Support** | 4 tools | Weather, addresses, payments |
| **Cultural** | 5 tools | Festivals, regional food, weather-based |

**Total: 16 tools** 🎯

---

## ✅ What to Expect

When working correctly:

1. **Claude recognizes your tools** ✅
   - You can ask "What tools do you have?"
   - Claude lists Foodmandu tools

2. **Claude uses tools automatically** ✅
   - You ask about order status
   - Claude calls `get_order_status` tool
   - Returns formatted response

3. **You see tool execution** ✅
   - Claude shows when it uses a tool
   - Tool results displayed
   - Natural language response

---

## 📚 More Help

- **Full Documentation:** [README_MCP.md](src/mcp/README_MCP.md)
- **Quick Start:** [MCP_QUICKSTART.md](MCP_QUICKSTART.md)
- **Testing Guide:** [TEST_MCP.md](src/mcp/TEST_MCP.md)
- **Implementation Summary:** [MCP_IMPLEMENTATION_SUMMARY.md](MCP_IMPLEMENTATION_SUMMARY.md)

---

**Happy MCP Development! 🚀**




