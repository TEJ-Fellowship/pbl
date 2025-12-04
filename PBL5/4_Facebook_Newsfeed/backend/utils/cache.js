const { redisClient } = require("../config/redis");
const { REDIS_TTL_DEFAULT } = require("./config");

// Basic cache operations
const getCache = async (key) => {
  try {
    if (!redisClient.isOpen) return null;
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error(`Cache get error for key ${key}:`, error);
    return null;
  }
};

const setCache = async (key, value, ttl = REDIS_TTL_DEFAULT) => {
  try {
    if (!redisClient.isOpen) return false;
    await redisClient.setEx(key, ttl, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Cache set error for key ${key}:`, error);
    return false;
  }
};

const deleteCache = async (key) => {
  try {
    if (!redisClient.isOpen) return false;
    await redisClient.del(key);
    return true;
  } catch (error) {
    console.error(`Cache delete error for key ${key}:`, error);
    return false;
  }
};

const deletePattern = async (pattern) => {
  try {
    if (!redisClient.isOpen) return false;

    // BETTER: Use SCAN instead of KEYS (non-blocking)
    const stream = redisClient.scanStream({
      match: pattern,
      count: 100,
    });

    const keysToDelete = [];

    stream.on("data", (keys) => {
      keysToDelete.push(...keys);
    });

    return new Promise((resolve, reject) => {
      stream.on("end", async () => {
        if (keysToDelete.length > 0) {
          // Delete in batches to avoid blocking
          const batchSize = 100;
          for (let i = 0; i < keysToDelete.length; i += batchSize) {
            const batch = keysToDelete.slice(i, i + batchSize);
            await redisClient.del(batch);
          }
        }
        resolve(true);
      });
      stream.on("error", reject);
    });
  } catch (error) {
    console.error(`Cache delete pattern error for ${pattern}:`, error);
    return false;
  }
};

/**
 * Track which cache keys exist for a user's posts
 * Uses Redis SET to efficiently track all cache keys for a user
 *
 * @param {number} user_id - User ID
 * @param {number} page - Page number
 * @param {number} ttl - Time to live in seconds (default: 600)
 */

const addUserPostCacheKey = async (user_id, page, ttl = 600) => {
  try {
    if (!redisClient.isOpen) return false;

    const key = `posts:user:${user_id}:page:${page}`;
    const setKey = `user_posts_cache:${user_id}`;

    // Add to set tracking all cache keys for this user
    await redisClient.sAdd(setKey, key);
    await redisClient.expire(setKey, ttl);

    return true;
  } catch (error) {
    console.error(
      `Error adding user post cache key for user ${user_id}:`,
      error
    );
    return false;
  }
};

/**
 * Efficiently delete all cached posts for a user using tracking set
 * Much faster than pattern matching with KEYS or SCAN!
 *
 * @param {number} user_id - User ID
 */
const deleteUserPostsCache = async (user_id) => {
  try {
    if (!redisClient.isOpen) return false;

    const setKey = `user_posts_cache:${user_id}`;
    const keys = await redisClient.sMembers(setKey);

    if (keys && keys.length > 0) {
      // Delete all cached post pages + the tracking set itself
      await redisClient.del([...keys, setKey]);
      console.log(
        `🗑️ Deleted ${keys.length} cached post keys for user ${user_id}`
      );
    }

    return true;
  } catch (error) {
    console.error(
      `Error deleting user posts cache for user ${user_id}:`,
      error
    );
    return false;
  }
};
// ============================================
// FEED CACHE TRACKING
// ============================================

/**
 * Track feed cache key for a user
 * Uses Redis SET to efficiently track feed cache keys
 *
 * @param {number} user_id - User ID
 * @param {number} ttl - Time to live in seconds (default: 600)
 */
const addFeedCacheKey = async (user_id, ttl = 600) => {
  try {
    if (!redisClient.isOpen) return false;

    const feedKey = `feed:user:${user_id}`;
    const setKey = `user_feed_cache:${user_id}`;

    // Add to set tracking feed cache key for this user
    await redisClient.sAdd(setKey, feedKey);
    await redisClient.expire(setKey, ttl);

    return true;
  } catch (error) {
    console.error(`Error adding feed cache key for user ${user_id}:`, error);
    return false;
  }
};

/**
 * Efficiently delete feed cache for a user using tracking set
 * Much faster than pattern matching with KEYS or SCAN!
 *
 * @param {number} user_id - User ID
 */
const deleteFeedCache = async (user_id) => {
  try {
    if (!redisClient.isOpen) return false;

    const setKey = `user_feed_cache:${user_id}`;
    const keys = await redisClient.sMembers(setKey);

    if (keys && keys.length > 0) {
      // Delete feed cache + the tracking set itself
      await redisClient.del([...keys, setKey]);
      console.log(
        `🗑️ Deleted ${keys.length} cached feed keys for user ${user_id}`
      );
    }

    return true;
  } catch (error) {
    console.error(`Error deleting feed cache for user ${user_id}:`, error);
    return false;
  }
};

/**
 * Delete feed caches for multiple users (batch operation)
 * Used when a post is liked/unliked - affects all users who have that post in their feed
 *
 * @param {Array<number>} user_ids - Array of user IDs
 */
const deleteMultipleFeedCaches = async (user_ids) => {
  try {
    if (!redisClient.isOpen || user_ids.length === 0) return false;

    const deletePromises = user_ids.map((user_id) => deleteFeedCache(user_id));
    await Promise.all(deletePromises);

    return true;
  } catch (error) {
    console.error(`Error deleting multiple feed caches:`, error);
    return false;
  }
};


// ============================================
// INCREMENTAL APPEND FUNCTIONS
// ============================================

/**
 * Append new post to cached feed (Incremental Append)
 * This is used for refresh scenarios - only add new posts, don't rebuild entire feed
 *
 * @param {string} key - Cache key (e.g., "feed:user:123")
 * @param {Object} newPost - New post to append
 * @param {number} maxLength - Maximum number of posts to keep (default: 100)
 * @param {number} ttl - Time to live in seconds
 */
const appendToFeedCache = async (
  key,
  newPost,
  maxLength = 100,
  ttl = REDIS_TTL_DEFAULT
) => {
  try {
    if (!redisClient.isOpen) return false;

    // Get existing feed from cache
    const existingFeed = await getCache(key);

    if (!existingFeed || !Array.isArray(existingFeed.posts)) {
      // If no cache exists, create new array with just this post
      await setCache(
        key,
        { posts: [newPost], lastUpdated: new Date().toISOString() },
        ttl
      );
      // ADD THIS: Track the feed cache key
  const userIdMatch = key.match(/feed:user:(\d+)/);
  if (userIdMatch) {
    const user_id = parseInt(userIdMatch[1]);
    await addFeedCacheKey(user_id, ttl);
  }
      return true;
    }

    // Check if post already exists (prevent duplicates)
    const postExists = existingFeed.posts.some((p) => p.id === newPost.id);
    if (postExists) {
      return true; // Post already in cache
    }

    // Prepend new post to beginning (newest first)
    existingFeed.posts.unshift(newPost);

    // Keep only the most recent posts (remove oldest if exceeds maxLength)
    if (existingFeed.posts.length > maxLength) {
      existingFeed.posts = existingFeed.posts.slice(0, maxLength);
    }

    // Update timestamp
    existingFeed.lastUpdated = new Date().toISOString();

    // Save back to cache
    await setCache(key, existingFeed, ttl);


    // Extract user_id from key (format: "feed:user:123")
    const userIdMatch = key.match(/feed:user:(\d+)/);
    if (userIdMatch) {
      const user_id = parseInt(userIdMatch[1]);
      await addFeedCacheKey(user_id, ttl);
    }
    
    return true;
  } catch (error) {
    console.error(`Append to feed cache error for key ${key}:`, error);
    return false;
  }
};

/**
 * Append multiple posts to cached feed (batch incremental append)
 * Used when multiple new posts need to be added at once
 */
const appendMultipleToFeedCache = async (
  key,
  newPosts,
  maxLength = 100,
  ttl = REDIS_TTL_DEFAULT
) => {
  try {
    if (!redisClient.isOpen) return false;

    const existingFeed = await getCache(key);

    if (!existingFeed || !Array.isArray(existingFeed.posts)) {
      await setCache(
        key,
        { posts: newPosts, lastUpdated: new Date().toISOString() },
        ttl
      );
      // ADD THIS: Track the feed cache key
      const userIdMatch = key.match(/feed:user:(\d+)/);
      if (userIdMatch) {
        const user_id = parseInt(userIdMatch[1]);
        await addFeedCacheKey(user_id, ttl);
      }
      return true;
    }

    // Filter out duplicates and merge
    const existingPostIds = new Set(existingFeed.posts.map((p) => p.id));
    const uniqueNewPosts = newPosts.filter((p) => !existingPostIds.has(p.id));

    // Prepend new posts
    existingFeed.posts = [...uniqueNewPosts, ...existingFeed.posts];

    // Trim to maxLength
    if (existingFeed.posts.length > maxLength) {
      existingFeed.posts = existingFeed.posts.slice(0, maxLength);
    }

    existingFeed.lastUpdated = new Date().toISOString();
    await setCache(key, existingFeed, ttl);

    // Extract user_id from key (format: "feed:user:123")
    const userIdMatch = key.match(/feed:user:(\d+)/);
    if (userIdMatch) {
      const user_id = parseInt(userIdMatch[1]);
      await addFeedCacheKey(user_id, ttl);
    }

    return true;
  } catch (error) {
    console.error(`Append multiple to feed cache error for key ${key}:`, error);
    return false;
  }
};

/**
 * Get last fetch timestamp for delta computation
 */
const getLastFetchTime = async (userId) => {
  try {
    const timestamp = await getCache(`last_fetch:user:${userId}`);
    return timestamp ? new Date(timestamp) : null;
  } catch (error) {
    return null;
  }
};

/**
 * Set last fetch timestamp
 */
const setLastFetchTime = async (userId, ttl = 300) => {
  try {
    await setCache(`last_fetch:user:${userId}`, new Date().toISOString(), ttl);
    return true;
  } catch (error) {
    return false;
  }
};

// Lua script defined once (not recreated every call)
const BATCH_APPEND_LUA_SCRIPT = `
  local postData = ARGV[1]
  local maxLength = tonumber(ARGV[2])
  local ttl = tonumber(ARGV[3])
  local currentTime = ARGV[4]
  local updatedCount = 0
  
  -- Parse post data ONCE (outside the loop)
  local newPost = cjson.decode(postData)
  local postId = tostring(newPost.id)
  
  -- Loop through all follower IDs (starting from ARGV[5])
  for i = 5, #ARGV do
    local followerId = ARGV[i]
    local feedKey = "feed:user:" .. followerId
    
    -- Get existing feed
    local existingFeedJson = redis.call("GET", feedKey)
    local feedData
    
    if existingFeedJson then
      feedData = cjson.decode(existingFeedJson)
    else
      feedData = {posts = {}, lastUpdated = currentTime}
    end
    
    -- Ensure posts array exists
    if not feedData.posts then
      feedData.posts = {}
    end
    
    -- Check if post already exists (prevent duplicates)
    local exists = false
    for j, post in ipairs(feedData.posts) do
      if tostring(post.id) == postId then
        exists = true
        break
      end
    end
    
    -- If post doesn't exist, add it
    if not exists then
      -- Prepend new post to beginning (newest first)
      table.insert(feedData.posts, 1, newPost)
      
      -- Trim to maxLength if needed
      if #feedData.posts > maxLength then
        -- Remove oldest posts (keep only first maxLength)
        local trimmed = {}
        for k = 1, maxLength do
          table.insert(trimmed, feedData.posts[k])
        end
        feedData.posts = trimmed
      end
      
      -- Update timestamp
      feedData.lastUpdated = currentTime
      
      -- Save back to Redis
      local updatedFeedJson = cjson.encode(feedData)
      redis.call("SETEX", feedKey, ttl, updatedFeedJson)
      updatedCount = updatedCount + 1
    end
  end
  
  return updatedCount
`;

// Cache for script SHA (loaded once)
let scriptSha = null;

/**
 * Load or get cached script SHA for EVALSHA
 */
const getScriptSha = async () => {
  if (scriptSha) return scriptSha;

  try {
    // Load script into Redis and get SHA
    scriptSha = await redisClient.scriptLoad(BATCH_APPEND_LUA_SCRIPT);
    console.log(
      `📜 Lua script loaded with SHA: ${scriptSha.substring(0, 8)}...`
    );
    return scriptSha;
  } catch (error) {
    console.error("Error loading Lua script:", error);
    return null;
  }
};

/**
 * Batch append post to multiple follower feeds using Lua script (optimized with EVALSHA)
 * This is much faster than individual appendToFeedCache calls
 *
 * @param {Array<number>} followerIds - Array of follower user IDs
 * @param {Object} newPost - New post to append to all feeds
 * @param {number} maxLength - Maximum number of posts to keep (default: 100)
 * @param {number} ttl - Time to live in seconds (default: 300)
 */
const batchAppendToFeedCache = async (
  followerIds,
  newPost,
  maxLength = 100,
  ttl = REDIS_TTL_DEFAULT
) => {
  try {
    if (!redisClient.isOpen || followerIds.length === 0) {
      return false;
    }

    const startTime = Date.now();

    // Get script SHA (loads once, then cached)
    const sha = await getScriptSha();
    if (!sha) {
      // Fallback to EVAL if script loading fails
      console.warn("⚠️ Falling back to EVAL (script load failed)");
      return await batchAppendToFeedCacheWithEval(
        followerIds,
        newPost,
        maxLength,
        ttl
      );
    }

    // Prepare arguments for Lua script
    const args = [
      JSON.stringify(newPost), // ARGV[1] - post data
      maxLength.toString(), // ARGV[2] - max length
      ttl.toString(), // ARGV[3] - TTL
      new Date().toISOString(), // ARGV[4] - current timestamp
      ...followerIds.map((id) => id.toString()), // ARGV[5+] - follower IDs
    ];

    // Execute using EVALSHA (much faster - script already cached in Redis)
    let result;
    try {
      result = await redisClient.evalSha(sha, {
        keys: [],
        arguments: args,
      });
    } catch (evalShaError) {
      // If script not found (e.g., Redis restarted), reload it
      if (evalShaError.message && evalShaError.message.includes("NOSCRIPT")) {
        console.log("🔄 Script not found, reloading...");
        scriptSha = null; // Reset cache
        const newSha = await getScriptSha();
        if (newSha) {
          result = await redisClient.evalSha(newSha, {
            keys: [],
            arguments: args,
          });
        } else {
          throw evalShaError;
        }
      } else {
        throw evalShaError;
      }
    }

    const endTime = Date.now();
    const executionTime = endTime - startTime;

    if (executionTime > 5) {
      console.log(
        `⏱️ Lua script (EVALSHA) took: ${executionTime}ms for ${followerIds.length} followers`
      );
    }
    if(result > 0) {
      const trackPromises = followerIds.map(id => addFeedCacheKey(id, ttl));
      await Promise.all(trackPromises);
    }

    return result > 0; // Return true if at least one feed was updated
  } catch (error) {
    console.error(`❌ Batch append to feed cache error:`, error);
    // Fallback to regular EVAL if EVALSHA fails
    console.log("⚠️ Falling back to EVAL");
    return await batchAppendToFeedCacheWithEval(
      followerIds,
      newPost,
      maxLength,
      ttl
    );
  }
};

/**
 * Fallback function using EVAL (if EVALSHA fails)
 */
const batchAppendToFeedCacheWithEval = async (
  followerIds,
  newPost,
  maxLength = 100,
  ttl = REDIS_TTL_DEFAULT
) => {
  try {
    const args = [
      JSON.stringify(newPost),
      maxLength.toString(),
      ttl.toString(),
      new Date().toISOString(),
      ...followerIds.map((id) => id.toString()),
    ];

    const result = await redisClient.eval(BATCH_APPEND_LUA_SCRIPT, {
      keys: [],
      arguments: args,
    });
    if(result > 0) {
      const trackPromises = followerIds.map(id => addFeedCacheKey(id, ttl));
      await Promise.all(trackPromises);
    }

    return result > 0;
  } catch (error) {
    console.error(`❌ EVAL fallback error:`, error);
    return false;
  }
};

module.exports = {
  getCache,
  setCache,
  deleteCache,
  deletePattern,
  appendToFeedCache,
  appendMultipleToFeedCache,
  batchAppendToFeedCache,
  getLastFetchTime,
  setLastFetchTime,
  addUserPostCacheKey,
  deleteUserPostsCache,
  addFeedCacheKey,
  deleteFeedCache,
  deleteMultipleFeedCaches,
};
