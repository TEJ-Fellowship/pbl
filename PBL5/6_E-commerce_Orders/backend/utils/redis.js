const redis = require('redis');
const { REDIS_HOST, REDIS_PORT, REDIS_PASSWORD } = require('./config');

// Create Redis client
const redisClient = redis.createClient({
  socket: {
    host: REDIS_HOST || 'localhost',
    port: REDIS_PORT || 6379
  },
  password: REDIS_PASSWORD || undefined
});

// Handle connection events
redisClient.on('connect', () => {
  console.log('✅ Redis client connecting...');
});

redisClient.on('error', (err) => {
  console.error('❌ Redis client error:', err.message);
});

redisClient.on('ready', () => {
  console.log('✅ Redis client ready');
});

redisClient.on('reconnecting', () => {
  console.log('🔄 Redis client reconnecting...');
});

// Connect to Redis
redisClient.connect().catch((err) => {
  console.error('❌ Failed to connect to Redis:', err.message);
});

// =====================================================
// CACHE UTILITIES
// =====================================================

/**
 * Get cached value
 */
const getCache = async (key) => {
  try {
    const value = await redisClient.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error(`Cache get error for key ${key}:`, error.message);
    return null;
  }
};

/**
 * Set cached value with TTL
 */
const setCache = async (key, value, ttlSeconds = 3600) => {
  try {
    await redisClient.setEx(key, ttlSeconds, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Cache set error for key ${key}:`, error.message);
    return false;
  }
};

/**
 * Delete cached value
 */
const deleteCache = async (key) => {
  try {
    await redisClient.del(key);
    return true;
  } catch (error) {
    console.error(`Cache delete error for key ${key}:`, error.message);
    return false;
  }
};

/**
 * Delete cache by pattern
 */
const deleteCachePattern = async (pattern) => {
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
    return true;
  } catch (error) {
    console.error(`Cache delete pattern error for ${pattern}:`, error.message);
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
    console.error(`Cart get error for session ${sessionId}:`, error.message);
    return {};
  }
};

/**
 * Add item to cart
 */
const addToCart = async (sessionId, productId, quantity, productData) => {
  try {
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
    console.error(`Cart add error:`, error.message);
    return false;
  }
};

/**
 * Update cart item quantity
 */
const updateCartItem = async (sessionId, productId, quantity) => {
  try {
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
    console.error(`Cart update error:`, error.message);
    return false;
  }
};

/**
 * Remove item from cart
 */
const removeFromCart = async (sessionId, productId) => {
  try {
    const cartKey = `cart:${sessionId}`;
    await redisClient.hDel(cartKey, productId);
    return true;
  } catch (error) {
    console.error(`Cart remove error:`, error.message);
    return false;
  }
};

/**
 * Clear entire cart
 */
const clearCart = async (sessionId) => {
  try {
    const cartKey = `cart:${sessionId}`;
    await redisClient.del(cartKey);
    return true;
  } catch (error) {
    console.error(`Cart clear error:`, error.message);
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
    const lockKey = `inventory_lock:${productId}`;
    const inventoryKey = `inventory:${productId}`;
    
    // Lua script for atomic check-and-decrement
    const luaScript = `
      local available = redis.call('GET', KEYS[1])
      if not available then
        return {err = 'INVENTORY_NOT_CACHED'}
      end
      available = tonumber(available)
      local requested = tonumber(ARGV[1])
      if available >= requested then
        redis.call('DECRBY', KEYS[1], requested)
        redis.call('SADD', KEYS[2], ARGV[2])
        redis.call('EXPIRE', KEYS[2], 600)
        return {ok = 1, remaining = available - requested}
      else
        return {err = 'INSUFFICIENT_STOCK', available = available}
      end
    `;
    
    const result = await redisClient.eval(
      luaScript,
      {
        keys: [inventoryKey, lockKey],
        arguments: [quantity.toString(), orderId]
      }
    );
    
    // Handle result (Lua returns as array or object depending on version)
    if (Array.isArray(result)) {
      if (result[0] === 'err') {
        return { 
          success: false, 
          error: result[1] || 'UNKNOWN_ERROR', 
          available: result[2] || 0 
        };
      }
      if (result[0] === 'ok') {
        return { success: true, remaining: result[1] || 0 };
      }
    }
    
    // Fallback: try to parse as object
    if (result && typeof result === 'object') {
      if (result.err) {
        return { 
          success: false, 
          error: result.err, 
          available: result.available || 0 
        };
      }
      if (result.ok) {
        return { success: true, remaining: result.remaining || 0 };
      }
    }
    
    return { success: false, error: 'UNKNOWN_RESULT' };
  } catch (error) {
    console.error(`Inventory reserve error:`, error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Release inventory (on payment failure or timeout)
 */
const releaseInventory = async (productId, quantity, orderId) => {
  try {
    const lockKey = `inventory_lock:${productId}`;
    const inventoryKey = `inventory:${productId}`;
    
    // Use pipeline for atomic operations
    const pipeline = redisClient.multi();
    pipeline.incrBy(inventoryKey, quantity);
    pipeline.sRem(lockKey, orderId);
    await pipeline.exec();
    
    return { success: true };
  } catch (error) {
    console.error(`Inventory release error:`, error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Sync inventory from database to Redis
 */
const syncInventoryToCache = async (productId, quantity) => {
  try {
    const inventoryKey = `inventory:${productId}`;
    await redisClient.setEx(inventoryKey, 300, quantity.toString()); // 5-minute TTL
    return true;
  } catch (error) {
    console.error(`Inventory sync error:`, error.message);
    return false;
  }
};

/**
 * Get cached inventory
 */
const getCachedInventory = async (productId) => {
  try {
    const inventoryKey = `inventory:${productId}`;
    const quantity = await redisClient.get(inventoryKey);
    return quantity ? parseInt(quantity, 10) : null;
  } catch (error) {
    console.error(`Inventory get error:`, error.message);
    return null;
  }
};

module.exports = {
  redisClient,
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

