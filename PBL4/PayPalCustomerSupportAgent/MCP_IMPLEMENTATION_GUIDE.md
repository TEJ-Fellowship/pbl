# MCP Server Implementation Guide

## How to Properly Implement an MCP Server

This guide shows how to convert your current service into a proper MCP (Model Context Protocol) server.

---

## ❌ Current Implementation (Wrong)

Your current `mcp-server/server.js`:

```javascript
const MCPToolsService = require("./src/index");

// Create MCP Tools Service instance
const mcpService = new MCPToolsService();

console.log("🚀 MCP Server starting...");
// ... just console logs
```

**Problems:**

- Not using MCP SDK
- Not implementing JSON-RPC protocol
- Not registering tools properly
- Cannot integrate with MCP clients

---

## ✅ Correct MCP Implementation

### Step 1: Install MCP SDK

```bash
cd mcp-server
npm install @modelcontextprotocol/sdk
```

### Step 2: Update package.json

```json
{
  "name": "paypal-mcp-server",
  "version": "1.0.0",
  "type": "module",
  "main": "src/index.js",
  "scripts": {
    "start": "node src/index.js"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^0.6.0",
    "axios": "^1.12.2",
    "dotenv": "^17.2.3"
  }
}
```

### Step 3: Create Proper MCP Server

**File: `mcp-server/src/index.js`**

```javascript
#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { CurrencyExchangeService } from "./components/currencyExchange.js";
import { WebSearchService } from "./components/webSearch.js";
import { FeeCalculatorService } from "./components/feeCalculator.js";
import { ApiStatusChecker } from "./components/apiStatusChecker.js";
import { TransactionTimelineService } from "./components/transactionTimeline.js";

class PayPalMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: "paypal-support-tools",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Initialize services
    this.currencyService = new CurrencyExchangeService();
    this.webSearchService = new WebSearchService();
    this.statusChecker = new ApiStatusChecker();
    this.feeCalculator = new FeeCalculatorService();
    this.timelineService = new TransactionTimelineService();

    this.setupHandlers();
  }

  setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "convert_currency",
            description: "Convert between currencies and get exchange rates",
            inputSchema: {
              type: "object",
              properties: {
                amount: {
                  type: "number",
                  description: "Amount to convert",
                },
                fromCurrency: {
                  type: "string",
                  description: "Source currency code (e.g., USD, EUR)",
                },
                toCurrency: {
                  type: "string",
                  description: "Target currency code (e.g., USD, EUR)",
                },
              },
              required: ["fromCurrency", "toCurrency"],
            },
          },
          {
            name: "search_web",
            description: "Search the web for recent PayPal information",
            inputSchema: {
              type: "object",
              properties: {
                query: {
                  type: "string",
                  description: "Search query",
                },
              },
              required: ["query"],
            },
          },
          {
            name: "calculate_fees",
            description: "Calculate PayPal transaction fees",
            inputSchema: {
              type: "object",
              properties: {
                amount: {
                  type: "number",
                  description: "Transaction amount",
                },
                transactionType: {
                  type: "string",
                  enum: ["domestic", "international"],
                },
                accountType: {
                  type: "string",
                  enum: ["personal", "business"],
                },
                paymentMethod: {
                  type: "string",
                  enum: ["paypal_balance", "credit_card", "debit_card"],
                },
                currency: {
                  type: "string",
                  default: "USD",
                },
              },
              required: ["amount"],
            },
          },
          {
            name: "check_status",
            description: "Check PayPal service status and outages",
            inputSchema: {
              type: "object",
              properties: {},
            },
          },
          {
            name: "estimate_timeline",
            description: "Estimate transaction hold timelines",
            inputSchema: {
              type: "object",
              properties: {
                amount: {
                  type: "number",
                  description: "Transaction amount",
                },
                accountAge: {
                  type: "string",
                  enum: ["new_account", "established_account"],
                },
                riskLevel: {
                  type: "string",
                  enum: ["low_risk", "medium_risk", "high_risk"],
                },
              },
            },
          },
        ],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case "convert_currency": {
            const result = await this.currencyService.getExchangeRate(
              args.fromCurrency,
              args.toCurrency,
              args.amount || 1
            );
            return {
              content: [
                {
                  type: "text",
                  text: `💱 Currency Conversion:\n\n${args.amount || 1} ${
                    result.from_currency
                  } = ${result.converted_amount} ${
                    result.to_currency
                  }\n\nExchange Rate: 1 ${result.from_currency} = ${
                    result.exchange_rate
                  } ${result.to_currency}`,
                },
              ],
            };
          }

          case "search_web": {
            const results = await this.webSearchService.searchPayPalWeb(
              args.query
            );
            return {
              content: [
                {
                  type: "text",
                  text: `Found ${results.length} results:\n\n${results
                    .map(
                      (r, i) =>
                        `${i + 1}. ${r.title}\n   ${r.snippet}\n   ${r.link}`
                    )
                    .join("\n\n")}`,
                },
              ],
            };
          }

          case "calculate_fees": {
            const result = this.feeCalculator.calculateFees(
              args.amount,
              args.transactionType || "domestic",
              args.accountType || "personal",
              args.paymentMethod || "paypal_balance",
              args.currency || "USD"
            );
            if (result.success) {
              return {
                content: [
                  {
                    type: "text",
                    text: result.data.formatted
                      ? `Fee: ${result.data.formatted.totalFee}\nAmount Received: ${result.data.formatted.amountReceived}`
                      : result.message,
                  },
                ],
              };
            } else {
              return {
                content: [
                  {
                    type: "text",
                    text: `Error: ${result.error}`,
                  },
                ],
                isError: true,
              };
            }
          }

          case "check_status": {
            const result = await this.statusChecker.getStatusResponse();
            return {
              content: [
                {
                  type: "text",
                  text: result.message,
                },
              ],
            };
          }

          case "estimate_timeline": {
            const transactionInfo = {
              amount: args.amount || 100,
              accountAge: args.accountAge || "established_account",
              riskLevel: args.riskLevel || "low_risk",
            };
            const result = await this.timelineService.handleTimelineQuery(
              `$${transactionInfo.amount}`
            );
            return {
              content: [
                {
                  type: "text",
                  text: result.message,
                },
              ],
            };
          }

          default:
            return {
              content: [
                {
                  type: "text",
                  text: `Unknown tool: ${name}`,
                },
              ],
              isError: true,
            };
        }
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error executing tool ${name}: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("PayPal MCP server running on stdio");
  }
}

// Start server
const server = new PayPalMCPServer();
server.run().catch(console.error);
```

### Step 4: Update Component Exports

All component files need to use ES modules:

**Example: `mcp-server/src/components/currencyExchange.js`**

```javascript
// ❌ Remove this
module.exports = CurrencyExchangeService;

// ✅ Add this
export { CurrencyExchangeService };
```

### Step 5: Configure MCP Client

For Claude Desktop, add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "paypal-support": {
      "command": "node",
      "args": ["/path/to/PayPalCustomerSupportAgent/mcp-server/src/index.js"],
      "env": {
        "GOOGLE_WEB_KEY": "your-key",
        "GOOGLE_SEARCH_ID": "your-id"
      }
    }
  }
}
```

---

## Key Differences

| Current (Wrong)         | Correct MCP              |
| ----------------------- | ------------------------ |
| Regular class           | MCP Server from SDK      |
| `processQuery()` method | Tool registration        |
| Manual invocation       | JSON-RPC protocol        |
| Cannot integrate        | Claude/Cursor compatible |
| `console.log` output    | Structured responses     |

---

## Testing Your MCP Server

1. **Test with MCP Inspector:**

```bash
npx @modelcontextprotocol/inspector node mcp-server/src/index.js
```

2. **Test tool listing:**

```json
{ "jsonrpc": "2.0", "id": 1, "method": "tools/list", "params": {} }
```

3. **Test tool call:**

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "convert_currency",
    "arguments": {
      "amount": 100,
      "fromCurrency": "USD",
      "toCurrency": "EUR"
    }
  }
}
```

---

## Additional Resources

- [MCP Documentation](https://modelcontextprotocol.io)
- [MCP SDK on GitHub](https://github.com/modelcontextprotocol/sdk-js)
- [Example MCP Servers](https://github.com/modelcontextprotocol/servers)
