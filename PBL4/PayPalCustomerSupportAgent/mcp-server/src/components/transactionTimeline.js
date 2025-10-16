class TransactionTimelineService {
  constructor() {
    // Hardcoded hold period data based on common PayPal patterns
    this.holdPeriods = {
      new_account: {
        low_risk: { min: 1, max: 3, typical: 2 },
        medium_risk: { min: 3, max: 7, typical: 5 },
        high_risk: { min: 7, max: 21, typical: 14 }
      },
      established_account: {
        low_risk: { min: 0, max: 1, typical: 0 },
        medium_risk: { min: 1, max: 3, typical: 2 },
        high_risk: { min: 3, max: 7, typical: 5 }
      }
    };
  }

  // Check if query is about transaction timelines
  isTimelineQuery(query) {
    const timelineKeywords = [
      'timeline', 'hold', 'hold period', 'when will', 'how long',
      'funds available', 'money available', 'release funds',
      'transaction time', 'processing time', 'settlement time',
      'pending', 'held', 'hold time', 'funds hold', 'when available'
    ];
    
    const lowerQuery = query.toLowerCase();
    return timelineKeywords.some(keyword => lowerQuery.includes(keyword));
  }

  // Parse transaction details from query
  parseTransactionQuery(query) {
    const lowerQuery = query.toLowerCase();
    
    // Extract amount (simple regex)
    const amountMatch = lowerQuery.match(/\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/);
    const amount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : 100;
    
    // Determine account age
    const isNewAccount = lowerQuery.includes('new account') || 
                        lowerQuery.includes('just started') ||
                        lowerQuery.includes('recently opened');
    
    // Determine risk level based on amount
    let riskLevel = 'low_risk';
    if (amount > 1000) riskLevel = 'high_risk';
    else if (amount > 100) riskLevel = 'medium_risk';
    
    return {
      amount,
      accountAge: isNewAccount ? 'new_account' : 'established_account',
      riskLevel
    };
  }

  // Calculate estimated timeline
  calculateTimeline(transactionInfo) {
    const { accountAge, riskLevel, amount } = transactionInfo;
    const basePeriod = this.holdPeriods[accountAge][riskLevel];
    
    return {
      min: basePeriod.min,
      max: basePeriod.max,
      typical: basePeriod.typical,
      accountAge,
      riskLevel,
      amount
    };
  }

  // Main handler method
  async handleTimelineQuery(query) {
    try {
      const transactionInfo = this.parseTransactionQuery(query);
      const timeline = this.calculateTimeline(transactionInfo);
      
      // Format the response message
      const { min, max, typical, amount, accountAge, riskLevel } = timeline;
      
      let message = `📅 **Transaction Timeline Estimate**\n\n`;
      message += `💰 **Amount:** $${amount.toLocaleString()}\n`;
      message += `🏦 **Account Type:** ${accountAge === 'new_account' ? 'New Account' : 'Established Account'}\n`;
      message += `⚠️ **Risk Level:** ${riskLevel.replace('_', ' ').toUpperCase()}\n\n`;
      
      message += `⏱️ **Estimated Hold Period:**\n`;
      if (min === max) {
        message += `• **${min} day${min !== 1 ? 's' : ''}** (typical)\n`;
      } else {
        message += `• **${min}-${max} days** (typical: ${typical} days)\n`;
      }
      
      message += `\n📝 **Notes:**\n`;
      if (accountAge === 'new_account') {
        message += `• New accounts typically have longer hold periods for security\n`;
      }
      if (riskLevel === 'high_risk') {
        message += `• Higher amounts may require additional verification\n`;
      }
      message += `• Actual hold times may vary based on specific circumstances\n`;
      message += `• Contact PayPal support for account-specific information\n`;
      
      return {
        success: true,
        message: message,
        data: {
          timeline,
          transactionInfo,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        success: false,
        message: `Timeline estimation failed: ${error.message}`
      };
    }
  }
}

module.exports = TransactionTimelineService;
