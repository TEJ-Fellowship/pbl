# PayPal MCP Server

This is a **real MCP (Model Context Protocol) server** implementation using the official MCP SDK.

## What Changed

### ✅ Real MCP Implementation

- Uses `@modelcontextprotocol/sdk` package
- Implements JSON-RPC 2.0 protocol
- Proper tool registration via MCP protocol
- Communicates via stdio transport
- Compatible with MCP clients (Claude Desktop, Cursor, etc.)

### ✅ ES Modules

- All components converted to ES modules
- `package.json` includes `"type": "module"`
- Proper `import/export` syntax

### ✅ Backend Compatibility

- Created `serviceAdapter.cjs` for CommonJS backend
- Backend can still use the service directly
- No breaking changes to backend code

## Available MCP Tools

1. **convert_currency** - Convert between currencies and get exchange rates
2. **search_web** - Search the web for recent PayPal information
3. **calculate_fees** - Calculate PayPal transaction fees
4. **check_status** - Check PayPal service status and outages
5. **estimate_timeline** - Estimate transaction hold timelines

## Running the MCP Server

### As MCP Server (for MCP clients)

```bash
node src/index.js
```

The server will run on stdio and communicate via JSON-RPC.

### For Testing

```bash
npm start
```

## Integration with MCP Clients

### Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "paypal-support": {
      "command": "node",
      "args": [
        "/full/path/to/PayPalCustomerSupportAgent/mcp-server/src/index.js"
      ],
      "env": {
        "GOOGLE_WEB_KEY": "your-key",
        "GOOGLE_SEARCH_ID": "your-id"
      }
    }
  }
}
```

### Testing with MCP Inspector

```bash
npx @modelcontextprotocol/inspector node src/index.js
```

## Backend Usage

The backend continues to use the service via the CommonJS adapter:

```javascript
const MCPToolsService = require("../../mcp-server/serviceAdapter.cjs");

// Use as before
const mcpTools = new MCPToolsService();
const result = await mcpTools.getToolData("currency", query);
```

## Architecture

```
mcp-server/
├── src/
│   ├── index.js              # MCP Server + Service Adapter (ES module)
│   └── components/           # All service components (ES modules)
│       ├── currencyExchange.js
│       ├── webSearch.js
│       ├── feeCalculator.js
│       ├── apiStatusChecker.js
│       └── transactionTimeline.js
├── serviceAdapter.cjs         # CommonJS wrapper for backend
└── package.json              # Configured as ES module
```

## Key Features

1. **Proper MCP Protocol**: Implements the official MCP specification
2. **Tool Registration**: Tools are properly registered with schemas
3. **Error Handling**: Proper error responses via MCP protocol
4. **Backward Compatible**: Backend code unchanged
5. **Production Ready**: Can be used with any MCP-compatible client
