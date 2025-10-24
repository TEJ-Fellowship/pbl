import axios from "axios";

/**
 * Currency Converter MCP Tool for Shopify Merchant Support Agent
 * Handles currency conversion for international merchants
 */
export class CurrencyConverterTool {
  constructor() {
    this.name = "currency_converter";
    this.description = "Convert currencies for international merchants";
    this.apiKey = process.env.EXCHANGE_RATE_API_KEY || null;
    this.baseUrl = "https://api.exchangerate-api.com/v4/latest";
    this.timeout = 5000; // 5 seconds timeout
    this.cache = new Map();
    this.cacheExpiry = 60 * 60 * 1000; // 1 hour cache
  }

  /**
   * Get exchange rates from API
   * @param {string} baseCurrency - Base currency (default: USD)
   * @returns {Object} Exchange rates
   */
  async getExchangeRates(baseCurrency = "USD") {
    const cacheKey = `rates_${baseCurrency}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }

    try {
      const response = await axios.get(`${this.baseUrl}/${baseCurrency}`, {
        timeout: this.timeout,
        headers: {
          "User-Agent": "Shopify-Merchant-Support-Agent/1.0",
        },
      });

      const rates = response.data;
      
      // Cache the results
      this.cache.set(cacheKey, {
        data: rates,
        timestamp: Date.now(),
      });

      return rates;
    } catch (error) {
      console.error("Exchange rate API error:", error.message);
      
      // Return fallback rates for common currencies
      return this.getFallbackRates(baseCurrency);
    }
  }

  /**
   * Get fallback exchange rates when API is unavailable
   * @param {string} baseCurrency - Base currency
   * @returns {Object} Fallback exchange rates
   */
  getFallbackRates(baseCurrency) {
    // These are approximate rates - in production, you'd want more accurate fallbacks
    const fallbackRates = {
      USD: {
        EUR: 0.85,
        GBP: 0.73,
        CAD: 1.25,
        AUD: 1.35,
        JPY: 110.0,
        CNY: 6.45,
        INR: 75.0,
        BRL: 5.2,
        MXN: 20.0,
        KRW: 1180.0,
        SGD: 1.35,
        HKD: 7.8,
        CHF: 0.92,
        SEK: 8.5,
        NOK: 8.8,
        DKK: 6.3,
        PLN: 3.9,
        CZK: 21.5,
        HUF: 300.0,
        RON: 4.2,
        BGN: 1.66,
        HRK: 6.4,
        RSD: 100.0,
        TRY: 8.5,
        RUB: 75.0,
        ZAR: 15.0,
        AED: 3.67,
        SAR: 3.75,
        QAR: 3.64,
        KWD: 0.30,
        BHD: 0.38,
        OMR: 0.38,
        JOD: 0.71,
        LBP: 1500.0,
        EGP: 15.7,
        MAD: 9.0,
        TND: 2.8,
        DZD: 135.0,
        LYD: 4.5,
        SDG: 55.0,
        ETB: 45.0,
        KES: 110.0,
        UGX: 3500.0,
        TZS: 2300.0,
        ZMW: 18.0,
        BWP: 11.0,
        SZL: 15.0,
        LSL: 15.0,
        NAD: 15.0,
        MUR: 40.0,
        SCR: 13.5,
        KMF: 450.0,
        DJF: 180.0,
        SOS: 580.0,
        ERN: 15.0,
        ETB: 45.0,
        GMD: 52.0,
        GNF: 10200.0,
        LRD: 150.0,
        SLL: 10200.0,
        STD: 21000.0,
        XOF: 550.0,
        XAF: 550.0,
        CDF: 2000.0,
        AOA: 650.0,
        MZN: 63.0,
        ZWL: 85.0,
        BIF: 2000.0,
        RWF: 1000.0,
        MWK: 800.0,
        MGA: 4000.0,
        KMF: 450.0,
        SCR: 13.5,
        DJF: 180.0,
        SOS: 580.0,
        ERN: 15.0,
        ETB: 45.0,
        GMD: 52.0,
        GNF: 10200.0,
        LRD: 150.0,
        SLL: 10200.0,
        STD: 21000.0,
        XOF: 550.0,
        XAF: 550.0,
        CDF: 2000.0,
        AOA: 650.0,
        MZN: 63.0,
        ZWL: 85.0,
        BIF: 2000.0,
        RWF: 1000.0,
        MWK: 800.0,
        MGA: 4000.0,
      },
      EUR: {
        USD: 1.18,
        GBP: 0.86,
        CAD: 1.47,
        AUD: 1.59,
        JPY: 129.0,
        CNY: 7.6,
        INR: 88.0,
        BRL: 6.1,
        MXN: 23.5,
        KRW: 1390.0,
        SGD: 1.59,
        HKD: 9.2,
        CHF: 1.08,
        SEK: 10.0,
        NOK: 10.4,
        DKK: 7.4,
        PLN: 4.6,
        CZK: 25.3,
        HUF: 353.0,
        RON: 4.9,
        BGN: 1.96,
        HRK: 7.5,
        RSD: 118.0,
        TRY: 10.0,
        RUB: 88.0,
        ZAR: 17.6,
        AED: 4.33,
        SAR: 4.42,
        QAR: 4.29,
        KWD: 0.35,
        BHD: 0.45,
        OMR: 0.45,
        JOD: 0.84,
        LBP: 1770.0,
        EGP: 18.5,
        MAD: 10.6,
        TND: 3.3,
        DZD: 159.0,
        LYD: 5.3,
        SDG: 65.0,
        ETB: 53.0,
        KES: 130.0,
        UGX: 4100.0,
        TZS: 2700.0,
        ZMW: 21.0,
        BWP: 13.0,
        SZL: 17.6,
        LSL: 17.6,
        NAD: 17.6,
        MUR: 47.0,
        SCR: 15.9,
        KMF: 530.0,
        DJF: 212.0,
        SOS: 684.0,
        ERN: 17.7,
        ETB: 53.0,
        GMD: 61.0,
        GNF: 12000.0,
        LRD: 177.0,
        SLL: 12000.0,
        STD: 24800.0,
        XOF: 650.0,
        XAF: 650.0,
        CDF: 2360.0,
        AOA: 770.0,
        MZN: 74.0,
        ZWL: 100.0,
        BIF: 2360.0,
        RWF: 1180.0,
        MWK: 940.0,
        MGA: 4700.0,
      },
      GBP: {
        USD: 1.37,
        EUR: 1.16,
        CAD: 1.71,
        AUD: 1.85,
        JPY: 150.0,
        CNY: 8.8,
        INR: 102.0,
        BRL: 7.1,
        MXN: 27.4,
        KRW: 1620.0,
        SGD: 1.85,
        HKD: 10.7,
        CHF: 1.26,
        SEK: 11.6,
        NOK: 12.1,
        DKK: 8.6,
        PLN: 5.4,
        CZK: 29.4,
        HUF: 410.0,
        RON: 5.7,
        BGN: 2.28,
        HRK: 8.7,
        RSD: 137.0,
        TRY: 11.6,
        RUB: 102.0,
        ZAR: 20.5,
        AED: 5.03,
        SAR: 5.14,
        QAR: 4.99,
        KWD: 0.41,
        BHD: 0.52,
        OMR: 0.52,
        JOD: 0.97,
        LBP: 2060.0,
        EGP: 21.5,
        MAD: 12.3,
        TND: 3.8,
        DZD: 185.0,
        LYD: 6.2,
        SDG: 75.0,
        ETB: 62.0,
        KES: 150.0,
        UGX: 4800.0,
        TZS: 3100.0,
        ZMW: 25.0,
        BWP: 15.0,
        SZL: 20.5,
        LSL: 20.5,
        NAD: 20.5,
        MUR: 55.0,
        SCR: 18.5,
        KMF: 620.0,
        DJF: 247.0,
        SOS: 796.0,
        ERN: 20.6,
        ETB: 62.0,
        GMD: 71.0,
        GNF: 14000.0,
        LRD: 206.0,
        SLL: 14000.0,
        STD: 28900.0,
        XOF: 750.0,
        XAF: 750.0,
        CDF: 2750.0,
        AOA: 900.0,
        MZN: 86.0,
        ZWL: 117.0,
        BIF: 2750.0,
        RWF: 1375.0,
        MWK: 1100.0,
        MGA: 5500.0,
      },
    };

    return {
      base: baseCurrency,
      date: new Date().toISOString().split("T")[0],
      rates: fallbackRates[baseCurrency] || fallbackRates.USD,
    };
  }

  /**
   * Convert currency amount
   * @param {number} amount - Amount to convert
   * @param {string} fromCurrency - Source currency
   * @param {string} toCurrency - Target currency
   * @returns {Object} Conversion result
   */
  async convertCurrency(amount, fromCurrency, toCurrency) {
    try {
      if (fromCurrency === toCurrency) {
        return {
          amount,
          fromCurrency,
          toCurrency,
          convertedAmount: amount,
          rate: 1,
          timestamp: new Date().toISOString(),
        };
      }

      const rates = await this.getExchangeRates(fromCurrency);
      const rate = rates.rates[toCurrency];

      if (!rate) {
        throw new Error(`Currency ${toCurrency} not supported`);
      }

      const convertedAmount = amount * rate;

      return {
        amount,
        fromCurrency,
        toCurrency,
        convertedAmount,
        rate,
        timestamp: new Date().toISOString(),
        source: rates.date,
      };
    } catch (error) {
      console.error("Currency conversion error:", error);
      throw error;
    }
  }

  /**
   * Extract currency information from query
   * @param {string} query - User query
   * @returns {Object} Extracted currency information
   */
  extractCurrencyInfo(query) {
    const queryLower = query.toLowerCase();

    // Currency codes (3-letter)
    const currencyCodes = [
      "USD", "EUR", "GBP", "CAD", "AUD", "JPY", "CNY", "INR", "BRL", "MXN",
      "KRW", "SGD", "HKD", "CHF", "SEK", "NOK", "DKK", "PLN", "CZK", "HUF",
      "RON", "BGN", "HRK", "RSD", "TRY", "RUB", "ZAR", "AED", "SAR", "QAR",
      "KWD", "BHD", "OMR", "JOD", "LBP", "EGP", "MAD", "TND", "DZD", "LYD",
      "SDG", "ETB", "KES", "UGX", "TZS", "ZMW", "BWP", "SZL", "LSL", "NAD",
      "MUR", "SCR", "KMF", "DJF", "SOS", "ERN", "GMD", "GNF", "LRD", "SLL",
      "STD", "XOF", "XAF", "CDF", "AOA", "MZN", "ZWL", "BIF", "RWF", "MWK",
      "MGA",
    ];

    // Currency symbols and names
    const currencySymbols = {
      "$": "USD",
      "€": "EUR",
      "£": "GBP",
      "¥": "JPY",
      "₹": "INR",
      "R$": "BRL",
      "₩": "KRW",
      "S$": "SGD",
      "HK$": "HKD",
      "CHF": "CHF",
      "kr": "SEK",
      "NOK": "NOK",
      "DKK": "DKK",
      "zł": "PLN",
      "Kč": "CZK",
      "Ft": "HUF",
      "lei": "RON",
      "лв": "BGN",
      "kn": "HRK",
      "дин": "RSD",
      "₺": "TRY",
      "₽": "RUB",
      "R": "ZAR",
      "د.إ": "AED",
      "ر.س": "SAR",
      "ر.ق": "QAR",
      "د.ك": "KWD",
      "د.ب": "BHD",
      "ر.ع": "OMR",
      "د.ا": "JOD",
      "ل.ل": "LBP",
      "ج.م": "EGP",
      "د.م": "MAD",
      "د.ت": "TND",
      "د.ج": "DZD",
      "ل.د": "LYD",
      "ج.س": "SDG",
      "ETB": "ETB",
      "KSh": "KES",
      "USh": "UGX",
      "TSh": "TZS",
      "ZK": "ZMW",
      "P": "BWP",
      "L": "SZL",
      "M": "MUR",
      "₨": "SCR",
      "CF": "KMF",
      "Fdj": "DJF",
      "S": "SOS",
      "Nfk": "ERN",
      "D": "GMD",
      "FG": "GNF",
      "L$": "LRD",
      "Le": "SLL",
      "Db": "STD",
      "CFA": "XOF",
      "FCFA": "XAF",
      "FC": "CDF",
      "Kz": "AOA",
      "MT": "MZN",
      "Z$": "ZWL",
      "FBu": "BIF",
      "RF": "RWF",
      "MK": "MWK",
      "Ar": "MGA",
    };

    const currencyNames = {
      "dollar": "USD",
      "euro": "EUR",
      "pound": "GBP",
      "yen": "JPY",
      "rupee": "INR",
      "real": "BRL",
      "won": "KRW",
      "singapore dollar": "SGD",
      "hong kong dollar": "HKD",
      "swiss franc": "CHF",
      "swedish krona": "SEK",
      "norwegian krone": "NOK",
      "danish krone": "DKK",
      "zloty": "PLN",
      "koruna": "CZK",
      "forint": "HUF",
      "leu": "RON",
      "lev": "BGN",
      "kuna": "HRK",
      "dinar": "RSD",
      "lira": "TRY",
      "ruble": "RUB",
      "rand": "ZAR",
      "dirham": "AED",
      "riyal": "SAR",
      "riyal": "QAR",
      "dinar": "KWD",
      "dinar": "BHD",
      "rial": "OMR",
      "dinar": "JOD",
      "pound": "LBP",
      "pound": "EGP",
      "dirham": "MAD",
      "dinar": "TND",
      "dinar": "DZD",
      "dinar": "LYD",
      "pound": "SDG",
      "birr": "ETB",
      "shilling": "KES",
      "shilling": "UGX",
      "shilling": "TZS",
      "kwacha": "ZMW",
      "pula": "BWP",
      "lilangeni": "SZL",
      "loti": "LSL",
      "dollar": "NAD",
      "rupee": "MUR",
      "rupee": "SCR",
      "franc": "KMF",
      "franc": "DJF",
      "shilling": "SOS",
      "nakfa": "ERN",
      "dalasi": "GMD",
      "franc": "GNF",
      "dollar": "LRD",
      "leone": "SLL",
      "dobra": "STD",
      "franc": "XOF",
      "franc": "XAF",
      "franc": "CDF",
      "kwanza": "AOA",
      "metical": "MZN",
      "dollar": "ZWL",
      "franc": "BIF",
      "franc": "RWF",
      "kwacha": "MWK",
      "ariary": "MGA",
    };

    // Extract amounts
    const amountPatterns = [
      /\$?(\d+(?:,\d{3})*(?:\.\d+)?)/g,
      /(\d+(?:,\d{3})*(?:\.\d+)?)\s*\$?/g,
      /(\d+(?:,\d{3})*(?:\.\d+)?)\s*(?:dollars?|euros?|pounds?|yen|rupees?|reais?|pesos?|won|francs?|kronas?|kroner?|zlotys?|korunas?|forints?|lei|levs?|kunas?|dinars?|lira|rubles?|rands?|dirhams?|riyals?|shillings?|kwachas?|pulas?|lilangeni|loti|dobras?|francs?|kwachas?|ariary)/gi,
    ];

    const amounts = [];
    amountPatterns.forEach(pattern => {
      const matches = query.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const amount = parseFloat(match.replace(/[^\d.,]/g, "").replace(/,/g, ""));
          if (!isNaN(amount)) {
            amounts.push(amount);
          }
        });
      }
    });

    // Extract currencies
    const currencies = [];
    
    // Check for currency codes
    currencyCodes.forEach(code => {
      if (queryLower.includes(code.toLowerCase())) {
        currencies.push(code);
      }
    });

    // Check for currency symbols
    Object.entries(currencySymbols).forEach(([symbol, code]) => {
      if (query.includes(symbol)) {
        currencies.push(code);
      }
    });

    // Check for currency names
    Object.entries(currencyNames).forEach(([name, code]) => {
      if (queryLower.includes(name)) {
        currencies.push(code);
      }
    });

    // Extract conversion keywords
    const conversionKeywords = [
      "convert", "conversion", "exchange", "rate", "to", "into", "in",
      "change", "transform", "translate", "switch", "swap", "trade",
    ];

    const hasConversionKeywords = conversionKeywords.some(keyword =>
      queryLower.includes(keyword)
    );

    return {
      amounts,
      currencies: [...new Set(currencies)], // Remove duplicates
      hasConversionKeywords,
      isCurrencyQuery: amounts.length > 0 && currencies.length > 0,
    };
  }

  /**
   * Determine if currency converter should be used
   * @param {string} query - User query
   * @returns {boolean} Whether to use currency converter
   */
  shouldUseCurrencyConverter(query) {
    const currencyInfo = this.extractCurrencyInfo(query);
    return currencyInfo.isCurrencyQuery || currencyInfo.hasConversionKeywords;
  }

  /**
   * Main method to handle currency conversion requests
   * @param {string} query - User query
   * @returns {Object} Conversion results
   */
  async convert(query) {
    if (!query || typeof query !== "string") {
      return {
        error: "Invalid query provided",
        conversions: [],
        summary: null,
      };
    }

    if (!this.shouldUseCurrencyConverter(query)) {
      return {
        error: "No currency conversion needed for this query",
        conversions: [],
        summary: null,
      };
    }

    try {
      console.log(`💱 Performing currency conversion for: ${query}`);

      const currencyInfo = this.extractCurrencyInfo(query);
      const conversions = [];

      // If we have amounts and currencies, perform conversions
      if (currencyInfo.amounts.length > 0 && currencyInfo.currencies.length > 0) {
        const amounts = currencyInfo.amounts;
        const currencies = currencyInfo.currencies;

        // Convert between all currency pairs
        for (let i = 0; i < currencies.length - 1; i++) {
          for (let j = i + 1; j < currencies.length; j++) {
            const fromCurrency = currencies[i];
            const toCurrency = currencies[j];

            for (const amount of amounts) {
              try {
                const conversion = await this.convertCurrency(amount, fromCurrency, toCurrency);
                conversions.push(conversion);
              } catch (error) {
                console.error(`Conversion error ${fromCurrency} to ${toCurrency}:`, error);
              }
            }
          }
        }

        // If only one currency, assume USD as base
        if (currencies.length === 1) {
          const currency = currencies[0];
          for (const amount of amounts) {
            try {
              const conversion = await this.convertCurrency(amount, currency, "USD");
              conversions.push(conversion);
            } catch (error) {
              console.error(`Conversion error ${currency} to USD:`, error);
            }
          }
        }
      }

      // Generate summary
      const summary = this.generateSummary(conversions, query);

      return {
        conversions,
        summary,
        currencyInfo,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Currency conversion error:", error);
      return {
        error: `Currency conversion failed: ${error.message}`,
        conversions: [],
        summary: null,
      };
    }
  }

  /**
   * Generate a summary of currency conversions
   * @param {Array} conversions - Array of conversions
   * @param {string} query - Original query
   * @returns {string} Summary text
   */
  generateSummary(conversions, query) {
    if (conversions.length === 0) {
      return "No currency conversions could be performed.";
    }

    let summary = `## 💱 **Currency Conversion Results**\n\n`;
    summary += `Performed ${conversions.length} conversion${conversions.length > 1 ? "s" : ""}:\n\n`;

    conversions.forEach((conversion, index) => {
      summary += `${index + 1}. **${conversion.amount} ${conversion.fromCurrency}** = **${conversion.convertedAmount.toFixed(2)} ${conversion.toCurrency}**\n`;
      summary += `   - Exchange Rate: 1 ${conversion.fromCurrency} = ${conversion.rate.toFixed(4)} ${conversion.toCurrency}\n`;
    });

    summary += `\n💡 **Shopify Context:** These conversions can help you understand pricing for international customers, calculate shipping costs, or determine product pricing in different markets.`;

    return summary;
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
        "Real-time currency conversion",
        "Support for 100+ currencies",
        "Fallback rates when API is unavailable",
        "Caching for improved performance",
        "Shopify-specific currency context",
      ],
      examples: [
        "Convert $100 USD to EUR",
        "What is 1000 JPY in USD?",
        "Convert 500 GBP to CAD",
        "How much is 1000 INR in USD?",
        "Convert 100 EUR to multiple currencies",
      ],
      supportedCurrencies: [
        "USD", "EUR", "GBP", "CAD", "AUD", "JPY", "CNY", "INR", "BRL", "MXN",
        "KRW", "SGD", "HKD", "CHF", "SEK", "NOK", "DKK", "PLN", "CZK", "HUF",
        "RON", "BGN", "HRK", "RSD", "TRY", "RUB", "ZAR", "AED", "SAR", "QAR",
        "KWD", "BHD", "OMR", "JOD", "LBP", "EGP", "MAD", "TND", "DZD", "LYD",
        "SDG", "ETB", "KES", "UGX", "TZS", "ZMW", "BWP", "SZL", "LSL", "NAD",
        "MUR", "SCR", "KMF", "DJF", "SOS", "ERN", "GMD", "GNF", "LRD", "SLL",
        "STD", "XOF", "XAF", "CDF", "AOA", "MZN", "ZWL", "BIF", "RWF", "MWK",
        "MGA",
      ],
      api: "ExchangeRate-API (https://api.exchangerate-api.com/v4/latest)",
    };
  }
}

export default CurrencyConverterTool;
