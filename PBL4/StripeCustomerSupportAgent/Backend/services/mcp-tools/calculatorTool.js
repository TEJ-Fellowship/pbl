import * as math from "mathjs";

/**
 * Calculator Tool for Stripe Fee Calculations
 * Handles mathematical expressions and fee calculations
 */
class CalculatorTool {
  constructor() {
    this.name = "calculator";
    this.description =
      "Calculate Stripe fees, percentages, and mathematical expressions";
  }

  /**
   * Extract and evaluate mathematical expressions from natural language
   * @param {string} query - User query containing mathematical expressions
   * @returns {Object} - Calculation result with confidence score
   */
  async execute(query) {
    try {
      console.log(
        `\n🧮 Calculator Tool: Processing "${query.substring(0, 50)}..."`
      );

      // Extract mathematical expressions from the query
      const mathExpressions = this.extractMathExpressions(query);

      if (mathExpressions.length === 0) {
        return {
          success: false,
          result: null,
          confidence: 0,
          message: "No mathematical expressions found in query",
        };
      }

      const results = [];
      let totalConfidence = 0;

      for (const expression of mathExpressions) {
        try {
          const result = math.evaluate(expression);
          const confidence = this.calculateConfidence(expression, result);

          results.push({
            expression,
            result,
            confidence,
            formatted: this.formatResult(result, expression),
          });

          totalConfidence += confidence;
        } catch (error) {
          console.warn(
            `⚠️ Calculator: Failed to evaluate "${expression}":`,
            error.message
          );
          results.push({
            expression,
            result: null,
            confidence: 0,
            error: error.message,
          });
        }
      }

      const avgConfidence =
        results.length > 0 ? totalConfidence / results.length : 0;

      const response = {
        success: true,
        results,
        confidence: avgConfidence,
        message: this.generateResponse(results, query),
      };

      // Clear last conversion after use
      this.lastConversion = null;

      return response;
    } catch (error) {
      console.error("❌ Calculator Tool Error:", error);
      return {
        success: false,
        result: null,
        confidence: 0,
        error: error.message,
      };
    }
  }

  /**
   * Extract mathematical expressions from natural language
   * @param {string} query - Input query
   * @returns {Array} - Array of mathematical expressions
   */
  extractMathExpressions(query) {
    const expressions = [];

    // Check for currency conversion first
    const currencyConversion = this.extractCurrencyConversion(query);
    if (currencyConversion) {
      expressions.push(currencyConversion);
      return expressions;
    }

    // Pattern 1: Direct mathematical expressions
    const directMath = query.match(/[\d\.\+\-\*\/\(\)%]+/g);
    if (directMath) {
      expressions.push(...directMath.filter((expr) => expr.length > 1));
    }

    // Pattern 2: Stripe fee calculations
    const feePattern = /(\d+\.?\d*)\s*%\s*\+\s*\$(\d+\.?\d*)/g;
    let match;
    while ((match = feePattern.exec(query)) !== null) {
      const percentage = parseFloat(match[1]);
      const fixedFee = parseFloat(match[2]);
      expressions.push(`${percentage}/100 + ${fixedFee}`);
    }

    // Pattern 3: Percentage calculations
    const percentagePattern = /(\d+\.?\d*)\s*%\s*of\s*\$?(\d+\.?\d*)/g;
    while ((match = percentagePattern.exec(query)) !== null) {
      const percentage = parseFloat(match[1]);
      const amount = parseFloat(match[2]);
      expressions.push(`(${percentage}/100) * ${amount}`);
    }

    // Pattern 4: Simple arithmetic
    const arithmeticPattern = /(\d+\.?\d*)\s*([\+\-\*\/])\s*(\d+\.?\d*)/g;
    while ((match = arithmeticPattern.exec(query)) !== null) {
      const num1 = match[1];
      const operator = match[2];
      const num2 = match[3];
      expressions.push(`${num1} ${operator} ${num2}`);
    }

    return [...new Set(expressions)]; // Remove duplicates
  }

  /**
   * Extract currency conversion from query
   * @param {string} query - User query
   * @returns {string|null} - Currency conversion expression or null
   */
  extractCurrencyConversion(query) {
    const lowerQuery = query.toLowerCase();

    // Check for currency conversion patterns (more flexible to handle typos)
    const currencyPatterns = [
      // Handle "ot" typo for "to"
      /convert\s+(\d+(?:\.\d+)?)\s*(rupee|rupees|rs|inr)\s*ot\s*(dollar|dollars|usd|us)/i,
      /convert\s+(\d+(?:\.\d+)?)\s*(dollar|dollars|usd|us)\s*ot\s*(rupee|rupees|rs|inr)/i,
      /(\d+(?:\.\d+)?)\s*(rupee|rupees|rs|inr)\s*ot\s*(dollar|dollars|usd|us)/i,
      /(\d+(?:\.\d+)?)\s*(dollar|dollars|usd|us)\s*ot\s*(rupee|rupees|rs|inr)/i,
      // Standard patterns
      /convert\s+(\d+(?:\.\d+)?)\s*(rupee|rupees|rs|inr)\s*to\s*(dollar|dollars|usd|us)/i,
      /convert\s+(\d+(?:\.\d+)?)\s*(dollar|dollars|usd|us)\s*to\s*(rupee|rupees|rs|inr)/i,
      /(\d+(?:\.\d+)?)\s*(rupee|rupees|rs|inr)\s*to\s*(dollar|dollars|usd|us)/i,
      /(\d+(?:\.\d+)?)\s*(dollar|dollars|usd|us)\s*to\s*(rupee|rupees|rs|inr)/i,
      // More flexible patterns
      /(\d+(?:\.\d+)?)\s*(rupee|rupees|rs|inr)\s*in\s*(dollar|dollars|usd|us)/i,
      /(\d+(?:\.\d+)?)\s*(dollar|dollars|usd|us)\s*in\s*(rupee|rupees|rs|inr)/i,
    ];

    for (const pattern of currencyPatterns) {
      const match = query.match(pattern);
      if (match) {
        const amount = parseFloat(match[1]);
        const fromCurrency = match[2].toLowerCase();
        const toCurrency = match[3]
          ? match[3].toLowerCase()
          : match[4].toLowerCase();

        // Use approximate exchange rates (these should be updated with real-time rates)
        let rate = 1;
        if (
          fromCurrency.includes("rupee") ||
          fromCurrency.includes("rs") ||
          fromCurrency.includes("inr")
        ) {
          if (
            toCurrency.includes("dollar") ||
            toCurrency.includes("usd") ||
            toCurrency.includes("us")
          ) {
            rate = 0.012; // Approximate INR to USD rate
          }
        } else if (
          fromCurrency.includes("dollar") ||
          fromCurrency.includes("usd") ||
          fromCurrency.includes("us")
        ) {
          if (
            toCurrency.includes("rupee") ||
            toCurrency.includes("rs") ||
            toCurrency.includes("inr")
          ) {
            rate = 83.0; // Approximate USD to INR rate
          }
        }

        // Store conversion details for better formatting
        this.lastConversion = {
          amount,
          fromCurrency,
          toCurrency,
          rate,
          result: amount * rate,
        };

        return `${amount} * ${rate}`;
      }
    }

    return null;
  }

  /**
   * Calculate confidence score for a mathematical expression
   * @param {string} expression - Mathematical expression
   * @param {number} result - Calculated result
   * @returns {number} - Confidence score (0-1)
   */
  calculateConfidence(expression, result) {
    let confidence = 0.8; // Base confidence

    // Higher confidence for simple expressions
    if (expression.length < 20) confidence += 0.1;

    // Higher confidence for reasonable results
    if (result > 0 && result < 1000000) confidence += 0.1;

    // Lower confidence for very large or very small results
    if (result > 1000000 || (result > 0 && result < 0.001)) confidence -= 0.2;

    return Math.min(1, Math.max(0, confidence));
  }

  /**
   * Format calculation result for display
   * @param {number} result - Calculation result
   * @param {string} expression - Original expression
   * @returns {string} - Formatted result
   */
  formatResult(result, expression) {
    if (typeof result === "number") {
      // Check if this is a currency conversion
      if (this.lastConversion) {
        const { fromCurrency, toCurrency, amount } = this.lastConversion;

        // Format based on target currency
        if (
          toCurrency.includes("dollar") ||
          toCurrency.includes("usd") ||
          toCurrency.includes("us")
        ) {
          if (result % 1 === 0) {
            return `$${result.toFixed(0)}`;
          } else {
            return `$${result.toFixed(2)}`;
          }
        } else if (
          toCurrency.includes("rupee") ||
          toCurrency.includes("rs") ||
          toCurrency.includes("inr")
        ) {
          if (result % 1 === 0) {
            return `₹${result.toFixed(0)}`;
          } else {
            return `₹${result.toFixed(2)}`;
          }
        }
      }

      // Default formatting
      if (result % 1 === 0) {
        return `$${result.toFixed(0)}`;
      } else {
        return `$${result.toFixed(2)}`;
      }
    }
    return result.toString();
  }

  /**
   * Generate human-readable response for calculation results
   * @param {Array} results - Array of calculation results
   * @param {string} query - Original query
   * @returns {string} - Formatted response
   */
  generateResponse(results, query) {
    const successfulResults = results.filter((r) => r.result !== null);

    if (successfulResults.length === 0) {
      return "I couldn't perform the calculation. Please check your input.";
    }

    if (successfulResults.length === 1) {
      const result = successfulResults[0];

      // Check if this is a currency conversion for better messaging
      if (this.lastConversion) {
        const { amount, fromCurrency, toCurrency } = this.lastConversion;
        return `${amount} ${fromCurrency.toUpperCase()} = ${
          result.formatted
        } (${toCurrency.toUpperCase()})`;
      }

      return `The result is ${result.formatted} (${result.expression})`;
    }

    let response = "Here are the calculations:\n";
    successfulResults.forEach((result, index) => {
      response += `${index + 1}. ${result.formatted} (${result.expression})\n`;
    });

    return response.trim();
  }

  /**
   * Check if this tool should be used for the given query
   * @param {string} query - User query
   * @returns {boolean} - Whether to use this tool
   */
  shouldUse(query) {
    const mathIndicators = [
      /\d+\.\d+%/, // Percentages
      /\$\d+/, // Dollar amounts
      /calculate|compute|math/, // Math keywords
      /fee|cost|price/, // Financial terms
      /[\+\-\*\/]/, // Math operators
      /percent|percentage/, // Percentage keywords
      /convert.*to|currency|rupee|dollar|euro|pound/, // Currency conversion
      /\d+\s*(rupee|dollar|euro|pound|rs|usd|eur|gbp)/i, // Currency amounts
    ];

    return mathIndicators.some((pattern) => pattern.test(query.toLowerCase()));
  }
}

export default CalculatorTool;
