//sequelize feed service
import { sequelize } from "../config/db.js";
import { Post } from "../models/index.js";
import { redisClient } from "../config/db.js";
import { Follow } from "../models/index.js";
import * as postService from "./postService.js";
import {
  addPostToFeedWithLua,
  getFeedWithTTL,
  removePostsFromFeedWithLua,
  warmUpFeedCacheWithLua,
  batchAddPostToFeeds,
  getCachedFeedResponse,
  batchInvalidateResponseCaches,
} from "./redisLuaScripts.js";
import { FEED_CONFIG } from "../config/constants.js";

// Redis key patterns
const FEED_KEY = (userId) => `feed:user:${userId}`;
const IDEMPOTENCY_KEY = (userId, postId) =>
  `fanout:idempotency:${userId}:${postId}`;
const MAX_FEED_SIZE = 100; // Top 100 posts per user in Redis
const FEED_TTL = FEED_CONFIG.FEED_TTL;
const FANOUT_BATCH_SIZE = FEED_CONFIG.FANOUT_BATCH_SIZE;

/**
 * Add a post to a user's feed in Redis only
 * @param {number} userId - User ID whose feed to update
 * @param {string} postId - Post UUID string
 * @param {Date} createdAt - Post creation timestamp
 */
export const addPostToFeedRedis = async (userId, postId, createdAt) => {
  try {
    const redisKey = FEED_KEY(userId);
    const score = createdAt.getTime(); // Convert to milliseconds for sorting

    // Use LUA script for atomic ZADD + ZREMRANGEBYRANK + EXPIRE
    // This keeps only the top 100 posts (MAX_FEED_SIZE)
    await addPostToFeedWithLua(
      redisKey,
      score,
      postId,
      MAX_FEED_SIZE,
      FEED_TTL
    );
  } catch (error) {
    console.error(
      `⚠️ Redis feed write error for user ${userId}:`,
      error.message
    );
    throw error; // Re-throw so Kafka retry mechanism can handle it
  }
};

/**
 * Fan-out: Add post to all followers' feeds in Redis only
 * This is called by Kafka consumer after post creation
 * @param {number} userId - User who created the post
 * @param {string} postId - Post UUID string
 * @param {Date} createdAt - Post creation timestamp
 */
export const fanOutToFollowers = async (userId, postId, createdAt) => {
  try {
    // Validate inputs
    if (!userId || !postId) {
      throw new Error("userId and postId are required");
    }

    // Validate and normalize createdAt
    let validCreatedAt;
    if (createdAt instanceof Date) {
      validCreatedAt = createdAt;
    } else if (typeof createdAt === "string") {
      validCreatedAt = new Date(createdAt);
    } else {
      validCreatedAt = new Date();
    }

    if (isNaN(validCreatedAt.getTime())) {
      console.error(
        `⚠️ Invalid createdAt date: ${createdAt}, using current time`
      );
      validCreatedAt = new Date();
    }

    // Get all followers of the user who posted
    const followers = await Follow.findAll({
      where: {
        following_id: userId,
      },
      attributes: ["follower_id"],
    });

    if (followers.length === 0) {
      return;
    }

    // Calculate score safely
    const score = validCreatedAt.getTime();
    if (!Number.isFinite(score) || score < 0) {
      console.error(
        `⚠️ Invalid score calculated: ${score}, using current time`
      );
      validCreatedAt = new Date();
    }

    const followerIds = followers.map((follow) => follow.follower_id);
    const totalFollowers = followerIds.length;

    // Process in batches to prevent OOM with large follower lists
    const batches = [];
    for (let i = 0; i < followerIds.length; i += FANOUT_BATCH_SIZE) {
      batches.push(followerIds.slice(i, i + FANOUT_BATCH_SIZE));
    }

    console.log(
      `📊 [FAN-OUT] Processing ${totalFollowers} followers in ${batches.length} batches`
    );

    // Process each batch sequentially to prevent memory issues
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      const feedKeys = batch.map((id) => FEED_KEY(id));

      try {
        // Batch update Redis feeds
        await batchAddPostToFeeds(
          feedKeys,
          score,
          postId,
          MAX_FEED_SIZE,
          FEED_TTL
        ).catch((err) => {
          console.error(
            `⚠️ Redis batch update failed for batch ${batchIndex + 1}:`,
            err.message
          );
          // Fallback to individual writes
          return Promise.allSettled(
            batch.map((followerId) =>
              addPostToFeedRedis(followerId, postId, validCreatedAt)
            )
          );
        });

        // CRITICAL: Invalidate response caches AFTER adding post to feed
        // This ensures the next request will get fresh data from Redis feed
        const invalidationResult = await batchInvalidateResponseCaches(batch);
        console.log(
          `🗑️ [CACHE] Invalidated response caches for ${invalidationResult} users in batch ${
            batchIndex + 1
          }`
        );

        console.log(
          `✅ [FAN-OUT] Batch ${batchIndex + 1}/${batches.length} completed (${
            batch.length
          } followers)`
        );
      } catch (error) {
        console.error(
          `❌ [FAN-OUT] Error processing batch ${batchIndex + 1}:`,
          error.message
        );
        // Continue with next batch - don't fail entire fan-out
      }
    }

    console.log(
      `✅ [FAN-OUT] Completed fan-out to ${totalFollowers} followers`
    );
  } catch (error) {
    console.error(`❌ [FAN-OUT] Critical error:`, error.message, error.stack);
    throw error; // Re-throw so Kafka retry mechanism can handle it
  }
};

/**
 * Backfill: Add all existing posts from a user to a follower's feed in Redis
 * Used when a new user follows someone who already has posts
 * @param {number} followerId - User who just started following
 * @param {number} followingId - User being followed
 */
export const backfillFeedOnFollow = async (followerId, followingId) => {
  try {
    // Get all existing posts from the user being followed (from PostgreSQL)
    const existingPosts = await postService.getPostsByUser(followingId);

    if (existingPosts.length === 0) {
      return 0;
    }

    // Get current feed from Redis to check which posts are already there
    const currentFeed = await getFeedFromRedis(followerId, MAX_FEED_SIZE);
    const existingPostIds = new Set(
      currentFeed.map((item) => item.post_id.toString())
    );

    // Filter out posts that are already in the feed
    const postsToAdd = existingPosts.filter(
      (post) => !existingPostIds.has(post.id.toString())
    );

    if (postsToAdd.length === 0) {
      return 0;
    }

    // Add missing posts to follower's feed in Redis
    const redisPromises = postsToAdd.map((post) =>
      addPostToFeedRedis(followerId, post.id, post.created_at)
    );

    await Promise.all(redisPromises);

    // Invalidate cached response so new posts appear immediately
    await invalidateFeedCache(followerId);

    return postsToAdd.length;
  } catch (error) {
    console.error(
      `⚠️ Error backfilling feed for follower ${followerId}:`,
      error.message
    );
    throw error;
  }
};

/**
 * Remove all posts from a specific user from a follower's feed in Redis
 * Used when a user unfollows someone
 * @param {number} followerId - User who unfollowed
 * @param {number} unfollowedId - User who was unfollowed
 */
export const removePostsFromFeedOnUnfollow = async (
  followerId,
  unfollowedId
) => {
  try {
    // Get all posts from the unfollowed user (from PostgreSQL)
    const postsToRemove = await postService.getPostsByUser(unfollowedId);

    if (postsToRemove.length === 0) {
      return 0;
    }

    const postIds = postsToRemove.map((post) => post.id);

    // Remove posts from Redis cache using LUA script (atomic batch operation)
    const redisKey = FEED_KEY(followerId);
    await removePostsFromFeedWithLua(redisKey, postIds);

    // Clear idempotency markers for removed posts
    const idempotencyDeletePromises = postIds.map(async (postId) => {
      try {
        const idempotencyKey = IDEMPOTENCY_KEY(followerId, postId);
        await redisClient.del(idempotencyKey);
      } catch (error) {
        // Non-critical - log but don't fail
        console.error(
          `⚠️ Error clearing idempotency marker for post ${postId}:`,
          error.message
        );
      }
    });
    await Promise.allSettled(idempotencyDeletePromises);

    // Invalidate cached response
    await invalidateFeedCache(followerId);

    return postsToRemove.length;
  } catch (error) {
    console.error(
      `⚠️ Error removing posts from feed for follower ${followerId}:`,
      error.message
    );
    throw error;
  }
};

/**
 * Get user's feed from Redis (top 100 posts)
 * @param {number} userId - User ID
 * @param {number} limit - Maximum number of posts to return
 * @returns {Array} Array of post IDs with timestamps
 */
export const getFeedFromRedis = async (userId, limit = 20) => {
  try {
    const redisKey = FEED_KEY(userId);
    const limitInt = parseInt(limit);

    // Use LUA script for atomic ZREVRANGE + EXPIRE
    const result = await getFeedWithTTL(redisKey, 0, limitInt - 1, FEED_TTL);

    if (result && result.length > 0) {
      // Cache hit! TTL already refreshed by LUA script
      // Parse result: [value1, score1, value2, score2, ...]
      const feedItems = [];
      for (let i = 0; i < result.length; i += 2) {
        feedItems.push({
          post_id: result[i],
          created_at: new Date(parseInt(result[i + 1])), // Convert milliseconds back to Date
        });
      }

      return feedItems;
    }

    return [];
  } catch (error) {
    console.error(
      `⚠️ Redis feed read error for user ${userId}:`,
      error.message
    );
    return [];
  }
};

/**
 * Get user's feed from PostgreSQL with cursor-based pagination
 * Used when requesting posts beyond the first 100 (Redis limit)
 * @param {number} userId - User ID
 * @param {number} limit - Maximum number of posts to return
 * @param {Date} cursor - Cursor timestamp (posts before this date)
 * @returns {Array} Array of posts
 */
export const getFeedFromPostgres = async (
  userId,
  limit = 20,
  cursor = null
) => {
  try {
    const userIdInt = parseInt(userId);
    const limitInt = parseInt(limit);

    // Get all users that this user follows
    const following = await Follow.findAll({
      where: {
        follower_id: userIdInt,
      },
      attributes: ["following_id"],
    });

    if (following.length === 0) {
      return [];
    }

    const followingIds = following.map((f) => f.following_id);

    // Build query with cursor-based pagination
    const whereClause = {
      user_id: followingIds,
    };

    if (cursor) {
      whereClause.created_at = {
        [sequelize.Op.lt]: cursor, // Less than cursor (older posts)
      };
    }

    const posts = await Post.findAll({
      where: whereClause,
      order: [["created_at", "DESC"]],
      limit: limitInt,
    });

    return posts.map((post) => ({
      id: post.id,
      user_id: post.user_id,
      caption: post.caption,
      image_url: post.image_url,
      likes_count: post.likes_count,
      comments_count: post.comments_count,
      created_at: post.created_at,
    }));
  } catch (error) {
    console.error(
      `⚠️ PostgreSQL feed read error for user ${userId}:`,
      error.message
    );
    return [];
  }
};

/**
 * Rebuild user's feed in Redis from PostgreSQL
 * Used when Redis feed is empty (cache miss)
 * @param {number} userId - User ID
 */
export const rebuildFeedFromPostgres = async (userId) => {
  try {
    // Get all users that this user follows
    const following = await Follow.findAll({
      where: {
        follower_id: userId,
      },
      attributes: ["following_id"],
    });

    if (following.length === 0) {
      return [];
    }

    const followingIds = following.map((f) => f.following_id);

    // Get top 100 posts from followed users (ordered by created_at DESC)
    const posts = await Post.findAll({
      where: {
        user_id: followingIds,
      },
      order: [["created_at", "DESC"]],
      limit: MAX_FEED_SIZE,
    });

    if (posts.length === 0) {
      return [];
    }

    // Convert posts to feed items format
    const feedItems = posts.map((post) => ({
      post_id: post.id,
      created_at: post.created_at,
    }));

    // Warm up Redis cache with these posts
    await warmUpCache(userId, feedItems);

    return feedItems;
  } catch (error) {
    console.error(
      `⚠️ Error rebuilding feed from PostgreSQL for user ${userId}:`,
      error.message
    );
    return [];
  }
};

/**
 * Warm up Redis cache with feed data
 * @param {number} userId - User ID
 * @param {Array} feedItems - Array of {post_id, created_at}
 */
export const warmUpCache = async (userId, feedItems) => {
  if (!feedItems || feedItems.length === 0) return;

  try {
    const redisKey = FEED_KEY(userId);
    // Use LUA script for atomic batch operation (ZADD + ZREMRANGEBYRANK + EXPIRE)
    await warmUpFeedCacheWithLua(redisKey, FEED_TTL, MAX_FEED_SIZE, feedItems);
  } catch (error) {
    console.error(`⚠️ Cache warm-up error for user ${userId}:`, error.message);
  }
};

/**
 * Get user's feed (hybrid: Redis first 100, PostgreSQL for beyond 100)
 * @param {number} userId - User ID
 * @param {number} limit - Maximum number of posts to return
 * @param {Date} cursor - Cursor for pagination (optional)
 * @returns {Array} Array of posts
 */
export const getFeed = async (userId, limit = 20, cursor = null) => {
  const limitInt = parseInt(limit);

  // If requesting more than 100 posts or using cursor, query PostgreSQL
  if (limitInt > MAX_FEED_SIZE || cursor) {
    return await getFeedFromPostgres(userId, limitInt, cursor);
  }

  // Try Redis first (top 100 posts)
  const cachedFeed = await getFeedFromRedis(userId, limitInt);

  if (cachedFeed && cachedFeed.length > 0) {
    // Cache hit - get post details from PostgreSQL
    const postIds = cachedFeed.map((item) => item.post_id);
    const posts = await postService.getPostsByIds(postIds);

    // Return posts in the same order as feed
    const postsMap = new Map(posts.map((post) => [post.id, post]));
    return cachedFeed
      .map((item) => postsMap.get(item.post_id))
      .filter((post) => post !== undefined);
  }

  // Cache miss - rebuild from PostgreSQL
  const feedItems = await rebuildFeedFromPostgres(userId);

  if (feedItems.length === 0) {
    return [];
  }

  // Get post details from PostgreSQL
  const postIds = feedItems.map((item) => item.post_id);
  const posts = await postService.getPostsByIds(postIds);

  // Return posts in the same order as feed
  const postsMap = new Map(posts.map((post) => [post.id, post]));
  return feedItems
    .map((item) => postsMap.get(item.post_id))
    .filter((post) => post !== undefined);
};

/**
 * Get cached feed response (pre-serialized JSON) - fastest path
 * @param {number} userId - User ID
 * @param {number} limit - Maximum number of posts (for logging)
 * @returns {Array|null} Cached feed posts array or null if not cached
 */
export const getFeedResponseFromCache = async (userId, limit = 20) => {
  try {
    const redisKey = FEED_KEY(userId);
    const cached = await getCachedFeedResponse(redisKey, FEED_TTL);

    if (cached) {
      return JSON.parse(cached);
    }

    return null;
  } catch (error) {
    console.error(
      `⚠️ Error getting cached feed response for user ${userId}:`,
      error.message
    );
    return null;
  }
};

/**
 * Invalidate user's feed cache (e.g., on unfollow)
 * @param {number} userId - User ID
 */
export const invalidateFeedCache = async (userId) => {
  try {
    const redisKey = FEED_KEY(userId);
    const cachedResponseKey = `${redisKey}:response`;

    // Delete both feed cache and response cache
    await Promise.all([
      redisClient.del(redisKey),
      redisClient.del(cachedResponseKey),
    ]);
  } catch (error) {
    console.error(
      `⚠️ Cache invalidation error for user ${userId}:`,
      error.message
    );
  }
};
