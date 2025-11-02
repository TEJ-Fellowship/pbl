import axios from "axios";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { CacheService } from "./cacheService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from mcp-server directory
dotenv.config({ path: path.join(__dirname, "../.env") });

// ===== CURRENCY EXCHANGE SERVICE =====
export class CurrencyExchangeService {
  constructor() {
    this.apiBaseUrl = "https://api.exchangerate-api.com/v4/latest";
    this.cache = new CacheService();
  }

  async getExchangeRate(fromCurrency, toCurrency, amount = 1) {
    try {
      console.log(`💱 Converting ${amount} ${fromCurrency} to ${toCurrency}`);

      // Validate inputs
      if (!fromCurrency || !toCurrency) {
        throw new Error("Both fromCurrency and toCurrency are required");
      }

      // Check cache first
      const cachedData = this.cache.get(fromCurrency, toCurrency);
      if (cachedData) {
        // Use cached rate but recalculate amount
        const convertedAmount = amount * cachedData.exchange_rate;
        return {
          from_currency: fromCurrency.toUpperCase(),
          to_currency: toCurrency.toUpperCase(),
          exchange_rate: cachedData.exchange_rate,
          amount: amount,
          converted_amount: convertedAmount,
          timestamp: cachedData.timestamp,
          source: "exchangerate-api (cached)",
        };
      }

      // Cache miss - fetch from API
      console.log(`🌐 API call for ${fromCurrency} to ${toCurrency}`);
      const response = await axios.get(
        `${this.apiBaseUrl}/${fromCurrency.toUpperCase()}`
      );

      if (!response.data || !response.data.rates) {
        throw new Error("Invalid API response");
      }

      const rates = response.data.rates;
      const rate = rates[toCurrency.toUpperCase()];

      if (!rate) {
        throw new Error(`Currency ${toCurrency} not supported`);
      }

      const convertedAmount = amount * rate;

      const result = {
        from_currency: fromCurrency.toUpperCase(),
        to_currency: toCurrency.toUpperCase(),
        exchange_rate: rate,
        amount: amount,
        converted_amount: convertedAmount,
        timestamp: new Date().toISOString(),
        source: "exchangerate-api",
      };

      // Cache the exchange rate (without amount-specific data)
      this.cache.set(fromCurrency, toCurrency, {
        exchange_rate: rate,
        timestamp: result.timestamp,
      });

      return result;
    } catch (error) {
      console.error("❌ Currency exchange error:", error.message);
      throw error;
    }
  }

  // Check if query is about currency conversion
  isCurrencyQuery(query) {
    const lowerQuery = query.toLowerCase();
    const currencyKeywords = [
      "convert",
      "exchange",
      "rate",
      "currency",
      "dollar",
      "euro",
      "pound",
      "yen",
      "usd",
      "eur",
      "gbp",
      "jpy",
      "cad",
      "aud",
      "chf",
      "inr",
      "mxn",
      "sgd",
      "nrs",
      "nepali rupee",
    ];

    return currencyKeywords.some((keyword) => lowerQuery.includes(keyword));
  }

  // Extract currency information from query
  parseCurrencyQuery(query) {
    const upperQuery = query.toUpperCase();

    // Common currency patterns - more comprehensive
    // Note: DOLLAR alone should match USD, and NRS should match NPR
    const currencyPatterns = [
      {
        from: /USD|US\s*DOLLAR|\bDOLLAR\b/i,
        to: /EUR|EURO/i,
        code: ["USD", "EUR"],
      },
      {
        from: /EUR|EURO/i,
        to: /USD|US\s*DOLLAR|\bDOLLAR\b/i,
        code: ["EUR", "USD"],
      },
      {
        from: /GBP|POUND|BRITISH/i,
        to: /USD|US\s*DOLLAR|\bDOLLAR\b/i,
        code: ["GBP", "USD"],
      },
      {
        from: /USD|US\s*DOLLAR|\bDOLLAR\b/i,
        to: /GBP|POUND|BRITISH/i,
        code: ["USD", "GBP"],
      },
      {
        from: /JPY|YEN|JAPANESE/i,
        to: /USD|US\s*DOLLAR|\bDOLLAR\b/i,
        code: ["JPY", "USD"],
      },
      {
        from: /USD|US\s*DOLLAR|\bDOLLAR\b/i,
        to: /JPY|YEN|JAPANESE/i,
        code: ["USD", "JPY"],
      },
      { from: /EUR|EURO/i, to: /JPY|YEN|JAPANESE/i, code: ["EUR", "JPY"] },
      { from: /JPY|YEN|JAPANESE/i, to: /EUR|EURO/i, code: ["JPY", "EUR"] },
      {
        from: /CAD|CANADIAN/i,
        to: /USD|US\s*DOLLAR|\bDOLLAR\b/i,
        code: ["CAD", "USD"],
      },
      {
        from: /USD|US\s*DOLLAR|\bDOLLAR\b/i,
        to: /CAD|CANADIAN/i,
        code: ["USD", "CAD"],
      },
      {
        from: /AUD|AUSTRALIAN/i,
        to: /USD|US\s*DOLLAR|\bDOLLAR\b/i,
        code: ["AUD", "USD"],
      },
      {
        from: /USD|US\s*DOLLAR|\bDOLLAR\b/i,
        to: /AUD|AUSTRALIAN/i,
        code: ["USD", "AUD"],
      },
      {
        from: /INR|INDIAN\s*RUPEE/i,
        to: /USD|US\s*DOLLAR|\bDOLLAR\b/i,
        code: ["INR", "USD"],
      },
      {
        from: /USD|US\s*DOLLAR|\bDOLLAR\b/i,
        to: /INR|INDIAN\s*RUPEE/i,
        code: ["USD", "INR"],
      },
      { from: /GBP|POUND|BRITISH/i, to: /CAD|CANADIAN/i, code: ["GBP", "CAD"] },
      { from: /CAD|CANADIAN/i, to: /GBP|POUND|BRITISH/i, code: ["CAD", "GBP"] },
      { from: /EUR|EURO/i, to: /GBP|POUND|BRITISH/i, code: ["EUR", "GBP"] },
      { from: /GBP|POUND|BRITISH/i, to: /EUR|EURO/i, code: ["GBP", "EUR"] },
      {
        from: /USD|US\s*DOLLAR|\bDOLLAR\b/i,
        to: /NRS|NPR|NEPALI\s*RUPEE/i,
        code: ["USD", "NPR"],
      },
      {
        from: /NRS|NPR|NEPALI\s*RUPEE/i,
        to: /USD|US\s*DOLLAR|\bDOLLAR\b/i,
        code: ["NPR", "USD"],
      },
      {
        from: /EUR|EURO/i,
        to: /NRS|NPR|NEPALI\s*RUPEE/i,
        code: ["EUR", "NPR"],
      },
      {
        from: /NRS|NPR|NEPALI\s*RUPEE/i,
        to: /EUR|EURO/i,
        code: ["NPR", "EUR"],
      },
    ];

    // Extract amount
    const amountMatch = query.match(/(\d+(?:\.\d+)?)/);
    const amount = amountMatch ? parseFloat(amountMatch[1]) : 1;

    // Find matching pattern
    for (const pattern of currencyPatterns) {
      if (pattern.from.test(query) && pattern.to.test(query)) {
        return {
          from_currency: pattern.code[0],
          to_currency: pattern.code[1],
          amount: amount,
        };
      }
    }

    return null;
  }

  // Format currency amount
  formatCurrency(amount, currency) {
    const symbols = {
      USD: "$",
      EUR: "€",
      GBP: "£",
      JPY: "¥",
      CAD: "C$",
      AUD: "A$",
      INR: "₹",
      MXN: "$",
      SGD: "S$",
      NRS: "₨",
      NPR: "₨",
      "NEPALI RUPEE": "₨",
    };

    const symbol = symbols[currency] || currency;
    const formattedAmount =
      currency === "JPY" ? Math.round(amount) : amount.toFixed(2);

    return `${symbol}${formattedAmount}`;
  }

  // Get cache statistics
  getCacheStats() {
    return this.cache.getStats();
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
  }

  // Get cache hit rate
  getCacheHitRate() {
    return this.cache.getHitRate();
  }
}
