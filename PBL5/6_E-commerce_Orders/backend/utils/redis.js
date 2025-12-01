const Redis = require("ioredis");
const {
  REDIS_HOST,
  REDIS_PORT,
  REDIS_PASSWORD,
  NODE_ENV,
} = require("./config");

// Connection state tracking
let isConnected = false;
let connectionAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;
const RECONNECT_DELAY = 2000; // 2 seconds

// Create Redis cluster/connection pool optimized for 1K users
// ioredis automatically handles connection pooling with maxRetriesPerRequest
// For 1K concurrent users, we need proper connection management
const redisClient = new Redis({
  host: REDIS_HOST || "localhost",
  port: REDIS_PORT || 6379,
  password: REDIS_PASSWORD || undefined,
  // Connection pool settings for high concurrency (1K users)
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => {
    if (times > MAX_RECONNECT_ATTEMPTS) {
      console.error("❌ Redis: Max reconnection attempts reached.");
      return null; // Stop retrying
    }
    // Exponential backoff: 2s, 4s, 8s, etc., max 10s
    const delay = Math.min(RECONNECT_DELAY * Math.pow(2, times - 1), 10000);
    if (NODE_ENV === "development") {
      console.log(
        `🔄 Redis: Reconnecting in ${delay}ms (attempt ${times}/${MAX_RECONNECT_ATTEMPTS})...`
      );
    }
    return delay;
  },
  // Enable offline queue for better resilience
  enableOfflineQueue: true,
  // Connection options optimized for 1K users
  connectTimeout: 10000,
  lazyConnect: false,
  // Keep alive settings
  keepAlive: 30000,
  // Connection pool size (ioredis manages this automatically, but we can hint)
  // For 1K concurrent users, ioredis will create multiple connections as needed
  family: 4, // Use IPv4
  // Enable command queue for better throughput
  enableReadyCheck: true,
  // Optimize for high throughput
  maxLoadingTimeout: 5000,
});

// Handle connection events
redisClient.on("connect", () => {
  connectionAttempts = 0;
  if (NODE_ENV === "development") {
    console.log("🔄 Redis: Connecting to Docker Redis...");
  }
});

redisClient.on("ready", () => {
  isConnected = true;
  connectionAttempts = 0;
  console.log(
    "✅ Redis: Connected and ready (ioredis with connection pooling)"
  );
});

redisClient.on("error", (err) => {
  isConnected = false;
  if (NODE_ENV === "development") {
    console.error("❌ Redis client error:", err.message);
  }
  if (err.code === "ECONNREFUSED" || err.message.includes("connect")) {
    console.error(
      "❌ Redis: Connection refused. Please ensure Docker Redis is running on",
      `${REDIS_HOST || "localhost"}:${REDIS_PORT || 6379}`
    );
    console.error("💡 Tip: Start Redis with: docker compose up -d");
  }
});

redisClient.on("close", () => {
  isConnected = false;
  if (NODE_ENV === "development") {
    console.log("⚠️  Redis: Connection closed");
  }
});

redisClient.on("reconnecting", (delay) => {
  isConnected = false;
  connectionAttempts++;
  if (NODE_ENV === "development") {
    console.log(
      `🔄 Redis: Reconnecting... (attempt ${connectionAttempts}, delay: ${delay}ms)`
    );
  }
});

// In-memory fallback store for cart (last resort if Redis completely fails)
const memoryCartStore = new Map();
const MEMORY_CART_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

// =====================================================
// RETRY UTILITY WITH EXPONENTIAL BACKOFF
// =====================================================

/**
 * Retry function with exponential backoff
 */
const retryWithBackoff = async (fn, maxRetries = 3, baseDelay = 100) => {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries - 1) {
        throw error;
      }
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
};

// =====================================================
// CACHE UTILITIES
// =====================================================

/**
 * Check if Redis is connected and ready
 */
const isRedisReady = () => {
  try {
    return redisClient.status === "ready" && isConnected;
  } catch (error) {
    isConnected = false;
    return false;
  }
};

/**
 * Get cached value with retry
 */
const getCache = async (key) => {
  try {
    if (!isRedisReady()) {
      return null;
    }
    const value = await retryWithBackoff(async () => {
      return await redisClient.get(key);
    });
    return value ? JSON.parse(value) : null;
  } catch (error) {
    if (NODE_ENV === "development") {
      console.error(`Cache get error for key ${key}:`, error.message);
    }
    isConnected = false;
    return null;
  }
};

/**
 * Set cached value with TTL and retry
 */
const setCache = async (key, value, ttlSeconds = 3600) => {
  try {
    if (!isRedisReady()) {
      return false;
    }
    await retryWithBackoff(async () => {
      return await redisClient.setex(key, ttlSeconds, JSON.stringify(value));
    });
    if (NODE_ENV === "development") {
      console.log(`✅ Cached key: ${key} (TTL: ${ttlSeconds}s)`);
    }
    return true;
  } catch (error) {
    if (NODE_ENV === "development") {
      console.error(`Cache set error for key ${key}:`, error.message);
    }
    isConnected = false;
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
    if (NODE_ENV === "development") {
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
      await redisClient.del(...keys);
    }
    return true;
  } catch (error) {
    if (NODE_ENV === "development") {
      console.error(
        `Cache delete pattern error for ${pattern}:`,
        error.message
      );
    }
    return false;
  }
};

// =====================================================
// SHOPPING CART UTILITIES WITH FALLBACK
// =====================================================

/**
 * Get user cart (Redis with memory fallback)
 */
const getCart = async (sessionId) => {
  try {
    if (isRedisReady()) {
      const cartKey = `cart:${sessionId}`;
      const cart = await retryWithBackoff(async () => {
        return await redisClient.hgetall(cartKey);
      });

      if (!cart || Object.keys(cart).length === 0) {
        // Check memory fallback
        if (memoryCartStore.has(sessionId)) {
          const memoryCart = memoryCartStore.get(sessionId);
          if (Date.now() < memoryCart.expiresAt) {
            return memoryCart.data;
          }
          memoryCartStore.delete(sessionId);
        }
        return {};
      }

      // Convert string values to objects
      const parsedCart = {};
      for (const [productId, itemJson] of Object.entries(cart)) {
        try {
          parsedCart[productId] = JSON.parse(itemJson);
        } catch (e) {
          if (NODE_ENV === "development") {
            console.warn(
              `⚠️  Invalid cart item JSON for product ${productId}:`,
              e.message
            );
          }
          continue;
        }
      }
      return parsedCart;
    } else {
      // Redis not available, use memory fallback
      if (memoryCartStore.has(sessionId)) {
        const memoryCart = memoryCartStore.get(sessionId);
        if (Date.now() < memoryCart.expiresAt) {
          return memoryCart.data;
        }
        memoryCartStore.delete(sessionId);
      }
      return {};
    }
  } catch (error) {
    if (NODE_ENV === "development") {
      console.error(`Cart get error for session ${sessionId}:`, error.message);
    }
    // Fallback to memory
    if (memoryCartStore.has(sessionId)) {
      const memoryCart = memoryCartStore.get(sessionId);
      if (Date.now() < memoryCart.expiresAt) {
        return memoryCart.data;
      }
    }
    return {};
  }
};

/**
 * Add item to cart (Redis with memory fallback)
 */
const addToCart = async (sessionId, productId, quantity, productData) => {
  try {
    const item = {
      productId,
      quantity,
      price: productData.price,
      title: productData.title,
      image: productData.thumbnail_url || productData.image_url,
      addedAt: new Date().toISOString(),
    };

    if (isRedisReady()) {
      const cartKey = `cart:${sessionId}`;
      await retryWithBackoff(async () => {
        await redisClient.hset(cartKey, productId, JSON.stringify(item));
        await redisClient.expire(cartKey, 7 * 24 * 60 * 60); // 7 days TTL
      });

      // Also update memory fallback
      if (!memoryCartStore.has(sessionId)) {
        memoryCartStore.set(sessionId, {
          data: {},
          expiresAt: Date.now() + MEMORY_CART_TTL,
        });
      }
      const memoryCart = memoryCartStore.get(sessionId);
      memoryCart.data[productId] = item;

      if (NODE_ENV === "development") {
        console.log(
          `✅ Added product ${productId} (qty: ${quantity}) to cart for session ${sessionId}`
        );
      }
      return true;
    } else {
      // Redis not available, use memory fallback
      if (!memoryCartStore.has(sessionId)) {
        memoryCartStore.set(sessionId, {
          data: {},
          expiresAt: Date.now() + MEMORY_CART_TTL,
        });
      }
      const memoryCart = memoryCartStore.get(sessionId);
      memoryCart.data[productId] = item;
      if (NODE_ENV === "development") {
        console.warn(`⚠️  Using memory fallback for cart (Redis unavailable)`);
      }
      return true;
    }
  } catch (error) {
    if (NODE_ENV === "development") {
      console.error(
        `❌ Cart add error for session ${sessionId}, product ${productId}:`,
        error.message
      );
    }
    // Try memory fallback on error
    try {
      if (!memoryCartStore.has(sessionId)) {
        memoryCartStore.set(sessionId, {
          data: {},
          expiresAt: Date.now() + MEMORY_CART_TTL,
        });
      }
      const memoryCart = memoryCartStore.get(sessionId);
      memoryCart.data[productId] = {
        productId,
        quantity,
        price: productData.price,
        title: productData.title,
        image: productData.thumbnail_url || productData.image_url,
        addedAt: new Date().toISOString(),
      };
      return true;
    } catch (fallbackError) {
      return false;
    }
  }
};

/**
 * Update cart item quantity
 */
const updateCartItem = async (sessionId, productId, quantity) => {
  try {
    if (isRedisReady()) {
      const cartKey = `cart:${sessionId}`;
      if (quantity <= 0) {
        await redisClient.hdel(cartKey, productId);
      } else {
        const itemJson = await redisClient.hget(cartKey, productId);
        if (itemJson) {
          const item = JSON.parse(itemJson);
          item.quantity = quantity;
          await redisClient.hset(cartKey, productId, JSON.stringify(item));
        }
      }
    }

    // Update memory fallback
    if (memoryCartStore.has(sessionId)) {
      const memoryCart = memoryCartStore.get(sessionId);
      if (quantity <= 0) {
        delete memoryCart.data[productId];
      } else if (memoryCart.data[productId]) {
        memoryCart.data[productId].quantity = quantity;
      }
    }

    return true;
  } catch (error) {
    if (NODE_ENV === "development") {
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
    if (isRedisReady()) {
      const cartKey = `cart:${sessionId}`;
      await redisClient.hdel(cartKey, productId);
    }

    // Update memory fallback
    if (memoryCartStore.has(sessionId)) {
      const memoryCart = memoryCartStore.get(sessionId);
      delete memoryCart.data[productId];
    }

    return true;
  } catch (error) {
    if (NODE_ENV === "development") {
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
    if (isRedisReady()) {
      const cartKey = `cart:${sessionId}`;
      await redisClient.del(cartKey);
    }

    // Clear memory fallback
    memoryCartStore.delete(sessionId);

    return true;
  } catch (error) {
    if (NODE_ENV === "development") {
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
      return { success: false, error: "REDIS_NOT_CONNECTED" };
    }

    const lockKey = `inventory_lock:${productId}`;
    const inventoryKey = `inventory:${productId}`;

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

    const quantityNum =
      typeof quantity === "number" ? quantity : parseInt(quantity, 10);
    if (isNaN(quantityNum) || quantityNum <= 0) {
      return { success: false, error: "INVALID_QUANTITY" };
    }

    const result = await redisClient.eval(
      luaScript,
      2,
      inventoryKey,
      lockKey,
      quantityNum.toString(),
      orderId
    );

    if (Array.isArray(result) && result.length > 0) {
      const successCode = result[0];
      if (successCode === 1 || successCode === "1") {
        const remaining = result[1] || 0;
        return {
          success: true,
          remaining:
            typeof remaining === "number"
              ? remaining
              : parseInt(remaining, 10) || 0,
        };
      } else if (successCode === 0 || successCode === "0") {
        const errorType = result[1] || "UNKNOWN_ERROR";
        const available = result[2] || 0;
        return {
          success: false,
          error: errorType,
          available:
            typeof available === "number"
              ? available
              : parseInt(available, 10) || 0,
        };
      }
    }

    return { success: false, error: "UNKNOWN_RESULT_FORMAT", result: result };
  } catch (error) {
    console.error(`Inventory reserve error for product ${productId}:`, error);
    return { success: false, error: error.message || "REDIS_ERROR" };
  }
};

/**
 * Release inventory
 */
const releaseInventory = async (productId, quantity, orderId) => {
  try {
    if (!isRedisReady()) {
      return { success: false, error: "REDIS_NOT_CONNECTED" };
    }

    const lockKey = `inventory_lock:${productId}`;
    const inventoryKey = `inventory:${productId}`;

    const pipeline = redisClient.pipeline();
    pipeline.incrby(inventoryKey, quantity);
    pipeline.srem(lockKey, orderId);
    await pipeline.exec();

    return { success: true };
  } catch (error) {
    if (NODE_ENV === "development") {
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
    await redisClient.setex(inventoryKey, 300, quantity.toString()); // 5-minute TTL
    return true;
  } catch (error) {
    if (NODE_ENV === "development") {
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
    if (NODE_ENV === "development") {
      console.error(`Inventory get error:`, error.message);
    }
    return null;
  }
};

/**
 * Ensure Redis is connected
 */
const ensureRedisConnected = async () => {
  if (isRedisReady()) {
    return true;
  }

  try {
    await redisClient.ping();
    isConnected = true;
    return true;
  } catch (err) {
    if (NODE_ENV === "development") {
      console.error("❌ Failed to ensure Redis connection:", err.message);
    }
    return false;
  }
};

// Connect to Redis on startup
const connectRedis = async () => {
  try {
    if (redisClient.status !== "ready") {
      await redisClient.connect();
    }
    await redisClient.ping();
    isConnected = true;
    if (NODE_ENV === "development") {
      console.log("✅ Redis: Connection established and verified");
    }
  } catch (err) {
    isConnected = false;
    console.error("❌ Failed to connect to Redis:", err.message);
    if (NODE_ENV === "development") {
      console.warn(
        "⚠️  Warning: App will continue without Redis caching. Some features may be slower."
      );
    }
  }
};

// Initialize connection
connectRedis().catch((err) => {
  console.error("❌ Redis connection initialization error:", err.message);
});

module.exports = {
  redisClient,
  isRedisReady,
  ensureRedisConnected,
  connectRedis,
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
  getCachedInventory,
};
