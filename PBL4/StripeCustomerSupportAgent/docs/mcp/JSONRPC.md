# JSON-RPC Implementation in MCP Server - Complete Guide

## Table of Contents

1. [What is JSON-RPC?](#what-is-json-rpc)
2. [How JSON-RPC is Implemented](#how-json-rpc-is-implemented)
3. [Real Request/Response Examples](#real-requestresponse-examples)
4. [Multiple Tool Execution](#multiple-tool-execution)
5. [Tool Execution Flow on Server](#tool-execution-flow-on-server)

---

## What is JSON-RPC?

**JSON-RPC** is a stateless, lightweight remote procedure call (RPC) protocol that uses JSON for message encoding. It's transport-agnostic and supports both request-response and notification patterns.

### Key Characteristics

- **Stateless**: Each request is independent
- **Transport-agnostic**: Works over HTTP, WebSockets, stdio, etc.
- **Request/Response**: Client sends requests, server responds
- **Structured**: Messages follow a defined format

### JSON-RPC Message Format

#### Request:

```json
{
  "jsonrpc": "2.0",
  "method": "method_name",
  "params": { ... },
  "id": 123
}
```

#### Success Response:

```json
{
  "jsonrpc": "2.0",
  "result": { ... },
  "id": 123
}
```

#### Error Response:

```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": -32600,
    "message": "Invalid Request"
  },
  "id": 123
}
```

---

## How JSON-RPC is Implemented

The codebase uses JSON-RPC through the **Model Context Protocol (MCP) SDK**. The implementation consists of:

### 1. MCP Server (JSON-RPC Server)

**Location**: `services/mcp-server/mcpServer.js`

The server exposes tools via JSON-RPC:

```javascript
class MCPServer {
  constructor() {
    this.server = new Server(
      {
        name: "stripe-support-tools",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.tools = new Map();
    this.setupTools();
    this.setupHandlers();
  }
}
```

**Key Components:**

- **Server**: MCP SDK Server instance
- **Transport**: `StdioServerTransport` (reads from stdin, writes to stdout)
- **Request Handlers**: Registered for `tools/list` and `tools/call`

### 2. MCP Client (JSON-RPC Client)

**Location**: `services/mcp-client/mcpClient.js`

The client sends JSON-RPC requests:

```javascript
class MCPClient {
  async initialize(serverConfig) {
    this.client = new Client(
      {
        name: "stripe-support-agent",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.transport = new StdioClientTransport({
      command: serverConfig.command,
      args: serverConfig.args || [],
      env: serverConfig.env || {},
    });

    await this.client.connect(this.transport);
  }

  async callTool(toolName, args = {}) {
    const result = await this.client.callTool({
      name: toolName,
      arguments: args,
    });
    // Parse and return result
  }
}
```

### 3. Transport Layer

- **Server**: `StdioServerTransport` - reads from stdin, writes to stdout
- **Client**: `StdioClientTransport` - spawns server process, communicates via stdio

**Communication Flow:**

```
Client                    Transport (stdio)              Server
  |                            |                           |
  |-- JSON-RPC Request ------->|                           |
  |   (tools/call)             |-- JSON-RPC Request ------>|
  |                            |                           |
  |                            |<-- JSON-RPC Response -----|
  |<-- JSON-RPC Response ------|                           |
```

---

## Real Request/Response Examples

### Example 1: Listing Available Tools (`tools/list`)

#### JSON-RPC Request:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/list",
  "params": {}
}
```

#### JSON-RPC Response:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "tools": [
      {
        "name": "calculator",
        "description": "Calculate Stripe fees, percentages, and mathematical expressions",
        "inputSchema": {
          "type": "object",
          "properties": {
            "query": {
              "type": "string",
              "description": "User query to process"
            }
          },
          "required": ["query"]
        }
      },
      {
        "name": "status_checker",
        "description": "Check Stripe service status and API health",
        "inputSchema": {
          "type": "object",
          "properties": {
            "query": {
              "type": "string",
              "description": "User query to process"
            }
          },
          "required": ["query"]
        }
      }
    ]
  }
}
```

### Example 2: Calling Calculator Tool

**Scenario**: User asks "What is 2.9% of $1000?"

#### JSON-RPC Request:

```json
{
  "jsonrpc": "2.0",
  "id": 42,
  "method": "tools/call",
  "params": {
    "name": "calculator",
    "arguments": {
      "query": "What is 2.9% of $1000?"
    }
  }
}
```

#### JSON-RPC Response:

```json
{
  "jsonrpc": "2.0",
  "id": 42,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"success\":true,\"results\":[{\"expression\":\"(2.9/100) * 1000\",\"result\":29,\"confidence\":0.95,\"formatted\":\"29\"}],\"confidence\":0.95,\"message\":\"The result is 29 ((2.9/100) * 1000)\"}"
      }
    ],
    "isError": false
  }
}
```

#### Parsed Response (after client parsing):

```json
{
  "success": true,
  "results": [
    {
      "expression": "(2.9/100) * 1000",
      "result": 29,
      "confidence": 0.95,
      "formatted": "29"
    }
  ],
  "confidence": 0.95,
  "message": "The result is 29 ((2.9/100) * 1000)"
}
```

### Example 3: Error Response - Tool Not Found

#### JSON-RPC Request:

```json
{
  "jsonrpc": "2.0",
  "id": 99,
  "method": "tools/call",
  "params": {
    "name": "nonexistent_tool",
    "arguments": {
      "query": "test query"
    }
  }
}
```

#### JSON-RPC Response:

```json
{
  "jsonrpc": "2.0",
  "id": 99,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"success\":false,\"error\":\"Tool 'nonexistent_tool' not found\"}"
      }
    ],
    "isError": true
  }
}
```

### Example 4: Multiple Calculations

**Scenario**: "Calculate 100 + 50 and 2.9% of 500"

#### JSON-RPC Request:

```json
{
  "jsonrpc": "2.0",
  "id": 123,
  "method": "tools/call",
  "params": {
    "name": "calculator",
    "arguments": {
      "query": "Calculate 100 + 50 and 2.9% of 500"
    }
  }
}
```

#### Parsed Response:

```json
{
  "success": true,
  "results": [
    {
      "expression": "100 + 50",
      "result": 150,
      "confidence": 0.98,
      "formatted": "150"
    },
    {
      "expression": "(2.9/100) * 500",
      "result": 14.5,
      "confidence": 0.95,
      "formatted": "14.5"
    }
  ],
  "confidence": 0.965,
  "message": "Here are the calculations:\n1. 150 (100 + 50)\n2. 14.5 ((2.9/100) * 500)"
}
```

---

## Multiple Tool Execution

### Current Implementation: Parallel Execution

The codebase supports executing multiple tools in parallel. The `AgentOrchestrator.executeTools()` method accepts an array of tool names:

**Location**: `services/mcp-server/agentOrchestrator.js`

```javascript
async executeTools(toolNames, query) {
  // Execute tools via MCP protocol (not direct calls)
  const toolPromises = toolNames.map(async (toolName) => {
    try {
      const mcpResult = await this.mcpClient.callTool(toolName, {
        query: query,
      });

      if (mcpResult.success && mcpResult.parsedResult) {
        return {
          toolName,
          result: mcpResult.parsedResult,
          success: true,
        };
      }
    } catch (error) {
      return {
        toolName,
        result: null,
        success: false,
        error: error.message,
      };
    }
  });

  const toolResults = await Promise.all(toolPromises);
  // Process and combine results
}
```

### How It Works

1. **Multiple Tools**: Pass an array like `["calculator", "status_checker", "web_search"]`
2. **Parallel Execution**: Each tool gets its own JSON-RPC request, executed in parallel with `Promise.all()`
3. **Individual Requests**: Each tool call is a separate JSON-RPC request

### Example Usage

```javascript
await orchestrator.executeTools(
  ["calculator", "status_checker", "web_search"],
  "What is 2.9% of $1000 and check Stripe status?"
);
```

This sends **3 separate JSON-RPC requests** that execute in parallel:

**Request 1:**

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "calculator",
    "arguments": { "query": "..." }
  }
}
```

**Request 2:**

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "status_checker",
    "arguments": { "query": "..." }
  }
}
```

**Request 3:**

```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/call",
  "params": {
    "name": "web_search",
    "arguments": { "query": "..." }
  }
}
```

All three execute in parallel, and results are combined.

### Alternative: JSON-RPC Batch Requests

JSON-RPC 2.0 supports batch requests (multiple requests in one message), though the current implementation doesn't use this. A batch request would look like:

```json
[
  {
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": { "name": "calculator", "arguments": { "query": "..." } }
  },
  {
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": { "name": "status_checker", "arguments": { "query": "..." } }
  }
]
```

---

## Tool Execution Flow on Server

### Complete Execution Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. JSON-RPC Request Arrives                                   │
│    {                                                           │
│      "method": "tools/call",                                   │
│      "params": {                                               │
│        "name": "calculator",                                   │
│        "arguments": { "query": "What is 2.9% of $1000?" }    │
│      }                                                         │
│    }                                                           │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Server Handler (mcpServer.js:81)                          │
│    - Extracts: name = "calculator"                           │
│    - Extracts: query = "What is 2.9% of $1000?"              │
│    - Looks up: tool = this.tools.get("calculator")           │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Tool Instance Retrieved                                    │
│    tool = CalculatorTool instance                             │
│    (created during setupTools())                              │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Execute Tool (calculatorTool.js:19)                       │
│    const result = await tool.execute(query)                  │
│                                                              │
│    Inside execute():                                         │
│    ├─ Extract math expressions: "(2.9/100) * 1000"          │
│    ├─ Evaluate: math.evaluate("(2.9/100) * 1000") = 29      │
│    ├─ Calculate confidence: 0.95                             │
│    ├─ Format result: "29"                                    │
│    └─ Return: {                                              │
│         success: true,                                       │
│         results: [{ expression: "...", result: 29, ... }],   │
│         confidence: 0.95,                                    │
│         message: "The result is 29..."                       │
│       }                                                      │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Server Wraps Result (mcpServer.js:118)                    │
│    return {                                                  │
│      content: [{                                             │
│        type: "text",                                         │
│        text: JSON.stringify(result)                          │
│      }],                                                     │
│      isError: false                                          │
│    }                                                         │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. JSON-RPC Response Sent                                    │
│    {                                                          │
│      "jsonrpc": "2.0",                                       │
│      "id": 42,                                               │
│      "result": {                                              │
│        "content": [{                                         │
│          "type": "text",                                     │
│          "text": "{\"success\":true,\"results\":[...]}"      │
│        }],                                                   │
│        "isError": false                                       │
│      }                                                       │
│    }                                                         │
└─────────────────────────────────────────────────────────────┘
```

### Step-by-Step Breakdown

#### Step 1: Tool Registration (Server Startup)

**Location**: `services/mcp-server/mcpServer.js:40-51`

When the MCP server starts, tools are instantiated and stored in a Map:

```javascript
setupTools() {
  console.log("🔧 [MCPServer] Setting up tools...");

  this.tools.set("calculator", new CalculatorTool());
  this.tools.set("status_checker", new StatusCheckerTool());
  this.tools.set("web_search", new WebSearchTool());
  this.tools.set("code_validator", new CodeValidatorTool());
  this.tools.set("datetime", new DateTimeTool());
  this.tools.set("currency_converter", new CurrencyConverterTool());

  console.log(`✅ [MCPServer] Initialized ${this.tools.size} tools`);
}
```

Each tool is a class instance with an `execute()` method.

#### Step 2: JSON-RPC Request Handler

**Location**: `services/mcp-server/mcpServer.js:81-108`

When a `tools/call` request arrives:

```javascript
this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  console.log(`🔧 [MCPServer] tools/call received for: ${name}`);

  const tool = this.tools.get(name);
  if (!tool) {
    // Return error response
    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          success: false,
          error: `Tool '${name}' not found`,
        }),
      }],
      isError: true,
    };
  }

  try {
    const query = args?.query || "";
    console.log(`🚀 [MCPServer] Executing tool: ${name}`);

    const result = await tool.execute(query);
    // ... wrap and return result
  }
});
```

**Flow:**

1. Extract `name` and `arguments` from JSON-RPC request
2. Look up tool: `this.tools.get(name)`
3. Extract query from arguments
4. Call `await tool.execute(query)`

#### Step 3: Tool Execution

Each tool implements its own `execute()` method. Examples:

**Calculator Tool** (`services/mcp-tools/calculatorTool.js`):

```javascript
async execute(query) {
  // Extract mathematical expressions from the query
  const mathExpressions = this.extractMathExpressions(query);

  // Evaluate each expression
  for (const expression of mathExpressions) {
    const result = math.evaluate(expression);
    const confidence = this.calculateConfidence(expression, result);
    results.push({
      expression,
      result,
      confidence,
      formatted: this.formatResult(result, expression),
    });
  }

  return {
    success: true,
    results,
    confidence: avgConfidence,
    message: this.generateResponse(results, query),
  };
}
```

**Status Checker Tool** (`services/mcp-tools/statusCheckerTool.js`):

```javascript
async execute(query) {
  // Check if we need to refresh the cache
  if (this.shouldRefreshCache()) {
    await this.fetchStatus();
  }

  const analysis = this.analyzeStatus(query);
  const confidence = this.calculateConfidence(analysis);

  return {
    success: true,
    result: analysis,
    confidence,
    message: this.generateResponse(analysis, query),
  };
}
```

#### Step 4: Result Formatting and Response

**Location**: `services/mcp-server/mcpServer.js:108-126`

After `tool.execute()` returns, the server wraps it:

```javascript
const result = await tool.execute(query);

console.log(`✅ [MCPServer] Tool execution completed`);
console.log(`📥 [MCPServer] Result:`, {
  success: result.success,
  hasResults: !!result.results,
  confidence: result.confidence,
  messageLength: result.message?.length || 0,
});

return {
  content: [
    {
      type: "text",
      text: JSON.stringify(result),
    },
  ],
  isError: !result.success,
};
```

The server:

1. Receives tool's result object
2. Logs execution details
3. Wraps in MCP format with `content` array
4. Sets `isError` based on `result.success`
5. Returns JSON-RPC response

### Key Points

1. **Tool Registration**: Tools are class instances stored in a Map, created at server startup
2. **Tool Interface**: Each tool implements `async execute(query)` that returns a structured result
3. **Server Handler**: The server handler calls `tool.execute(query)` and wraps the result
4. **Tool Independence**: Tools can do anything: calculations, API calls, database queries, etc.
5. **Standardized Response**: All tools return the same structure: `{ success, result/results, confidence, message }`

---

## Available Tools

The following tools are registered in the MCP server:

1. **calculator** - Calculate Stripe fees, percentages, and mathematical expressions
2. **status_checker** - Check Stripe service status and API health
3. **web_search** - Search the web for information
4. **code_validator** - Validate code snippets
5. **datetime** - Date/time operations
6. **currency_converter** - Currency conversion

---

## Benefits of This Architecture

1. **Decoupling**: Server and client are separate processes
2. **Standardization**: MCP SDK handles JSON-RPC details
3. **Extensibility**: Easy to add new tools
4. **Debugging**: JSON messages are human-readable
5. **Parallel Execution**: Multiple tools can run simultaneously
6. **Error Handling**: Each tool can fail independently

---

## Summary

- **JSON-RPC** is the underlying protocol for communication between MCP client and server
- **MCP SDK** abstracts JSON-RPC details, providing high-level methods
- **Tools** are independent class instances with `execute()` methods
- **Multiple tools** can be executed in parallel via separate JSON-RPC requests
- **Transport** uses stdio (standard input/output) for process communication
- **Response format** is standardized across all tools for consistency

```

```
