import { evaluate } from "mathjs";

/**
 * Calculator MCP Tool for Shopify pricing calculations
 * Handles mathematical expressions and Shopify-specific calculations
 */
export class CalculatorTool {
  constructor() {
    this.name = "calculator";
    this.description = "Calculate mathematical expressions and Shopify pricing";
  }

  /**
   * Extract mathematical expressions from natural language queries
   * @param {string} query - The user query containing mathematical expressions
   * @returns {Array} Array of mathematical expressions found
   */
  extractMathExpressions(query) {
    // Patterns for various mathematical expressions
    const patterns = [
      // Percentage calculations: "3.2% + $0.30"
      /[\d\.]+%\s*[\+\-\*\/]\s*\$?[\d\.]+/g,
      // Currency calculations: "$1,247.50 * 0.032"
      /\$?[\d,]+\.?\d*\s*[\+\-\*\/]\s*[\d\.]+/g,
      // Basic math expressions: "100 + 50", "25 * 4"
      /[\d\.]+\s*[\+\-\*\/]\s*[\d\.]+/g,
      // Complex expressions with parentheses
      /\([\d\.\s\+\-\*\/]+\)/g,
      // Shopify fee calculations: "2.9% + 30¢"
      /[\d\.]+%\s*\+\s*[\d\.]+¢/g,
      // Simple numbers for context
      /[\d\.]+/g,
    ];

    const expressions = [];

    patterns.forEach((pattern) => {
      const matches = query.match(pattern);
      if (matches) {
        expressions.push(...matches);
      }
    });

    return [...new Set(expressions)]; // Remove duplicates
  }

  /**
   * Clean and normalize mathematical expressions for evaluation
   * @param {string} expression - Raw mathematical expression
   * @returns {string} Cleaned expression ready for evaluation
   */
  cleanExpression(expression) {
    return expression
      .replace(/\$/g, "") // Remove dollar signs
      .replace(/,/g, "") // Remove commas
      .replace(/¢/g, "") // Remove cent symbols
      .replace(/%/g, "/100") // Convert percentage to decimal
      .replace(/\s+/g, "") // Remove spaces
      .trim();
  }

  /**
   * Calculate Shopify-specific fees and pricing
   * @param {string} query - Query containing pricing information
   * @returns {Object} Calculation results
   */
  calculateShopifyFees(query) {
    const results = {
      calculations: [],
      summary: null,
      error: null,
    };

    try {
      // Extract mathematical expressions
      const expressions = this.extractMathExpressions(query);

      if (expressions.length === 0) {
        results.error = "No mathematical expressions found in the query";
        return results;
      }

      // Process each expression
      expressions.forEach((expr, index) => {
        try {
          const cleanedExpr = this.cleanExpression(expr);
          const result = evaluate(cleanedExpr);

          results.calculations.push({
            original: expr,
            cleaned: cleanedExpr,
            result: result,
            formatted: this.formatResult(result, expr),
          });
        } catch (err) {
          results.calculations.push({
            original: expr,
            error: `Invalid expression: ${err.message}`,
          });
        }
      });

      // Generate summary if we have valid calculations
      const validCalculations = results.calculations.filter(
        (calc) => !calc.error
      );
      if (validCalculations.length > 0) {
        results.summary = this.generateSummary(validCalculations, query);
      }
    } catch (error) {
      results.error = `Calculation error: ${error.message}`;
    }

    return results;
  }

  /**
   * Format calculation results based on the original expression context
   * @param {number} result - The calculated result
   * @param {string} originalExpr - The original expression
   * @returns {string} Formatted result
   */
  formatResult(result, originalExpr) {
    // If original expression contains currency symbols, format as currency
    if (originalExpr.includes("$") || originalExpr.includes("¢")) {
      return `$${result.toFixed(2)}`;
    }

    // If original expression contains percentage, format as percentage
    if (originalExpr.includes("%")) {
      return `${(result * 100).toFixed(2)}%`;
    }

    // Default formatting
    return result.toString();
  }

  /**
   * Generate a summary of calculations for Shopify context
   * @param {Array} calculations - Array of valid calculations
   * @param {string} query - Original query for context
   * @returns {string} Summary text
   */
  generateSummary(calculations, query) {
    const totalCalculations = calculations.length;
    const results = calculations.map((calc) => calc.formatted).join(", ");

    let summary = `Calculated ${totalCalculations} expression${
      totalCalculations > 1 ? "s" : ""
    }: ${results}`;

    // Add Shopify-specific context if detected
    if (
      query.toLowerCase().includes("fee") ||
      query.toLowerCase().includes("charge")
    ) {
      summary +=
        "\n\n💡 **Shopify Fee Context:** These calculations can help you understand transaction fees, processing costs, or pricing structures for your Shopify store.";
    }

    if (
      query.toLowerCase().includes("tax") ||
      query.toLowerCase().includes("vat")
    ) {
      summary +=
        "\n\n💡 **Tax Calculation:** Remember to consider local tax regulations when calculating final prices for your customers.";
    }

    return summary;
  }

  /**
   * Main method to handle calculator requests
   * @param {string} query - User query containing mathematical expressions
   * @returns {Object} Calculation results
   */
  async calculate(query) {
    if (!query || typeof query !== "string") {
      return {
        error: "Invalid query provided",
        calculations: [],
        summary: null,
      };
    }

    // Check if query contains mathematical expressions
    const hasMath = /[\d\.\+\-\*\/\(\)%\$¢]/.test(query);

    if (!hasMath) {
      return {
        error: "No mathematical expressions detected in the query",
        calculations: [],
        summary: null,
      };
    }

    return this.calculateShopifyFees(query);
  }

  /**
   * Get tool information
   * @returns {Object} Tool metadata
   */
  getToolInfo() {
    return {
      name: this.name,
      description: this.description,
      capabilities: [
        "Basic mathematical operations (+, -, *, /)",
        "Percentage calculations",
        "Currency calculations",
        "Shopify fee calculations",
        "Complex expressions with parentheses",
        "Multi-expression evaluation",
      ],
      examples: [
        "Calculate 2.9% + $0.30 on $100",
        "What is 15% of $250?",
        "If I charge 3.2% + $0.30 per transaction, what's the fee on $1,247.50?",
        "Calculate (100 + 50) * 0.15",
      ],
    };
  }
}

export default CalculatorTool;
