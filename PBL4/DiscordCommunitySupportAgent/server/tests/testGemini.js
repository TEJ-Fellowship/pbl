import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

async function testGemini() {
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
    console.log('❌ Please add your Gemini API key to .env file first');
    console.log('1. Go to https://aistudio.google.com');
    console.log('2. Get your API key');
    console.log('3. Replace "your_gemini_api_key_here" in .env with your actual key');
    return;
  }

  try {
    console.log('🧪 Testing Gemini embeddings...');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
    
    const result = await model.embedContent('Test embedding');
    console.log('✅ SUCCESS! Gemini embeddings working!');
    console.log('🚀 Ready to run: node processDocsGemini.js');
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

testGemini();
