const { handleQuery } = require('./services/queryServiceHybrid');

async function testHybridWebIntegration() {
  console.log('🧪 Testing Enhanced Hybrid + Web Search Integration\n');
  console.log('🔧 This test will show detailed logging to verify web search is working\n');
  
  const testQueries = [
    "is paypal down today?",
    "what are the current paypal fees?",
    "paypal security breach recent",
    "how to send money with paypal",
    "paypal account suspended help",
    "paypal service status",
    "paypal outage today",
    "paypal fees 2024",
    "paypal not working"
  ];
  
  for (const query of testQueries) {
    console.log(`\n🔍 Testing Query: "${query}"`);
    console.log('=' .repeat(80));
    
    try {
      const startTime = Date.now();
      const response = await handleQuery(query, 'test-session');
      const endTime = Date.now();
      
      console.log(`\n📊 RESULTS SUMMARY:`);
      console.log(`⏱️  Response Time: ${endTime - startTime}ms`);
      console.log(`🎯 Confidence: ${response.confidence}%`);
      console.log(`🔍 Search Type: ${response.searchType}`);
      console.log(`📊 Search Details:`, response.searchDetails);
      console.log(`📚 Total Citations: ${response.citations.length}`);
      
      // Show detailed citation analysis
      console.log(`\n📚 CITATION ANALYSIS:`);
      response.citations.forEach((citation, idx) => {
        const sourceType = citation.channel === 'web_search' ? '🌐 WEB' : '📚 HYBRID';
        const official = citation.isOfficial ? '[OFFICIAL]' : '';
        const recent = citation.isRecent ? '[RECENT]' : '';
        const priority = citation.priority || 'unknown';
        
        console.log(`   ${idx + 1}. ${sourceType} ${citation.label} - ${citation.source} ${official} ${recent} [${priority}]`);
      });
      
      // Analyze source distribution
      const webCount = response.citations.filter(c => c.channel === 'web_search').length;
      const hybridCount = response.citations.filter(c => c.channel === 'hybrid').length;
      console.log(`\n📈 SOURCE DISTRIBUTION: ${webCount} Web Search + ${hybridCount} Hybrid Search`);
      
      // Check if web search is being used effectively
      if (webCount > 0) {
        console.log(`✅ Web search is being used (${webCount} results)`);
      } else {
        console.log(`⚠️  No web search results found`);
      }
      
      console.log(`\n💬 Answer Preview: ${response.answer.substring(0, 300)}...`);
      
    } catch (error) {
      console.error(`❌ Error testing query "${query}":`, error.message);
    }
    
    console.log('\n' + '-'.repeat(80));
  }
  
  console.log('\nHybrid + Web Search Integration Test Complete!');
  console.log('\n Key Improvements Made:');
  console.log('   • More aggressive web search triggering');
  console.log('   • Enhanced search strategies (3-tier approach)');
  console.log('   • Heavily prioritized web search results in ranking');
  console.log('   • Better result differentiation and mixing');
  console.log('   • Detailed logging for debugging');
}

// Run the test if this file is executed directly
if (require.main === module) {
  testHybridWebIntegration().catch(console.error);
}

module.exports = { testHybridWebIntegration };
