import { connectToMongoDB } from './utils/mongodb.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

async function testMongoConnection() {
  console.log("🧪 Testing MongoDB connection...");
  console.log("MongoDB URI:", process.env.MONGODB_URI ? "✅ Set" : "❌ Not set");
  console.log("MongoDB DB:", process.env.MONGODB_DB || "discord_support");
  
  try {
    const db = await connectToMongoDB();
    if (db) {
      console.log("✅ MongoDB connection successful!");
      
      // Test a simple operation
      const collections = await db.listCollections().toArray();
      console.log("📋 Available collections:", collections.map(c => c.name));
      
      process.exit(0);
    } else {
      console.log("❌ MongoDB connection failed");
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ MongoDB test failed:", error.message);
    process.exit(1);
  }
}

testMongoConnection();
