import CalculatorTool from "./calculatorTool.js";
import WebSearchTool from "./webSearchTool.js";
import ShopifyStatusTool from "./shopifyStatusTool.js";
import DateTimeTool from "./dateTimeTool.js";
import CodeValidatorTool from "./codeValidatorTool.js";
import CurrencyConverterTool from "./currencyConverterTool.js";
import ThemeCompatibilityTool from "./themeCompatibilityTool.js";

/**
 * MCP Client Orchestrator for Shopify Merchant Support Agent
 * Manages tool integration and decision making for when to use tools
 */
export class MCPOrchestrator {
  constructor() {
    this.tools = new Map();
    this.initializeTools();
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

    // Priority-based tool selection for better performance
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

    // 7. Low priority: Web Search (fallback, slower, use sparingly)
    // Use web search if confidence is low OR when explicitly needed
    if (this.shouldUseWebSearch(query, confidence)) {
      toolsToUse.push("web_search");
    }

    // Limit to 3 tools maximum for better performance
    return toolsToUse.slice(0, 3);
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
   * @param {Array} toolNames - Array of tool names to execute
   * @param {string} query - User query
   * @param {number} confidence - RAG confidence score
   * @returns {Object} Results from all executed tools
   */
  async executeTools(toolNames, query, confidence = 0.5) {
    const results = {};

    // Execute tools in parallel for better performance
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

    if (toolsToUse.length === 0) {
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
    if (toolResults.currency_converter && !toolResults.currency_converter.error) {
      const currencyResults = toolResults.currency_converter;

      if (currencyResults.summary) {
        enhancedAnswer += `\n\n${currencyResults.summary}`;
      }
    }

    // Add theme compatibility results if available
    if (toolResults.theme_compatibility && !toolResults.theme_compatibility.error) {
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
