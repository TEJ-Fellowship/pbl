import * as postService from "../services/postService.js";
import * as feedService from "../services/feedService.js";
import { cacheFeedResponse } from "../services/redisLuaScripts.js";

/**
 * Create a new post
 * POST /api/posts
 */
export const createPost = async (req, res) => {
  try {
    const { user_id, caption, image_url, created_at } = req.body;

    // Fast validation - return early
    if (!user_id || !image_url) {
      return res.status(400).json({
        success: false,
        message: "user_id and image_url are required",
      });
    }

    // Create post using service (service handles PostgreSQL + Kafka)
    const post = await postService.createPost({
      user_id,
      caption,
      image_url,
      created_at,
    });

    // Return immediately - use 201 status
    res.status(201).json({
      success: true,
      message: "Post created successfully",
      post,
    });
  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).json({
      success: false,
      message: "Error creating post",
      error: error.message,
    });
  }
};

/**
 * Get post by ID
 * GET /api/posts/:id
 */
export const getPostById = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await postService.getPostById(id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    res.status(200).json({
      success: true,
      post,
    });
  } catch (error) {
    console.error("Error fetching post:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching post",
      error: error.message,
    });
  }
};

/**
 * Get all posts by a user
 * GET /api/posts/user/:user_id
 */
export const getPostsByUser = async (req, res) => {
  try {
    const { user_id } = req.params;
    const posts = await postService.getPostsByUser(user_id);

    res.status(200).json({
      success: true,
      posts,
      count: posts.length,
    });
  } catch (error) {
    console.error("Error fetching user posts:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching user posts",
      error: error.message,
    });
  }
};

/**
 * Get all posts (limited)
 * GET /api/posts
 */
export const getAllPosts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const posts = await postService.getAllPosts(limit);

    res.status(200).json({
      success: true,
      posts,
      count: posts.length,
    });
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching posts",
      error: error.message,
    });
  }
};

/**
 * Get user's feed
 * GET /api/posts/feed/:user_id
 */
export const getUserFeed = async (req, res) => {
  try {
    const { user_id } = req.params;
    const limit = parseInt(req.query.limit) || 20;
    const refresh = req.query.refresh === "true" || req.query.refresh === "1"; // Force refresh
    const cursor = req.query.cursor ? new Date(req.query.cursor) : null; // FIX: Get cursor early

    // Validate user_id
    const userIdInt = parseInt(user_id);
    if (isNaN(userIdInt)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user_id",
      });
    }

    // FIX: Skip cache if cursor is provided (pagination requires fresh data)
    // OPTIMIZATION: Try cached complete response first (fastest path - < 10ms)
    // BUT: Skip if refresh=true OR if cursor is provided (pagination)
    if (!refresh && !cursor) {
      const minCachedPosts = Math.max(1, Math.floor(limit * 0.8));
      const cachedResponse = await feedService.getFeedResponseFromCache(
        user_id,
        limit
      );

      if (cachedResponse && cachedResponse.length >= minCachedPosts) {
        // FIX: Validate cache freshness - check if Redis feed has newer posts
        try {
          const redisFeed = await feedService.getFeedFromRedis(user_id, 1); // Get just the newest post from Redis

          // DEBUG: Log what we found
          console.log(
            `🔍 [CACHE VALIDATION] User ${user_id}: Redis feed length=${
              redisFeed?.length || 0
            }, Cache length=${cachedResponse.length}`
          );

          if (redisFeed && redisFeed.length > 0 && cachedResponse.length > 0) {
            const newestPostInRedis = redisFeed[0];
            const newestPostInCache = cachedResponse[0];

            // FIX: Convert post_id to string for comparison (UUIDs are strings)
            const redisPostId = newestPostInRedis.post_id.toString();
            const cachePostId = newestPostInCache.id.toString();

            // Compare timestamps - if Redis has a newer post, cache is stale
            const redisTimestamp = new Date(
              newestPostInRedis.created_at
            ).getTime();
            const cacheTimestamp = new Date(
              newestPostInCache.created_at
            ).getTime();

            console.log(
              `🔍 [CACHE VALIDATION] User ${user_id}: Redis timestamp=${redisTimestamp}, Cache timestamp=${cacheTimestamp}, Redis post_id=${redisPostId}, Cache post_id=${cachePostId}`
            );

            // FIX: Check if Redis has a newer post OR if post IDs don't match
            if (
              redisTimestamp > cacheTimestamp ||
              redisPostId !== cachePostId
            ) {
              // Cache is stale - invalidate it and rebuild
              console.log(
                `🔄 [CACHE] Stale cache detected for user ${user_id}. Redis newest: ${newestPostInRedis.created_at} (${redisPostId}), Cache newest: ${newestPostInCache.created_at} (${cachePostId})`
              );
              await feedService.invalidateFeedCache(user_id);
              // Fall through to rebuild from Redis feed below
            } else {
              // Cache is fresh, return it
              console.log(`✅ [CACHE] Cache is fresh for user ${user_id}`);
              
              // FIX: Calculate pagination info for cached response too
              const lastPost = cachedResponse[cachedResponse.length - 1];
              let nextCursor = null;
              if (lastPost && lastPost.created_at) {
                const createdAt = lastPost.created_at instanceof Date 
                  ? lastPost.created_at 
                  : new Date(lastPost.created_at);
                if (!isNaN(createdAt.getTime())) {
                  nextCursor = createdAt.toISOString();
                }
              }
              const hasMore = cachedResponse.length === limit;
              
              return res.status(200).json({
                success: true,
                feed: cachedResponse,
                count: cachedResponse.length,
                cached: true,
                has_more: hasMore,
                next_cursor: nextCursor,
              });
            }
          } else if (redisFeed && redisFeed.length === 0) {
            // Redis feed is empty but cache has posts - this is suspicious
            // It might mean posts weren't added to Redis feed
            console.log(
              `⚠️ [CACHE] Redis feed is EMPTY for user ${user_id} but cache has ${cachedResponse.length} posts. This might indicate fan-out didn't happen.`
            );
            // Still return cache since Redis is empty - but log the issue
            const lastPost = cachedResponse[cachedResponse.length - 1];
            let nextCursor = null;
            if (lastPost && lastPost.created_at) {
              const createdAt = lastPost.created_at instanceof Date 
                ? lastPost.created_at 
                : new Date(lastPost.created_at);
              if (!isNaN(createdAt.getTime())) {
                nextCursor = createdAt.toISOString();
              }
            }
            const hasMore = cachedResponse.length === limit;
            
            return res.status(200).json({
              success: true,
              feed: cachedResponse,
              count: cachedResponse.length,
              cached: true,
              has_more: hasMore,
              next_cursor: nextCursor,
              warning:
                "Redis feed is empty - posts may not have been added via fan-out",
            });
          } else {
            // No posts in cache or Redis - return cached response
            const lastPost = cachedResponse[cachedResponse.length - 1];
            let nextCursor = null;
            if (lastPost && lastPost.created_at) {
              const createdAt = lastPost.created_at instanceof Date 
                ? lastPost.created_at 
                : new Date(lastPost.created_at);
              if (!isNaN(createdAt.getTime())) {
                nextCursor = createdAt.toISOString();
              }
            }
            const hasMore = cachedResponse.length === limit;
            
            return res.status(200).json({
              success: true,
              feed: cachedResponse,
              count: cachedResponse.length,
              cached: true,
              has_more: hasMore,
              next_cursor: nextCursor,
            });
          }
        } catch (validationError) {
          // If validation fails, just use the cache (better than failing)
          console.error(
            `⚠️ Cache validation error for user ${user_id}:`,
            validationError.message
          );
          const lastPost = cachedResponse[cachedResponse.length - 1];
          let nextCursor = null;
          if (lastPost && lastPost.created_at) {
            const createdAt = lastPost.created_at instanceof Date 
              ? lastPost.created_at 
              : new Date(lastPost.created_at);
            if (!isNaN(createdAt.getTime())) {
              nextCursor = createdAt.toISOString();
            }
          }
          const hasMore = cachedResponse.length === limit;
          
          return res.status(200).json({
            success: true,
            feed: cachedResponse,
            count: cachedResponse.length,
            cached: true,
            has_more: hasMore,
            next_cursor: nextCursor,
          });
        }
      }
    }

    // Cache miss or stale or cursor provided - use hybrid approach: Redis first 100, PostgreSQL for beyond
    const feed = await feedService.getFeed(user_id, limit, cursor);

    if (feed.length === 0) {
      return res.status(200).json({
        success: true,
        feed: [],
        count: 0,
        message: "No posts in feed",
        // FIX: Return pagination info
        has_more: false,
        next_cursor: null,
      });
    }

    // Cache the complete response for next time (only if no cursor - first page)
    if (!cursor) {
      const redisKey = `feed:user:${user_id}`;
      const FEED_TTL = 7 * 24 * 60 * 60; // 7 days in seconds
      await cacheFeedResponse(redisKey, feed, FEED_TTL).catch((err) =>
        console.error("Error caching feed response:", err)
      );
    }

    // FIX: Calculate next cursor for pagination
    const lastPost = feed[feed.length - 1];
    let nextCursor = null;
    
    if (lastPost && lastPost.created_at) {
      // Handle both Date objects and strings
      const createdAt = lastPost.created_at instanceof Date 
        ? lastPost.created_at 
        : new Date(lastPost.created_at);
      
      if (!isNaN(createdAt.getTime())) {
        nextCursor = createdAt.toISOString();
      }
    }
    
    const hasMore = feed.length === limit; // If we got exactly the limit, there might be more

    res.status(200).json({
      success: true,
      feed: feed,
      count: feed.length,
      cached: false,
      // FIX: Add pagination info
      has_more: hasMore,
      next_cursor: nextCursor,
    });
  } catch (error) {
    console.error("Error fetching user feed:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching user feed",
      error: error.message,
    });
  }
};
