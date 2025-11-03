import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from "url";
import crypto from 'crypto';
import { config } from '../config/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

let client = null;
let db = null;

/**
 * Generate a hash for exact query matching
 * @param {string} query - User query
 * @param {Object} serverContext - Server context
 * @returns {string} Query hash
 */
function generateQueryHash(query, serverContext = {}) {
  const normalizedQuery = query.toLowerCase().trim();
  const contextStr = JSON.stringify(serverContext, Object.keys(serverContext).sort());
  const combined = `${normalizedQuery}||${contextStr}`;
  return crypto.createHash('sha256').update(combined).digest('hex');
}

export async function connectToMongoDB() {
  try {
    const mongoUrl = process.env.MONGODB_URI || 'mongodb://localhost:27017';
    const dbName = process.env.MONGODB_DB || 'discord_support';
    
    console.log("🗄️ Connecting to MongoDB...");
    console.log(`📡 MongoDB URI: ${mongoUrl}`);
    console.log(`🗃️ Database: ${dbName}`);
    
    // MongoDB connection
    client = new MongoClient(mongoUrl, {
      serverSelectionTimeoutMS: 30000,
      connectTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      retryWrites: true,
      retryReads: true,
      tls: mongoUrl.includes('mongodb+srv://'),
      compressors: ['zlib'],
      zlibCompressionLevel: 6
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
    console.log("💡 Please check your MongoDB connection string and network access");
    throw error;
  }
}

async function createIndexes() {
  try {
    const memoryConfig = config.memory;
    
    // Exact Query Cache indexes with TTL
    if (memoryConfig.queryCache.enabled) {
      const queryCacheCollection = db.collection(memoryConfig.queryCache.collectionName);
      
      // Index on queryHash for fast lookups
      await queryCacheCollection.createIndex({ queryHash: 1 }, { unique: true });
      
      // TTL index on expiresAt for auto-cleanup (6 hours)
      const ttlSeconds = memoryConfig.queryCache.ttlHours * 3600;
      await queryCacheCollection.createIndex(
        { expiresAt: 1 },
        { expireAfterSeconds: 0 } // MongoDB will delete documents when expiresAt passes
      );
      
      console.log(`📊 Query cache indexes created (TTL: ${memoryConfig.queryCache.ttlHours}h)`);
    }
    
    // Server-Based Conversation Memory indexes with TTL
    if (memoryConfig.conversation.enabled) {
      const conversationsCollection = db.collection(memoryConfig.conversation.collectionName);
      
      // Index on serverId + timestamp for fast history retrieval
      await conversationsCollection.createIndex({ serverId: 1, 'metadata.timestamp': -1 });
      await conversationsCollection.createIndex({ serverId: 1 });
      
      // TTL index on expiresAt for auto-cleanup (2 days)
      const ttlSeconds = memoryConfig.conversation.ttlDays * 86400;
      await conversationsCollection.createIndex(
        { expiresAt: 1 },
        { expireAfterSeconds: 0 } // MongoDB will delete documents when expiresAt passes
      );
      
      console.log(`📊 Conversation memory indexes created (TTL: ${memoryConfig.conversation.ttlDays} days, limit: ${memoryConfig.conversation.messageLimit} messages)`);
    }
    
    // Server Context indexes
    if (memoryConfig.serverContext.enabled) {
      const contextsCollection = db.collection(memoryConfig.serverContext.collectionName);
      await contextsCollection.createIndex({ serverId: 1 }, { unique: true });
      console.log(`📊 Server context indexes created`);
    }
    
    console.log("✅ All database indexes created successfully");
  } catch (error) {
    console.log("⚠️ Index creation failed (may already exist):", error.message);
  }
}

/**
 * Get exact query cache result
 * @param {string} query - User query
 * @param {Object} serverContext - Server context
 * @returns {Promise<Object|null>} Cached result or null
 */
export async function getQueryCache(query, serverContext = {}) {
  try {
    if (!db) {
      return null;
    }
    
    const memoryConfig = config.memory;
    if (!memoryConfig.queryCache.enabled) {
      return null;
    }
    
    const queryCache = db.collection(memoryConfig.queryCache.collectionName);
    const queryHash = generateQueryHash(query, serverContext);
    
    const cached = await queryCache.findOne({ queryHash });
    
    if (cached && cached.expiresAt > new Date()) {
      console.log(`💾 Query cache HIT for: "${query.substring(0, 50)}..."`);
      return cached.response;
    }
    
    // Clean up expired entries
    if (cached && cached.expiresAt <= new Date()) {
      await queryCache.deleteOne({ queryHash });
    }
    
    return null;
  } catch (error) {
    console.error("❌ Failed to get query cache:", error.message);
    return null;
  }
}

/**
 * Save exact query cache result
 * @param {string} query - User query
 * @param {Object} serverContext - Server context
 * @param {Object} response - Response to cache
 * @returns {Promise<boolean>} Success status
 */
export async function saveQueryCache(query, serverContext = {}, response) {
  try {
    if (!db) {
      return false;
    }
    
    const memoryConfig = config.memory;
    if (!memoryConfig.queryCache.enabled) {
      return false;
    }
    
    const queryCache = db.collection(memoryConfig.queryCache.collectionName);
    const queryHash = generateQueryHash(query, serverContext);
    const ttlHours = memoryConfig.queryCache.ttlHours;
    const expiresAt = new Date(Date.now() + ttlHours * 3600 * 1000);
    
    await queryCache.replaceOne(
      { queryHash },
      {
        queryHash,
        query: query.substring(0, 200), // Store truncated query for debugging
        serverContext,
        response,
        expiresAt,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      { upsert: true }
    );
    
    console.log(`💾 Query cache saved (expires in ${ttlHours}h): "${query.substring(0, 50)}..."`);
    return true;
  } catch (error) {
    console.error("❌ Failed to save query cache:", error.message);
    return false;
  }
}

/**
 * Save conversation message (server-based memory)
 * @param {string} serverId - Server/Guild identifier
 * @param {string} query - User query
 * @param {Object} response - AI response
 * @param {Object} metadata - Additional metadata
 * @returns {Promise<string|null>} Conversation ID
 */
export async function saveConversation(serverId, query, response, metadata = {}) {
  try {
    if (!db) {
      console.log("⚠️ MongoDB not connected, skipping conversation save");
      return null;
    }
    
    const memoryConfig = config.memory;
    if (!memoryConfig.conversation.enabled) {
      return null;
    }
    
    const conversations = db.collection(memoryConfig.conversation.collectionName);
    const ttlDays = memoryConfig.conversation.ttlDays;
    const expiresAt = new Date(Date.now() + ttlDays * 86400 * 1000);
    
    const conversation = {
      serverId,
      query,
      response: {
        answer: response.answer || response,
        sources: response.sources || [],
        timestamp: response.timestamp || new Date().toISOString()
      },
      metadata: {
        ...metadata,
        timestamp: new Date(),
        resultCount: metadata.resultCount || 0,
        rerankingEnabled: metadata.rerankingEnabled || false
      },
      expiresAt
    };
    
    const result = await conversations.insertOne(conversation);
    console.log(`💾 Saved conversation for server ${serverId}`);
    
    // Enforce message limit per server (delete oldest if exceeded)
    await enforceMessageLimit(serverId, memoryConfig.conversation.messageLimit);
    
    return result.insertedId.toString();
  } catch (error) {
    console.error("❌ Failed to save conversation:", error.message);
    return null;
  }
}

/**
 * Enforce message limit per server (keep only last N messages)
 * @param {string} serverId - Server identifier
 * @param {number} limit - Maximum number of messages to keep
 */
async function enforceMessageLimit(serverId, limit) {
  try {
    const memoryConfig = config.memory;
    const conversations = db.collection(memoryConfig.conversation.collectionName);
    
    // Get count of messages for this server
    const count = await conversations.countDocuments({ serverId });
    
    if (count > limit) {
      // Get oldest messages beyond limit
      const oldestMessages = await conversations
        .find({ serverId })
        .sort({ 'metadata.timestamp': 1 })
        .limit(count - limit)
        .toArray();
      
      if (oldestMessages.length > 0) {
        const idsToDelete = oldestMessages.map(msg => msg._id);
        await conversations.deleteMany({ _id: { $in: idsToDelete } });
        console.log(`🗑️ Removed ${oldestMessages.length} old conversation(s) for server ${serverId} (limit: ${limit})`);
      }
    }
  } catch (error) {
    console.error("❌ Failed to enforce message limit:", error.message);
  }
}

/**
 * Get conversation history for a server
 * @param {string} serverId - Server identifier
 * @param {number} limit - Number of recent conversations to retrieve
 * @returns {Promise<Array>} Conversation history
 */
export async function getConversationHistory(serverId, limit = null) {
  try {
    if (!db) {
      return [];
    }
    
    const memoryConfig = config.memory;
    if (!memoryConfig.conversation.enabled) {
      return [];
    }
    
    const conversations = db.collection(memoryConfig.conversation.collectionName);
    const messageLimit = limit || memoryConfig.conversation.messageLimit;
    
    const history = await conversations
      .find({ serverId })
      .sort({ 'metadata.timestamp': -1 })
      .limit(messageLimit)
      .toArray();
    
    // Return in chronological order (oldest first) for conversation flow
    return history.reverse().map(msg => ({
      query: msg.query,
      response: msg.response,
      timestamp: msg.metadata.timestamp,
      metadata: msg.metadata
    }));
  } catch (error) {
    console.error("❌ Failed to get conversation history:", error.message);
    return [];
  }
}

/**
 * Get server context
 * @param {string} serverId - Server identifier
 * @returns {Promise<Object|null>} Server context
 */
export async function getServerContext(serverId) {
  try {
    if (!db) {
      return null;
    }
    
    const memoryConfig = config.memory;
    if (!memoryConfig.serverContext.enabled) {
      return null;
    }
    
    const contexts = db.collection(memoryConfig.serverContext.collectionName);
    const context = await contexts.findOne({ serverId });
    
    return context ? { ...context, serverId: undefined } : null; // Remove serverId from response
  } catch (error) {
    console.error("❌ Failed to get server context:", error.message);
    return null;
  }
}

/**
 * Save server context
 * @param {string} serverId - Server identifier
 * @param {Object} context - Server context (type, size, purpose, etc.)
 * @returns {Promise<boolean>} Success status
 */
export async function saveServerContext(serverId, context) {
  try {
    if (!db) {
      return false;
    }
    
    const memoryConfig = config.memory;
    if (!memoryConfig.serverContext.enabled) {
      return false;
    }
    
    const contexts = db.collection(memoryConfig.serverContext.collectionName);
    
    const serverContext = {
      serverId,
      ...context,
      updatedAt: new Date()
    };
    
    await contexts.replaceOne(
      { serverId },
      serverContext,
      { upsert: true }
    );
    
    console.log(`💾 Saved server context for server ${serverId}`);
    return true;
  } catch (error) {
    console.error("❌ Failed to save server context:", error.message);
    return false;
  }
}

/**
 * Close MongoDB connection
 */
export async function closeMongoConnection() {
  if (client) {
    await client.close();
    console.log("🔌 MongoDB connection closed");
  }
}

export { db };
