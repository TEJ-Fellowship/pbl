import CalculatorTool from "./calculatorTool.js";
import WebSearchTool from "./webSearchTool.js";
import ShopifyStatusTool from "./shopifyStatusTool.js";
import DateTimeTool from "./dateTimeTool.js";
import CodeValidatorTool from "./codeValidatorTool.js";

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

    // Check for Shopify status issues
    if (this.shouldUseStatusChecker(query)) {
      toolsToUse.push("shopify_status");
    }

    // Check for mathematical expressions that require calculator
    if (this.shouldUseCalculator(query)) {
      toolsToUse.push("calculator");
    }

    // Check for date/time operations
    if (this.shouldUseDateTimeTool(query)) {
      toolsToUse.push("date_time");
    }

    // Check for code validation needs
    if (this.shouldUseCodeValidator(query)) {
      toolsToUse.push("code_validator");
    }

    // Check for web search fallback when confidence is low or recent info needed
    if (this.shouldUseWebSearch(query, confidence)) {
      toolsToUse.push("web_search");
    }

    return toolsToUse;
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
    const mathPatterns = [
      // Percentage calculations
      /[\d\.]+%\s*[\+\-\*\/]/,
      // Currency calculations
      /\$?[\d,]+\.?\d*\s*[\+\-\*\/]/,
      // Basic math expressions
      /[\d\.]+\s*[\+\-\*\/]\s*[\d\.]+/,
      // Complex expressions with parentheses
      /\([\d\.\s\+\-\*\/]+\)/,
      // Shopify fee patterns
      /[\d\.]+%\s*\+\s*[\d\.]+¢/,
      // Words that suggest calculation
      /calculate|compute|what is|how much|fee|charge|cost|price|total|sum|add|multiply|divide|subtract/i,
    ];

    return mathPatterns.some((pattern) => pattern.test(query));
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

    for (const toolName of toolNames) {
      if (this.tools.has(toolName)) {
        try {
          const tool = this.tools.get(toolName);

          // Pass confidence to web search tool, handle different tool methods
          if (toolName === "web_search") {
            results[toolName] = await tool.search(query, confidence);
          } else if (toolName === "shopify_status") {
            results[toolName] = await tool.checkStatus(query);
          } else if (toolName === "date_time") {
            results[toolName] = await tool.processDateTime(query);
          } else if (toolName === "code_validator") {
            results[toolName] = await tool.validateCode(query);
          } else {
            results[toolName] = await tool.calculate(query);
          }
        } catch (error) {
          console.error(`Error executing tool ${toolName}:`, error);
          results[toolName] = {
            error: `Tool execution failed: ${error.message}`,
            operations: [],
            calculations: [],
            validations: [],
            summary: null,
          };
        }
      } else {
        console.warn(`Tool ${toolName} not found`);
        results[toolName] = {
          error: `Tool ${toolName} not available`,
          operations: [],
          calculations: [],
          validations: [],
          summary: null,
        };
      }
    }

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
