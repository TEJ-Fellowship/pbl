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
    const expressions = [];

    // First, try to handle universal mathematical expressions
    const universalExpression = this.extractUniversalMathExpression(query);
    if (universalExpression) {
      expressions.push(universalExpression);
      return expressions;
    }

    // Then try to handle complex expressions with multiple operations
    const complexExpression = this.extractComplexExpression(query);
    if (complexExpression) {
      expressions.push(complexExpression);
      return expressions;
    }

    // Handle natural language percentage calculations
    const percentageMatch = this.extractPercentageCalculation(query);
    if (percentageMatch) {
      expressions.push(percentageMatch);
      return expressions;
    }

    // Enhanced patterns for various mathematical expressions
    const patterns = [
      // Basic arithmetic operations: "100 + 50", "25 * 4", "10 - 3", "15 / 5"
      /\d+(?:\.\d+)?\s*[\+\-\*\/]\s*\d+(?:\.\d+)?/g,
      // Decimal arithmetic: "10.5 + 2.3"
      /\d+\.\d+\s*[\+\-\*\/]\s*\d+\.?\d*/g,
      // Percentage calculations: "3.2% + $0.30", "15% of 200"
      /\d+(?:\.\d+)?%\s*[\+\-\*\/]\s*\$?[\d,]+(?:\.\d+)?/g,
      // Currency calculations: "$1,247.50 * 0.032", "$100 + $50"
      /\$[\d,]+(?:\.\d+)?\s*[\+\-\*\/]\s*[\d,]+(?:\.\d+)?/g,
      // Complex expressions with parentheses: "(100 + 50) * 2"
      /\([\d\.\s\+\-\*\/]+\)/g,
      // Shopify fee calculations: "2.9% + 30¢"
      /\d+(?:\.\d+)?%\s*\+\s*\d+(?:\.\d+)?¢/g,
      // Simple arithmetic with words: "ten plus five", "twenty minus three"
      /\b(?:ten|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand)\s+(?:plus|minus|times|divided by)\s+\b(?:ten|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand|\d+)/gi,
      // Mathematical expressions with variables: "x + y", "a * b"
      /[a-zA-Z]\s*[\+\-\*\/]\s*[a-zA-Z]/g,
    ];

    patterns.forEach((pattern) => {
      const matches = query.match(pattern);
      if (matches) {
        expressions.push(...matches);
      }
    });

    // If no patterns found, try to extract simple numbers and operations
    if (expressions.length === 0) {
      const simpleMathPattern =
        /(\d+(?:\.\d+)?)\s*([\+\-\*\/])\s*(\d+(?:\.\d+)?)/g;
      const simpleMatches = query.match(simpleMathPattern);
      if (simpleMatches) {
        expressions.push(...simpleMatches);
      }
    }

    return [...new Set(expressions)]; // Remove duplicates
  }

  /**
   * Extract universal mathematical expressions that can handle any mathematical expression
   * @param {string} query - The user query
   * @returns {string|null} Formatted calculation or null if not found
   */
  extractUniversalMathExpression(query) {
    // Remove common words like "calculate", "compute", "solve", "what is", etc.
    let cleanQuery = query
      .replace(
        /^(calculate|compute|solve|what is|how much is|evaluate)\s+/i,
        ""
      )
      .trim();

    // Check if the query contains mathematical content
    if (!this.hasMathematicalContent(cleanQuery)) {
      return null;
    }

    try {
      // Convert natural language to mathematical expression
      let mathExpression = this.convertNaturalLanguageToMath(cleanQuery);

      // Evaluate the mathematical expression
      const result = this.evaluateMathExpression(mathExpression);

      if (result !== null) {
        return `${cleanQuery} = ${result}`;
      }
    } catch (error) {
      console.log("Universal math expression parsing failed:", error.message);
    }

    return null;
  }

  /**
   * Convert natural language to mathematical expression
   * @param {string} query - Natural language query
   * @returns {string} Mathematical expression
   */
  convertNaturalLanguageToMath(query) {
    let expression = query;

    // Handle percentage expressions: "15% of $200" -> "(15/100) * 200"
    expression = expression.replace(
      /(\d+(?:\.\d+)?)%\s+of\s+\$?(\d+(?:,\d{3})*(?:\.\d+)?)/gi,
      (match, percentage, amount) => {
        const cleanAmount = amount.replace(/,/g, "");
        return `(${percentage}/100) * ${cleanAmount}`;
      }
    );

    // Handle currency symbols
    expression = expression.replace(/\$/g, "");

    // Handle commas in numbers
    expression = expression.replace(/(\d+),(\d+)/g, "$1$2");

    // Convert natural language operators to mathematical symbols
    expression = expression.replace(/\bplus\b/gi, "+");
    expression = expression.replace(/\bminus\b/gi, "-");
    expression = expression.replace(/\btimes\b/gi, "*");
    expression = expression.replace(/\bmultiply\b/gi, "*");
    expression = expression.replace(/\bdivided by\b/gi, "/");
    expression = expression.replace(/\bdivide\b/gi, "/");
    expression = expression.replace(/\badd\b/gi, "+");
    expression = expression.replace(/\bsubtract\b/gi, "-");

    // Clean up spaces around operators
    expression = expression.replace(/\s*([\+\-\*\/])\s*/g, " $1 ");

    return expression.trim();
  }

  /**
   * Evaluate mathematical expression safely
   * @param {string} expression - Mathematical expression
   * @returns {number|null} Result or null if invalid
   */
  evaluateMathExpression(expression) {
    try {
      // Use the already imported evaluate function from mathjs
      return evaluate(expression);
    } catch (error) {
      console.log("Math evaluation error:", error.message);
      return null;
    }
  }

  /**
   * Extract complex mathematical expressions with multiple operations
   * @param {string} query - The user query
   * @returns {string|null} Formatted calculation or null if not found
   */
  extractComplexExpression(query) {
    const lowerQuery = query.toLowerCase();

    // Pattern for complex expressions like "15% of $200 plus $20", "10% of 100 minus 5"
    const complexPatterns = [
      // "X% of $Y plus $Z", "X% of Y plus Z"
      /(\d+(?:\.\d+)?)%\s+of\s+\$?(\d+(?:,\d{3})*(?:\.\d+)?)\s+(?:plus|add|\+)\s+\$?(\d+(?:,\d{3})*(?:\.\d+)?)/i,
      // "X% of $Y minus $Z", "X% of Y minus Z"
      /(\d+(?:\.\d+)?)%\s+of\s+\$?(\d+(?:,\d{3})*(?:\.\d+)?)\s+(?:minus|subtract|\-)\s+\$?(\d+(?:,\d{3})*(?:\.\d+)?)/i,
      // "X% of $Y times $Z", "X% of Y times Z"
      /(\d+(?:\.\d+)?)%\s+of\s+\$?(\d+(?:,\d{3})*(?:\.\d+)?)\s+(?:times|multiply|\*)\s+\$?(\d+(?:,\d{3})*(?:\.\d+)?)/i,
      // "X% of $Y divided by $Z", "X% of Y divided by Z"
      /(\d+(?:\.\d+)?)%\s+of\s+\$?(\d+(?:,\d{3})*(?:\.\d+)?)\s+(?:divided by|divide|\/)\s+\$?(\d+(?:,\d{3})*(?:\.\d+)?)/i,
    ];

    for (const pattern of complexPatterns) {
      const match = query.match(pattern);
      if (match) {
        const percentage = parseFloat(match[1]);
        const amount1 = parseFloat(match[2].replace(/,/g, ""));
        const amount2 = parseFloat(match[3].replace(/,/g, ""));

        // Calculate the percentage first
        const percentageResult = (percentage / 100) * amount1;

        // Determine the operation
        let operation, result;
        if (match[0].toLowerCase().includes("plus") || match[0].includes("+")) {
          operation = "+";
          result = percentageResult + amount2;
        } else if (
          match[0].toLowerCase().includes("minus") ||
          match[0].includes("-")
        ) {
          operation = "-";
          result = percentageResult - amount2;
        } else if (
          match[0].toLowerCase().includes("times") ||
          match[0].includes("*")
        ) {
          operation = "*";
          result = percentageResult * amount2;
        } else if (
          match[0].toLowerCase().includes("divided") ||
          match[0].includes("/")
        ) {
          operation = "/";
          result = percentageResult / amount2;
        }

        // Format the result
        const hasDollarSign = match[0].includes("$");
        const formattedAmount1 = hasDollarSign ? `$${match[2]}` : match[2];
        const formattedAmount2 = hasDollarSign ? `$${match[3]}` : match[3];

        return `${match[1]}% of ${formattedAmount1} ${operation} ${formattedAmount2} = ${result}`;
      }
    }

    return null;
  }

  /**
   * Extract percentage calculation from natural language query
   * @param {string} query - The user query
   * @returns {string|null} Formatted calculation or null if not found
   */
  extractPercentageCalculation(query) {
    const lowerQuery = query.toLowerCase();

    // Look for percentage patterns
    const percentagePatterns = [
      // "15% of $200", "20% of 100"
      /(\d+(?:\.\d+)?)%\s+of\s+\$?(\d+(?:,\d{3})*(?:\.\d+)?)/i,
      // "what is 15% of $200"
      /(?:what\s+is|calculate|compute)\s+(\d+(?:\.\d+)?)%\s+of\s+\$?(\d+(?:,\d{3})*(?:\.\d+)?)/i,
      // "15% off $200"
      /(\d+(?:\.\d+)?)%\s+(?:off|discount\s+on)\s+\$?(\d+(?:,\d{3})*(?:\.\d+)?)/i,
    ];

    for (const pattern of percentagePatterns) {
      const match = query.match(pattern);
      if (match) {
        const percentage = parseFloat(match[1]);
        const amount = parseFloat(match[2].replace(/,/g, ""));
        const result = (percentage / 100) * amount;
        const hasDollarSign = match[0].includes("$");
        const formattedAmount = hasDollarSign ? `$${match[2]}` : match[2];
        return `${match[1]}% of ${formattedAmount} = ${result}`;
      }
    }

    return null;
  }

  /**
   * Clean and normalize mathematical expressions for evaluation
   * @param {string} expression - Raw mathematical expression
   * @returns {string} Cleaned expression ready for evaluation
   */
  cleanExpression(expression) {
    // Handle complex expressions that already have results
    if (expression.includes("=")) {
      const result = expression.split("=")[1].trim();
      return result.replace(/\$/g, "").replace(/,/g, "").trim();
    }

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
          // Check if this is a pre-calculated percentage result
          if (expr.includes("=")) {
            const [original, result] = expr.split(" = ");
            results.calculations.push({
              original: original,
              cleaned: original,
              result: parseFloat(result),
              formatted: this.formatResult(parseFloat(result), original),
            });
          } else {
            const cleanedExpr = this.cleanExpression(expr);
            const result = evaluate(cleanedExpr);

            results.calculations.push({
              original: expr,
              cleaned: cleanedExpr,
              result: result,
              formatted: this.formatResult(result, expr),
            });
          }
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
    // If original expression contains currency symbols or "of" (percentage of amount), format as currency
    if (
      originalExpr.includes("$") ||
      originalExpr.includes("¢") ||
      originalExpr.includes(" of ")
    ) {
      return `$${result.toFixed(2)}`;
    }

    // If original expression contains percentage and no currency context, format as percentage
    if (originalExpr.includes("%") && !originalExpr.includes(" of ")) {
      return `${(result * 100).toFixed(2)}%`;
    }

    // For large numbers, add commas
    if (result >= 1000) {
      return result.toLocaleString();
    }

    // Default formatting with appropriate decimal places
    if (result % 1 === 0) {
      return result.toString();
    } else {
      return result.toFixed(2);
    }
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

    // Enhanced mathematical expression detection
    const hasMath = this.hasMathematicalContent(query);

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
   * Check if query contains mathematical content
   * @param {string} query - User query
   * @returns {boolean} Whether query contains mathematical content
   */
  hasMathematicalContent(query) {
    const queryLower = query.toLowerCase();

    // Check for mathematical symbols
    const hasMathSymbols = /[\+\-\*\/\(\)]/.test(query);

    // Check for numbers
    const hasNumbers = /\d/.test(query);

    // Check for percentage symbols
    const hasPercentage = /%/.test(query);

    // Check for currency symbols
    const hasCurrency = /[\$¢]/.test(query);

    // Check for mathematical keywords
    const mathKeywords = [
      "calculate",
      "compute",
      "what is",
      "how much",
      "solve",
      "evaluate",
      "add",
      "subtract",
      "multiply",
      "divide",
      "plus",
      "minus",
      "times",
      "percentage",
      "percent",
      "fee",
      "charge",
      "cost",
      "price",
      "total",
      "sum",
      "discount",
      "tax",
      "commission",
      "profit",
      "loss",
      "revenue",
      "margin",
      "markup",
      "rate",
      "amount",
      "value",
      "worth",
      "expense",
      "income",
      "earnings",
      "savings",
      "refund",
      "credit",
      "debit",
      "balance",
      "budget",
      "estimate",
      "approximate",
      "roughly",
      "about",
      "around",
    ];

    const hasMathKeywords = mathKeywords.some((keyword) =>
      queryLower.includes(keyword)
    );

    // Enhanced mathematical patterns
    const mathPatterns = [
      /\d+\s*[\+\-\*\/]\s*\d+/, // Basic arithmetic: "100 + 50"
      /\d+\.\d+\s*[\+\-\*\/]\s*\d+/, // Decimal arithmetic: "10.5 + 2.3"
      /\d+%\s*(?:of|off|\+|\-|\*|\/)/i, // Percentage operations: "15% of 200"
      /\$\d+\s*[\+\-\*\/]/, // Currency operations: "$100 + $50"
      /\([\d\.\s\+\-\*\/]+\)/, // Parentheses expressions: "(100 + 50) * 2"
      /\d+(?:\.\d+)?%\s*\+\s*\d+(?:\.\d+)?¢/, // Shopify fee pattern: "2.9% + 30¢"
      /\d+(?:\.\d+)?%\s*\+\s*\$\d+(?:\.\d+)?/, // Percentage + currency: "3.2% + $0.30"
      /\d+(?:\.\d+)?%\s*of\s+\$?[\d,]+(?:\.\d+)?/i, // Percentage of amount: "15% of $200"
      /\$\d+(?:,\d{3})*(?:\.\d+)?\s*[\+\-\*\/]\s*\d+(?:\.\d+)?/, // Currency with numbers: "$1,247.50 * 0.032"
      /\d+(?:\.\d+)?\s*(?:times|multiplied by)\s*\d+(?:\.\d+)?/i, // Word-based multiplication
      /\d+(?:\.\d+)?\s*(?:plus|added to)\s*\d+(?:\.\d+)?/i, // Word-based addition
      /\d+(?:\.\d+)?\s*(?:minus|subtract)\s*\d+(?:\.\d+)?/i, // Word-based subtraction
      /\d+(?:\.\d+)?\s*(?:divided by)\s*\d+(?:\.\d+)?/i, // Word-based division
    ];

    const hasMathPatterns = mathPatterns.some((pattern) => pattern.test(query));

    // Check for calculation phrases
    const calculationPhrases = [
      /what is \d+/i,
      /how much is \d+/i,
      /calculate \d+/i,
      /compute \d+/i,
      /solve \d+/i,
      /evaluate \d+/i,
      /if.*\d+.*what/i,
      /when.*\d+.*then/i,
      /fee.*\d+/i,
      /charge.*\d+/i,
      /cost.*\d+/i,
      /price.*\d+/i,
      /total.*\d+/i,
      /sum.*\d+/i,
    ];

    const hasCalculationPhrases = calculationPhrases.some((pattern) =>
      pattern.test(query)
    );

    // Return true if any mathematical content is detected
    return (
      hasMathSymbols ||
      (hasNumbers && hasMathKeywords) ||
      hasPercentage ||
      hasCurrency ||
      hasMathPatterns ||
      hasCalculationPhrases ||
      (hasNumbers && queryLower.includes("transaction")) ||
      (hasNumbers && queryLower.includes("payment")) ||
      (hasNumbers && queryLower.includes("processing"))
    );
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
