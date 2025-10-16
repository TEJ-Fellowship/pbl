const axios = require('axios');

async function testIntegration() {
  console.log('🧪 Testing Full Integration - Tool 4 (Currency Exchange)\n');
  
  const testQueries = [
    "Convert 100 USD to EUR",
    "How much is 50 EUR in Japanese Yen?",
    "What's the exchange rate from GBP to USD?",
    "Convert 1000 USD to Indian Rupees",
    "What's 75 GBP worth in Canadian Dollars?",
    "How do I request a refund?", // This should NOT trigger currency conversion
    "What are PayPal fees?" // This should NOT trigger currency conversion
  ];
  
  for (const query of testQueries) {
    console.log(`\n🔍 Testing: "${query}"`);
    try {
      const response = await axios.post('http://localhost:5000/api/query', {
        question: query,
        sessionId: 'test123'
      });
      
      const data = response.data;
      console.log(`✅ Response Type: ${data.issueType}`);
      console.log(`✅ Search Type: ${data.searchType}`);
      console.log(`✅ Confidence: ${data.confidence}%`);
      
      if (data.searchType === 'mcp_tool' && data.issueType === 'currency_conversion') {
        console.log('💱 Currency conversion detected!');
        console.log(`📊 MCP Data: ${JSON.stringify(data.mcpData, null, 2)}`);
      } else if (data.searchType === 'mcp_tool') {
        console.log('🌐 Web search detected!');
      } else {
        console.log('📚 Regular RAG search (as expected)');
      }
      
      console.log(`📝 Answer: ${data.answer.substring(0, 100)}...`);
      
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  }
  
  console.log('\n\n✅ Integration testing completed!');
}

// Run the test
testIntegration().catch(console.error);
