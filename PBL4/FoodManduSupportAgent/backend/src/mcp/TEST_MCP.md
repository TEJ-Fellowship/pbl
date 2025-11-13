# 🧪 MCP Server Testing Guide

Complete testing procedures for your Model Context Protocol implementation.

---

## 🎯 Test Objectives

Verify that:
1. ✅ MCP server starts without errors
2. ✅ Tools are registered correctly
3. ✅ JSON-RPC communication works
4. ✅ Claude Desktop can connect
5. ✅ All 16 tools execute successfully

---

## Test 1: Server Startup ⚡

### Run:
```bash
cd backend
npm run mcp-server
```

### Expected Output:
```
🚀 Starting TRUE MCP Server for Foodmandu Support Agent
📡 Protocol: Model Context Protocol (JSON-RPC 2.0)
🔌 Transport: stdio (Standard Input/Output)
📦 Tools available: 16

Waiting for MCP client connection...
(Connect via Claude Desktop or MCP Inspector)

✅ MCP Server connected and ready!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### ✅ Pass Criteria:
- No import errors
- Shows "16 tools available"
- Shows "connected and ready"

### ❌ If Failed:
```bash
# Check dependencies
npm install

# Verify SDK installed
npm list @modelcontextprotocol/sdk
```

---

## Test 2: MCP Inspector 🔍

### Run:
```bash
cd backend
npm run mcp-inspect
```

### Expected:
1. Browser opens to `http://localhost:6000`
2. Shows "MCP Inspector" interface
3. Your server appears in the list

### In Inspector UI:

#### Test 2.1: List Tools
1. Click **"Connect"** button
2. Click **"List Tools"** button
3. **Expected:** JSON response with 16 tools

**Example Response:**
```json
{
  "tools": [
    {
      "name": "get_order_status",
      "description": "Get the current status of an order by order ID",
      "inputSchema": {
        "type": "object",
        "properties": {
          "orderId": { "type": "string", "description": "..." }
        },
        "required": ["orderId"]
      }
    },
    // ... 15 more tools
  ]
}
```

#### Test 2.2: Call Tool - get_order_status
1. Select `get_order_status` from dropdown
2. Input arguments:
```json
{
  "orderId": "FM100001"
}
```
3. Click **"Call Tool"**

**Expected Response:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "{\"success\":true,\"data\":{\"orderId\":\"FM100001\",\"orderNumber\":\"ORD-2024-001\",\"status\":\"Order is on the Way\",\"rawStatus\":\"on_the_way\",\"currentStage\":\"on_the_way\",\"timestamp\":\"2024-...\"}}
    }
  ]
}
```

#### Test 2.3: Call Tool - check_weather_delay
1. Select `check_weather_delay`
2. Input:
```json
{
  "location": "Kathmandu"
}
```
3. Click **"Call Tool"**

**Expected:** Weather data with delivery impact

#### Test 2.4: Call Tool - validate_address
1. Select `validate_address`
2. Input:
```json
{
  "address": "Thamel, Kathmandu"
}
```
3. Click **"Call Tool"**

**Expected:**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "coverage": true,
    "area": "Thamel",
    "message": "Address is within delivery coverage"
  }
}
```

### ✅ Pass Criteria:
- All tools appear in list
- Tools execute without errors
- Responses follow MCP format

---

## Test 3: Manual stdio Test 📝

Test JSON-RPC directly:

### Test 3.1: tools/list Request

```bash
# Create test file
cat > test_list.json << 'EOF'
{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}
EOF

# Send request
cat test_list.json | node src/mcp/mcpServer.js
```

**Expected Output:** JSON with tools array

### Test 3.2: tools/call Request

```bash
cat > test_call.json << 'EOF'
{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"get_order_status","arguments":{"orderId":"FM100001"}}}
EOF

cat test_call.json | node src/mcp/mcpServer.js
```

**Expected:** Tool execution result in JSON-RPC format

---

## Test 4: Claude Desktop Integration 🤖

### Prerequisites:
- Claude Desktop installed
- Config file created (see MCP_QUICKSTART.md)

### Test 4.1: Connection
1. Restart Claude Desktop
2. Open Claude app
3. Look for 🔌 icon or "Tools" indicator

**Expected:** Icon shows server is connected

### Test 4.2: List Tools
**Prompt:** "What tools do you have access to?"

**Expected Response:** Claude lists your Foodmandu tools

### Test 4.3: Order Status Tool
**Prompt:** "Check the status of order FM100001"

**Expected:** 
- Claude calls `get_order_status` tool
- Returns formatted order status
- Shows tool invocation in UI

### Test 4.4: Weather Tool
**Prompt:** "What's the weather in Kathmandu and will it delay deliveries?"

**Expected:**
- Claude calls `check_weather_delay`
- Returns weather info + delivery impact
- Natural language response

### Test 4.5: Address Validation
**Prompt:** "Can you deliver to Thamel in Kathmandu?"

**Expected:**
- Claude calls `validate_address`
- Confirms delivery coverage
- Natural response

### Test 4.6: Restaurant Search
**Prompt:** "Find information about Momo Hut restaurant"

**Expected:**
- Claude calls `web_search_restaurant`
- Returns restaurant details
- Menu items if available

### ✅ Pass Criteria:
- Claude recognizes all 16 tools
- Tools execute successfully
- Claude formats responses naturally
- No JSON-RPC errors

---

## Test 5: All Tools Comprehensive Test 🔬

### Setup Test Data:
```bash
cd backend/src/mcp
node -e "
const tests = [
  {tool: 'get_order_status', args: {orderId: 'FM100001'}},
  {tool: 'get_location_tracking', args: {orderId: 'FM100001', userLat: 27.7172, userLng: 85.324}},
  {tool: 'calculate_eta', args: {orderId: 'FM100001'}},
  {tool: 'get_order_details', args: {orderId: 'FM100001'}},
  {tool: 'get_driver_info', args: {orderId: 'FM100001'}},
  {tool: 'get_progress_tracking', args: {orderId: 'FM100001'}},
  {tool: 'get_route_info', args: {orderId: 'FM100001', userLat: 27.7172, userLng: 85.324}},
  {tool: 'check_weather_delay', args: {location: 'Kathmandu'}},
  {tool: 'validate_address', args: {address: 'Thamel, Kathmandu'}},
  {tool: 'check_payment_status', args: {}},
  {tool: 'check_festival_schedule', args: {}},
  {tool: 'suggest_festival_food', args: {festival: 'Dashain'}},
  {tool: 'get_regional_preferences', args: {region: 'Kathmandu'}},
  {tool: 'web_search_restaurant', args: {restaurantName: 'Momo Hut'}},
  {tool: 'get_current_weather', args: {location: 'Kathmandu'}},
  {tool: 'suggest_weather_based_food', args: {location: 'Kathmandu'}}
];
console.log(JSON.stringify(tests, null, 2));
" > test_all_tools.json
```

### Run Each Test in Inspector:
Use MCP Inspector to call each tool with test args.

### ✅ Expected Results:

| Tool | Status | Response Type |
|------|--------|---------------|
| `get_order_status` | ✅ | Order status data |
| `get_location_tracking` | ✅ | GPS coordinates |
| `calculate_eta` | ✅ | ETA in minutes |
| `get_order_details` | ✅ | Full order info |
| `get_driver_info` | ✅ | Driver details |
| `get_progress_tracking` | ✅ | Progress stages |
| `get_route_info` | ✅ | Route coordinates |
| `check_weather_delay` | ✅ | Weather + delay |
| `validate_address` | ✅ | Validation result |
| `check_payment_status` | ✅ | Gateway status |
| `check_festival_schedule` | ✅ | Festival list |
| `suggest_festival_food` | ✅ | Food suggestions |
| `get_regional_preferences` | ✅ | Regional data |
| `web_search_restaurant` | ✅ | Restaurant info |
| `get_current_weather` | ✅ | Weather data |
| `suggest_weather_based_food` | ✅ | Food suggestions |

---

## Test 6: Error Handling 🛡️

### Test 6.1: Invalid Tool Name
```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/call",
  "params": {
    "name": "invalid_tool_name",
    "arguments": {}
  }
}
```

**Expected:** Error response with "Unknown tool"

### Test 6.2: Missing Required Argument
```json
{
  "jsonrpc": "2.0",
  "id": 4,
  "method": "tools/call",
  "params": {
    "name": "get_order_status",
    "arguments": {}
  }
}
```

**Expected:** Error about missing orderId

### Test 6.3: Invalid Order ID
```json
{
  "jsonrpc": "2.0",
  "id": 5,
  "method": "tools/call",
  "params": {
    "name": "get_order_status",
    "arguments": {"orderId": "INVALID999"}
  }
}
```

**Expected:** "Order not found" error

---

## Test 7: Performance Test 🚀

### Measure Response Times:

```bash
# Test tool execution speed
time echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"get_order_status","arguments":{"orderId":"FM100001"}}}' | node src/mcp/mcpServer.js
```

**Expected:** Response time < 500ms

### Load Test (Optional):
```bash
# Call tool 10 times
for i in {1..10}; do
  echo '{"jsonrpc":"2.0","id":'$i',"method":"tools/call","params":{"name":"check_weather_delay","arguments":{}}}' | node src/mcp/mcpServer.js &
done
wait
```

**Expected:** All complete successfully

---

## Test 8: Logging & Debugging 📊

### Check Server Logs:

When running `npm run mcp-server`, you should see:

```
📋 MCP Request: tools/list
✅ Returning 16 tools

🔧 MCP Request: tools/call - get_order_status
   Arguments: {"orderId":"FM100001"}
✅ Tool executed successfully
   Result: {"success":true,"data":...
```

### Debug Mode:
Add verbose logging:
```javascript
// In mcpServer.js, uncomment debug lines
console.error("📥 Full request:", JSON.stringify(request, null, 2));
console.error("📤 Full response:", JSON.stringify(response, null, 2));
```

---

## ✅ Final Verification Checklist

- [ ] Server starts without errors
- [ ] All 16 tools listed correctly
- [ ] MCP Inspector connects successfully
- [ ] All tools execute in Inspector
- [ ] Claude Desktop recognizes tools
- [ ] Claude can execute tools successfully
- [ ] Error handling works properly
- [ ] Response times acceptable
- [ ] Logs show proper MCP requests
- [ ] HTTP API still works (for web frontend)

---

## 🐛 Common Issues & Solutions

### "Cannot find module '@modelcontextprotocol/sdk'"
```bash
cd backend
npm install @modelcontextprotocol/sdk
```

### "ENOENT: no such file or directory"
- Check file paths in imports
- Verify `toolExecutor.js` exists
- Ensure all tool files present

### "Tool not found" in Claude
- Verify `claude_desktop_config.json` path is absolute
- Check config JSON is valid
- Restart Claude Desktop completely

### Tools execute in Inspector but not Claude
- Check Claude Desktop logs
- Verify server script has no syntax errors
- Test with manual stdio (Test 3)

---

## 📈 Success Metrics

**Your MCP server is production-ready when:**

✅ All 16 tools pass tests  
✅ Response times < 500ms  
✅ Error handling graceful  
✅ Claude Desktop integration works  
✅ No import or runtime errors  
✅ Logs show clear MCP communication  

---

**Congratulations! You have a fully functional TRUE MCP server! 🎉**




