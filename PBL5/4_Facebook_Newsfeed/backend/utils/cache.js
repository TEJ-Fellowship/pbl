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
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
    return true;
  } catch (error) {
    console.error(`Cache delete pattern error for ${pattern}:`, error);
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
const appendToFeedCache = async (key, newPost, maxLength = 100, ttl = REDIS_TTL_DEFAULT) => {
  try {
    if (!redisClient.isOpen) return false;
    
    // Get existing feed from cache
    const existingFeed = await getCache(key);
    
    if (!existingFeed || !Array.isArray(existingFeed.posts)) {
      // If no cache exists, create new array with just this post
      await setCache(key, { posts: [newPost], lastUpdated: new Date().toISOString() }, ttl);
      return true;
    }
    
    // Check if post already exists (prevent duplicates)
    const postExists = existingFeed.posts.some(p => p.id === newPost.id);
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
const appendMultipleToFeedCache = async (key, newPosts, maxLength = 100, ttl = REDIS_TTL_DEFAULT) => {
  try {
    if (!redisClient.isOpen) return false;
    
    const existingFeed = await getCache(key);
    
    if (!existingFeed || !Array.isArray(existingFeed.posts)) {
      await setCache(key, { posts: newPosts, lastUpdated: new Date().toISOString() }, ttl);
      return true;
    }
    
    // Filter out duplicates and merge
    const existingPostIds = new Set(existingFeed.posts.map(p => p.id));
    const uniqueNewPosts = newPosts.filter(p => !existingPostIds.has(p.id));
    
    // Prepend new posts
    existingFeed.posts = [...uniqueNewPosts, ...existingFeed.posts];
    
    // Trim to maxLength
    if (existingFeed.posts.length > maxLength) {
      existingFeed.posts = existingFeed.posts.slice(0, maxLength);
    }
    
    existingFeed.lastUpdated = new Date().toISOString();
    await setCache(key, existingFeed, ttl);
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

module.exports = {
  getCache,
  setCache,
  deleteCache,
  deletePattern,
  appendToFeedCache,
  appendMultipleToFeedCache,
  getLastFetchTime,
  setLastFetchTime,
};