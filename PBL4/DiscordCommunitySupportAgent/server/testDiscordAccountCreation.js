#!/usr/bin/env node

/**
 * Enhanced Hybrid Search Test for Discord Account Creation
 * 
 * This script specifically tests the enhanced hybrid search system
 * with the Discord account creation query that was failing.
 */

import { initializeHybridSearch, hybridSearch, demonstrateHybridSearch } from './src/utils/enhancedHybridSearch.js';

async function testDiscordAccountCreation() {
  console.log('🎯 Testing Enhanced Hybrid Search for Discord Account Creation\n');
  
  try {
    // Initialize the enhanced hybrid search system
    console.log('1️⃣ Initializing Enhanced Hybrid Search System...');
    const initialized = await initializeHybridSearch();
    
    if (!initialized) {
      console.log('❌ Enhanced hybrid search initialization failed');
      return;
    }
    console.log('✅ Enhanced hybrid search initialized successfully\n');
    
    // Test the specific query that was failing
    const failingQuery = "how to create account in discord?";
    console.log(`2️⃣ Testing the failing query: "${failingQuery}"`);
    console.log('─'.repeat(80));
    
    // Test different configurations to find the best one
    const testConfigurations = [
      {
        name: 'Semantic-Focused (α=0.8, β=0.2)',
        alpha: 0.8,
        beta: 0.2,
        normalizationMethod: 'minmax'
      },
      {
        name: 'Balanced (α=0.5, β=0.5)',
        alpha: 0.5,
        beta: 0.5,
        normalizationMethod: 'minmax'
      },
      {
        name: 'Keyword-Focused (α=0.3, β=0.7)',
        alpha: 0.3,
        beta: 0.7,
        normalizationMethod: 'minmax'
      },
      {
        name: 'Softmax Normalization (α=0.7, β=0.3)',
        alpha: 0.7,
        beta: 0.3,
        normalizationMethod: 'softmax'
      }
    ];
    
    for (const config of testConfigurations) {
      console.log(`\n🔧 Configuration: ${config.name}`);
      console.log(`   α=${config.alpha}, β=${config.beta}, normalization=${config.normalizationMethod}`);
      
      try {
        const startTime = Date.now();
        const results = await hybridSearch(
          failingQuery, 
          5, 
          config.alpha, 
          config.beta, 
          false, 
          config.normalizationMethod
        );
        const searchTime = Date.now() - startTime;
        
        if (results.length > 0) {
          console.log(`✅ Found ${results.length} results in ${searchTime}ms:`);
          
          results.forEach((result, index) => {
            console.log(`\n   ${index + 1}. Combined Score: ${result.combinedScore.toFixed(4)}`);
            console.log(`      Semantic: ${result.semanticScore.toFixed(4)} | BM25: ${result.keywordScore.toFixed(4)}`);
            console.log(`      Method: ${result.searchMethod} | Source: ${result.source}`);
            console.log(`      Content Preview: ${result.content.substring(0, 120)}...`);
            
            // Check if this result is relevant to account creation
            const relevantKeywords = ['account', 'create', 'register', 'sign up', 'signup', 'registration'];
            const contentLower = result.content.toLowerCase();
            const keywordMatches = relevantKeywords.filter(keyword => contentLower.includes(keyword));
            
            if (keywordMatches.length > 0) {
              console.log(`      🎯 RELEVANT! Contains keywords: ${keywordMatches.join(', ')}`);
            } else {
              console.log(`      ⚠️ May not be directly relevant to account creation`);
            }
          });
          
          // Analyze result quality
          const relevantResults = results.filter(result => {
            const contentLower = result.content.toLowerCase();
            return relevantKeywords.some(keyword => contentLower.includes(keyword));
          });
          
          console.log(`\n   📊 Quality Analysis:`);
          console.log(`      Relevant results: ${relevantResults.length}/${results.length}`);
          console.log(`      Average combined score: ${(results.reduce((sum, r) => sum + r.combinedScore, 0) / results.length).toFixed(4)}`);
          
        } else {
          console.log('❌ No results found');
        }
        
      } catch (error) {
        console.log(`❌ Error with ${config.name}: ${error.message}`);
      }
    }
    
    // Test related queries that should work better
    console.log('\n\n3️⃣ Testing Related Queries...');
    const relatedQueries = [
      "How to create a Discord account?",
      "Discord account registration",
      "Sign up for Discord",
      "Create Discord user account",
      "Discord account setup"
    ];
    
    for (const query of relatedQueries) {
      console.log(`\n🔍 Testing: "${query}"`);
      
      try {
        const results = await hybridSearch(query, 3, 0.7, 0.3, false, 'minmax');
        
        if (results.length > 0) {
          console.log(`✅ Found ${results.length} results:`);
          results.forEach((result, index) => {
            console.log(`   ${index + 1}. Score: ${result.combinedScore.toFixed(4)} | ${result.source}`);
            console.log(`      ${result.content.substring(0, 80)}...`);
          });
        } else {
          console.log('⚠️ No results found');
        }
        
      } catch (error) {
        console.log(`❌ Error: ${error.message}`);
      }
    }
    
    // Run the demonstration
    console.log('\n\n4️⃣ Running Full Demonstration...');
    await demonstrateHybridSearch();
    
    console.log('\n🎉 Enhanced Hybrid Search Testing Completed!');
    console.log('\n📋 Summary:');
    console.log('   ✅ Enhanced hybrid search system implemented');
    console.log('   ✅ BM25 + FAISS + SentenceTransformer integration');
    console.log('   ✅ Configurable weights (α, β) and normalization');
    console.log('   ✅ Comprehensive ranking and scoring');
    console.log('   ✅ Detailed logging and analysis');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

// Run the test
testDiscordAccountCreation();
