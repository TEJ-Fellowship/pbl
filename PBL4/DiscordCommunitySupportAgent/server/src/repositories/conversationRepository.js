import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

let client = null;
let db = null;

export async function connectToMongoDB() {
  try {
    const mongoUrl = process.env.MONGODB_URI || 'mongodb://localhost:27017';
    const dbName = process.env.MONGODB_DB || 'discord_support';
    
    console.log("🗄️ Connecting to MongoDB...");
    console.log(`📡 MongoDB URI: ${mongoUrl}`);
    console.log(`🗃️ Database: ${dbName}`);
    
    client = new MongoClient(mongoUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    await client.connect();
    db = client.db(dbName);
    
    // Test connection
    await db.admin().ping();
    console.log("✅ Connected to MongoDB successfully");
    
    // Create indexes for better performance
    await createIndexes();
    
    return db;
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    throw error;
  }
}

async function createIndexes() {
  try {
    // Create indexes for better query performance
    await db.collection('conversations').createIndex({ sessionId: 1, 'metadata.timestamp': -1 });
    await db.collection('conversations').createIndex({ sessionId: 1 });
    await db.collection('user_profiles').createIndex({ sessionId: 1 }, { unique: true });
    await db.collection('server_contexts').createIndex({ sessionId: 1 }, { unique: true });
    console.log("📊 Database indexes created successfully");
  } catch (error) {
    console.log("⚠️ Index creation failed (may already exist):", error.message);
  }
}

export async function saveConversation(sessionId, query, results, metadata = {}) {
  try {
    if (!db) {
      console.log("⚠️ MongoDB not connected, skipping conversation save");
      return null;
    }
    
    const conversations = db.collection('conversations');
    
    const conversation = {
      sessionId,
      query,
      results: results.map(r => ({
        id: r.id,
        source: r.source,
        score: r.combinedScore || r.score,
        content: r.content.substring(0, 500) // Store truncated content
      })),
      metadata: {
        ...metadata,
        timestamp: new Date(),
        resultCount: results.length,
        rerankingEnabled: metadata.rerankingEnabled || false
      }
    };
    
    const result = await conversations.insertOne(conversation);
    console.log(`💾 Saved conversation for session ${sessionId}`);
    
    return result.insertedId;
  } catch (error) {
    console.error("❌ Failed to save conversation:", error.message);
    return null;
  }
}

export async function getConversationHistory(sessionId, limit = 10) {
  try {
    if (!db) {
      return [];
    }
    
    const conversations = db.collection('conversations');
    const history = await conversations
      .find({ sessionId })
      .sort({ 'metadata.timestamp': -1 })
      .limit(limit)
      .toArray();
    
    return history;
  } catch (error) {
    console.error("❌ Failed to get conversation history:", error.message);
    return [];
  }
}

export async function getServerContext(sessionId) {
  try {
    if (!db) {
      return null;
    }
    
    const contexts = db.collection('server_contexts');
    const context = await contexts.findOne({ sessionId });
    
    return context;
  } catch (error) {
    console.error("❌ Failed to get server context:", error.message);
    return null;
  }
}

// User Profile Management
export async function saveUserProfile(sessionId, userData) {
  try {
    if (!db) {
      console.log("⚠️ MongoDB not connected, skipping user profile save");
      return null;
    }
    
    const userProfiles = db.collection('user_profiles');
    
    const profile = {
      sessionId,
      ...userData,
      lastUpdated: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };
    
    await userProfiles.updateOne(
      { sessionId },
      { $set: profile },
      { upsert: true }
    );
    
    console.log(`👤 User profile saved for session ${sessionId}`);
    return profile;
  } catch (error) {
    console.error("❌ Failed to save user profile:", error.message);
    return null;
  }
}

export async function getUserProfile(sessionId) {
  try {
    if (!db) {
      return null;
    }
    
    const userProfiles = db.collection('user_profiles');
    const profile = await userProfiles.findOne({ sessionId });
    
    return profile;
  } catch (error) {
    console.error("❌ Failed to get user profile:", error.message);
    return null;
  }
}

export async function updateUserProfile(sessionId, updates) {
  try {
    if (!db) {
      console.log("⚠️ MongoDB not connected, skipping user profile update");
      return null;
    }
    
    const userProfiles = db.collection('user_profiles');
    
    const result = await userProfiles.updateOne(
      { sessionId },
      { 
        $set: {
          ...updates,
          lastUpdated: new Date().toISOString()
        }
      },
      { upsert: true }
    );
    
    console.log(`👤 User profile updated for session ${sessionId}`);
    return result;
  } catch (error) {
    console.error("❌ Failed to update user profile:", error.message);
    return null;
  }
}

export async function saveServerContext(sessionId, context) {
  try {
    if (!db) {
      return null;
    }
    
    const contexts = db.collection('server_contexts');
    
    const serverContext = {
      sessionId,
      ...context,
      updatedAt: new Date()
    };
    
    await contexts.replaceOne(
      { sessionId },
      serverContext,
      { upsert: true }
    );
    
    console.log(`💾 Saved server context for session ${sessionId}`);
    return true;
  } catch (error) {
    console.error("❌ Failed to save server context:", error.message);
    return false;
  }
}

export async function closeMongoConnection() {
  if (client) {
    await client.close();
    console.log("🔌 MongoDB connection closed");
  }
}

export { db };
