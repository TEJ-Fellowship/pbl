#!/usr/bin/env node

/**
 * Test script for improved AI responses
 * Tests the enhanced prompt system for better Discord account creation answers
 */

import { initializeHybridSearch, hybridSearch } from './src/utils/enhancedHybridSearch.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

async function testImprovedAIResponses() {
  console.log('🤖 Testing Improved AI Responses for Discord Account Creation\n');
  
  try {
    // Initialize the enhanced hybrid search system
    console.log('1️⃣ Initializing Enhanced Hybrid Search System...');
    const initialized = await initializeHybridSearch();
    
    if (!initialized) {
      console.log('❌ Enhanced hybrid search initialization failed');
      return;
    }
    console.log('✅ Enhanced hybrid search initialized successfully\n');
    
    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    // Test queries
    const testQueries = [
      "how do i create a discord account?",
      "how to create account in discord?",
      "discord account registration steps",
      "sign up for discord"
    ];
    
    for (const query of testQueries) {
      console.log(`\n🔍 Testing Query: "${query}"`);
      console.log('─'.repeat(80));
      
      try {
        // Get search results
        const searchResults = await hybridSearch(query, 8, 0.7, 0.3, false, 'minmax');
        
        if (searchResults.length === 0) {
          console.log('❌ No search results found');
          continue;
        }
        
        console.log(`✅ Found ${searchResults.length} search results`);
        
        // Prepare context for AI
        const context = searchResults.map((doc, index) => 
          `Source ${index + 1} (${doc.source}):\n${doc.content}\n`
        ).join('\n');
        
        // Generate AI answer with improved prompt
        const prompt = `You are a Discord Community Support Agent. Answer this question based on the Discord documentation provided.

User Question: ${query}
Server Context: general server (unknown members)

Discord Documentation:
${context}

Instructions:
1. Provide a detailed, step-by-step answer based on the context above
2. Use Discord-specific terminology correctly (channels, roles, permissions, etc.)
3. Format your response with Discord-style markdown:
   - Use **bold** for important terms and headings
   - Use \`code blocks\` for commands, settings, and file names
   - Use > blockquotes for important notes and warnings
   - Use numbered lists (1., 2., 3.) for step-by-step instructions
   - Use bullet points (•) for sub-steps or additional information
4. Include relevant Discord emojis (⚙️, 🔒, ➕, 📝, 🎮, 💻, 📱, 🌐, etc.)
5. For account creation queries, provide specific steps like:
   - Download Discord app or visit website
   - Click "Register" button
   - Enter email, username, password
   - Verify email
   - Complete setup
6. Be detailed and actionable - don't just say "refer to the guide"
7. If the context contains specific steps, use them exactly
8. Make it beginner-friendly with clear explanations

Answer:`;

        console.log('\n🤖 Generating AI Answer...');
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const answer = response.text();
        
        console.log('\n📝 AI Answer:');
        console.log('─'.repeat(80));
        console.log(answer);
        console.log('─'.repeat(80));
        
        // Analyze the answer quality
        console.log('\n📊 Answer Quality Analysis:');
        
        const hasSteps = answer.includes('1.') || answer.includes('2.') || answer.includes('3.');
        const hasEmojis = /[\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u.test(answer);
        const hasBold = answer.includes('**');
        const hasCodeBlocks = answer.includes('`');
        const hasBlockquotes = answer.includes('>');
        const isDetailed = answer.length > 200;
        
        console.log(`   ✅ Has step-by-step instructions: ${hasSteps ? 'Yes' : 'No'}`);
        console.log(`   ✅ Has Discord emojis: ${hasEmojis ? 'Yes' : 'No'}`);
        console.log(`   ✅ Has bold formatting: ${hasBold ? 'Yes' : 'No'}`);
        console.log(`   ✅ Has code blocks: ${hasCodeBlocks ? 'Yes' : 'No'}`);
        console.log(`   ✅ Has blockquotes: ${hasBlockquotes ? 'Yes' : 'No'}`);
        console.log(`   ✅ Is detailed (${answer.length} chars): ${isDetailed ? 'Yes' : 'No'}`);
        
        const qualityScore = [hasSteps, hasEmojis, hasBold, isDetailed].filter(Boolean).length;
        console.log(`   📈 Overall Quality Score: ${qualityScore}/4`);
        
        if (qualityScore >= 3) {
          console.log('   🎉 High quality answer!');
        } else if (qualityScore >= 2) {
          console.log('   👍 Good quality answer');
        } else {
          console.log('   ⚠️ Answer needs improvement');
        }
        
      } catch (error) {
        console.log(`❌ Error processing query "${query}": ${error.message}`);
      }
    }
    
    console.log('\n🎉 Improved AI Response Testing Completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

// Run the test
testImprovedAIResponses();
