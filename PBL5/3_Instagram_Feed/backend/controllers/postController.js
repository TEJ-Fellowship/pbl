import * as postService from "../services/postService.js";
import * as feedService from "../services/feedService.js";
import { cacheFeedResponse } from "../services/redisLuaScripts.js";
import { publishPostCreated } from "../services/kafkaProducer.js";
import { enqueueFanOutTask } from "../services/fallbackQueue.js";

/**
 * Create a new post
 * POST /api/posts
 */
export const createPost = async (req, res) => {
  try {
    const { user_id, caption, image_url, created_at } = req.body;

    if (!user_id || !image_url) {
      return res.status(400).json({
        success: false,
        message: "user_id and image_url are required",
      });
    }

    // Create post using service
    const post = await postService.createPost({
      user_id,
      caption,
      image_url,
      created_at,
    });

    // Helper function to handle fallback queue
    const enqueueFallback = async () => {
      try {
        await enqueueFanOutTask({
          userId: post.user_id,
          postId: post.id,
          createdAt: post.created_at,
        });
      } catch (queueError) {
        console.error("⚠️ Error enqueueing fallback fan-out:", queueError);
      }
    };

    // Publish post created event to Kafka (completely non-blocking)
    setImmediate(async () => {
      try {
        const result = await publishPostCreated(post);
        if (!result.success) {
          console.warn(
            `⚠️ Failed to publish post event to Kafka: ${result.error}`
          );
          await enqueueFallback();
        }
      } catch (kafkaError) {
        // Catch ALL errors - never let this crash the server
        console.error("⚠️ Error publishing to Kafka:", kafkaError.message);
        await enqueueFallback();
      }
    });

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

    // Validate user_id
    const userIdInt = parseInt(user_id);
    if (isNaN(userIdInt)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user_id",
      });
    }

    // OPTIMIZATION: Try cached complete response first (fastest path - < 10ms)
    // Only use cache if it has enough posts (at least 80% of limit or >= limit)
    const minCachedPosts = Math.max(1, Math.floor(limit * 0.8));
    const cachedResponse = await feedService.getFeedResponseFromCache(
      user_id,
      limit
    );

    if (cachedResponse && cachedResponse.length >= minCachedPosts) {
      return res.status(200).json({
        success: true,
        feed: cachedResponse,
        count: cachedResponse.length,
      });
    }

    // Cache miss or incomplete - fetch from Cassandra
    // Get feed items directly from Cassandra (source of truth)
    let feedItems = await feedService.getFeedFromCassandra(user_id, limit);

    // If we got fewer than expected, trigger async backfill (non-blocking)
    if (feedItems.length < limit) {
      console.warn(
        `⚠️ Only ${feedItems.length}/${limit} posts found. Triggering async backfill...`
      );
      // Run backfill asynchronously to avoid blocking the response
      feedService
        .ensureAllPostsInFeed(user_id)
        .catch((err) =>
          console.error("Background backfill error:", err.message)
        );
    }

    // Warm up Redis cache with the feed items we found
    if (feedItems.length > 0) {
      await feedService
        .warmUpCache(user_id, feedItems)
        .catch((err) => console.error(`Error warming cache:`, err));
    }

    let sortedPosts = [];
    const redisKey = `feed:user:${user_id}`;
    const FEED_TTL = 7 * 24 * 60 * 60; // 7 days in seconds

    // Always fetch post details if we have feedItems
    if (feedItems.length > 0) {
      // Get all post IDs
      const postIds = feedItems.map((item) => item.post_id);

      // Fetch all post details
      const posts = await postService.getPostsByIds(postIds);

      // Create map for quick lookup
      const allPostsMap = new Map(posts.map((post) => [post.id, post]));

      // Build sorted posts array
      sortedPosts = feedItems
        .map((item) => allPostsMap.get(item.post_id))
        .filter((post) => post !== undefined)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at)); // Sort by newest first

      // Cache the complete response for next time (enables < 10ms response on next request)
      if (sortedPosts.length > 0) {
        await cacheFeedResponse(redisKey, sortedPosts, FEED_TTL);
      }
    } else {
      return res.status(200).json({
        success: true,
        feed: [],
        count: 0,
        message: "No posts in feed",
      });
    }

    res.status(200).json({
      success: true,
      feed: sortedPosts,
      count: sortedPosts.length,
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
