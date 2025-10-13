import CalculatorTool from "./calculatorTool.js";

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

    // Check for mathematical expressions that require calculator
    if (this.shouldUseCalculator(query)) {
      toolsToUse.push("calculator");
    }

    // Future tools can be added here
    // if (confidence < 0.6) {
    //   toolsToUse.push('web_search');
    // }

    return toolsToUse;
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
   * Execute the specified tools with the given query
   * @param {Array} toolNames - Array of tool names to execute
   * @param {string} query - User query
   * @returns {Object} Results from all executed tools
   */
  async executeTools(toolNames, query) {
    const results = {};

    for (const toolName of toolNames) {
      if (this.tools.has(toolName)) {
        try {
          const tool = this.tools.get(toolName);
          results[toolName] = await tool.calculate(query);
        } catch (error) {
          console.error(`Error executing tool ${toolName}:`, error);
          results[toolName] = {
            error: `Tool execution failed: ${error.message}`,
            calculations: [],
            summary: null,
          };
        }
      } else {
        console.warn(`Tool ${toolName} not found`);
        results[toolName] = {
          error: `Tool ${toolName} not available`,
          calculations: [],
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

    const toolResults = await this.executeTools(toolsToUse, query);

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
