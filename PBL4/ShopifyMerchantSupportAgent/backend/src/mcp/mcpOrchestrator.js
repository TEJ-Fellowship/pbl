import CalculatorTool from "./calculatorTool.js";
import WebSearchTool from "./webSearchTool.js";
import ShopifyStatusTool from "./shopifyStatusTool.js";
import DateTimeTool from "./dateTimeTool.js";
import CodeValidatorTool from "./codeValidatorTool.js";
import CurrencyConverterTool from "./currencyConverterTool.js";
import ThemeCompatibilityTool from "./themeCompatibilityTool.js";
import { getMCPClient } from "./mcpClient.js";

/**
 * MCP Client Orchestrator for Shopify Merchant Support Agent
 *
 * This orchestrator now uses the MCP client-server architecture:
 * - Tools are registered with MCP server
 * - Tool execution goes through MCP protocol (JSON-RPC)
 * - Maintains backward compatibility with existing interface
 * - Decision-making still uses direct tool instances for performance
 *
 * Architecture Flow:
 * 1. Orchestrator decides which tools to use (direct tool instances)
 * 2. Orchestrator calls MCP client to execute tools via protocol
 * 3. MCP client sends JSON-RPC requests to MCP server
 * 4. MCP server routes to appropriate tool handlers
 * 5. Results flow back through protocol to orchestrator
 */
export class MCPOrchestrator {
  constructor() {
    this.tools = new Map(); // Keep for decision-making methods
    this.mcpClient = null; // MCP client for protocol-based execution
    this.clientInitialized = false; // Track initialization status
    this.initializeTools();
    // Initialize client asynchronously (non-blocking)
    this.initializeMCPClient().catch((err) => {
      console.error("MCP client initialization error:", err);
    });
  }

  /**
   * Initialize MCP client connection (async, non-blocking)
   */
  async initializeMCPClient() {
    if (this.clientInitialized) return;

    try {
      this.mcpClient = await getMCPClient({
        useDirectServer: true, // Use direct server access for in-process (no protocol overhead)
      });
      this.clientInitialized = true;
      console.log("🔌 MCP Orchestrator: Connected to MCP server via client");
    } catch (error) {
      console.error("Failed to initialize MCP client:", error);
      // Fallback to direct calls if MCP client fails
      console.warn("⚠️ Falling back to direct tool calls");
      this.clientInitialized = false;
    }
  }

  /**
   * Initialize available MCP tools
   */
  initializeTools() {
    // Register Calculator Tool
    const calculatorTool = new CalculatorTool();
    this.tools.set("calculator", calculatorTool);

    // Register Web Search Tool
    const webSearchTool = new WebSearchTool();
    this.tools.set("web_search", webSearchTool);

    // Register Shopify Status Tool
    const shopifyStatusTool = new ShopifyStatusTool();
    this.tools.set("shopify_status", shopifyStatusTool);

    // Register Date/Time Tool
    const dateTimeTool = new DateTimeTool();
    this.tools.set("date_time", dateTimeTool);

    // Register Code Validator Tool
    const codeValidatorTool = new CodeValidatorTool();
    this.tools.set("code_validator", codeValidatorTool);

    // Register Currency Converter Tool
    const currencyConverterTool = new CurrencyConverterTool();
    this.tools.set("currency_converter", currencyConverterTool);

    // Register Theme Compatibility Tool
    const themeCompatibilityTool = new ThemeCompatibilityTool();
    this.tools.set("theme_compatibility", themeCompatibilityTool);

    console.log("🔧 MCP Tools initialized:", Array.from(this.tools.keys()));
  }

  /**
   * Decide which tools to use based on query content and confidence
   * @param {string} query - User query
   * @param {number} confidence - Confidence score from RAG system
   * @returns {Array} Array of tool names to use
   */
  decideToolUse(query, confidence) {
    const toolsToUse = [];
    const queryLower = query.toLowerCase();

    // Check for general knowledge queries first (highest priority for non-Shopify queries)
    const webSearchTool = this.tools.get("web_search");
    const shouldUseWeb = webSearchTool
      ? webSearchTool.shouldUseWebSearch(query, confidence)
      : false;

    console.log(
      `🔧 Web search check: shouldUseWeb=${shouldUseWeb}, confidence=${confidence}`
    );

    // If this is a general knowledge query that needs web search, prioritize it
    if (shouldUseWeb) {
      const isGeneralKnowledgeQuery =
        /^(who is|what is|when was|where is|why is|how does|tell me about|explain|describe|define)/i.test(
          query
        );
      const isNotShopifyRelated =
        !queryLower.includes("shopify") &&
        !queryLower.includes("ecommerce") &&
        !queryLower.includes("store");

      console.log(
        `🔧 General knowledge check: isGeneralKnowledgeQuery=${isGeneralKnowledgeQuery}, isNotShopifyRelated=${isNotShopifyRelated}`
      );

      if (isGeneralKnowledgeQuery && isNotShopifyRelated) {
        // For general knowledge queries, prioritize web search
        console.log(
          `🔧 Prioritizing web search for general knowledge query: "${query}"`
        );
        toolsToUse.push("web_search");
        return toolsToUse; // Return early for general knowledge queries
      }
    }

    // Priority-based tool selection for Shopify-related queries
    // 1. High priority: Calculator (fast, local calculation)
    if (this.shouldUseCalculator(query)) {
      toolsToUse.push("calculator");
    }

    // 2. High priority: Shopify Status (critical for service issues)
    if (this.shouldUseStatusChecker(query)) {
      toolsToUse.push("shopify_status");
    }

    // 3. Medium priority: Code Validator (important for development queries)
    if (this.shouldUseCodeValidator(query)) {
      toolsToUse.push("code_validator");
    }

    // 4. Medium priority: Currency Converter (for international merchants)
    if (this.shouldUseCurrencyConverter(query)) {
      toolsToUse.push("currency_converter");
    }

    // 5. Medium priority: Theme Compatibility (for app compatibility checks)
    if (this.shouldUseThemeCompatibility(query)) {
      toolsToUse.push("theme_compatibility");
    }

    // 6. Medium priority: Date/Time (useful for scheduling queries)
    if (this.shouldUseDateTimeTool(query)) {
      toolsToUse.push("date_time");
    }

    // 7. Web Search for other cases (Shopify-related external info, low confidence, etc.)
    if (shouldUseWeb && !toolsToUse.includes("web_search")) {
      toolsToUse.push("web_search");
    }

    // Limit to 2 tools maximum for better performance and reduced latency
    return toolsToUse.slice(0, 2);
  }

  /**
   * Determine if Shopify status checker should be used
   * @param {string} query - User query
   * @returns {boolean} Whether to use status checker
   */
  shouldUseStatusChecker(query) {
    const statusTool = this.tools.get("shopify_status");
    if (!statusTool) return false;

    return statusTool.shouldUseStatusChecker(query);
  }

  /**
   * Determine if calculator tool should be used
   * @param {string} query - User query
   * @returns {boolean} Whether to use calculator
   */
  shouldUseCalculator(query) {
    const calculatorTool = this.tools.get("calculator");
    if (!calculatorTool) return false;

    // Use the enhanced detection from the calculator tool itself
    return calculatorTool.hasMathematicalContent(query);
  }

  /**
   * Determine if date/time tool should be used
   * @param {string} query - User query
   * @returns {boolean} Whether to use date/time tool
   */
  shouldUseDateTimeTool(query) {
    const dateTimeTool = this.tools.get("date_time");
    if (!dateTimeTool) return false;

    return dateTimeTool.shouldUseDateTimeTool(query);
  }

  /**
   * Determine if code validator tool should be used
   * @param {string} query - User query
   * @returns {boolean} Whether to use code validator
   */
  shouldUseCodeValidator(query) {
    const codeValidatorTool = this.tools.get("code_validator");
    if (!codeValidatorTool) return false;

    return codeValidatorTool.shouldUseCodeValidator(query);
  }

  /**
   * Determine if currency converter tool should be used
   * @param {string} query - User query
   * @returns {boolean} Whether to use currency converter
   */
  shouldUseCurrencyConverter(query) {
    const currencyConverterTool = this.tools.get("currency_converter");
    if (!currencyConverterTool) return false;

    return currencyConverterTool.shouldUseCurrencyConverter(query);
  }

  /**
   * Determine if theme compatibility tool should be used
   * @param {string} query - User query
   * @returns {boolean} Whether to use theme compatibility checker
   */
  shouldUseThemeCompatibility(query) {
    const themeCompatibilityTool = this.tools.get("theme_compatibility");
    if (!themeCompatibilityTool) return false;

    return themeCompatibilityTool.shouldUseThemeCompatibilityChecker(query);
  }

  /**
   * Determine if web search tool should be used
   * @param {string} query - User query
   * @param {number} confidence - RAG confidence score
   * @returns {boolean} Whether to use web search
   */
  shouldUseWebSearch(query, confidence) {
    const webSearchTool = this.tools.get("web_search");
    if (!webSearchTool) return false;

    return webSearchTool.shouldUseWebSearch(query, confidence);
  }

  /**
   * Execute the specified tools with the given query
   * Now uses MCP client-server architecture via protocol
   * @param {Array} toolNames - Array of tool names to execute
   * @param {string} query - User query
   * @param {number} confidence - RAG confidence score
   * @returns {Object} Results from all executed tools
   */
  async executeTools(toolNames, query, confidence = 0.5) {
    const results = {};

    // Ensure client is initialized
    if (!this.clientInitialized && !this.mcpClient) {
      await this.initializeMCPClient();
    }

    // Use MCP client if available, otherwise fallback to direct calls
    const useMCPClient = this.mcpClient && this.mcpClient.isConnected();

    if (useMCPClient) {
      // Execute tools via MCP protocol (client-server architecture)
      console.log(`🔌 Executing ${toolNames.length} tools via MCP protocol`);

      const toolPromises = toolNames.map(async (toolName) => {
        try {
          // Call tool via MCP client (JSON-RPC protocol)
          const mcpResponse = await this.mcpClient.callTool(toolName, {
            query: query,
            confidence: confidence,
          });

          // Parse MCP response
          let toolResult;
          if (typeof mcpResponse === "string") {
            toolResult = JSON.parse(mcpResponse);
          } else if (mcpResponse.content && mcpResponse.content[0]) {
            try {
              toolResult = JSON.parse(mcpResponse.content[0].text);
            } catch (e) {
              // If not JSON, create result object
              toolResult = {
                summary: mcpResponse.content[0].text,
                error: mcpResponse.isError ? "Tool execution failed" : null,
              };
            }
          } else {
            toolResult = mcpResponse;
          }

          return { toolName, result: toolResult };
        } catch (error) {
          console.error(`Error executing tool ${toolName} via MCP:`, error);
          return {
            toolName,
            result: {
              error: `Tool execution failed: ${error.message}`,
              operations: [],
              calculations: [],
              validations: [],
              summary: null,
            },
          };
        }
      });

      // Wait for all tools to complete
      const toolResults = await Promise.all(toolPromises);

      // Organize results by tool name
      toolResults.forEach(({ toolName, result }) => {
        results[toolName] = result;
      });

      return results;
    }

    // Fallback to direct method calls (backward compatibility)
    console.log(`⚠️ Using direct tool calls (MCP client not available)`);

    const toolPromises = toolNames.map(async (toolName) => {
      if (!this.tools.has(toolName)) {
        console.warn(`Tool ${toolName} not found`);
        return {
          toolName,
          result: {
            error: `Tool ${toolName} not available`,
            operations: [],
            calculations: [],
            validations: [],
            summary: null,
          },
        };
      }

      try {
        const tool = this.tools.get(toolName);
        let toolResult;

        // Execute tool based on its type
        switch (toolName) {
          case "web_search":
            toolResult = await tool.search(query, confidence);
            break;
          case "shopify_status":
            toolResult = await tool.checkStatus(query);
            break;
          case "date_time":
            toolResult = await tool.processDateTime(query);
            break;
          case "code_validator":
            toolResult = await tool.validateCode(query);
            break;
          case "calculator":
            toolResult = await tool.calculate(query);
            break;
          case "currency_converter":
            toolResult = await tool.convert(query);
            break;
          case "theme_compatibility":
            toolResult = await tool.checkCompatibility(query);
            break;
          default:
            toolResult = await tool.calculate(query);
        }

        return { toolName, result: toolResult };
      } catch (error) {
        console.error(`Error executing tool ${toolName}:`, error);
        return {
          toolName,
          result: {
            error: `Tool execution failed: ${error.message}`,
            operations: [],
            calculations: [],
            validations: [],
            summary: null,
          },
        };
      }
    });

    // Wait for all tools to complete
    const toolResults = await Promise.all(toolPromises);

    // Organize results by tool name
    toolResults.forEach(({ toolName, result }) => {
      results[toolName] = result;
    });

    return results;
  }

  /**
   * Process query with MCP tools and return enhanced response
   * @param {string} query - User query
   * @param {number} confidence - RAG confidence score
   * @param {string} originalAnswer - Original RAG answer
   * @returns {Object} Enhanced response with tool results
   */
  async processWithTools(query, confidence, originalAnswer) {
    const toolsToUse = this.decideToolUse(query, confidence);

    console.log(
      `🔧 MCP Decision for query: "${query}" (confidence: ${confidence})`
    );
    console.log(`🔧 Tools selected: [${toolsToUse.join(", ")}]`);

    if (toolsToUse.length === 0) {
      console.log(`🔧 No tools selected for query: "${query}"`);
      return {
        enhancedAnswer: originalAnswer,
        toolResults: {},
        toolsUsed: [],
      };
    }

    console.log(`🔧 Using MCP tools: ${toolsToUse.join(", ")}`);

    const toolResults = await this.executeTools(toolsToUse, query, confidence);

    // Enhance the original answer with tool results
    const enhancedAnswer = this.enhanceAnswerWithToolResults(
      originalAnswer,
      toolResults
    );

    return {
      enhancedAnswer,
      toolResults,
      toolsUsed: toolsToUse,
    };
  }

  /**
   * Enhance the original answer with tool results
   * @param {string} originalAnswer - Original RAG answer
   * @param {Object} toolResults - Results from executed tools
   * @returns {string} Enhanced answer
   */
  enhanceAnswerWithToolResults(originalAnswer, toolResults) {
    let enhancedAnswer = originalAnswer;

    // Add calculator results if available
    if (toolResults.calculator && !toolResults.calculator.error) {
      const calcResults = toolResults.calculator;

      if (calcResults.summary) {
        enhancedAnswer += `\n\n## 🧮 **Calculation Results**\n\n${calcResults.summary}`;

        if (calcResults.calculations.length > 0) {
          enhancedAnswer += "\n\n**Detailed Calculations:**\n";
          calcResults.calculations.forEach((calc, index) => {
            if (!calc.error) {
              enhancedAnswer += `${index + 1}. \`${calc.original}\` = **${
                calc.formatted
              }**\n`;
            }
          });
        }
      }
    }

    // Add Shopify status results if available
    if (toolResults.shopify_status && !toolResults.shopify_status.error) {
      const statusResults = toolResults.shopify_status;

      if (statusResults.summary) {
        enhancedAnswer += `\n\n${statusResults.summary}`;
      }
    }

    // Add date/time results if available
    if (toolResults.date_time && !toolResults.date_time.error) {
      const dateTimeResults = toolResults.date_time;

      if (dateTimeResults.summary) {
        enhancedAnswer += `\n\n## 🕒 **Date/Time Information**\n\n${dateTimeResults.summary}`;

        if (
          dateTimeResults.operations &&
          dateTimeResults.operations.length > 0
        ) {
          enhancedAnswer += "\n\n**Time Operations:**\n";
          dateTimeResults.operations.forEach((op, index) => {
            enhancedAnswer += `${index + 1}. ${op.formatted}\n`;
          });
        }

        if (
          dateTimeResults.calculations &&
          dateTimeResults.calculations.length > 0
        ) {
          enhancedAnswer += "\n\n**Time Calculations:**\n";
          dateTimeResults.calculations.forEach((calc, index) => {
            enhancedAnswer += `${index + 1}. ${calc.date1} to ${calc.date2}: ${
              calc.formatted
            }\n`;
          });
        }
      }
    }

    // Add code validator results if available
    if (toolResults.code_validator && !toolResults.code_validator.error) {
      const validatorResults = toolResults.code_validator;

      if (validatorResults.summary) {
        enhancedAnswer += `\n\n## 🔍 **Code Validation Results**\n\n${validatorResults.summary}`;

        if (
          validatorResults.validations &&
          validatorResults.validations.length > 0
        ) {
          enhancedAnswer += "\n\n**Validation Details:**\n";
          validatorResults.validations.forEach((validation, index) => {
            enhancedAnswer += `${index + 1}. **${validation.type}**: ${
              validation.value
            }\n`;

            if (
              validation.validation.errors &&
              validation.validation.errors.length > 0
            ) {
              enhancedAnswer += `   - Errors: ${validation.validation.errors.join(
                ", "
              )}\n`;
            }
            if (
              validation.validation.warnings &&
              validation.validation.warnings.length > 0
            ) {
              enhancedAnswer += `   - Warnings: ${validation.validation.warnings.join(
                ", "
              )}\n`;
            }
            if (
              validation.validation.suggestions &&
              validation.validation.suggestions.length > 0
            ) {
              enhancedAnswer += `   - Suggestions: ${validation.validation.suggestions.join(
                ", "
              )}\n`;
            }
          });
        }
      }
    }

    // Add currency converter results if available
    if (
      toolResults.currency_converter &&
      !toolResults.currency_converter.error
    ) {
      const currencyResults = toolResults.currency_converter;

      if (currencyResults.summary) {
        enhancedAnswer += `\n\n${currencyResults.summary}`;
      }
    }

    // Add theme compatibility results if available
    if (
      toolResults.theme_compatibility &&
      !toolResults.theme_compatibility.error
    ) {
      const themeResults = toolResults.theme_compatibility;

      if (themeResults.summary) {
        enhancedAnswer += `\n\n${themeResults.summary}`;
      }
    }

    // Add web search results if available
    if (toolResults.web_search && !toolResults.web_search.error) {
      const searchResults = toolResults.web_search;

      if (searchResults.summary) {
        enhancedAnswer += `\n\n## 🔍 **Web Search Results**\n\n${searchResults.summary}`;

        if (searchResults.results && searchResults.results.length > 0) {
          enhancedAnswer += "\n\n**Sources:**\n";
          searchResults.results.forEach((result, index) => {
            enhancedAnswer += `${index + 1}. [${result.title}](${
              result.url
            }) (${result.source})\n`;
          });
        }
      }
    }

    // Add error information if tools failed
    Object.entries(toolResults).forEach(([toolName, result]) => {
      if (result.error) {
        console.warn(`Tool ${toolName} error:`, result.error);
      }
    });

    return enhancedAnswer;
  }

  /**
   * Get information about available tools
   * @returns {Object} Tool information
   */
  getToolsInfo() {
    const toolsInfo = {};

    this.tools.forEach((tool, name) => {
      toolsInfo[name] = tool.getToolInfo();
    });

    return toolsInfo;
  }
}

export default MCPOrchestrator;
