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

// Redis key patterns
const FEED_KEY = (userId) => `feed:user:${userId}`;
const MAX_FEED_SIZE = 100; // Keep only last 100 posts in Redis
const FEED_TTL = 7 * 24 * 60 * 60; // 7 days in seconds

/**
 * Add a post to a user's feed in Cassandra (source of truth)
 * @param {number} userId - User ID whose feed to update
 * @param {string} postId - Post UUID string
 * @param {Date} createdAt - Post creation timestamp
 */
export const addPostToFeed = async (userId, postId, createdAt) => {
  const postIdUuid = types.Uuid.fromString(postId);
  const userIdInt = parseInt(userId);

  const query = `
    INSERT INTO ${KEYSPACE}.feeds_by_user (user_id, created_at, post_id)
    VALUES (?, ?, ?)
  `;

  await cassandraClient.execute(query, [userIdInt, createdAt, postIdUuid], {
    prepare: true,
  });
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
  // Get all followers of the user who posted
  const followers = await Follow.findAll({
    where: {
      following_id: userId, // People who follow this user
    },
    attributes: ["follower_id"],
  });

  console.log(
    `📤 Fan-out: Adding post ${postId} to ${followers.length} followers' feeds`
  );

  // Add post to each follower's feed in Cassandra (source of truth)
  const cassandraPromises = followers.map((follow) =>
    addPostToFeed(follow.follower_id, postId, createdAt)
  );

  // Use Redis pipelining for batch writes (much faster!)
  const score = createdAt.getTime();
  const feedKeys = followers.map((follow) => FEED_KEY(follow.follower_id));

  console.time(`[PIPELINE] Batch add to ${feedKeys.length} feeds`);
  try {
    await batchAddPostToFeeds(feedKeys, score, postId, MAX_FEED_SIZE, FEED_TTL);
    console.timeEnd(`[PIPELINE] Batch add to ${feedKeys.length} feeds`);
  } catch (error) {
    console.error("⚠️ Error in Redis pipelining:", error.message);
    // Fallback to individual writes if pipelining fails
    console.log("⚠️ Falling back to individual Redis writes...");
    const redisPromises = followers.map((follow) =>
      addPostToFeedRedis(follow.follower_id, postId, createdAt)
    );
    await Promise.all(redisPromises);
  }

  // Execute Cassandra writes in parallel
  await Promise.all(cassandraPromises);

  // IMPORTANT: Invalidate all followers' response caches so new post appears immediately
  // This ensures cached responses are cleared and feed will be rebuilt with new post
  // OPTIMIZATION: Only invalidate response cache (not feed cache which is already updated)
  // Use batch invalidation for better performance (single Lua script vs N individual DELs)
  if (followers.length > 0) {
    try {
      const followerIds = followers.map((follow) => follow.follower_id);
      const deletedCount = await batchInvalidateResponseCaches(followerIds);
      console.log(
        `🗑️ Batch invalidated ${deletedCount} response cache keys for ${followers.length} followers`
      );
    } catch (error) {
      console.error(
        `⚠️ Failed to batch invalidate response caches:`,
        error.message
      );
      // Fallback to individual invalidation if batch fails
      const invalidationPromises = followers.map((follow) =>
        invalidateFeedCache(follow.follower_id).catch((err) =>
          console.error(
            `⚠️ Failed to invalidate cache for follower ${follow.follower_id}:`,
            err.message
          )
        )
      );
      await Promise.all(invalidationPromises);
    }
  }

  return followers.length;
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
      console.log(`ℹ️ No existing posts to backfill for user ${followingId}`);
      return 0;
    }

    console.log(
      `📥 Backfilling ${existingPosts.length} posts from user ${followingId} to follower ${followerId}'s feed`
    );

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
      console.log(
        `ℹ️ All posts from user ${followingId} are already in follower ${followerId}'s feed`
      );
      return 0;
    }

    console.log(
      `📥 Adding ${postsToAdd.length} missing posts from user ${followingId} to follower ${followerId}'s feed`
    );

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

    console.log(
      `✅ Backfilled ${postsToAdd.length} posts to user ${followerId}'s feed and invalidated response cache`
    );

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
 * Ensure all posts from all followed users are in the feed
 * This is called when retrieving a feed to ensure completeness
 * @param {number} userId - User ID whose feed to check
 * @returns {number} Number of posts backfilled
 */
export const ensureAllPostsInFeed = async (userId) => {
  try {
    // Get all users that this user follows
    const following = await Follow.findAll({
      where: {
        follower_id: userId,
      },
      attributes: ["following_id"],
    });

    if (following.length === 0) {
      return 0;
    }

    // Get current feed to see what's already there
    const currentFeed = await getFeedFromCassandra(userId, 1000); // Get all posts
    const existingPostIds = new Set(
      currentFeed.map((item) => item.post_id.toString())
    );

    let totalBackfilled = 0;

    // For each followed user, check if all their posts are in the feed
    for (const follow of following) {
      const followingId = follow.following_id;

      // Get all posts from this followed user
      const userPosts = await postService.getPostsByUser(followingId);

      if (userPosts.length === 0) {
        continue;
      }

      // Find posts that are missing from the feed
      const missingPosts = userPosts.filter(
        (post) => !existingPostIds.has(post.id.toString())
      );

      if (missingPosts.length > 0) {
        console.log(
          `📥 Found ${missingPosts.length} missing posts from user ${followingId} in user ${userId}'s feed, backfilling...`
        );

        // Add missing posts to feed
        const cassandraPromises = missingPosts.map((post) =>
          addPostToFeed(userId, post.id, post.created_at)
        );

        const redisPromises = missingPosts.map((post) =>
          addPostToFeedRedis(userId, post.id, post.created_at)
        );

        await Promise.all([...cassandraPromises, ...redisPromises]);

        // Update existingPostIds to avoid duplicates in next iteration
        missingPosts.forEach((post) => existingPostIds.add(post.id.toString()));

        totalBackfilled += missingPosts.length;
      }
    }

    if (totalBackfilled > 0) {
      console.log(
        `✅ Backfilled ${totalBackfilled} missing posts to user ${userId}'s feed`
      );
      // Invalidate cache so new posts appear
      await invalidateFeedCache(userId);

      // IMPORTANT: Rebuild Redis cache with all posts from Cassandra
      // This ensures Redis has the complete feed after backfill
      try {
        const allFeedItems = await getFeedFromCassandra(userId, MAX_FEED_SIZE);
        if (allFeedItems.length > 0) {
          await warmUpCache(userId, allFeedItems);
          console.log(
            `✅ Rebuilt Redis cache for user ${userId} with ${allFeedItems.length} posts`
          );
        }
      } catch (error) {
        console.error(
          `⚠️ Error rebuilding Redis cache after backfill:`,
          error.message
        );
      }
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
      console.log(`ℹ️ No posts to remove for user ${unfollowedId}`);
      return 0;
    }

    console.log(
      `🗑️ Removing ${postsToRemove.length} posts from user ${unfollowedId} in follower ${followerId}'s feed`
    );

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

    console.log(
      `✅ Removed ${postsToRemove.length} posts from user ${followerId}'s feed and invalidated response cache`
    );

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
      console.log(
        `✅ [CACHE HIT] Feed cache for user ${userId} - ${
          result.length / 2
        } posts found`
      );

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

  console.log(
    `🔍 [CASSANDRA] Querying feed for user ${userId} with limit ${limitInt}`
  );

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

  console.log(
    `🔍 [CASSANDRA] Query returned ${result.rows.length} rows for user ${userId}`
  );

  const feedItems = result.rows.map((row) => ({
    post_id: row.post_id.toString(),
    created_at: row.created_at,
  }));

  console.log(
    `📊 [CASSANDRA] Retrieved ${feedItems.length} feed items for user ${userId} from Cassandra`
  );

  // If we got fewer than limit, check total count (without limit)
  if (feedItems.length < limitInt) {
    const countQuery = `
      SELECT COUNT(*) as total
      FROM ${KEYSPACE}.feeds_by_user 
      WHERE user_id = ?
    `;
    try {
      const countResult = await cassandraClient.execute(
        countQuery,
        [userIdInt],
        { prepare: true }
      );
      const total = countResult.rows[0]?.total?.toNumber() || 0;
      console.log(
        `🔍 [CASSANDRA] Total posts in feed for user ${userId}: ${total} (returned ${feedItems.length})`
      );
    } catch (err) {
      console.error(`Error getting total count:`, err.message);
    }
  }

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
    console.log(
      `✅ [CACHE HIT] User ${userId} feed - returning ${cachedFeed.length} posts from Redis`
    );
    // Still check and backfill missing posts asynchronously (don't block response)
    ensureAllPostsInFeed(userId).catch((err) =>
      console.error(`Background backfill failed:`, err)
    );
    return cachedFeed;
  }

  // Cache miss or partial - get from Cassandra
  if (cachedFeed && cachedFeed.length > 0) {
    console.log(
      `⚠️ [CACHE PARTIAL] User ${userId} feed - only ${cachedFeed.length}/${limit} posts in cache, fetching from Cassandra`
    );
  } else {
    console.log(
      `❌ [CACHE MISS] User ${userId} feed - fetching from Cassandra`
    );
  }

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
      console.log(
        `✅ [CACHE HIT] Feed + Posts for user ${userId} - ${feedItems.length} posts found in single LUA call`
      );

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
      console.log(
        `✅ [CACHE HIT] Complete feed response for user ${userId} (fastest path)`
      );
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

    console.log(
      `🗑️ Invalidated feed cache and response cache for user ${userId}`
    );
  } catch (error) {
    console.error(
      `⚠️ Cache invalidation error for user ${userId}:`,
      error.message
    );
  }
};
