const fs = require('fs');
const path = require('path');

// ===== FEE CALCULATOR SERVICE =====
class FeeCalculatorService {
  constructor() {
    this.feeRates = this.loadFeeRates();
  }

  // Load fee rates from JSON file
  loadFeeRates() {
    try {
      const feeRatesPath = path.join(__dirname, '../../fee-rates/paypal-fees.json');
      const data = fs.readFileSync(feeRatesPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('❌ Failed to load fee rates:', error.message);
      return null;
    }
  }

  // Check if query is about fee calculation
  isFeeQuery(query) {
    const lowerQuery = query.toLowerCase();
    const feeKeywords = [
      'fee', 'fees', 'cost', 'costs', 'charge', 'charges', 'calculate', 'calculation',
      'how much', 'paypal fee', 'transaction fee', 'payment fee', 'send money fee',
      'receive money fee', 'domestic fee', 'international fee', 'currency fee'
    ];
    
    return feeKeywords.some(keyword => lowerQuery.includes(keyword));
  }

  // Parse fee calculation query
  parseFeeQuery(query) {
    const upperQuery = query.toUpperCase();
    
    // Extract amount
    const amountMatch = query.match(/(\d+(?:\.\d+)?)/);
    const amount = amountMatch ? parseFloat(amountMatch[1]) : null;

    // Determine transaction type
    let transactionType = 'domestic';
    if (upperQuery.includes('INTERNATIONAL') || upperQuery.includes('CROSS-BORDER') || 
        upperQuery.includes('FOREIGN') || upperQuery.includes('OVERSEAS')) {
      transactionType = 'international';
    }

    // Determine account type
    let accountType = 'personal';
    if (upperQuery.includes('BUSINESS') || upperQuery.includes('MERCHANT') || 
        upperQuery.includes('COMMERCIAL')) {
      accountType = 'business';
    }

    // Determine payment method
    let paymentMethod = 'paypal_balance';
    if (upperQuery.includes('CREDIT CARD') || upperQuery.includes('CREDITCARD')) {
      paymentMethod = 'credit_card';
    } else if (upperQuery.includes('DEBIT CARD') || upperQuery.includes('DEBITCARD')) {
      paymentMethod = 'debit_card';
    }

    // Determine currency
    let currency = 'USD';
    const currencyPatterns = [
      { pattern: /USD|US\s*DOLLAR/i, code: 'USD' },
      { pattern: /EUR|EURO/i, code: 'EUR' },
      { pattern: /GBP|POUND|BRITISH/i, code: 'GBP' },
      { pattern: /JPY|YEN|JAPANESE/i, code: 'JPY' },
      { pattern: /CAD|CANADIAN/i, code: 'CAD' },
      { pattern: /AUD|AUSTRALIAN/i, code: 'AUD' },
      { pattern: /INR|INDIAN\s*RUPEE/i, code: 'INR' },
      { pattern: /NPR|NEPALI\s*RUPEE/i, code: 'NPR' }
    ];

    for (const pattern of currencyPatterns) {
      if (pattern.pattern.test(query)) {
        currency = pattern.code;
        break;
      }
    }

    return {
      amount,
      transactionType,
      accountType,
      paymentMethod,
      currency,
      isValid: amount !== null && amount > 0
    };
  }

  // Calculate PayPal fees
  calculateFees(amount, transactionType, accountType, paymentMethod, currency = 'USD') {
    try {
      // Validate inputs
      if (!amount || amount <= 0) {
        throw new Error('Amount must be greater than 0');
      }

      if (!this.feeRates) {
        throw new Error('Fee rates not available');
      }

      // Check if currency is supported
      if (!this.feeRates.currencies[currency]) {
        throw new Error(`Currency ${currency} not supported`);
      }

      // Get fee structure
      const feeStructure = this.feeRates.fee_structures[transactionType]?.[accountType]?.[paymentMethod];
      if (!feeStructure) {
        throw new Error(`Fee structure not found for ${transactionType} ${accountType} ${paymentMethod}`);
      }

      // Check for micropayments
      const isMicropayment = amount <= this.feeRates.micropayments.threshold;
      let feeStructureToUse = feeStructure;

      if (isMicropayment) {
        const micropaymentFees = this.feeRates.micropayments[accountType];
        if (micropaymentFees) {
          feeStructureToUse = micropaymentFees;
        }
      }

      // Calculate fees
      const percentageFee = amount * feeStructureToUse.percentage;
      const fixedFee = feeStructureToUse.fixed_fee;
      const totalFee = percentageFee + fixedFee;
      const amountReceived = amount - totalFee;

      // Check for currency conversion fee
      let currencyConversionFee = 0;
      let currencyConversionNote = '';
      if (currency !== 'USD') {
        currencyConversionFee = amount * this.feeRates.currency_conversion.additional_fee_percentage;
        currencyConversionNote = ` + ${this.feeRates.currency_conversion.additional_fee_percentage * 100}% currency conversion fee`;
      }

      const finalTotalFee = totalFee + currencyConversionFee;
      const finalAmountReceived = amount - finalTotalFee;

      // Format currency
      const currencyInfo = this.feeRates.currencies[currency];
      const formatAmount = (amt) => {
        const symbol = currencyInfo.symbol;
        const decimals = currencyInfo.decimal_places;
        const formatted = decimals === 0 ? Math.round(amt) : amt.toFixed(decimals);
        return `${symbol}${formatted}`;
      };

      return {
        success: true,
        data: {
          amount: amount,
          currency: currency,
          transactionType: transactionType,
          accountType: accountType,
          paymentMethod: paymentMethod,
          feeBreakdown: {
            percentageFee: percentageFee,
            fixedFee: fixedFee,
            currencyConversionFee: currencyConversionFee,
            totalFee: finalTotalFee
          },
          amountReceived: finalAmountReceived,
          isMicropayment: isMicropayment,
          currencyConversionNote: currencyConversionNote
        },
        formatted: {
          amount: formatAmount(amount),
          percentageFee: formatAmount(percentageFee),
          fixedFee: formatAmount(fixedFee),
          currencyConversionFee: formatAmount(currencyConversionFee),
          totalFee: formatAmount(finalTotalFee),
          amountReceived: formatAmount(finalAmountReceived)
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Handle fee calculation query
  async handleFeeQuery(query) {
    try {
      const parsedQuery = this.parseFeeQuery(query);
      
      if (!parsedQuery.isValid) {
        return {
          success: false,
          message: 'I couldn\'t understand the fee calculation request. Please try: "Calculate PayPal fee for $100 domestic payment" or "What are the fees for sending $50 internationally?"'
        };
      }

      const result = this.calculateFees(
        parsedQuery.amount,
        parsedQuery.transactionType,
        parsedQuery.accountType,
        parsedQuery.paymentMethod,
        parsedQuery.currency
      );

      if (!result.success) {
        return {
          success: false,
          message: `Sorry, I couldn't calculate the fees: ${result.error}`
        };
      }

      const { data, formatted } = result;
      const { feeBreakdown, isMicropayment, currencyConversionNote } = data;

      // Create detailed breakdown message
      let message = `💳 PayPal Fee Calculation:\n\n`;
      message += `Transaction: ${formatted.amount} (${data.transactionType.charAt(0).toUpperCase() + data.transactionType.slice(1)})\n`;
      message += `Account Type: ${data.accountType.charAt(0).toUpperCase() + data.accountType.slice(1)}\n`;
      message += `Payment Method: ${data.paymentMethod.replace('_', ' ').toUpperCase()}\n\n`;

      if (isMicropayment) {
        message += `⚠️ Micropayment rates apply (≤ $${this.feeRates.micropayments.threshold})\n\n`;
      }

      message += `Fee Breakdown:\n`;
      message += `- Percentage Fee: ${formatted.percentageFee} (${(feeBreakdown.percentageFee / data.amount * 100).toFixed(2)}%)\n`;
      message += `- Fixed Fee: ${formatted.fixedFee}\n`;
      
      if (feeBreakdown.currencyConversionFee > 0) {
        message += `- Currency Conversion: ${formatted.currencyConversionFee} (2.5%)\n`;
      }
      
      message += `- Total Fee: ${formatted.totalFee}\n\n`;
      message += `Amount Received: ${formatted.amountReceived}\n\n`;

      if (currencyConversionNote) {
        message += `*${currencyConversionNote}*\n`;
      }

      message += `*Fees may vary based on account type and payment method*`;

      return {
        success: true,
        message: message,
        data: data
      };

    } catch (error) {
      return {
        success: false,
        message: `Sorry, I couldn't calculate the fees: ${error.message}`
      };
    }
  }

  // Get supported currencies
  getSupportedCurrencies() {
    if (!this.feeRates) return [];
    return Object.keys(this.feeRates.currencies);
  }

  // Get fee structure info
  getFeeStructureInfo() {
    if (!this.feeRates) return null;
    return {
      version: this.feeRates.version,
      lastUpdated: this.feeRates.last_updated,
      supportedCurrencies: this.getSupportedCurrencies(),
      micropaymentThreshold: this.feeRates.micropayments.threshold
    };
  }
}

module.exports = FeeCalculatorService;
