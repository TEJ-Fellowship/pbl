// Quick test script to verify API functionality
import { searchSimilarDocuments } from './chroma/chromaClient.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

async function testAPI() {
  try {
    console.log('🧪 Testing API functionality...');
    
    const query = 'how to create roles';
    console.log('Query:', query);
    
    // Test search
    const results = await searchSimilarDocuments(query, 3);
    console.log('✅ Search working:', results.documents[0].length, 'results');
    
    // Test AI generation
    const retrievedDocs = results.documents[0].map((doc, index) => ({
      content: doc,
      metadata: results.metadatas[0][index],
      similarity: 1 - results.distances[0][index]
    }));
    
    const prompt = `Answer this question: ${query}\n\nContext: ${retrievedDocs[0].content}`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    console.log('✅ AI generation working:', response.text().substring(0, 100) + '...');
    
    console.log('🎉 API functionality verified!');
    
  } catch (error) {
    console.log('❌ API test failed:', error.message);
  }
}

testAPI();
