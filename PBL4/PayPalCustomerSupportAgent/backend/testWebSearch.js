// Test script for web search functionality
const { searchPayPalWeb, shouldUseWebSearch } = require('./services/webSearchService.js');
const dotenv = require('dotenv');

dotenv.config();

async function testWebSearch() {
  console.log('🧪 Testing PayPal Web Search Tool\n');
  
  // Test 1: Check if web search should be triggered
  const testQueries = [
    "How do I get a refund?", // Should NOT trigger web search
    "Is PayPal down today?", // Should trigger web search
    "Recent PayPal fee changes", // Should trigger web search
    "What are PayPal fees?", // Should NOT trigger web search
    "PayPal outage status", // Should trigger web search
  ];
  
  console.log('📋 Testing web search triggers:');
  testQueries.forEach((query, index) => {
    const shouldSearch = shouldUseWebSearch(query);
    console.log(`${index + 1}. "${query}" → ${shouldSearch ? '🌐 WEB SEARCH' : '📚 HYBRID ONLY'}`);
  });
  
  console.log('\n🔍 Testing actual web search (if API keys are configured):');
  
  // Test 2: Actual web search (only if API keys are configured)
  if (process.env.GOOGLE_WEB_KEY && process.env.GOOGLE_SEARCH_ID) {
    try {
      const results = await searchPayPalWeb('PayPal outage');
      console.log(`✅ Found ${results.length} web search results:`);
      results.forEach((result, index) => {
        console.log(`\n${index + 1}. ${result.title}`);
        console.log(`   ${result.snippet}`);
        console.log(`   Link: ${result.link}`);
      });
    } catch (error) {
      console.error('❌ Web search failed:', error.message);
    }
  } else {
    console.log('⚠️  Google API credentials not configured. Please add GOOGLE_WEB_KEY and GOOGLE_SEARCH_ID to your .env file');
  }
  
  console.log('\n✅ Test completed!');
}

testWebSearch().catch(console.error);
