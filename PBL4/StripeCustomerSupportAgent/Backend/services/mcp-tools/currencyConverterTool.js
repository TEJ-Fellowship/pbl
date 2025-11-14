import axios from "axios";

/**
 * Currency Converter Tool
 * Handles currency conversion with real-time exchange rates
 * Uses intelligent currency detection instead of rigid patterns
 */
class CurrencyConverterTool {
  constructor() {
    this.name = "currency_converter";
    this.description = "Convert currencies with real-time exchange rates";
    this.exchangeRates = {
      // Fallback rates (should be updated with real-time data)
      // Base: USD rates, others calculated from USD
      USD: {
        INR: 83.0,
        NPR: 133.0,
        EUR: 0.92,
        GBP: 0.79,
        JPY: 150.0,
        CNY: 7.2,
        AUD: 1.52,
        CAD: 1.35,
        PKR: 278.0,
        BDT: 110.0,
        LKR: 325.0,
        THB: 35.5,
        SGD: 1.34,
        MYR: 4.7,
        AED: 3.67,
        SAR: 3.75,
        RUB: 92.0,
        KRW: 1320.0,
        HKD: 7.8,
        CHF: 0.88,
      },
      INR: {
        USD: 0.012,
        NPR: 1.6,
        EUR: 0.011,
        GBP: 0.0095,
        JPY: 1.81,
        CNY: 0.087,
        AUD: 0.018,
        CAD: 0.016,
        PKR: 3.35,
        BDT: 1.33,
        LKR: 3.92,
        THB: 0.43,
        SGD: 0.016,
        MYR: 0.057,
        AED: 0.044,
        SAR: 0.045,
        RUB: 1.11,
        KRW: 15.9,
        HKD: 0.094,
        CHF: 0.011,
      },
      NPR: {
        USD: 0.0075,
        INR: 0.625,
        EUR: 0.0069,
        GBP: 0.0059,
        JPY: 1.13,
        CNY: 0.054,
        AUD: 0.011,
        CAD: 0.01,
        PKR: 2.09,
        BDT: 0.83,
        LKR: 2.44,
        THB: 0.27,
        SGD: 0.01,
        MYR: 0.035,
        AED: 0.028,
        SAR: 0.028,
        RUB: 0.69,
        KRW: 9.92,
        HKD: 0.059,
        CHF: 0.007,
      },
      EUR: {
        USD: 1.09,
        INR: 90.0,
        NPR: 145.0,
        GBP: 0.86,
        JPY: 163.5,
        CNY: 7.85,
        AUD: 1.66,
        CAD: 1.47,
        PKR: 303.0,
        BDT: 120.0,
        LKR: 354.0,
        THB: 38.7,
        SGD: 1.46,
        MYR: 5.12,
        AED: 4.0,
        SAR: 4.09,
        RUB: 100.3,
        KRW: 1439.0,
        HKD: 8.5,
        CHF: 0.96,
      },
      GBP: {
        USD: 1.27,
        INR: 105.0,
        NPR: 169.0,
        EUR: 1.16,
        JPY: 190.5,
        CNY: 9.14,
        AUD: 1.93,
        CAD: 1.71,
        PKR: 353.0,
        BDT: 140.0,
        LKR: 413.0,
        THB: 45.1,
        SGD: 1.7,
        MYR: 5.97,
        AED: 4.66,
        SAR: 4.76,
        RUB: 116.8,
        KRW: 1676.0,
        HKD: 9.9,
        CHF: 1.12,
      },
      JPY: {
        USD: 0.0067,
        INR: 0.55,
        NPR: 0.89,
        EUR: 0.0061,
        GBP: 0.0052,
        CNY: 0.048,
        AUD: 0.01,
        CAD: 0.009,
        PKR: 1.85,
        BDT: 0.73,
        LKR: 2.17,
        THB: 0.24,
        SGD: 0.009,
        MYR: 0.031,
        AED: 0.024,
        SAR: 0.025,
        RUB: 0.61,
        KRW: 8.8,
        HKD: 0.052,
        CHF: 0.006,
      },
      CNY: {
        USD: 0.139,
        INR: 11.5,
        NPR: 18.5,
        EUR: 0.127,
        GBP: 0.109,
        JPY: 20.8,
        AUD: 0.211,
        CAD: 0.188,
        PKR: 38.6,
        BDT: 15.3,
        LKR: 45.1,
        THB: 4.93,
        SGD: 0.186,
        MYR: 0.653,
        AED: 0.51,
        SAR: 0.521,
        RUB: 12.8,
        KRW: 183.3,
        HKD: 1.08,
        CHF: 0.122,
      },
      AUD: {
        USD: 0.658,
        INR: 54.6,
        NPR: 87.5,
        EUR: 0.602,
        GBP: 0.518,
        JPY: 98.7,
        CNY: 4.74,
        CAD: 0.888,
        PKR: 183.0,
        BDT: 72.4,
        LKR: 214.0,
        THB: 23.4,
        SGD: 0.882,
        MYR: 3.09,
        AED: 2.41,
        SAR: 2.47,
        RUB: 60.5,
        KRW: 868.0,
        HKD: 5.13,
        CHF: 0.579,
      },
      CAD: {
        USD: 0.741,
        INR: 61.5,
        NPR: 98.5,
        EUR: 0.678,
        GBP: 0.584,
        JPY: 111.2,
        CNY: 5.33,
        AUD: 1.13,
        PKR: 206.0,
        BDT: 81.5,
        LKR: 241.0,
        THB: 26.3,
        SGD: 0.993,
        MYR: 3.48,
        AED: 2.72,
        SAR: 2.78,
        RUB: 68.1,
        KRW: 977.0,
        HKD: 5.78,
        CHF: 0.652,
      },
      PKR: {
        USD: 0.0036,
        INR: 0.3,
        NPR: 0.48,
        EUR: 0.0033,
        GBP: 0.0028,
        JPY: 0.54,
        CNY: 0.026,
        AUD: 0.0055,
        CAD: 0.0049,
        BDT: 0.4,
        LKR: 1.17,
        THB: 0.13,
        SGD: 0.0048,
        MYR: 0.017,
        AED: 0.013,
        SAR: 0.013,
        RUB: 0.33,
        KRW: 4.75,
        HKD: 0.028,
        CHF: 0.0032,
      },
      BDT: {
        USD: 0.0091,
        INR: 0.75,
        NPR: 1.21,
        EUR: 0.0083,
        GBP: 0.0071,
        JPY: 1.37,
        CNY: 0.065,
        AUD: 0.014,
        CAD: 0.012,
        PKR: 2.53,
        LKR: 2.95,
        THB: 0.32,
        SGD: 0.012,
        MYR: 0.043,
        AED: 0.033,
        SAR: 0.034,
        RUB: 0.84,
        KRW: 12.0,
        HKD: 0.071,
        CHF: 0.008,
      },
      LKR: {
        USD: 0.0031,
        INR: 0.255,
        NPR: 0.41,
        EUR: 0.0028,
        GBP: 0.0024,
        JPY: 0.46,
        CNY: 0.022,
        AUD: 0.0047,
        CAD: 0.0041,
        PKR: 0.86,
        BDT: 0.34,
        THB: 0.11,
        SGD: 0.0041,
        MYR: 0.014,
        AED: 0.011,
        SAR: 0.012,
        RUB: 0.28,
        KRW: 4.06,
        HKD: 0.024,
        CHF: 0.0027,
      },
      THB: {
        USD: 0.028,
        INR: 2.34,
        NPR: 3.75,
        EUR: 0.026,
        GBP: 0.022,
        JPY: 4.23,
        CNY: 0.203,
        AUD: 0.043,
        CAD: 0.038,
        PKR: 7.83,
        BDT: 3.1,
        LKR: 9.15,
        SGD: 0.038,
        MYR: 0.132,
        AED: 0.103,
        SAR: 0.106,
        RUB: 2.59,
        KRW: 37.2,
        HKD: 0.22,
        CHF: 0.025,
      },
      SGD: {
        USD: 0.746,
        INR: 61.9,
        NPR: 99.2,
        EUR: 0.685,
        GBP: 0.588,
        JPY: 111.9,
        CNY: 5.37,
        AUD: 1.13,
        CAD: 1.01,
        PKR: 207.4,
        BDT: 82.1,
        LKR: 242.5,
        THB: 26.5,
        MYR: 3.51,
        AED: 2.74,
        SAR: 2.8,
        RUB: 68.6,
        KRW: 985.0,
        HKD: 5.82,
        CHF: 0.657,
      },
      MYR: {
        USD: 0.213,
        INR: 17.7,
        NPR: 28.3,
        EUR: 0.195,
        GBP: 0.168,
        JPY: 31.9,
        CNY: 1.53,
        AUD: 0.324,
        CAD: 0.287,
        PKR: 59.1,
        BDT: 23.4,
        LKR: 69.1,
        THB: 7.55,
        SGD: 0.285,
        AED: 0.781,
        SAR: 0.798,
        RUB: 19.6,
        KRW: 281.0,
        HKD: 1.66,
        CHF: 0.187,
      },
      AED: {
        USD: 0.272,
        INR: 22.6,
        NPR: 36.2,
        EUR: 0.25,
        GBP: 0.215,
        JPY: 40.9,
        CNY: 1.96,
        AUD: 0.415,
        CAD: 0.368,
        PKR: 75.7,
        BDT: 30.0,
        LKR: 88.6,
        THB: 9.68,
        SGD: 0.365,
        MYR: 1.28,
        SAR: 1.02,
        RUB: 25.1,
        KRW: 360.0,
        HKD: 2.13,
        CHF: 0.24,
      },
      SAR: {
        USD: 0.267,
        INR: 22.1,
        NPR: 35.5,
        EUR: 0.245,
        GBP: 0.21,
        JPY: 40.0,
        CNY: 1.92,
        AUD: 0.406,
        CAD: 0.36,
        PKR: 74.1,
        BDT: 29.3,
        LKR: 86.7,
        THB: 9.47,
        SGD: 0.357,
        MYR: 1.25,
        AED: 0.98,
        RUB: 24.5,
        KRW: 352.0,
        HKD: 2.08,
        CHF: 0.235,
      },
      RUB: {
        USD: 0.011,
        INR: 0.9,
        NPR: 1.45,
        EUR: 0.01,
        GBP: 0.0086,
        JPY: 1.63,
        CNY: 0.078,
        AUD: 0.017,
        CAD: 0.015,
        PKR: 3.02,
        BDT: 1.2,
        LKR: 3.53,
        THB: 0.39,
        SGD: 0.015,
        MYR: 0.051,
        AED: 0.04,
        SAR: 0.041,
        KRW: 14.3,
        HKD: 0.085,
        CHF: 0.0096,
      },
      KRW: {
        USD: 0.00076,
        INR: 0.063,
        NPR: 0.101,
        EUR: 0.00069,
        GBP: 0.0006,
        JPY: 0.114,
        CNY: 0.0055,
        AUD: 0.0012,
        CAD: 0.001,
        PKR: 0.21,
        BDT: 0.083,
        LKR: 0.25,
        THB: 0.027,
        SGD: 0.001,
        MYR: 0.0036,
        AED: 0.0028,
        SAR: 0.0028,
        RUB: 0.07,
        HKD: 0.0059,
        CHF: 0.00067,
      },
      HKD: {
        USD: 0.128,
        INR: 10.6,
        NPR: 17.0,
        EUR: 0.118,
        GBP: 0.101,
        JPY: 19.2,
        CNY: 0.92,
        AUD: 0.195,
        CAD: 0.173,
        PKR: 35.6,
        BDT: 14.1,
        LKR: 41.6,
        THB: 4.55,
        SGD: 0.172,
        MYR: 0.603,
        AED: 0.47,
        SAR: 0.481,
        RUB: 11.8,
        KRW: 169.2,
        CHF: 0.113,
      },
      CHF: {
        USD: 1.14,
        INR: 94.6,
        NPR: 151.6,
        EUR: 1.04,
        GBP: 0.89,
        JPY: 171.0,
        CNY: 8.18,
        AUD: 1.73,
        CAD: 1.53,
        PKR: 317.0,
        BDT: 125.4,
        LKR: 370.5,
        THB: 40.5,
        SGD: 1.52,
        MYR: 5.34,
        AED: 4.17,
        SAR: 4.26,
        RUB: 104.9,
        KRW: 1505.0,
        HKD: 8.9,
      },
    };

    // Comprehensive currency mapping with aliases and variations
    this.currencyDatabase = this.buildCurrencyDatabase();
  }

  /**
   * Build comprehensive currency database with all variations
   * @returns {Object} Currency database mapping aliases to ISO codes
   */
  buildCurrencyDatabase() {
    return {
      // US Dollar
      USD: {
        code: "USD",
        symbol: "$",
        aliases: [
          "usd",
          "us",
          "dollar",
          "dollars",
          "us dollar",
          "us dollars",
          "united states dollar",
          "united states dollars",
          "american dollar",
          "american dollars",
          "usa dollar",
          "usa dollars",
        ],
        countryKeywords: ["usa", "united states", "america", "american", "us"],
      },
      // Indian Rupee
      INR: {
        code: "INR",
        symbol: "₹",
        aliases: [
          "inr",
          "rupee",
          "rupees",
          "rs",
          "indian rupee",
          "indian rupees",
          "india rupee",
          "india rupees",
          "india currency",
          "india's currency",
          "indian currency",
          "bharat rupee",
          "bharat rupees",
        ],
        countryKeywords: ["india", "indian", "bharat", "hindustan"],
      },
      // Nepalese Rupee
      NPR: {
        code: "NPR",
        symbol: "₨",
        aliases: [
          "npr",
          "nrs",
          "nepali rupee",
          "nepali rupees",
          "nepalese rupee",
          "nepalese rupees",
          "nepali",
          "nepalese",
          "nepal rupee",
          "nepal rupees",
          "nepal currency",
          "nepal's currency",
          "nepalese currency",
          "nepali currency",
        ],
        countryKeywords: ["nepal", "nepali", "nepalese"],
      },
      // Euro
      EUR: {
        code: "EUR",
        symbol: "€",
        aliases: [
          "eur",
          "euro",
          "euros",
          "euro currency",
          "european currency",
          "european euro",
          "european euros",
        ],
        countryKeywords: [
          "europe",
          "european",
          "eurozone",
          "eu",
          "european union",
          "germany",
          "german",
          "france",
          "french",
          "italy",
          "italian",
          "spain",
          "spanish",
          "portugal",
          "portuguese",
          "netherlands",
          "dutch",
          "belgium",
          "belgian",
          "austria",
          "austrian",
          "ireland",
          "irish",
          "finland",
          "finnish",
          "greece",
          "greek",
        ],
      },
      // British Pound
      GBP: {
        code: "GBP",
        symbol: "£",
        aliases: [
          "gbp",
          "pound",
          "pounds",
          "sterling",
          "british pound",
          "british pounds",
          "uk pound",
          "uk pounds",
          "united kingdom pound",
          "uk currency",
          "britain currency",
          "british currency",
          "english pound",
          "english pounds",
        ],
        countryKeywords: [
          "uk",
          "united kingdom",
          "britain",
          "british",
          "england",
          "english",
          "scotland",
          "scottish",
          "wales",
          "welsh",
          "northern ireland",
        ],
      },
      // Japanese Yen
      JPY: {
        code: "JPY",
        symbol: "¥",
        aliases: [
          "jpy",
          "yen",
          "yens",
          "japanese yen",
          "japanese yens",
          "japan yen",
          "japan currency",
          "japan's currency",
          "japanese currency",
        ],
        countryKeywords: ["japan", "japanese"],
      },
      // Chinese Yuan
      CNY: {
        code: "CNY",
        symbol: "¥",
        aliases: [
          "cny",
          "rmb",
          "yuan",
          "yuans",
          "chinese yuan",
          "chinese yuans",
          "china yuan",
          "china currency",
          "china's currency",
          "chinese currency",
          "renminbi",
          "rmb currency",
          "people's currency",
        ],
        countryKeywords: [
          "china",
          "chinese",
          "prc",
          "people's republic of china",
        ],
      },
      // Australian Dollar
      AUD: {
        code: "AUD",
        symbol: "A$",
        aliases: [
          "aud",
          "australian dollar",
          "australian dollars",
          "aussie dollar",
          "aussie dollars",
          "australia dollar",
          "australia dollars",
          "australia currency",
          "australia's currency",
          "australian currency",
        ],
        countryKeywords: ["australia", "australian", "aussie", "oz"],
      },
      // Canadian Dollar
      CAD: {
        code: "CAD",
        symbol: "C$",
        aliases: [
          "cad",
          "canadian dollar",
          "canadian dollars",
          "can dollar",
          "can dollars",
          "canada dollar",
          "canada dollars",
          "canada currency",
          "canada's currency",
          "canadian currency",
        ],
        countryKeywords: ["canada", "canadian", "can"],
      },
      // Pakistani Rupee
      PKR: {
        code: "PKR",
        symbol: "₨",
        aliases: [
          "pkr",
          "pakistani rupee",
          "pakistani rupees",
          "pak rupee",
          "pak rupees",
          "pakistan rupee",
          "pakistan rupees",
          "pakistan currency",
          "pakistan's currency",
          "pakistani currency",
        ],
        countryKeywords: ["pakistan", "pakistani", "pak"],
      },
      // Bangladeshi Taka
      BDT: {
        code: "BDT",
        symbol: "৳",
        aliases: [
          "bdt",
          "taka",
          "takas",
          "bangladeshi taka",
          "bangladeshi takas",
          "bangladesh taka",
          "bangladesh takas",
          "bangladesh currency",
          "bangladesh's currency",
          "bangladeshi currency",
        ],
        countryKeywords: ["bangladesh", "bangladeshi"],
      },
      // Sri Lankan Rupee
      LKR: {
        code: "LKR",
        symbol: "₨",
        aliases: [
          "lkr",
          "sri lankan rupee",
          "sri lankan rupees",
          "sri lanka rupee",
          "sri lanka rupees",
          "sri lanka currency",
          "sri lanka's currency",
          "sri lankan currency",
        ],
        countryKeywords: ["sri lanka", "sri lankan", "ceylon"],
      },
      // Thai Baht
      THB: {
        code: "THB",
        symbol: "฿",
        aliases: [
          "thb",
          "baht",
          "bahts",
          "thai baht",
          "thai bahts",
          "thailand baht",
          "thailand currency",
          "thailand's currency",
          "thai currency",
        ],
        countryKeywords: ["thailand", "thai", "siam"],
      },
      // Singapore Dollar
      SGD: {
        code: "SGD",
        symbol: "S$",
        aliases: [
          "sgd",
          "singapore dollar",
          "singapore dollars",
          "singaporean dollar",
          "singaporean dollars",
          "sing dollar",
          "sing dollars",
          "singapore currency",
          "singapore's currency",
          "singaporean currency",
        ],
        countryKeywords: ["singapore", "singaporean", "sing"],
      },
      // Malaysian Ringgit
      MYR: {
        code: "MYR",
        symbol: "RM",
        aliases: [
          "myr",
          "ringgit",
          "ringgits",
          "malaysian ringgit",
          "malaysian ringgits",
          "malaysia ringgit",
          "malaysia currency",
          "malaysia's currency",
          "malaysian currency",
        ],
        countryKeywords: ["malaysia", "malaysian"],
      },
      // UAE Dirham
      AED: {
        code: "AED",
        symbol: "د.إ",
        aliases: [
          "aed",
          "dirham",
          "dirhams",
          "uae dirham",
          "uae dirhams",
          "emirati dirham",
          "emirati dirhams",
          "united arab emirates dirham",
          "uae currency",
          "uae's currency",
          "emirati currency",
        ],
        countryKeywords: [
          "uae",
          "united arab emirates",
          "emirates",
          "emirati",
          "dubai",
          "abu dhabi",
        ],
      },
      // Saudi Riyal
      SAR: {
        code: "SAR",
        symbol: "﷼",
        aliases: [
          "sar",
          "riyal",
          "riyals",
          "saudi riyal",
          "saudi riyals",
          "saudi arabia riyal",
          "saudi arabia currency",
          "saudi arabia's currency",
          "saudi currency",
        ],
        countryKeywords: [
          "saudi arabia",
          "saudi",
          "ksa",
          "kingdom of saudi arabia",
        ],
      },
      // Russian Ruble
      RUB: {
        code: "RUB",
        symbol: "₽",
        aliases: [
          "rub",
          "ruble",
          "rubles",
          "russian ruble",
          "russian rubles",
          "russia ruble",
          "russia currency",
          "russia's currency",
          "russian currency",
        ],
        countryKeywords: ["russia", "russian"],
      },
      // South Korean Won
      KRW: {
        code: "KRW",
        symbol: "₩",
        aliases: [
          "krw",
          "won",
          "wons",
          "korean won",
          "korean wons",
          "south korean won",
          "south korea won",
          "south korea currency",
          "south korea's currency",
          "korean currency",
        ],
        countryKeywords: [
          "south korea",
          "korea",
          "korean",
          "republic of korea",
        ],
      },
      // Hong Kong Dollar
      HKD: {
        code: "HKD",
        symbol: "HK$",
        aliases: [
          "hkd",
          "hong kong dollar",
          "hong kong dollars",
          "hk dollar",
          "hk dollars",
          "hongkong dollar",
          "hongkong currency",
          "hong kong currency",
          "hong kong's currency",
        ],
        countryKeywords: ["hong kong", "hongkong", "hk"],
      },
      // Swiss Franc
      CHF: {
        code: "CHF",
        symbol: "Fr",
        aliases: [
          "chf",
          "franc",
          "francs",
          "swiss franc",
          "swiss francs",
          "switzerland franc",
          "switzerland currency",
          "switzerland's currency",
          "swiss currency",
        ],
        countryKeywords: ["switzerland", "swiss"],
      },
    };
  }

  /**
   * Find currency code from text using intelligent matching
   * @param {string} text - Text to search for currency
   * @returns {string|null} - Currency code or null
   */
  findCurrencyInText(text) {
    const lowerText = text.toLowerCase().trim();

    // Direct alias matching
    for (const [code, data] of Object.entries(this.currencyDatabase)) {
      for (const alias of data.aliases) {
        // Check if alias appears as a whole word in the text
        const aliasRegex = new RegExp(
          `\\b${alias.replace(/\s+/g, "\\s+")}\\b`,
          "i"
        );
        if (aliasRegex.test(lowerText)) {
          return code;
        }
      }

      // Check country keywords if alias didn't match
      for (const keyword of data.countryKeywords) {
        const keywordRegex = new RegExp(`\\b${keyword}\\b`, "i");
        if (keywordRegex.test(lowerText)) {
          // If country keyword found, check for currency indicator nearby
          const currencyIndicators = [
            "currency",
            "rupee",
            "dollar",
            "pound",
            "euro",
            "yen",
            "yuan",
          ];
          const hasCurrencyIndicator = currencyIndicators.some((indicator) =>
            lowerText.includes(indicator)
          );

          // If we found a country keyword and currency indicator, it's likely this currency
          if (hasCurrencyIndicator || lowerText.includes(code.toLowerCase())) {
            return code;
          }
        }
      }
    }

    // Check for ISO codes (3-letter currency codes)
    const isoCodeRegex = /\b([A-Z]{3})\b/i;
    const isoMatch = text.match(isoCodeRegex);
    if (isoMatch) {
      const code = isoMatch[1].toUpperCase();
      if (this.currencyDatabase[code]) {
        return code;
      }
    }

    return null;
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
   * Parse currency conversion from query using intelligent detection
   * @param {string} query - User query
   * @returns {Object|null} - Parsed conversion details
   */
  parseCurrencyConversion(query) {
    // Extract amount (number with optional decimals)
    const amountMatch = query.match(/(\d+(?:\.\d+)?)/);
    if (!amountMatch) {
      return null;
    }
    const amount = parseFloat(amountMatch[1]);

    // Find all currency mentions in the query
    const currencyMentions = [];
    const lowerQuery = query.toLowerCase();

    // Split query into potential currency sections
    // Look for conversion keywords: "to", "into", "in", "from"
    const conversionKeywords = ["to", "into", "in", "from"];
    let foundKeyword = false;
    let keywordIndex = -1;
    let keyword = null;

    for (const kw of conversionKeywords) {
      const index = lowerQuery.indexOf(kw);
      if (index !== -1) {
        foundKeyword = true;
        keywordIndex = index;
        keyword = kw;
        break;
      }
    }

    if (foundKeyword) {
      // Split query at the keyword
      const beforeKeyword = query.substring(0, keywordIndex).trim();
      const afterKeyword = query
        .substring(keywordIndex + keyword.length)
        .trim();

      // Find currencies in each section
      const fromCurrency = this.findCurrencyInText(beforeKeyword);
      const toCurrency = this.findCurrencyInText(afterKeyword);

      if (fromCurrency && toCurrency) {
        return { amount, fromCurrency, toCurrency };
      }

      // If keyword was "from", swap the order
      if (keyword === "from" && fromCurrency && toCurrency) {
        return { amount, fromCurrency: toCurrency, toCurrency: fromCurrency };
      }
    }

    // Fallback: find all currencies mentioned and try to determine from context
    const allCurrencies = [];
    for (const code in this.currencyDatabase) {
      // Check each currency's aliases and keywords in the query
      const found = this.findCurrencyInText(query);
      if (found === code) {
        allCurrencies.push(code);
      }
    }

    // Remove duplicates
    const uniqueCurrencies = [...new Set(allCurrencies)];

    // If we found exactly 2 currencies, use them
    if (uniqueCurrencies.length === 2) {
      // Try to determine order from query structure
      const fromIndex = lowerQuery.indexOf(uniqueCurrencies[0].toLowerCase());
      const toIndex = lowerQuery.indexOf(uniqueCurrencies[1].toLowerCase());

      if (fromIndex < toIndex) {
        return {
          amount,
          fromCurrency: uniqueCurrencies[0],
          toCurrency: uniqueCurrencies[1],
        };
      } else {
        return {
          amount,
          fromCurrency: uniqueCurrencies[1],
          toCurrency: uniqueCurrencies[0],
        };
      }
    }

    // Last resort: try simple patterns for common cases
    const simplePatterns = [
      /convert\s+(\d+(?:\.\d+)?)\s+(.+?)\s+(?:to|into|in)\s+(.+)/i,
      /(\d+(?:\.\d+)?)\s+(.+?)\s+(?:to|into|in)\s+(.+)/i,
      /what\s+is\s+(\d+(?:\.\d+)?)\s+(.+?)\s+in\s+(.+)/i,
    ];

    for (const pattern of simplePatterns) {
      const match = query.match(pattern);
      if (match) {
        const fromCurrency = this.findCurrencyInText(match[2]);
        const toCurrency = this.findCurrencyInText(match[3]);

        if (fromCurrency && toCurrency) {
          return { amount: parseFloat(match[1]), fromCurrency, toCurrency };
        }
      }
    }

    return null;
  }

  /**
   * Normalize currency names (now uses intelligent detection)
   * @param {string} currency - Currency name or text
   * @returns {string} - Normalized currency code
   */
  normalizeCurrency(currency) {
    const detected = this.findCurrencyInText(currency);
    return detected || currency.toUpperCase();
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
