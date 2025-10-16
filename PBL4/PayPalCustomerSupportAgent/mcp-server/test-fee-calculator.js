const MCPToolsService = require('./src/index.js');

// Create MCP Tools Service instance
const mcpService = new MCPToolsService();

console.log('Testing Fee Calculator MCP Tool');
console.log('=====================================\n');

// Test cases
const testQueries = [
  "Calculate PayPal fee for $100 domestic payment",
  "What are the fees for sending $50 internationally?",
  "How much will I pay in fees for $25 USD to EUR?",
  "Calculate fee for $5 micropayment",
  "What's the cost for $500 business payment?",
  "Fee calculation for $1000 international transfer",
  "Calculate PayPal charges for $75 credit card payment",
  "How much fee for $200 domestic business payment?"
];

async function testFeeCalculator() {
  console.log('Testing Fee Calculator Integration...\n');

  for (let i = 0; i < testQueries.length; i++) {
    const query = testQueries[i];
    console.log(`Test ${i + 1}: "${query}"`);
    console.log('-'.repeat(50));

    try {
      // Check if fee calculator should be triggered
      const triggeredTools = await mcpService.getTriggeredTools(query);
      console.log(`Triggered tools: ${triggeredTools.join(', ')}`);

      if (triggeredTools.includes('feecalculator')) {
        const result = await mcpService.getToolData('feecalculator', query);
        
        if (result.success) {
          console.log('Success!');
          console.log(result.message);
        } else {
          console.log('Failed!');
          console.log(result.message);
        }
      } else {
        console.log('Fee calculator not triggered');
      }

    } catch (error) {
      console.log(' Error:', error.message);
    }

    console.log('\n' + '='.repeat(60) + '\n');
  }

  // Test fee calculator directly
  console.log('Testing Fee Calculator Service Directly...\n');
  
  try {
    const feeCalculator = mcpService.feeCalculator;
    
    // Test supported currencies
    console.log('Supported currencies:', feeCalculator.getSupportedCurrencies());
    
    // Test fee structure info
    const info = feeCalculator.getFeeStructureInfo();
    console.log('Fee structure info:', info);
    
    // Test direct calculation
    console.log('\nDirect calculation test:');
    const directResult = feeCalculator.calculateFees(100, 'domestic', 'personal', 'paypal_balance', 'USD');
    console.log('Direct calculation result:', directResult);

  } catch (error) {
    console.log('Direct test error:', error.message);
  }
}

// Run the tests
testFeeCalculator().catch(console.error);
