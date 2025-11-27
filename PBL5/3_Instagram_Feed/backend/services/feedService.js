import { cassandraClient, redisClient } from "../config/db.js";
import { KEYSPACE } from "../config/cassandra-schema.js";
import { types } from "cassandra-driver";
import { Follow } from "../models/index.js";
import * as postService from "./postService.js"; // Add this import

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

    // Add to sorted set
    await redisClient.zAdd(redisKey, {
      score: score,
      value: postId,
    });

    // Trim to keep only last MAX_FEED_SIZE posts (remove oldest)
    await redisClient.zRemRangeByRank(redisKey, 0, -(MAX_FEED_SIZE + 1));

    // Set TTL (refresh on each write)
    await redisClient.expire(redisKey, FEED_TTL);
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

  // Add post to each follower's feed in Redis (cache)
  const redisPromises = followers.map((follow) =>
    addPostToFeedRedis(follow.follower_id, postId, createdAt)
  );

  // Execute both in parallel
  await Promise.all([...cassandraPromises, ...redisPromises]);

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

    // Add all posts to follower's feed in Cassandra
    const cassandraPromises = existingPosts.map((post) =>
      addPostToFeed(followerId, post.id, post.created_at)
    );

    // Add all posts to follower's feed in Redis
    const redisPromises = existingPosts.map((post) =>
      addPostToFeedRedis(followerId, post.id, post.created_at)
    );

    await Promise.all([...cassandraPromises, ...redisPromises]);

    console.log(
      `✅ Backfilled ${existingPosts.length} posts to user ${followerId}'s feed`
    );

    return existingPosts.length;
  } catch (error) {
    console.error(
      `⚠️ Error backfilling feed for follower ${followerId}:`,
      error.message
    );
    throw error;
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

    // Remove posts from Redis cache
    const redisKey = FEED_KEY(followerId);
    const redisPromises = postIds.map((postId) =>
      redisClient.zRem(redisKey, postId)
    );
    await Promise.all(redisPromises);

    console.log(
      `✅ Removed ${postsToRemove.length} posts from user ${followerId}'s feed`
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

    // Get top N posts (most recent first) with scores - ZREVRANGE with WITHSCORES
    const result = await redisClient.zRange(redisKey, 0, limitInt - 1, {
      REV: true,
      WITHSCORES: true,
    });

    if (result && result.length > 0) {
      // Cache hit!
      console.log(
        `✅ [CACHE HIT] Feed cache for user ${userId} - ${
          result.length / 2
        } posts found`
      );

      // Refresh TTL on access
      await redisClient.expire(redisKey, FEED_TTL);

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

  const query = `
    SELECT post_id, created_at 
    FROM ${KEYSPACE}.feeds_by_user 
    WHERE user_id = ? 
    LIMIT ?
  `;

  const result = await cassandraClient.execute(query, [userIdInt, limitInt], {
    prepare: true,
  });

  return result.rows.map((row) => ({
    post_id: row.post_id.toString(),
    created_at: row.created_at,
  }));
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
    const pipeline = redisClient.multi();

    // Add all posts to sorted set
    feedItems.forEach((item) => {
      const score = item.created_at.getTime();
      pipeline.zAdd(redisKey, {
        score: score,
        value: item.post_id,
      });
    });

    // Trim to MAX_FEED_SIZE
    pipeline.zRemRangeByRank(redisKey, 0, -(MAX_FEED_SIZE + 1));

    // Set TTL
    pipeline.expire(redisKey, FEED_TTL);

    await pipeline.exec();
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
 * Invalidate user's feed cache (e.g., on unfollow)
 * @param {number} userId - User ID
 */
export const invalidateFeedCache = async (userId) => {
  try {
    const redisKey = FEED_KEY(userId);
    await redisClient.del(redisKey);
    console.log(`🗑️ Invalidated feed cache for user ${userId}`);
  } catch (error) {
    console.error(
      `⚠️ Cache invalidation error for user ${userId}:`,
      error.message
    );
  }
};
