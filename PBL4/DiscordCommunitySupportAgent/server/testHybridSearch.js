#!/usr/bin/env node

/**
 * Test script for Hybrid Search Implementation
 * Tests BM25, semantic search, and hybrid search functionality
 */

import { bm25Search } from './src/utils/bm25Search.js';
import { initializeHybridSearch, hybridSearch } from './src/utils/hybridSearch.js';
import { searchSimilarDocuments } from './src/utils/chromaClient.js';

async function testHybridSearch() {
  console.log('🧪 Testing Hybrid Search Implementation\n');
  
  try {
    // Test 1: Initialize hybrid search
    console.log('1️⃣ Testing hybrid search initialization...');
    const initialized = await initializeHybridSearch();
    
    if (!initialized) {
      console.log('❌ Hybrid search initialization failed');
      return;
    }
    console.log('✅ Hybrid search initialized successfully\n');
    
    // Test 2: Test BM25 search
    console.log('2️⃣ Testing BM25 search...');
    const testQueries = [
      'How to create a Discord server?',
      'What are Discord permissions?',
      'How to set up webhooks?',
      'Discord bot integration',
      'Channel permissions setup'
    ];
    
    for (const query of testQueries) {
      console.log(`\n🔍 Testing BM25 search: "${query}"`);
      const bm25Results = bm25Search.search(query, 3);
      
      if (bm25Results.length > 0) {
        console.log(`✅ Found ${bm25Results.length} BM25 results:`);
        bm25Results.forEach((result, index) => {
          console.log(`   ${index + 1}. Score: ${result.bm25Score.toFixed(4)} | Source: ${result.source}`);
          console.log(`      Content: ${result.content.substring(0, 100)}...`);
        });
      } else {
        console.log('⚠️ No BM25 results found');
      }
    }
    
    // Test 3: Test semantic search
    console.log('\n\n3️⃣ Testing semantic search...');
    for (const query of testQueries.slice(0, 2)) {
      console.log(`\n🧠 Testing semantic search: "${query}"`);
      try {
        const semanticResults = await searchSimilarDocuments(query, 3);
        
        if (semanticResults.documents && semanticResults.documents[0].length > 0) {
          console.log(`✅ Found ${semanticResults.documents[0].length} semantic results:`);
          semanticResults.documents[0].forEach((content, index) => {
            const similarity = 1 - semanticResults.distances[0][index];
            const metadata = semanticResults.metadatas[0][index];
            console.log(`   ${index + 1}. Similarity: ${similarity.toFixed(4)} | Source: ${metadata.source}`);
            console.log(`      Content: ${content.substring(0, 100)}...`);
          });
        } else {
          console.log('⚠️ No semantic results found');
        }
      } catch (error) {
        console.log(`⚠️ Semantic search failed: ${error.message}`);
      }
    }
    
    // Test 4: Test hybrid search
    console.log('\n\n4️⃣ Testing hybrid search...');
    for (const query of testQueries.slice(0, 2)) {
      console.log(`\n🔀 Testing hybrid search: "${query}"`);
      try {
        const hybridResults = await hybridSearch(query, 3, 0.65, 0.35, false);
        
        if (hybridResults.length > 0) {
          console.log(`✅ Found ${hybridResults.length} hybrid results:`);
          hybridResults.forEach((result, index) => {
            console.log(`   ${index + 1}. Combined: ${result.combinedScore.toFixed(4)} | Semantic: ${result.semanticScore.toFixed(4)} | BM25: ${result.keywordScore.toFixed(4)}`);
            console.log(`      Method: ${result.searchMethod} | Source: ${result.source}`);
            console.log(`      Content: ${result.content.substring(0, 100)}...`);
          });
        } else {
          console.log('⚠️ No hybrid results found');
        }
      } catch (error) {
        console.log(`⚠️ Hybrid search failed: ${error.message}`);
      }
    }
    
    // Test 5: Performance comparison
    console.log('\n\n5️⃣ Performance comparison...');
    const testQuery = 'Discord server permissions setup';
    console.log(`\n📊 Comparing search methods for: "${testQuery}"`);
    
    const startTime = Date.now();
    
    // BM25 only
    const bm25Start = Date.now();
    const bm25Results = bm25Search.search(testQuery, 5);
    const bm25Time = Date.now() - bm25Start;
    
    // Semantic only
    const semanticStart = Date.now();
    let semanticResults = null;
    try {
      semanticResults = await searchSimilarDocuments(testQuery, 5);
    } catch (error) {
      console.log('⚠️ Semantic search failed in performance test');
    }
    const semanticTime = Date.now() - semanticStart;
    
    // Hybrid
    const hybridStart = Date.now();
    const hybridResults = await hybridSearch(testQuery, 5, 0.65, 0.35, false);
    const hybridTime = Date.now() - hybridStart;
    
    console.log(`\n⏱️ Performance Results:`);
    console.log(`   BM25 Search: ${bm25Time}ms (${bm25Results.length} results)`);
    console.log(`   Semantic Search: ${semanticTime}ms (${semanticResults?.documents?.[0]?.length || 0} results)`);
    console.log(`   Hybrid Search: ${hybridTime}ms (${hybridResults.length} results)`);
    
    console.log('\n🎉 Hybrid search testing completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

// Run the test
testHybridSearch();
