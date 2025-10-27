import axios from "axios";

/**
 * Currency Converter Tool
 * Handles currency conversion with real-time exchange rates
 */
class CurrencyConverterTool {
  constructor() {
    this.name = "currency_converter";
    this.description = "Convert currencies with real-time exchange rates";
    this.exchangeRates = {
      // Fallback rates (should be updated with real-time data)
      INR: { USD: 0.012, EUR: 0.011, GBP: 0.0095, NPR: 1.6 },
      USD: { INR: 83.0, EUR: 0.92, GBP: 0.79, NPR: 133.0 },
      EUR: { USD: 1.09, INR: 90.0, GBP: 0.86, NPR: 145.0 },
      GBP: { USD: 1.27, INR: 105.0, EUR: 1.16, NPR: 169.0 },
      NPR: { USD: 0.0075, INR: 0.625, EUR: 0.0069, GBP: 0.0059 },
    };
  }

  /**
   * Execute currency conversion
   * @param {string} query - User query
   * @returns {Object} - Conversion result
   */
  async execute(query) {
    try {
      console.log(
        `\n💱 Currency Converter: Processing "${query.substring(0, 50)}..."`
      );

      const conversion = this.parseCurrencyConversion(query);
      if (!conversion) {
        return {
          success: false,
          result: null,
          confidence: 0,
          message: "Could not parse currency conversion from query",
        };
      }

      const { amount, fromCurrency, toCurrency } = conversion;

      // Get exchange rate
      const rate = await this.getExchangeRate(fromCurrency, toCurrency);
      if (!rate) {
        return {
          success: false,
          result: null,
          confidence: 0,
          message: `Exchange rate not available for ${fromCurrency} to ${toCurrency}`,
        };
      }

      const result = amount * rate;
      const formattedResult = this.formatCurrency(result, toCurrency);

      return {
        success: true,
        result: result,
        confidence: 0.9,
        message: `${amount} ${fromCurrency.toUpperCase()} = ${formattedResult} (${toCurrency.toUpperCase()})`,
        conversion: {
          from: fromCurrency,
          to: toCurrency,
          amount: amount,
          rate: rate,
          result: result,
        },
      };
    } catch (error) {
      console.error("❌ Currency Converter Error:", error);
      return {
        success: false,
        result: null,
        confidence: 0,
        error: error.message,
      };
    }
  }

  /**
   * Parse currency conversion from query
   * @param {string} query - User query
   * @returns {Object|null} - Parsed conversion details
   */
  parseCurrencyConversion(query) {
    const lowerQuery = query.toLowerCase();

    // More flexible patterns to handle typos and variations
    const patterns = [
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
      // Nepali Rupee patterns
      /convert\s+(\d+(?:\.\d+)?)\s*(dollar|dollars|usd|us)\s*to\s*(nepali\s*rupee|nepali\s*rupees|npr)/i,
      /(\d+(?:\.\d+)?)\s*(dollar|dollars|usd|us)\s*in\s*(nepali\s*rupee|nepali\s*rupees|npr)/i,
      /what\s*is\s*(\d+(?:\.\d+)?)\s*(dollar|dollars|usd|us)\s*in\s*(nepali\s*rupee|nepali\s*rupees|npr)/i,
      /(\d+(?:\.\d+)?)\s*(dollar|dollars|usd|us)\s*to\s*(nepali\s*rupee|nepali\s*rupees|npr)/i,
      // More flexible patterns for "what is X in Y"
      /what\s*is\s*(\d+(?:\.\d+)?)\s*(dollar|dollars|usd|us)\s*in\s*(nepali|npr)/i,
      /(\d+(?:\.\d+)?)\s*(dollar|dollars|usd|us)\s*in\s*(nepali|npr)/i,
    ];

    for (const pattern of patterns) {
      const match = query.match(pattern);
      if (match) {
        const amount = parseFloat(match[1]);
        const fromCurrency = this.normalizeCurrency(match[2].toLowerCase());
        const toCurrency = this.normalizeCurrency(
          match[3] ? match[3].toLowerCase() : match[4].toLowerCase()
        );

        return { amount, fromCurrency, toCurrency };
      }
    }

    return null;
  }

  /**
   * Normalize currency names
   * @param {string} currency - Currency name
   * @returns {string} - Normalized currency code
   */
  normalizeCurrency(currency) {
    const currencyMap = {
      rupee: "INR",
      rupees: "INR",
      rs: "INR",
      inr: "INR",
      "nepali rupee": "NPR",
      "nepali rupees": "NPR",
      npr: "NPR",
      dollar: "USD",
      dollars: "USD",
      usd: "USD",
      us: "USD",
      euro: "EUR",
      euros: "EUR",
      eur: "EUR",
      pound: "GBP",
      pounds: "GBP",
      gbp: "GBP",
    };

    return currencyMap[currency.toLowerCase()] || currency.toUpperCase();
  }

  /**
   * Get exchange rate between currencies
   * @param {string} fromCurrency - Source currency
   * @param {string} toCurrency - Target currency
   * @returns {number|null} - Exchange rate
   */
  async getExchangeRate(fromCurrency, toCurrency) {
    try {
      // Try to get real-time rates (you can integrate with a real API here)
      // For now, use fallback rates
      if (
        this.exchangeRates[fromCurrency] &&
        this.exchangeRates[fromCurrency][toCurrency]
      ) {
        return this.exchangeRates[fromCurrency][toCurrency];
      }

      return null;
    } catch (error) {
      console.warn(
        "⚠️ Could not fetch real-time exchange rates, using fallback"
      );
      return this.exchangeRates[fromCurrency]?.[toCurrency] || null;
    }
  }

  /**
   * Format currency amount
   * @param {number} amount - Amount to format
   * @param {string} currency - Currency code
   * @returns {string} - Formatted currency string
   */
  formatCurrency(amount, currency) {
    const currencySymbols = {
      USD: "$",
      INR: "₹",
      EUR: "€",
      GBP: "£",
      NPR: "₨",
    };

    const symbol = currencySymbols[currency] || currency;

    if (amount % 1 === 0) {
      return `${symbol}${amount.toFixed(0)}`;
    } else {
      return `${symbol}${amount.toFixed(2)}`;
    }
  }

  /**
   * Check if this tool should be used for the given query
   * @param {string} query - User query
   * @returns {boolean} - Whether to use this tool
   */
  shouldUse(query) {
    const currencyIndicators = [
      /convert.*currency|currency.*convert/i,
      /convert.*to|to.*convert/i,
      /rupee|dollar|euro|pound|rs|usd|eur|gbp|inr|npr|nepali/i,
      /\d+\s*(rupee|dollar|euro|pound|rs|usd|eur|gbp|inr|npr|nepali)/i,
      /what\s*is.*\d+.*in.*rupee|what\s*is.*\d+.*in.*dollar/i,
    ];

    return currencyIndicators.some((pattern) =>
      pattern.test(query.toLowerCase())
    );
  }
}

export default CurrencyConverterTool;
