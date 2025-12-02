import { cassandraClient, redisClient } from "../config/db.js";
import { KEYSPACE } from "../config/cassandra-schema.js";
import { types } from "cassandra-driver";
import { Follow } from "../models/index.js";
import * as postService from "./postService.js"; // Add this import
import {
  addPostToFeedWithLua,
  getFeedWithTTL,
  removePostsFromFeedWithLua,
  warmUpFeedCacheWithLua,
  batchAddPostToFeeds,
  getFeedWithPosts,
  getCachedFeedResponse,
  cacheFeedResponse,
  batchInvalidateResponseCaches,
} from "./redisLuaScripts.js";
import { FEED_CONFIG } from "../config/constants.js";

// Redis key patterns
const FEED_KEY = (userId) => `feed:user:${userId}`;
const IDEMPOTENCY_KEY = (userId, postId) =>
  `fanout:idempotency:${userId}:${postId}`;
const MAX_FEED_SIZE = FEED_CONFIG.MAX_FEED_SIZE;
const FEED_TTL = FEED_CONFIG.FEED_TTL;

/**
 * Check if a post is already in a user's feed (idempotency check)
 * @param {number} userId - User ID
 * @param {string} postId - Post UUID string
 * @returns {Promise<boolean>} True if post already exists in feed
 */
const isPostInFeed = async (userId, postId) => {
  try {
    // Check Redis idempotency key first (fastest)
    const idempotencyKey = IDEMPOTENCY_KEY(userId, postId);
    const exists = await redisClient.exists(idempotencyKey);
    if (exists) {
      return true;
    }

    // Check Cassandra (source of truth)
    const postIdUuid = types.Uuid.fromString(postId);
    const userIdInt = parseInt(userId);
    const query = `
      SELECT post_id 
      FROM ${KEYSPACE}.feeds_by_user 
      WHERE user_id = ? AND post_id = ? 
      LIMIT 1
    `;
    const result = await cassandraClient.execute(
      query,
      [userIdInt, postIdUuid],
      { prepare: true }
    );

    return result.rows.length > 0;
  } catch (error) {
    console.error(
      `⚠️ Error checking idempotency for user ${userId}, post ${postId}:`,
      error.message
    );
    // On error, assume not exists to allow write (fail open)
    return false;
  }
};

/**
 * Mark a post as added to feed (idempotency marker)
 * @param {number} userId - User ID
 * @param {string} postId - Post UUID string
 */
const markPostAdded = async (userId, postId) => {
  try {
    const idempotencyKey = IDEMPOTENCY_KEY(userId, postId);
    // Set with TTL matching feed TTL
    await redisClient.setEx(idempotencyKey, FEED_TTL, "1");
  } catch (error) {
    // Non-critical - log but don't fail
    console.error(
      `⚠️ Error setting idempotency marker for user ${userId}, post ${postId}:`,
      error.message
    );
  }
};

/**
 * Add a post to a user's feed in Cassandra (source of truth)
 * @param {number} userId - User ID whose feed to update
 * @param {string} postId - Post UUID string
 * @param {Date} createdAt - Post creation timestamp
 * @param {boolean} skipIdempotencyCheck - Skip idempotency check (for performance in batch)
 */
export const addPostToFeed = async (
  userId,
  postId,
  createdAt,
  skipIdempotencyCheck = false
) => {
  // Idempotency check
  if (!skipIdempotencyCheck) {
    const exists = await isPostInFeed(userId, postId);
    if (exists) {
      return;
    }
  }

  const postIdUuid = types.Uuid.fromString(postId);
  const userIdInt = parseInt(userId);

  const query = `
    INSERT INTO ${KEYSPACE}.feeds_by_user (user_id, created_at, post_id)
    VALUES (?, ?, ?)
  `;

  await cassandraClient.execute(query, [userIdInt, createdAt, postIdUuid], {
    prepare: true,
  });

  // Mark as added for idempotency
  await markPostAdded(userId, postId);
};

/**
 * Add a post to a user's feed in Redis (cache)
 * @param {number} userId - User ID whose feed to update
 * @param {string} postId - Post UUID string
 * @param {Date} createdAt - Post creation timestamp
 */
export const addPostToFeedRedis = async (userId, postId, createdAt) => {
  try {
    const redisKey = FEED_KEY(userId);
    const score = createdAt.getTime(); // Convert to milliseconds for sorting

    // Use LUA script for atomic ZADD + ZREMRANGEBYRANK + EXPIRE
    await addPostToFeedWithLua(
      redisKey,
      score,
      postId,
      MAX_FEED_SIZE,
      FEED_TTL
    );
  } catch (error) {
    // Log but don't fail - Redis is cache, Cassandra is source of truth
    console.error(
      `⚠️ Redis feed write error for user ${userId}:`,
      error.message
    );
  }
};

/**
 * Fan-out: Add post to all followers' feeds (both Cassandra and Redis)
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

    // Check if date is valid
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
      const now = Date.now();
      validCreatedAt = new Date(now);
    }

    const followerIds = followers.map((follow) => follow.follower_id);
    const feedKeys = followerIds.map((id) => FEED_KEY(id));

    // OPTIMIZATION: Do all operations in parallel batches
    // 1. Cassandra writes (source of truth)
    // 2. Redis cache updates
    // 3. Idempotency markers
    // 4. Cache invalidation

    const cassandraPromises = followerIds.map((followerId) =>
      addPostToFeed(followerId, postId, validCreatedAt, true).catch((err) => {
        console.error(
          `⚠️ Failed to add post to feed for follower ${followerId}:`,
          err.message
        );
        // Don't throw - continue with other followers
      })
    );

    // Execute all operations in parallel
    const [cassandraResults] = await Promise.allSettled([
      Promise.all(cassandraPromises),
    ]);

    // Check if any critical failures occurred
    if (cassandraResults.status === "rejected") {
      console.error(
        `❌ [CASSANDRA] Critical failure in fan-out:`,
        cassandraResults.reason?.message
      );
      throw cassandraResults.reason;
    }

    // Update Redis cache in parallel (non-blocking)
    Promise.all([
      // Batch Redis update
      batchAddPostToFeeds(
        feedKeys,
        score,
        postId,
        MAX_FEED_SIZE,
        FEED_TTL
      ).catch((err) => {
        console.error("⚠️ Redis batch update failed:", err.message);
        // Fallback to individual writes
        return Promise.allSettled(
          followerIds.map((followerId) =>
            addPostToFeedRedis(followerId, postId, validCreatedAt)
          )
        );
      }),
      // Mark idempotency (non-critical)
      Promise.allSettled(
        followerIds.map((followerId) => markPostAdded(followerId, postId))
      ),
      // Invalidate response caches
      batchInvalidateResponseCaches(followerIds).catch((err) => {
        console.error("⚠️ Cache invalidation failed:", err.message);
        return Promise.resolve(0);
      }),
    ]).catch((err) => {
      // Log but don't fail - these are cache operations
      console.error("⚠️ Non-critical cache operations failed:", err.message);
    });
  } catch (error) {
    console.error(`❌ [FAN-OUT] Critical error:`, error.message, error.stack);
    throw error; // Re-throw so Kafka retry mechanism can handle it
  }
};

/**
 * Backfill: Add all existing posts from a user to a follower's feed
 * Used when a new user follows someone who already has posts
 * @param {number} followerId - User who just started following
 * @param {number} followingId - User being followed
 */
export const backfillFeedOnFollow = async (followerId, followingId) => {
  try {
    // Get all existing posts from the user being followed
    const existingPosts = await postService.getPostsByUser(followingId);

    if (existingPosts.length === 0) {
      return 0;
    }

    // Get current feed to check which posts are already there
    const currentFeed = await getFeedFromCassandra(followerId, 1000); // Get all posts
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

    // Add missing posts to follower's feed in Cassandra
    const cassandraPromises = postsToAdd.map((post) =>
      addPostToFeed(followerId, post.id, post.created_at)
    );

    // Add missing posts to follower's feed in Redis
    const redisPromises = postsToAdd.map((post) =>
      addPostToFeedRedis(followerId, post.id, post.created_at)
    );

    await Promise.all([...cassandraPromises, ...redisPromises]);

    // IMPORTANT: Invalidate cached response so new posts appear immediately
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

// Cache for backfill status to avoid repeated work
const BACKFILL_STATUS_KEY = (userId) => `backfill:status:${userId}`;
const BACKFILL_STATUS_TTL = 3600; // 1 hour

/**
 * Check if backfill is needed for a user
 * @param {number} userId - User ID
 * @returns {Promise<boolean>} True if backfill is needed
 */
async function isBackfillNeeded(userId) {
  try {
    const status = await redisClient.get(BACKFILL_STATUS_KEY(userId));
    // If status exists and is recent, skip backfill
    return !status || status !== "completed";
  } catch (error) {
    // On error, assume backfill is needed (fail open)
    return true;
  }
}

/**
 * Mark backfill as completed for a user
 * @param {number} userId - User ID
 */
async function markBackfillCompleted(userId) {
  try {
    await redisClient.setEx(
      BACKFILL_STATUS_KEY(userId),
      BACKFILL_STATUS_TTL,
      "completed"
    );
  } catch (error) {
    // Non-critical
    console.error(`⚠️ Error marking backfill completed:`, error.message);
  }
}

/**
 * Ensure all posts from all followed users are in the feed
 * This is called when retrieving a feed to ensure completeness
 * OPTIMIZED: Only runs if backfill status indicates it's needed
 * @param {number} userId - User ID whose feed to check
 * @param {boolean} force - Force backfill even if status says completed
 * @returns {number} Number of posts backfilled
 */
export const ensureAllPostsInFeed = async (userId, force = false) => {
  try {
    // Check if backfill is needed (skip if recently completed)
    if (!force && !(await isBackfillNeeded(userId))) {
      return 0;
    }

    // Get all users that this user follows
    const following = await Follow.findAll({
      where: {
        follower_id: userId,
      },
      attributes: ["following_id"],
    });

    if (following.length === 0) {
      await markBackfillCompleted(userId);
      return 0;
    }

    // Get current feed to see what's already there (limited to recent posts)
    const currentFeed = await getFeedFromCassandra(userId, MAX_FEED_SIZE);
    const existingPostIds = new Set(
      currentFeed.map((item) => item.post_id.toString())
    );

    let totalBackfilled = 0;
    const followingIds = following.map((f) => f.following_id);

    // Batch process followed users (process in parallel)
    const backfillPromises = followingIds.map(async (followingId) => {
      try {
        // Get all posts from this followed user
        const userPosts = await postService.getPostsByUser(followingId);

        if (userPosts.length === 0) {
          return 0;
        }

        // Find posts that are missing from the feed
        const missingPosts = userPosts.filter(
          (post) => !existingPostIds.has(post.id.toString())
        );

        if (missingPosts.length > 0) {
          // Add missing posts to feed (batch operation)
          const cassandraPromises = missingPosts.map(
            (post) => addPostToFeed(userId, post.id, post.created_at, true) // Skip idempotency check for performance
          );

          const redisPromises = missingPosts.map((post) =>
            addPostToFeedRedis(userId, post.id, post.created_at)
          );

          await Promise.all([...cassandraPromises, ...redisPromises]);

          return missingPosts.length;
        }
        return 0;
      } catch (error) {
        console.error(
          `⚠️ Error backfilling posts from user ${followingId}:`,
          error.message
        );
        return 0;
      }
    });

    const results = await Promise.all(backfillPromises);
    totalBackfilled = results.reduce((sum, count) => sum + count, 0);

    if (totalBackfilled > 0) {
      // Invalidate cache so new posts appear
      await invalidateFeedCache(userId);

      // Rebuild Redis cache with all posts from Cassandra
      try {
        const allFeedItems = await getFeedFromCassandra(userId, MAX_FEED_SIZE);
        if (allFeedItems.length > 0) {
          await warmUpCache(userId, allFeedItems);
        }
      } catch (error) {
        console.error(
          `⚠️ Error rebuilding Redis cache after backfill:`,
          error.message
        );
      }
    } else {
      // Mark as completed if no backfill was needed
      await markBackfillCompleted(userId);
    }

    return totalBackfilled;
  } catch (error) {
    console.error(
      `⚠️ Error ensuring all posts in feed for user ${userId}:`,
      error.message
    );
    // Don't throw - just log, so feed retrieval can continue
    return 0;
  }
};

/**
 * Remove all posts from a specific user from a follower's feed
 * Used when a user unfollows someone
 * @param {number} followerId - User who unfollowed
 * @param {number} unfollowedId - User who was unfollowed
 */
export const removePostsFromFeedOnUnfollow = async (
  followerId,
  unfollowedId
) => {
  try {
    // Get all posts from the unfollowed user
    const postsToRemove = await postService.getPostsByUser(unfollowedId);

    if (postsToRemove.length === 0) {
      return 0;
    }

    const followerIdInt = parseInt(followerId);
    const postIds = postsToRemove.map((post) => post.id);

    // Remove posts from Cassandra feed
    const deletePromises = postIds.map(async (postId) => {
      const postIdUuid = types.Uuid.fromString(postId);
      const post = postsToRemove.find((p) => p.id === postId);

      // We need created_at to delete from feeds_by_user
      // Since the primary key is (user_id, created_at, post_id)
      const deleteQuery = `
        DELETE FROM ${KEYSPACE}.feeds_by_user 
        WHERE user_id = ? AND created_at = ? AND post_id = ?
      `;

      await cassandraClient.execute(
        deleteQuery,
        [followerIdInt, post.created_at, postIdUuid],
        { prepare: true }
      );
    });

    await Promise.all(deletePromises);

    // Remove posts from Redis cache using LUA script (atomic batch operation)
    const redisKey = FEED_KEY(followerId);
    await removePostsFromFeedWithLua(redisKey, postIds);

    // IMPORTANT: Also invalidate the cached response to prevent stale data
    // The cached response still contains the old posts, so we need to delete it
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
 * Get user's feed from Redis (cache-first)
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
 * Get user's feed from Cassandra (fallback)
 * @param {number} userId - User ID
 * @param {number} limit - Maximum number of posts to return
 * @returns {Array} Array of post IDs with timestamps
 */
export const getFeedFromCassandra = async (userId, limit = 20) => {
  const userIdInt = parseInt(userId);
  const limitInt = parseInt(limit);

  // Note: ORDER BY is not needed because table has CLUSTERING ORDER BY (created_at DESC)
  // But we'll add it explicitly for clarity and to ensure correct ordering
  const query = `
    SELECT post_id, created_at 
    FROM ${KEYSPACE}.feeds_by_user 
    WHERE user_id = ? 
    ORDER BY created_at DESC
    LIMIT ?
  `;

  const result = await cassandraClient.execute(query, [userIdInt, limitInt], {
    prepare: true,
  });

  const feedItems = result.rows.map((row) => ({
    post_id: row.post_id.toString(),
    created_at: row.created_at,
  }));

  // Removed COUNT(*) query - it's a Cassandra anti-pattern
  // COUNT(*) requires scanning all rows and is very expensive
  // If we need total count, track it separately or use a counter table

  return feedItems;
};

/**
 * Warm up Redis cache with feed data from Cassandra
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
 * Get user's feed (hybrid: Redis first, fallback to Cassandra)
 * @param {number} userId - User ID
 * @param {number} limit - Maximum number of posts to return
 * @returns {Array} Array of post IDs with timestamps
 */
export const getFeed = async (userId, limit = 20) => {
  // Try Redis first (cache)
  const cachedFeed = await getFeedFromRedis(userId, limit);

  if (cachedFeed && cachedFeed.length >= limit) {
    // Cache hit - return from Redis
    // Still check and backfill missing posts asynchronously (don't block response)
    ensureAllPostsInFeed(userId).catch((err) =>
      console.error(`Background backfill failed:`, err)
    );
    return cachedFeed;
  }

  // Cache miss or partial - get from Cassandra
  // Ensure all posts from followed users are in the feed before retrieving
  await ensureAllPostsInFeed(userId);

  const feedItems = await getFeedFromCassandra(userId, limit);

  // Warm up cache asynchronously (don't block response)
  if (feedItems.length > 0) {
    warmUpCache(userId, feedItems).catch((err) =>
      console.error(`Cache warm-up failed:`, err)
    );
  }

  return feedItems;
};

/**
 * Get feed with post details in one optimized LUA operation (atomic)
 * This reduces 2 network round-trips to 1 by combining feed retrieval and post fetching
 * @param {number} userId - User ID
 * @param {number} limit - Maximum number of posts to return
 * @returns {Object} { feedItems: [...], postsMap: Map<postId, post> }
 */
export const getFeedWithPostsFromRedis = async (userId, limit = 20) => {
  try {
    const redisKey = FEED_KEY(userId);
    const limitInt = parseInt(limit);

    // Use combined LUA script for atomic feed + posts retrieval
    const { feedItems, posts } = await getFeedWithPosts(
      redisKey,
      0,
      limitInt - 1,
      FEED_TTL
    );

    if (feedItems && feedItems.length > 0) {
      // Create posts map for quick lookup
      const postsMap = new Map(posts.map((post) => [post.id, post]));

      return {
        feedItems,
        postsMap,
      };
    }

    return { feedItems: [], postsMap: new Map() };
  } catch (error) {
    console.error(
      `⚠️ Redis feed+posts read error for user ${userId}:`,
      error.message
    );
    return { feedItems: [], postsMap: new Map() };
  }
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
