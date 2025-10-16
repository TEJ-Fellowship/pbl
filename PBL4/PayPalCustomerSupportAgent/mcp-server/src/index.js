const CurrencyExchangeService = require('./components/currencyExchange');
const WebSearchService = require('./components/webSearch');
const ApiStatusChecker = require('./components/apiStatusChecker');
const FeeCalculatorService = require('./components/feeCalculator');

// ===== MCP TOOLS SERVICE =====
class MCPToolsService {
  constructor() {
    this.currencyService = new CurrencyExchangeService();
    this.webSearchService = new WebSearchService();
    this.statusChecker = new ApiStatusChecker();
    this.feeCalculator = new FeeCalculatorService();
  }

  // Check which tools should be triggered for this query
  async getTriggeredTools(query) {
    const tools = [];
    
    if (this.statusChecker.isStatusQuery(query)) {
      tools.push('status');
    }
    if (this.currencyService.isCurrencyQuery(query)) {
      tools.push('currency');
    }
    if (this.webSearchService.shouldUseWebSearch(query)) {
      tools.push('websearch');
    }
    if (this.feeCalculator.isFeeQuery(query)) {
      tools.push('feecalculator');
    }
    
    return tools;
  }

  // Get data from triggered tools
  async getToolData(toolType, query) {
    switch (toolType) {
      case 'status':
        return await this.statusChecker.getStatusResponse();
      case 'currency':
        return await this.handleCurrencyQuery(query);
      case 'websearch':
        return await this.handleWebSearchQuery(query);
      case 'feecalculator':
        return await this.handleFeeQuery(query);
      default:
        return null;
    }
  }

  // Handle currency conversion queries
  async handleCurrencyQuery(query) {
    try {
      const currencyInfo = this.currencyService.parseCurrencyQuery(query);
      
      if (!currencyInfo) {
        return {
          success: false,
          message: 'I couldn\'t understand the currency conversion. Please try: "Convert 100 USD to EUR" or "What\'s the exchange rate from USD to GBP?"'
        };
      }

      const result = await this.currencyService.getExchangeRate(
        currencyInfo.from_currency,
        currencyInfo.to_currency,
        currencyInfo.amount
      );

      const formattedFrom = this.currencyService.formatCurrency(result.amount, result.from_currency);
      const formattedTo = this.currencyService.formatCurrency(result.converted_amount, result.to_currency);

      return {
        success: true,
        message: `💱 Currency Conversion:\n\n${formattedFrom} = ${formattedTo}\n\nExchange Rate: 1 ${result.from_currency} = ${result.exchange_rate} ${result.to_currency}\n\n*Rate as of ${new Date(result.timestamp).toLocaleString()}*`,
        data: result
      };

    } catch (error) {
      return {
        success: false,
        message: `Sorry, I couldn't get the exchange rate: ${error.message}`
      };
    }
  }

  // Handle web search queries
  async handleWebSearchQuery(query) {
    try {
      const results = await this.webSearchService.searchPayPalWeb(query);
      
      return {
        success: true,
        message: `Found ${results.length} recent results about: ${query}`,
        data: results
      };

    } catch (error) {
      return {
        success: false,
        message: `Sorry, I couldn't search for recent information: ${error.message}`
      };
    }
  }

  // Handle fee calculation queries
  async handleFeeQuery(query) {
    try {
      const result = await this.feeCalculator.handleFeeQuery(query);
      return result;

    } catch (error) {
      return {
        success: false,
        message: `Sorry, I couldn't calculate the fees: ${error.message}`
      };
    }
  }

  // Main processQuery method for testing and external use
  async processQuery(query) {
    try {
      console.log(`🔍 Processing query: "${query}"`);
      
      // Get triggered tools
      const triggeredTools = await this.getTriggeredTools(query);
      console.log(`🛠️ Triggered tools: ${triggeredTools.join(', ')}`);
      
      if (triggeredTools.length === 0) {
        return null; // No MCP tools triggered
      }
      
      // Get data from the first triggered tool (for testing purposes)
      const tool = triggeredTools[0];
      const toolData = await this.getToolData(tool, query);
      
      if (toolData && toolData.success) {
        return {
          type: tool,
          message: toolData.message,
          data: toolData.data
        };
      } else {
        return {
          type: tool,
          message: toolData?.message || 'Tool execution failed',
          data: null
        };
      }
      
    } catch (error) {
      console.error('❌ Error in processQuery:', error.message);
      return {
        type: 'error',
        message: `Error processing query: ${error.message}`,
        data: null
      };
    }
  }
}

// Export the service
module.exports = MCPToolsService;