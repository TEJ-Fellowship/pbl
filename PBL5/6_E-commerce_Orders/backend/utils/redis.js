const redis = require('redis');
const { REDIS_HOST, REDIS_PORT, REDIS_PASSWORD, NODE_ENV } = require('./config');

// Connection state tracking
let isConnected = false;
let connectionAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;
const RECONNECT_DELAY = 2000; // 2 seconds

// Create Redis client optimized for local setup
// For local Redis/Memurai, we don't need password
const redisClient = redis.createClient({
  socket: {
    host: REDIS_HOST || 'localhost',
    port: REDIS_PORT || 6379,
    reconnectStrategy: (retries) => {
      if (retries > MAX_RECONNECT_ATTEMPTS) {
        console.error('❌ Redis: Max reconnection attempts reached. Please check if Redis/Memurai is running.');
        return new Error('Max reconnection attempts reached');
      }
      // Exponential backoff: 2s, 4s, 8s, etc., max 10s
      const delay = Math.min(RECONNECT_DELAY * Math.pow(2, retries), 10000);
      console.log(`🔄 Redis: Reconnecting in ${delay}ms (attempt ${retries + 1}/${MAX_RECONNECT_ATTEMPTS})...`);
      return delay;
    }
  },
  // Password is optional (not needed for local Redis/Memurai)
  password: REDIS_PASSWORD || undefined
});

// Handle connection events
redisClient.on('connect', () => {
  console.log('🔄 Redis: Connecting to local Redis/Memurai...');
  connectionAttempts = 0;
});

redisClient.on('error', (err) => {
  isConnected = false;
  // Don't spam errors in production, but log in development
  if (NODE_ENV === 'development') {
    console.error('❌ Redis client error:', err.message);
  }
  // If it's a connection error, provide helpful message
  if (err.code === 'ECONNREFUSED' || err.message.includes('connect')) {
    console.error('❌ Redis: Connection refused. Please ensure Memurai/Redis is running on', 
      `${REDIS_HOST || 'localhost'}:${REDIS_PORT || 6379}`);
    console.error('💡 Tip: Check if Memurai service is running: Get-Service | Where-Object {$_.Name -like "*memurai*"}');
  }
});

redisClient.on('ready', () => {
  isConnected = true;
  connectionAttempts = 0;
  console.log('✅ Redis: Connected and ready (local Redis/Memurai)');
});

redisClient.on('reconnecting', () => {
  isConnected = false;
  connectionAttempts++;
  console.log(`🔄 Redis: Reconnecting... (attempt ${connectionAttempts})`);
});

redisClient.on('end', () => {
  isConnected = false;
  console.log('⚠️  Redis: Connection ended');
});

// Listen for disconnect event (fires when server stops)
redisClient.on('disconnect', () => {
  isConnected = false;
  console.log('⚠️  Redis: Disconnected from server');
});

// Listen for socket close (fires when connection is actually closed)
redisClient.on('close', () => {
  isConnected = false;
  console.log('⚠️  Redis: Socket closed');
});

// Connect to Redis with error handling
const connectRedis = async () => {
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
      // Verify connection with ping after connecting
      try {
        await redisClient.ping();
        isConnected = true;
      } catch (pingErr) {
        // Ping failed immediately after connect - server might be down
        isConnected = false;
        if (NODE_ENV === 'development') {
          console.error('❌ Redis ping failed after connection:', pingErr.message);
        }
      }
    } else {
      // Connection already open, verify it's actually working
      try {
        await redisClient.ping();
        isConnected = true;
      } catch (pingErr) {
        // Connection appears open but ping fails - server stopped
        isConnected = false;
        if (NODE_ENV === 'development') {
          console.warn('⚠️  Redis connection appears open but ping failed - server may be stopped');
        }
      }
    }
  } catch (err) {
    isConnected = false;
    console.error('❌ Failed to connect to Redis:', err.message);
    // Don't throw - allow app to continue without Redis (graceful degradation)
    if (NODE_ENV === 'development') {
      console.warn('⚠️  Warning: App will continue without Redis caching. Some features may be slower.');
    }
  }
};

// Initialize connection
connectRedis();

// =====================================================
// CACHE UTILITIES
// =====================================================

/**
 * Check if Redis is connected and ready
 * Checks both socket state and our tracked connection state
 * Note: This is a synchronous check - for actual verification, use ping()
 */
const isRedisReady = () => {
  try {
    // Check both: socket must be open AND we must have confirmed connection
    // When server stops, socket might still appear open until next operation fails
    // So we check both isOpen AND our isConnected flag (updated on events)
    if (!redisClient.isOpen) {
      isConnected = false; // Sync state
      return false;
    }
    // Also verify we're actually connected (not just socket open)
    // The isConnected flag is updated immediately on disconnect/error events
    // If flag is false, connection is not ready even if socket appears open
    return isConnected === true;
  } catch (error) {
    // If any error checking state, assume not ready
    isConnected = false;
    return false;
  }
};

/**
 * Get cached value
 */
const getCache = async (key) => {
  try {
    // Check connection before attempting operation
    if (!isRedisReady()) {
      if (NODE_ENV === 'development') {
        console.warn(`⚠️  Redis not connected, skipping cache get for key: ${key}`);
      }
      return null;
    }
    const value = await redisClient.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    // Graceful degradation: if Redis fails, return null (cache miss)
    if (NODE_ENV === 'development') {
      console.error(`Cache get error for key ${key}:`, error.message);
    }
    return null;
  }
};

/**
 * Set cached value with TTL
 */
const setCache = async (key, value, ttlSeconds = 3600) => {
  try {
    // Check connection before attempting operation
    if (!isRedisReady()) {
      if (NODE_ENV === 'development') {
        console.warn(`⚠️  Redis not connected, skipping cache set for key: ${key}`);
      }
      return false;
    }
    await redisClient.setEx(key, ttlSeconds, JSON.stringify(value));
    return true;
  } catch (error) {
    // Graceful degradation: if Redis fails, return false (cache write failed, but app continues)
    if (NODE_ENV === 'development') {
      console.error(`Cache set error for key ${key}:`, error.message);
    }
    return false;
  }
};

/**
 * Delete cached value
 */
const deleteCache = async (key) => {
  try {
    if (!isRedisReady()) {
      return false;
    }
    await redisClient.del(key);
    return true;
  } catch (error) {
    if (NODE_ENV === 'development') {
      console.error(`Cache delete error for key ${key}:`, error.message);
    }
    return false;
  }
};

/**
 * Delete cache by pattern
 */
const deleteCachePattern = async (pattern) => {
  try {
    if (!isRedisReady()) {
      return false;
    }
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
    return true;
  } catch (error) {
    if (NODE_ENV === 'development') {
      console.error(`Cache delete pattern error for ${pattern}:`, error.message);
    }
    return false;
  }
};

// =====================================================
// SHOPPING CART UTILITIES
// =====================================================

/**
 * Get user cart
 */
const getCart = async (sessionId) => {
  try {
    if (!isRedisReady()) {
      // Return empty cart if Redis is not available
      return {};
    }
    const cartKey = `cart:${sessionId}`;
    const cart = await redisClient.hGetAll(cartKey);
    if (!cart || Object.keys(cart).length === 0) {
      return {};
    }
    // Convert string values to objects
    const parsedCart = {};
    for (const [productId, itemJson] of Object.entries(cart)) {
      try {
        parsedCart[productId] = JSON.parse(itemJson);
      } catch (e) {
        // Skip invalid JSON
        continue;
      }
    }
    return parsedCart;
  } catch (error) {
    if (NODE_ENV === 'development') {
      console.error(`Cart get error for session ${sessionId}:`, error.message);
    }
    return {};
  }
};

/**
 * Add item to cart
 */
const addToCart = async (sessionId, productId, quantity, productData) => {
  try {
    if (!isRedisReady()) {
      return false;
    }
    const cartKey = `cart:${sessionId}`;
    const item = {
      productId,
      quantity,
      price: productData.price,
      title: productData.title,
      image: productData.thumbnail_url || productData.image_url,
      addedAt: new Date().toISOString()
    };
    await redisClient.hSet(cartKey, productId, JSON.stringify(item));
    // Set TTL to 7 days
    await redisClient.expire(cartKey, 7 * 24 * 60 * 60);
    return true;
  } catch (error) {
    if (NODE_ENV === 'development') {
      console.error(`Cart add error:`, error.message);
    }
    return false;
  }
};

/**
 * Update cart item quantity
 */
const updateCartItem = async (sessionId, productId, quantity) => {
  try {
    if (!isRedisReady()) {
      return false;
    }
    const cartKey = `cart:${sessionId}`;
    if (quantity <= 0) {
      await redisClient.hDel(cartKey, productId);
    } else {
      const itemJson = await redisClient.hGet(cartKey, productId);
      if (itemJson) {
        const item = JSON.parse(itemJson);
        item.quantity = quantity;
        await redisClient.hSet(cartKey, productId, JSON.stringify(item));
      }
    }
    return true;
  } catch (error) {
    if (NODE_ENV === 'development') {
      console.error(`Cart update error:`, error.message);
    }
    return false;
  }
};

/**
 * Remove item from cart
 */
const removeFromCart = async (sessionId, productId) => {
  try {
    if (!isRedisReady()) {
      return false;
    }
    const cartKey = `cart:${sessionId}`;
    await redisClient.hDel(cartKey, productId);
    return true;
  } catch (error) {
    if (NODE_ENV === 'development') {
      console.error(`Cart remove error:`, error.message);
    }
    return false;
  }
};

/**
 * Clear entire cart
 */
const clearCart = async (sessionId) => {
  try {
    if (!isRedisReady()) {
      return false;
    }
    const cartKey = `cart:${sessionId}`;
    await redisClient.del(cartKey);
    return true;
  } catch (error) {
    if (NODE_ENV === 'development') {
      console.error(`Cart clear error:`, error.message);
    }
    return false;
  }
};

// =====================================================
// INVENTORY LOCK UTILITIES
// =====================================================

/**
 * Reserve inventory (atomic operation using Lua script)
 */
const reserveInventory = async (productId, quantity, orderId) => {
  try {
    if (!isRedisReady()) {
      return { success: false, error: 'REDIS_NOT_CONNECTED' };
    }
    
    const lockKey = `inventory_lock:${productId}`;
    const inventoryKey = `inventory:${productId}`;
    
    // Lua script for atomic check-and-decrement
    // Returns: 1 for success, or error code as number
    const luaScript = `
      local available = redis.call('GET', KEYS[1])
      if not available then
        return {0, 'INVENTORY_NOT_CACHED', 0}
      end
      available = tonumber(available)
      local requested = tonumber(ARGV[1])
      if available >= requested then
        redis.call('DECRBY', KEYS[1], requested)
        redis.call('SADD', KEYS[2], ARGV[2])
        redis.call('EXPIRE', KEYS[2], 600)
        return {1, available - requested}
      else
        return {0, 'INSUFFICIENT_STOCK', available}
      end
    `;
    
    // Ensure quantity is a number
    const quantityNum = typeof quantity === 'number' ? quantity : parseInt(quantity, 10);
    if (isNaN(quantityNum) || quantityNum <= 0) {
      console.error(`Invalid quantity for reserveInventory: ${quantity}`);
      return { success: false, error: 'INVALID_QUANTITY' };
    }
    
    if (NODE_ENV === 'development') {
      console.log(`Reserving inventory: productId=${productId}, quantity=${quantityNum}, orderId=${orderId}`);
      console.log(`Redis keys: inventoryKey=${inventoryKey}, lockKey=${lockKey}`);
    }
    
    const result = await redisClient.eval(
      luaScript,
      {
        keys: [inventoryKey, lockKey],
        arguments: [quantityNum.toString(), orderId]
      }
    );
    
    if (NODE_ENV === 'development') {
      console.log(`Lua script result for product ${productId}:`, result);
    }
    
    // Result format: [success_code, ...]
    // success_code: 1 = success, 0 = error
    if (Array.isArray(result) && result.length > 0) {
      const successCode = result[0];
      
      // Handle both string and number success codes
      if (successCode === 1 || successCode === '1') {
        // Success: [1, remaining]
        const remaining = result[1] || 0;
        if (NODE_ENV === 'development') {
          console.log(`Reservation successful. Remaining: ${remaining}`);
        }
        return { 
          success: true, 
          remaining: typeof remaining === 'number' ? remaining : parseInt(remaining, 10) || 0
        };
      } else if (successCode === 0 || successCode === '0') {
        // Error: [0, error_type, available]
        const errorType = result[1] || 'UNKNOWN_ERROR';
        const available = result[2] || 0;
        if (NODE_ENV === 'development') {
          console.log(`Reservation failed. Error: ${errorType}, Available: ${available}`);
        }
        return { 
          success: false, 
          error: errorType, 
          available: typeof available === 'number' ? available : parseInt(available, 10) || 0
        };
      }
    }
    
    // If result is not in expected format, log it for debugging
    console.error(`Unexpected reserveInventory result format for product ${productId}:`, JSON.stringify(result));
    return { success: false, error: 'UNKNOWN_RESULT_FORMAT', result: result };
  } catch (error) {
    console.error(`Inventory reserve error for product ${productId}:`, error);
    return { success: false, error: error.message || 'REDIS_ERROR' };
  }
};

/**
 * Release inventory (on payment failure or timeout)
 */
const releaseInventory = async (productId, quantity, orderId) => {
  try {
    if (!isRedisReady()) {
      return { success: false, error: 'REDIS_NOT_CONNECTED' };
    }
    
    const lockKey = `inventory_lock:${productId}`;
    const inventoryKey = `inventory:${productId}`;
    
    // Use pipeline for atomic operations
    const pipeline = redisClient.multi();
    pipeline.incrBy(inventoryKey, quantity);
    pipeline.sRem(lockKey, orderId);
    await pipeline.exec();
    
    return { success: true };
  } catch (error) {
    if (NODE_ENV === 'development') {
      console.error(`Inventory release error:`, error.message);
    }
    return { success: false, error: error.message };
  }
};

/**
 * Sync inventory from database to Redis
 */
const syncInventoryToCache = async (productId, quantity) => {
  try {
    if (!isRedisReady()) {
      return false;
    }
    const inventoryKey = `inventory:${productId}`;
    await redisClient.setEx(inventoryKey, 300, quantity.toString()); // 5-minute TTL
    return true;
  } catch (error) {
    if (NODE_ENV === 'development') {
      console.error(`Inventory sync error:`, error.message);
    }
    return false;
  }
};

/**
 * Get cached inventory
 */
const getCachedInventory = async (productId) => {
  try {
    if (!isRedisReady()) {
      return null;
    }
    const inventoryKey = `inventory:${productId}`;
    const quantity = await redisClient.get(inventoryKey);
    return quantity ? parseInt(quantity, 10) : null;
  } catch (error) {
    if (NODE_ENV === 'development') {
      console.error(`Inventory get error:`, error.message);
    }
    return null;
  }
};

module.exports = {
  redisClient,
  isRedisReady,
  // Cache utilities
  getCache,
  setCache,
  deleteCache,
  deleteCachePattern,
  // Cart utilities
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  // Inventory utilities
  reserveInventory,
  releaseInventory,
  syncInventoryToCache,
  getCachedInventory
};

