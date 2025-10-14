import OpenAI from 'openai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

async function testOpenAI() {
  console.log("🧪 Testing OpenAI API key...");
  console.log("API Key:", process.env.OPENAI_API_KEY ? "✅ Set" : "❌ Not set");
  
  if (!process.env.OPENAI_API_KEY) {
    console.log("❌ No OpenAI API key found in .env file");
    return;
  }
  
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    console.log("🔍 Testing API connection...");
    
    // Test with a simple completion
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: "Say 'OpenAI API is working!' if you can read this."
        }
      ],
      max_tokens: 50
    });
    
    console.log("✅ OpenAI API is working!");
    console.log("Response:", response.choices[0].message.content);
    
    // Test embeddings
    console.log("🔍 Testing embeddings...");
    const embedding = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: "Test embedding",
    });
    
    console.log("✅ Embeddings are working!");
    console.log("Embedding dimension:", embedding.data[0].embedding.length);
    
  } catch (error) {
    console.error("❌ OpenAI API test failed:", error.message);
    
    if (error.message.includes('401')) {
      console.log("💡 This usually means your API key is invalid or expired");
    } else if (error.message.includes('429')) {
      console.log("💡 This means you've exceeded your quota/rate limit");
    } else if (error.message.includes('insufficient_quota')) {
      console.log("💡 Your account has insufficient credits");
    }
  }
}

testOpenAI();
