import { Pool } from "pg";
import dotenv from "dotenv";
import { CurrencyExchangeService } from "./currencyExchange.js";

// Load environment variables
dotenv.config();

// ===== ENHANCED FEE CALCULATOR SERVICE =====
// Uses actual fee data from PostgreSQL raw_data table
export class FeeCalculatorEnhancedService {
  constructor(dbPool = null) {
    // Use provided pool or create a new one
    this.dbPool =
      dbPool ||
      new Pool({
        user: process.env.POSTGRES_USER || "postgres",
        host: process.env.POSTGRES_HOST || "localhost",
        database: process.env.POSTGRES_DATABASE || "paypalAgent",
        password: process.env.POSTGRES_PASSWORD || "your_password_here",
        port: parseInt(process.env.POSTGRES_PORT || "5433", 10),
      });

    // Initialize data as null - will be loaded asynchronously
    this.merchantFees = null;
    this.consumerFees = null;
    this.braintreeFees = null;
    this.dataLoaded = false;
    this.dataLoading = false;
    this.initializePromise = null; // Track initialization promise
    this.fx = new CurrencyExchangeService();

    // Currency mapping
    this.currencyMap = {
      USD: ["us dollar", "dollar", "usd"],
      EUR: ["euro", "eur"],
      GBP: ["uk pounds sterling", "pound", "gbp", "sterling"],
      JPY: ["japanese yen", "yen", "jpy"],
      CAD: ["canadian dollar", "cad"],
      AUD: ["australian dollar", "aud"],
      INR: ["indian rupee", "inr"],
      NPR: ["nepali rupee", "npr"],
      HKD: ["hong kong dollar", "hkd"],
      SGD: ["singapore dollar", "sgd"],
      CHF: ["swiss franc", "chf"],
      CNY: ["chinese yuan", "cny"],
      MXN: ["mexican peso", "mxn"],
      BRL: ["brazilian real", "brl"],
    };

    // Initialize data asynchronously (don't await in constructor)
    this.initializePromise = this.initializeData().catch((err) => {
      console.error("❌ Failed to initialize fee data:", err.message);
      return null;
    });
  }

  // Load fee data from PostgreSQL
  async loadFeeDataFromDB(filename) {
    const client = await this.dbPool.connect();
    try {
      const result = await client.query(
        "SELECT original_data FROM raw_data WHERE source_file = $1",
        [filename]
      );

      if (result.rows.length === 0) {
        console.warn(`⚠️ Fee file not found in DB: ${filename}`);
        return [];
      }

      // original_data is stored as JSON/JSONB, parse if needed
      const data =
        typeof result.rows[0].original_data === "string"
          ? JSON.parse(result.rows[0].original_data)
          : result.rows[0].original_data;

      return data;
    } catch (error) {
      console.error(`❌ Failed to load ${filename} from DB:`, error.message);
      return [];
    } finally {
      client.release();
    }
  }

  // Initialize data asynchronously
  async initializeData() {
    // If already loaded, return immediately
    if (this.dataLoaded) {
      return;
    }

    // If already loading, return the existing promise
    if (this.dataLoading && this.initializePromise) {
      return this.initializePromise;
    }

    // Start loading
    this.dataLoading = true;

    // Create and store the promise so concurrent calls can await it
    this.initializePromise = (async () => {
      try {
        const [merchantFees, consumerFees, braintreeFees] = await Promise.all([
          this.loadFeeDataFromDB("paypal_merchant_fees.json"),
          this.loadFeeDataFromDB("paypal_consumer_fees.json"),
          this.loadFeeDataFromDB("paypal_braintree_fees.json"),
        ]);

        this.merchantFees = merchantFees;
        this.consumerFees = consumerFees;
        this.braintreeFees = braintreeFees;
        this.dataLoaded = true;

        console.log(
          `✅ Fee data loaded from PostgreSQL: merchantFees=${merchantFees.length} tables, consumerFees=${consumerFees.length} tables, braintreeFees=${braintreeFees.length} tables`
        );
      } catch (error) {
        console.error("❌ Error initializing fee data:", error);
        // Fallback to empty arrays
        this.merchantFees = [];
        this.consumerFees = [];
        this.braintreeFees = [];
        throw error; // Re-throw so callers know it failed
      } finally {
        this.dataLoading = false;
      }
    })();

    return this.initializePromise;
  }

  // Normalize currency name to currency code
  normalizeCurrency(currencyText) {
    if (!currencyText) return "USD";

    const normalized = currencyText.toLowerCase().trim();

    // Check direct match first
    if (this.currencyMap[normalized.toUpperCase()]) {
      return normalized.toUpperCase();
    }

    // Check in currency map
    for (const [code, aliases] of Object.entries(this.currencyMap)) {
      if (aliases.some((alias) => normalized.includes(alias))) {
        return code;
      }
    }

    // Default to USD
    return "USD";
  }

  // Parse fee string (e.g., "2.99%", "3.49% + fixed fee", "2.89% + 0.29 USD")
  parseFeeString(feeString) {
    if (!feeString || typeof feeString !== "string") {
      return { percentage: 0, fixed: 0, currency: "USD" };
    }

    const lower = feeString.toLowerCase();

    // Check for "No fee" or "No Fee"
    if (lower.includes("no fee")) {
      return { percentage: 0, fixed: 0, currency: "USD" };
    }

    let percentage = 0;
    let fixed = 0;
    let currency = "USD";

    // Extract percentage (e.g., "2.99%", "3.49%")
    const percentageMatch = feeString.match(/(\d+\.?\d*)\s*%/);
    if (percentageMatch) {
      percentage = parseFloat(percentageMatch[1]) / 100;
    }

    // Extract fixed fee with currency (e.g., "0.29 USD", "0.49 USD")
    const fixedMatch = feeString.match(
      /(\d+\.?\d*)\s*(USD|EUR|GBP|JPY|CAD|AUD|INR|NPR|HKD|SGD|CHF|CNY|MXN|BRL|AUD|CAD)/i
    );
    if (fixedMatch) {
      fixed = parseFloat(fixedMatch[1]);
      currency = fixedMatch[2].toUpperCase();
    } else {
      // Check for "fixed fee" mention without explicit amount
      // Look for fixed fee from currency tables
      if (lower.includes("fixed fee") || lower.includes("+ fixed fee")) {
        // Will be looked up from currency tables
        fixed = null; // Special marker
      }
    }

    // Check for tiered structures (e.g., "1.00 - 74.99 USD")
    // These are handled separately in findFeeForAmount

    return { percentage, fixed, currency, original: feeString };
  }

  // Find fixed fee from currency tables
  findFixedFeeForCurrency(currency, dataSet) {
    const currencyCode = this.normalizeCurrency(currency);

    for (const table of dataSet) {
      if (!table.headers || !table.rows) continue;

      // Check if this table has Currency and Fee columns
      const hasCurrencyCol = table.headers.some((h) =>
        h.toLowerCase().includes("currency")
      );
      const hasFeeCol = table.headers.some((h) =>
        h.toLowerCase().includes("fee")
      );

      if (!hasCurrencyCol || !hasFeeCol) continue;

      // Find currency column index
      const currencyColIdx = table.headers.findIndex((h) =>
        h.toLowerCase().includes("currency")
      );
      const feeColIdx = table.headers.findIndex((h) =>
        h.toLowerCase().includes("fee")
      );

      // Search rows for matching currency
      for (const row of table.rows) {
        const currencyValue = Object.values(row)[currencyColIdx];
        if (!currencyValue) continue;

        const normalized = this.normalizeCurrency(currencyValue);
        if (normalized === currencyCode) {
          const feeValue = Object.values(row)[feeColIdx];
          if (feeValue) {
            const parsed = this.parseFeeString(feeValue);
            if (parsed.fixed > 0) {
              return parsed.fixed;
            }
          }
        }
      }
    }

    return null;
  }

  // Find fee structure matching payment type and transaction context
  findFeeStructure(paymentType, transactionType, dataSet) {
    const results = [];
    const normalizedPaymentType = paymentType.toLowerCase().trim();

    // Build search terms with priority: exact phrase first, then individual words
    const searchTerms = [normalizedPaymentType];
    if (paymentType.includes(" ")) {
      // Add individual words for flexible matching
      const words = normalizedPaymentType.split(/\s+/);
      searchTerms.push(...words);
    }

    for (const table of dataSet) {
      if (!table.headers || !table.rows) continue;

      // Find relevant columns
      const paymentTypeColIdx = table.headers.findIndex((h) =>
        ["payment type", "payment method", "transfer type"].some((term) =>
          h.toLowerCase().includes(term)
        )
      );
      const rateColIdx = table.headers.findIndex((h) =>
        ["rate", "fee"].some((term) => h.toLowerCase().includes(term))
      );

      if (paymentTypeColIdx === -1 || rateColIdx === -1) continue;

      // Search rows
      for (const row of table.rows) {
        const rowArray = Object.values(row);
        const paymentTypeValue = rowArray[paymentTypeColIdx];
        const rateValue = rowArray[rateColIdx];

        if (!paymentTypeValue || !rateValue) continue;

        const normalizedValue = paymentTypeValue.toLowerCase().trim();

        // Priority 1: Exact match (highest priority)
        let matchScore = 0;
        if (normalizedValue === normalizedPaymentType) {
          matchScore = 100; // Perfect match
        } else if (
          normalizedPaymentType.includes(normalizedValue) ||
          normalizedValue.includes(normalizedPaymentType)
        ) {
          // Priority 2: Contains the full phrase (good match) - check both directions
          matchScore = 85; // Increased from 80 for better matching
        } else {
          // Priority 3: Check word-by-word matching
          const valueWords = normalizedValue.split(/\s+/);
          const matchingWords = searchTerms.filter((term) =>
            valueWords.some((vw) => vw.includes(term) || term.includes(vw))
          ).length;

          if (matchingWords > 0) {
            // Score based on how many words match
            matchScore = (matchingWords / searchTerms.length) * 60;

            // Boost score if key terms match (exact phrase matching)
            if (normalizedPaymentType.includes("paypal checkout")) {
              if (normalizedValue === "paypal checkout") {
                matchScore = 100; // Exact match gets highest score
              } else if (
                normalizedValue.includes("paypal") &&
                normalizedValue.includes("checkout") &&
                !normalizedValue.includes("guest")
              ) {
                matchScore = 90; // High score for PayPal Checkout (not guest)
              } else if (
                normalizedValue.includes("paypal") &&
                normalizedValue.includes("checkout")
              ) {
                matchScore = 75; // Lower score for Guest Checkout
              }
            }
            // Boost for PayPal balance/bank account (critical for consumer fees)
            if (
              (normalizedPaymentType.includes("paypal balance") ||
                normalizedPaymentType.includes("bank account") ||
                normalizedPaymentType.includes("balance") ||
                normalizedPaymentType.includes("using my paypal")) &&
              (normalizedValue.includes("paypal balance") ||
                normalizedValue.includes("bank account"))
            ) {
              if (
                normalizedValue.includes("paypal balance") &&
                normalizedValue.includes("bank account")
              ) {
                matchScore = 100; // Exact match: "PayPal balance or a bank account"
              } else if (normalizedValue.includes("paypal balance")) {
                matchScore = 95; // High score for PayPal balance
              } else if (normalizedValue.includes("bank account")) {
                matchScore = 95; // High score for bank account
              }
            }
            if (
              normalizedPaymentType.includes("qr code") &&
              normalizedValue.includes("qr")
            ) {
              matchScore = 85; // High score for QR code
            }
            if (
              normalizedPaymentType.includes("pay later") &&
              normalizedValue.includes("pay later")
            ) {
              matchScore = 85; // High score for Pay Later
            }
          }
        }

        if (matchScore > 0) {
          results.push({
            paymentType: paymentTypeValue,
            fee: rateValue,
            table: table.description,
            matchScore: matchScore,
          });
        }
      }
    }

    // Sort by match score (highest first) to prioritize best matches
    results.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));

    return results;
  }

  // Find tiered fee for amount (e.g., crypto conversion tiers)
  findTieredFeeForAmount(amount, currency, dataSet) {
    for (const table of dataSet) {
      if (!table.headers || !table.rows) continue;

      // Check for tiered structure (amount range column)
      const amountColIdx = table.headers.findIndex((h) =>
        [
          "purchase, sale, or conversion amount",
          "amount",
          "transaction amount",
        ].some((term) => h.toLowerCase().includes(term))
      );
      const feeColIdx = table.headers.findIndex((h) =>
        ["fee", "rate"].some((term) => h.toLowerCase().includes(term))
      );

      if (amountColIdx === -1 || feeColIdx === -1) continue;

      // Search for matching tier
      for (const row of table.rows) {
        const rowArray = Object.values(row);
        const amountRange = rowArray[amountColIdx];
        const feeValue = rowArray[feeColIdx];

        if (!amountRange || !feeValue) continue;

        // Parse amount range (e.g., "1.00 - 74.99 USD", "75.00 – 200.00 USD", "1000.01 USD +")
        const rangeMatch = amountRange.match(
          /(\d+\.?\d*)\s*[–\-]\s*(\d+\.?\d*)\s*(USD|EUR|GBP|JPY|CAD|AUD)/i
        );
        const minOnlyMatch = amountRange.match(
          /(\d+\.?\d*)\s*\+\s*(USD|EUR|GBP|JPY|CAD|AUD)/i
        );

        let matches = false;

        if (rangeMatch) {
          const min = parseFloat(rangeMatch[1]);
          const max = parseFloat(rangeMatch[2]);
          const rangeCurrency = rangeMatch[3].toUpperCase();

          // Convert amount to range currency if needed
          let amountInRange = amount;
          if (rangeCurrency !== currency) {
            // For tier matching, assume currency conversion for range check
            // In practice, we'd need FX rates, but for tier detection, use direct match
            matches = false; // Skip currency mismatch for now
          } else {
            matches = amount >= min && amount <= max;
          }
        } else if (minOnlyMatch) {
          const min = parseFloat(minOnlyMatch[1]);
          const rangeCurrency = minOnlyMatch[2].toUpperCase();

          if (rangeCurrency === currency || rangeCurrency === "USD") {
            matches = amount >= min;
          }
        }

        if (matches) {
          return this.parseFeeString(feeValue);
        }
      }
    }

    return null;
  }

  // Main fee calculation method
  async calculateFees(args) {
    try {
      // Ensure data is loaded before calculating
      // Wait for initialization - either existing promise or start new one
      if (!this.dataLoaded) {
        if (this.dataLoading && this.initializePromise) {
          // Wait for existing initialization
          await this.initializePromise;
        } else {
          // Start new initialization
          await this.initializeData();
        }
      }

      // Verify data is actually loaded and not empty
      if (
        !this.dataLoaded ||
        (this.merchantFees?.length === 0 &&
          this.consumerFees?.length === 0 &&
          this.braintreeFees?.length === 0)
      ) {
        console.error("❌ Fee data failed to load or is empty!");
        throw new Error(
          "Fee data not available. Please try again in a moment."
        );
      }

      const {
        amount,
        paymentType = null,
        transactionType = "domestic",
        accountType = "personal",
        currency = "USD",
        feeCategory = "auto", // "merchant", "consumer", "auto"
      } = args;

      if (!amount || amount <= 0) {
        throw new Error("Amount must be greater than 0");
      }

      // Normalize currency
      const currencyCode = this.normalizeCurrency(currency);

      // Select data set based on fee category
      let dataSet = [];
      if (feeCategory === "merchant" || accountType === "business") {
        dataSet = this.merchantFees || [];
      } else if (feeCategory === "consumer" || accountType === "personal") {
        dataSet = this.consumerFees || [];
      } else {
        // Auto-detect: consumer fees for personal, merchant for business
        dataSet =
          accountType === "business"
            ? this.merchantFees || []
            : this.consumerFees || [];
      }

      // Determine payment type if not provided
      let resolvedPaymentType = paymentType;
      if (!resolvedPaymentType) {
        // Default based on account type
        resolvedPaymentType =
          accountType === "business"
            ? "PayPal Checkout"
            : "PayPal balance or a bank account";
      } else {
        // Normalize payment type to handle variations
        const lowerPaymentType = resolvedPaymentType.toLowerCase();
        // If user mentions PayPal balance, bank account, or similar, normalize to standard form
        if (
          lowerPaymentType.includes("paypal balance") ||
          lowerPaymentType.includes("balance") ||
          (lowerPaymentType.includes("paypal") &&
            lowerPaymentType.includes("balance")) ||
          (lowerPaymentType.includes("bank") &&
            lowerPaymentType.includes("account")) ||
          lowerPaymentType.includes("using my paypal")
        ) {
          // Check if this is for consumer sending money (not merchant)
          if (
            accountType === "personal" ||
            feeCategory === "consumer" ||
            feeCategory === "auto"
          ) {
            resolvedPaymentType = "PayPal balance or a bank account";
          }
        }
      }

      console.log(
        `🔍 Fee calculation request: amount=${amount}, paymentType="${paymentType}", resolvedPaymentType="${resolvedPaymentType}", accountType="${accountType}", feeCategory="${feeCategory}", currency="${currencyCode}", dataSet size=${dataSet.length}`
      );

      // Check if data is loaded
      if (dataSet.length === 0) {
        console.error(
          `❌ Fee data not loaded! merchantFees=${
            this.merchantFees?.length || 0
          }, consumerFees=${this.consumerFees?.length || 0}`
        );
      }

      // Try to find fee structure
      let feeStructure = null;

      // First, check for tiered fees (crypto, etc.)
      if (
        resolvedPaymentType &&
        (resolvedPaymentType.toLowerCase().includes("crypto") ||
          resolvedPaymentType.toLowerCase().includes("cryptocurrency") ||
          resolvedPaymentType.toLowerCase().includes("conversion"))
      ) {
        feeStructure = this.findTieredFeeForAmount(
          amount,
          currencyCode,
          dataSet
        );
      }

      // If not found, search by payment type
      if (!feeStructure) {
        const feeMatches = this.findFeeStructure(
          resolvedPaymentType,
          transactionType,
          dataSet
        );

        if (feeMatches.length > 0) {
          // Use first match (most specific - already sorted by match score)
          feeStructure = this.parseFeeString(feeMatches[0].fee);
          console.log(
            `✅ Matched payment type: "${feeMatches[0].paymentType}" (score: ${feeMatches[0].matchScore}) with fee: "${feeMatches[0].fee}" from table: "${feeMatches[0].table}"`
          );
          // Log all matches for debugging
          if (feeMatches.length > 1) {
            console.log(
              `📊 All matches (${feeMatches.length}):`,
              feeMatches.map(
                (m) => `"${m.paymentType}" (${m.matchScore}) → "${m.fee}"`
              )
            );
          }
        } else {
          console.warn(
            `⚠️ No fee match found for payment type: "${resolvedPaymentType}" in dataSet with ${dataSet.length} tables`
          );
        }
      }

      // Fallback to default merchant rates if nothing found
      if (
        !feeStructure ||
        (feeStructure.percentage === 0 && !feeStructure.fixed)
      ) {
        // Default PayPal rates
        feeStructure = {
          percentage: accountType === "business" ? 0.0299 : 0.029,
          fixed: 0,
          currency: currencyCode,
        };
      }

      // Get fixed fee if needed
      let fixedFee = feeStructure.fixed;
      if (fixedFee === null || fixedFee === undefined) {
        // Look up from currency tables
        const foundFixed = this.findFixedFeeForCurrency(currencyCode, dataSet);
        if (foundFixed !== null) {
          fixedFee = foundFixed;
        } else {
          // Default fixed fees by currency
          fixedFee = currencyCode === "USD" ? 0.49 : 0;
        }
      }

      // Convert fixed fee to target currency if needed
      if (
        feeStructure.currency &&
        feeStructure.currency !== currencyCode &&
        fixedFee > 0
      ) {
        try {
          const fx = await this.fx.getExchangeRate(
            feeStructure.currency,
            currencyCode,
            fixedFee
          );
          fixedFee = fx.converted_amount;
        } catch (err) {
          console.warn(`FX conversion failed, using original fixed fee`);
        }
      }

      // Calculate fees
      const percentageFee = amount * feeStructure.percentage;
      const totalFee = percentageFee + fixedFee;
      const amountReceived = amount - totalFee;

      // Format currency
      const formatAmount = (amt) => {
        const decimals = currencyCode === "JPY" ? 0 : 2;
        return decimals === 0
          ? Math.round(amt).toLocaleString()
          : amt.toFixed(decimals);
      };

      const currencySymbols = {
        USD: "$",
        EUR: "€",
        GBP: "£",
        JPY: "¥",
        CAD: "C$",
        AUD: "A$",
        INR: "₹",
        NPR: "₨",
        HKD: "HK$",
        SGD: "S$",
        CHF: "CHF ",
        CNY: "¥",
        MXN: "Mex$",
        BRL: "R$",
      };

      const symbol = currencySymbols[currencyCode] || currencyCode + " ";

      return {
        success: true,
        data: {
          amount,
          currency: currencyCode,
          paymentType: resolvedPaymentType,
          transactionType,
          accountType,
          feeBreakdown: {
            percentage: feeStructure.percentage * 100,
            percentageFee,
            fixedFee,
            totalFee,
          },
          amountReceived,
        },
        formatted: {
          amount: `${symbol}${formatAmount(amount)}`,
          percentage: `${(feeStructure.percentage * 100).toFixed(2)}%`,
          percentageFee: `${symbol}${formatAmount(percentageFee)}`,
          fixedFee: `${symbol}${formatAmount(fixedFee)}`,
          totalFee: `${symbol}${formatAmount(totalFee)}`,
          amountReceived: `${symbol}${formatAmount(amountReceived)}`,
        },
        message: this.formatFeeMessage({
          amount,
          currencyCode,
          symbol,
          formatAmount,
          feeStructure,
          fixedFee,
          percentageFee,
          totalFee,
          amountReceived,
          resolvedPaymentType,
          transactionType,
          accountType,
        }),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Format fee message
  formatFeeMessage({
    amount,
    currencyCode,
    symbol,
    formatAmount,
    feeStructure,
    fixedFee,
    percentageFee,
    totalFee,
    amountReceived,
    resolvedPaymentType,
    transactionType,
    accountType,
  }) {
    let message = `💳 PayPal Fee Calculation:\n\n`;
    message += `Transaction Amount: ${symbol}${formatAmount(amount)}\n`;
    message += `Payment Type: ${resolvedPaymentType || "Standard"}\n`;
    message += `Account Type: ${
      accountType.charAt(0).toUpperCase() + accountType.slice(1)
    }\n`;
    message += `Transaction Type: ${
      transactionType.charAt(0).toUpperCase() + transactionType.slice(1)
    }\n\n`;

    message += `Fee Breakdown:\n`;
    message += `- Percentage Rate: ${(feeStructure.percentage * 100).toFixed(
      2
    )}%\n`;
    message += `- Percentage Fee: ${symbol}${formatAmount(percentageFee)}\n`;

    if (fixedFee > 0) {
      message += `- Fixed Fee: ${symbol}${formatAmount(fixedFee)}\n`;
    }

    message += `- Total Fee: ${symbol}${formatAmount(totalFee)}\n\n`;
    message += `Amount After Fees: ${symbol}${formatAmount(
      amountReceived
    )}\n\n`;
    message += `*Fees calculated based on current PayPal fee structure*`;

    return message;
  }
}
