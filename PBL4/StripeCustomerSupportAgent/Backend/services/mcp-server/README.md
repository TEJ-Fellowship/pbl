# MCP Server Implementation

This directory contains the MCP (Model Context Protocol) server implementation using the `@modelcontextprotocol/sdk`.

## Architecture

```
mcp-server/
├── mcpServer.js          # MCP server (runs as standalone process)
├── mcpOrchestrator.js    # MCP client orchestrator (uses MCP protocol)
└── agentOrchestrator.js  # Direct orchestrator (legacy, not using MCP)

mcp-client/
└── mcpClient.js          # MCP client for connecting to servers

mcp-tools/
└── [tool files]         # Tool implementations
```

## How It Works

1. **MCP Server** (`mcpServer.js`):

   - Runs as a standalone Node.js process
   - Exposes tools via MCP protocol using stdio transport
   - Handles `tools/list` and `tools/call` requests

2. **MCP Client** (`mcp-client/mcpClient.js`):

   - Connects to MCP server via stdio transport
   - Sends tool calls via MCP protocol (JSON-RPC)
   - Parses responses from server

3. **MCP Orchestrator** (`mcp-server/mcpOrchestrator.js`):
   - Coordinates tool selection and execution
   - Uses MCP client to call tools via protocol
   - Replaces direct tool calls with MCP protocol calls

## Usage

The MCP server is automatically started when the orchestrator initializes. The client connects via stdio transport.

## Tools Available

- `calculator` - Mathematical calculations
- `status_checker` - Stripe status monitoring
- `web_search` - Web search
- `code_validator` - Code validation
- `datetime` - Date/time operations
- `currency_converter` - Currency conversion
