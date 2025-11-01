#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { Pool } from "pg";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

import { CurrencyExchangeService } from "./components/currencyExchange.js";
import { WebSearchService } from "./components/webSearch.js";
import { FeeCalculatorService } from "./components/feeCalculator.js";
import { FeeCalculatorEnhancedService } from "./components/feeCalculatorEnhanced.js";
import { ApiStatusChecker } from "./components/apiStatusChecker.js";
import { TransactionTimelineService } from "./components/transactionTimeline.js";
import { DateTimeService } from "./components/dateTime.js";

// ===== PAYPAL MCP SERVER =====
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

    // Create database pool for fee calculator
    this.dbPool = new Pool({
      user: process.env.POSTGRES_USER || "postgres",
      host: process.env.POSTGRES_HOST || "localhost",
      database: process.env.POSTGRES_DATABASE || "paypalAgent",
      password: process.env.POSTGRES_PASSWORD || "your_password_here",
      port: parseInt(process.env.POSTGRES_PORT || "5433", 10),
    });

    // Initialize services
    this.currencyService = new CurrencyExchangeService();
    this.webSearchService = new WebSearchService();
    this.statusChecker = new ApiStatusChecker();
    this.feeCalculator = new FeeCalculatorService(); // Keep for backward compatibility
    this.feeCalculatorEnhanced = new FeeCalculatorEnhancedService(this.dbPool); // Enhanced fee calculator with DB pool
    this.timelineService = new TransactionTimelineService();
    this.dateTimeService = new DateTimeService();

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
                  description: "Amount to convert (default: 1)",
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
                  description: "Search query about PayPal",
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
                  description: "Type of transaction",
                },
                accountType: {
                  type: "string",
                  enum: ["personal", "business"],
                  description: "Type of PayPal account",
                },
                paymentMethod: {
                  type: "string",
                  enum: ["paypal_balance", "credit_card", "debit_card"],
                  description: "Payment method used",
                },
                currency: {
                  type: "string",
                  default: "USD",
                  description: "Currency code",
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
                  description: "Account age category",
                },
                riskLevel: {
                  type: "string",
                  enum: ["low_risk", "medium_risk", "high_risk"],
                  description: "Risk level of the transaction",
                },
              },
            },
          },
          {
            name: "get_datetime",
            description:
              "Get current date and time, optionally for a specific location (e.g., Nepal, India, US)",
            inputSchema: {
              type: "object",
              properties: {
                location: {
                  type: "string",
                  description:
                    "Location or timezone (e.g., 'Nepal', 'India', 'US', 'Asia/Kathmandu')",
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
            const formattedFrom = this.currencyService.formatCurrency(
              result.amount,
              result.from_currency
            );
            const formattedTo = this.currencyService.formatCurrency(
              result.converted_amount,
              result.to_currency
            );
            return {
              content: [
                {
                  type: "text",
                  text: `💱 Currency Conversion:\n\n${formattedFrom} = ${formattedTo}\n\nExchange Rate: 1 ${
                    result.from_currency
                  } = ${result.exchange_rate} ${
                    result.to_currency
                  }\n\n*Rate as of ${new Date(
                    result.timestamp
                  ).toLocaleString()}*`,
                },
              ],
            };
          }

          case "search_web": {
            const query = args.query || "";
            const results = await this.webSearchService.searchPayPalWeb(query);

            // Detect if this is a policy query for appropriate messaging
            const isPolicyQuery =
              /(policy.*change|policy.*update|change.*policy|update.*policy|terms.*change|terms.*update|user agreement.*change|user agreement.*update|recent.*policy|latest.*policy)/i.test(
                query
              );

            if (results.length === 0) {
              const message = isPolicyQuery
                ? `No policy updates found for: ${query}. Please check PayPal's official policy pages for the latest information.`
                : `No recent results found for: ${query}`;
              return {
                content: [
                  {
                    type: "text",
                    text: message,
                  },
                ],
              };
            }

            // Use appropriate result limit (5 for policy queries, 3 for others)
            const resultLimit = isPolicyQuery ? 5 : 3;
            const displayedResults = results.slice(0, resultLimit);

            // Format results with indication of official sources and date information for policy queries
            const formattedResults = displayedResults
              .map((r, i) => {
                const isOfficial =
                  /paypal\.com\/(legal|legalhome|.*policy)/i.test(r.link);
                const officialBadge =
                  isPolicyQuery && isOfficial ? "[OFFICIAL] " : "";

                // Try to extract date from snippet or title for policy queries
                let dateInfo = "";
                if (isPolicyQuery) {
                  // Look for "X days ago", "X weeks ago", dates in various formats including "Last updated on 20 August 2025"
                  const datePatterns = [
                    /(Last\s+updated\s+on|Updated\s+on|Last\s+updated|Updated\s+on).*?(\d{1,2}\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}|\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2}|(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[\w\s]+\d{1,2},?\s+\d{4})/i, // "Last updated on 20 August 2025"
                    /(\d+\s+(days?|weeks?|months?)\s+ago)/i, // "3 days ago", "2 weeks ago"
                    /(Effective|Effective\s+date).*?(\d{1,2}\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}|\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2})/i,
                    /\d{1,2}\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}/i, // "20 August 2025"
                    /\d{1,2}\/\d{1,2}\/\d{4}/,
                    /\d{4}-\d{2}-\d{2}/,
                  ];
                  const fullText = `${r.title} ${r.snippet}`;
                  for (const pattern of datePatterns) {
                    const match = fullText.match(pattern);
                    if (match) {
                      dateInfo = `\n   📅 ${match[0]}`;
                      break;
                    }
                  }
                }

                return `${i + 1}. ${officialBadge}${r.title}\n   ${
                  r.snippet
                }${dateInfo}\n   🔗 ${r.link}`;
              })
              .join("\n\n");

            const header = isPolicyQuery
              ? `Found ${results.length} policy update${
                  results.length !== 1 ? "s" : ""
                } from PayPal's official pages:\n\n`
              : `Found ${results.length} recent result${
                  results.length !== 1 ? "s" : ""
                }:\n\n`;

            return {
              content: [
                {
                  type: "text",
                  text: header + formattedResults,
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
                    text: result.data?.formatted
                      ? `💳 PayPal Fee Calculation:\n\nTransaction: ${result.data.formatted.amount}\nFee: ${result.data.formatted.totalFee}\nAmount Received: ${result.data.formatted.amountReceived}`
                      : result.message || "Fee calculation completed",
                  },
                ],
              };
            } else {
              return {
                content: [
                  {
                    type: "text",
                    text: `Error: ${result.error || "Unknown error"}`,
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
                  text: result.message || "Status check completed",
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
            const queryStr = `$${transactionInfo.amount}`;
            const result = await this.timelineService.handleTimelineQuery(
              queryStr
            );
            return {
              content: [
                {
                  type: "text",
                  text: result.message || "Timeline estimation completed",
                },
              ],
            };
          }

          case "get_datetime": {
            const location = args.location || null;
            const query = location
              ? `what is the time now in ${location}`
              : "what is the time now";
            const result = await this.dateTimeService.execute(query, location);
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

// ===== SERVICE ADAPTER (for backend compatibility) =====
// This adapter provides the same interface as before for the backend to use
export class MCPToolsService {
  constructor() {
    // Create database pool for fee calculator
    this.dbPool = new Pool({
      user: process.env.POSTGRES_USER || "postgres",
      host: process.env.POSTGRES_HOST || "localhost",
      database: process.env.POSTGRES_DATABASE || "paypalAgent",
      password: process.env.POSTGRES_PASSWORD || "your_password_here",
      port: parseInt(process.env.POSTGRES_PORT || "5433", 10),
    });

    this.currencyService = new CurrencyExchangeService();
    this.webSearchService = new WebSearchService();
    this.statusChecker = new ApiStatusChecker();
    this.feeCalculator = new FeeCalculatorService(); // Keep for backward compatibility
    this.feeCalculatorEnhanced = new FeeCalculatorEnhancedService(this.dbPool); // Enhanced fee calculator with DB pool
    this.timelineService = new TransactionTimelineService();
    this.dateTimeService = new DateTimeService();
  }

  // Check which tools should be triggered for this query
  async getTriggeredTools(query) {
    const tools = [];

    if (this.statusChecker.isStatusQuery(query)) {
      tools.push("status");
    }
    if (this.currencyService.isCurrencyQuery(query)) {
      tools.push("currency");
    }
    if (this.webSearchService.shouldUseWebSearch(query)) {
      tools.push("websearch");
    }
    if (this.feeCalculator.isFeeQuery(query)) {
      tools.push("feecalculator");
    }
    if (this.timelineService.isTimelineQuery(query)) {
      tools.push("timeline");
    }
    if (this.dateTimeService.isTimeQuery(query)) {
      tools.push("datetime");
    }

    return tools;
  }

  // Get data from triggered tools
  async getToolData(toolType, query) {
    switch (toolType) {
      case "status":
        return await this.statusChecker.getStatusResponse();
      case "currency":
        return await this.handleCurrencyQuery(query);
      case "websearch":
        return await this.handleWebSearchQuery(query);
      case "feecalculator":
        return await this.handleFeeQuery(query);
      case "timeline":
        return await this.handleTimelineQuery(query);
      case "datetime":
        return await this.handleDateTimeQuery(query);
      default:
        return null;
    }
  }

  // Handle currency conversion queries
  async handleCurrencyQuery(query) {
    try {
      const currencyInfo = this.currencyService.parseCurrencyQuery(query);

      if (!currencyInfo) {
        return {
          success: false,
          message:
            'I couldn\'t understand the currency conversion. Please try: "Convert 100 USD to EUR" or "What\'s the exchange rate from USD to GBP?"',
        };
      }

      const result = await this.currencyService.getExchangeRate(
        currencyInfo.from_currency,
        currencyInfo.to_currency,
        currencyInfo.amount
      );

      const formattedFrom = this.currencyService.formatCurrency(
        result.amount,
        result.from_currency
      );
      const formattedTo = this.currencyService.formatCurrency(
        result.converted_amount,
        result.to_currency
      );

      return {
        success: true,
        message: `💱 Currency Conversion:\n\n${formattedFrom} = ${formattedTo}\n\nExchange Rate: 1 ${
          result.from_currency
        } = ${result.exchange_rate} ${
          result.to_currency
        }\n\n*Rate as of ${new Date(result.timestamp).toLocaleString()}*`,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        message: `Sorry, I couldn't get the exchange rate: ${error.message}`,
      };
    }
  }

  // Handle web search queries
  async handleWebSearchQuery(query) {
    try {
      const results = await this.webSearchService.searchPayPalWeb(query);

      return {
        success: true,
        message: `Found ${results.length} recent results about: ${query}`,
        data: results,
      };
    } catch (error) {
      return {
        success: false,
        message: `Sorry, I couldn't search for recent information: ${error.message}`,
      };
    }
  }

  // Handle fee calculation queries
  async handleFeeQuery(query) {
    try {
      const result = await this.feeCalculator.handleFeeQuery(query);
      return result;
    } catch (error) {
      return {
        success: false,
        message: `Sorry, I couldn't calculate the fees: ${error.message}`,
      };
    }
  }

  // Handle timeline estimation queries
  async handleTimelineQuery(query) {
    try {
      const result = await this.timelineService.handleTimelineQuery(query);
      return result;
    } catch (error) {
      return {
        success: false,
        message: `Sorry, I couldn't estimate the timeline: ${error.message}`,
      };
    }
  }

  async handleDateTimeQuery(query) {
    try {
      const result = await this.dateTimeService.execute(query);
      return {
        success: result.success,
        message: result.message,
        timeInfo: result.timeInfo,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: `Error getting time information: ${error.message}`,
      };
    }
  }

  /**
   * Execute an MCP tool by name and arguments (MCP-style execution)
   * This simulates how a real MCP client would call tools
   */
  async executeTool(toolName, args) {
    try {
      console.log(`🔧 Executing MCP tool: ${toolName}`, args);

      switch (toolName) {
        case "convert_currency": {
          const { fromCurrency, toCurrency, amount = 1 } = args || {};
          if (!fromCurrency || !toCurrency) {
            return {
              success: false,
              message:
                "Missing required arguments: fromCurrency and toCurrency",
            };
          }
          const result = await this.currencyService.getExchangeRate(
            fromCurrency,
            toCurrency,
            amount
          );
          const formattedFrom = this.currencyService.formatCurrency(
            result.amount,
            result.from_currency
          );
          const formattedTo = this.currencyService.formatCurrency(
            result.converted_amount,
            result.to_currency
          );
          return {
            success: true,
            message: `💱 Currency Conversion:\n\n${formattedFrom} = ${formattedTo}\n\nExchange Rate: 1 ${
              result.from_currency
            } = ${result.exchange_rate} ${
              result.to_currency
            }\n\n*Rate as of ${new Date(result.timestamp).toLocaleString()}*`,
            data: result,
          };
        }

        case "search_web": {
          const { query } = args || {};
          if (!query) {
            return {
              success: false,
              message: "Missing required argument: query",
            };
          }
          try {
            // Detect if this is a policy query first (needed for error message too)
            const isPolicyQuery =
              /(policy.*change|policy.*update|change.*policy|update.*policy|terms.*change|terms.*update|user agreement.*change|user agreement.*update|recent.*policy|latest.*policy)/i.test(
                query
              );

            const results = await this.webSearchService.searchPayPalWeb(query);
            if (results.length === 0) {
              // Context-aware message for policy queries
              const message = isPolicyQuery
                ? `No policy updates found for: ${query}. Please check PayPal's official policy pages for the latest information.`
                : `No recent results found for: ${query}`;
              return {
                success: true,
                message: message,
                data: [],
              };
            }

            // Format results for resultCombiner compatibility
            const formattedResults = results.map((r) => ({
              ...r,
              combinedScore: r.score || 0.8, // Default score for web results
              metadata: {
                title: r.title,
                text: r.snippet,
                preview: r.snippet,
                source: r.link,
              },
              isRecent: !isPolicyQuery, // Policy queries may be from weeks ago
              isOfficial: /paypal\.com\/(legal|legalhome|.*policy)/i.test(
                r.link
              ),
            }));
            // Use appropriate result limit and message for policy queries
            const resultLimit = isPolicyQuery ? 5 : 3;
            const displayedResults = formattedResults.slice(0, resultLimit);
            const headerMessage = isPolicyQuery
              ? `Found ${formattedResults.length} policy update${
                  formattedResults.length !== 1 ? "s" : ""
                } from PayPal's official pages`
              : `Found ${formattedResults.length} recent result${
                  formattedResults.length !== 1 ? "s" : ""
                }`;

            // Format results with official source highlighting and date information
            const formattedMessage = displayedResults
              .map((r, i) => {
                const isOfficial =
                  /paypal\.com\/(legal|legalhome|.*policy)/i.test(r.link);
                const officialBadge =
                  isPolicyQuery && isOfficial ? "[OFFICIAL] " : "";

                // Try to extract date from snippet or title
                let dateInfo = "";
                if (isPolicyQuery) {
                  // Look for "X days ago", "X weeks ago", dates in various formats including "Last updated on 20 August 2025"
                  const datePatterns = [
                    /(Last\s+updated\s+on|Updated\s+on|Last\s+updated|Updated\s+on).*?(\d{1,2}\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}|\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2}|(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[\w\s]+\d{1,2},?\s+\d{4})/i, // "Last updated on 20 August 2025"
                    /(\d+\s+(days?|weeks?|months?)\s+ago)/i, // "3 days ago", "2 weeks ago"
                    /(Effective|Effective\s+date).*?(\d{1,2}\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}|\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2})/i,
                    /\d{1,2}\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}/i, // "20 August 2025"
                    /\d{1,2}\/\d{1,2}\/\d{4}/,
                    /\d{4}-\d{2}-\d{2}/,
                  ];
                  const fullText = `${r.title} ${r.snippet}`;
                  for (const pattern of datePatterns) {
                    const match = fullText.match(pattern);
                    if (match) {
                      dateInfo = `\n   📅 ${match[0]}`;
                      break;
                    }
                  }
                }

                return `${i + 1}. ${officialBadge}${r.title}\n   ${
                  r.snippet
                }${dateInfo}\n   🔗 ${r.link}`;
              })
              .join("\n\n");

            return {
              success: true,
              message: `${headerMessage}:\n\n${formattedMessage}`,
              data: formattedResults,
            };
          } catch (error) {
            console.error("❌ Web search error in executeTool:", error);
            return {
              success: false,
              message: `Web search failed: ${error.message}`,
              data: [],
            };
          }
        }

        case "calculate_fees": {
          const {
            amount,
            transactionType = "domestic",
            accountType = "personal",
            paymentMethod = null,
            paymentType = null,
            currency = "USD",
            feeCategory = "auto",
          } = args || {};
          if (!amount) {
            return {
              success: false,
              message: "Missing required argument: amount",
            };
          }
          // Use enhanced fee calculator with actual fee data
          const result = await this.feeCalculatorEnhanced.calculateFees({
            amount,
            transactionType,
            accountType,
            paymentType: paymentType || paymentMethod,
            currency,
            feeCategory,
          });
          if (result.success) {
            return {
              success: true,
              message: result.message || "Fee calculation completed",
              data: result.data,
            };
          } else {
            return {
              success: false,
              message: result.error || "Fee calculation failed",
            };
          }
        }

        case "check_status": {
          const result = await this.statusChecker.getStatusResponse();
          return {
            success: result.success,
            message: result.message,
            data: result.statusData,
          };
        }

        case "estimate_timeline": {
          const {
            amount = 100,
            accountAge = "established_account",
            riskLevel = "low_risk",
          } = args || {};
          const queryStr = `$${amount}`;
          const result = await this.timelineService.handleTimelineQuery(
            queryStr
          );
          return {
            success: result.success,
            message: result.message,
            data: result.data,
          };
        }

        case "get_datetime": {
          const location = args?.location || null;
          const query = location
            ? `what is the time now in ${location}`
            : "what is the time now";
          const result = await this.dateTimeService.execute(query, location);
          return {
            success: result.success,
            message: result.message,
            timeInfo: result.timeInfo,
          };
        }

        default:
          return {
            success: false,
            message: `Unknown tool: ${toolName}`,
          };
      }
    } catch (error) {
      console.error(`❌ Error executing tool ${toolName}:`, error);
      return {
        success: false,
        message: `Error executing tool ${toolName}: ${error.message}`,
      };
    }
  }

  // Main processQuery method for testing and external use
  async processQuery(query) {
    try {
      console.log(`🔍 Processing query: "${query}"`);

      // Get triggered tools
      const triggeredTools = await this.getTriggeredTools(query);
      console.log(`🛠️ Triggered tools: ${triggeredTools.join(", ")}`);

      if (triggeredTools.length === 0) {
        return null; // No MCP tools triggered
      }

      // Get data from the first triggered tool (for testing purposes)
      const tool = triggeredTools[0];
      const toolData = await this.getToolData(tool, query);

      if (toolData && toolData.success) {
        return {
          type: tool,
          message: toolData.message,
          data: toolData.data,
        };
      } else {
        return {
          type: tool,
          message: toolData?.message || "Tool execution failed",
          data: null,
        };
      }
    } catch (error) {
      console.error("❌ Error in processQuery:", error.message);
      return {
        type: "error",
        message: `Error processing query: ${error.message}`,
        data: null,
      };
    }
  }
}

// Start MCP server when run directly
// MCP servers are typically called without TTY (stdin/stdout are pipes)
// or when this file is executed directly
const filePath = process.argv[1]?.replace(/\\/g, "/") || "";
const isIndexFile =
  filePath.endsWith("index.js") || filePath.endsWith("src/index.js");
const isMCPMode = !process.stdin.isTTY; // MCP clients communicate via stdio

if (isIndexFile || isMCPMode) {
  // Running as MCP server - start it
  const server = new PayPalMCPServer();
  server.run().catch((error) => {
    console.error("Error starting MCP server:", error);
    process.exit(1);
  });
}

// Export service adapter for backend use
// Note: Backend needs to use dynamic import since this is ES module
export default MCPToolsService;
