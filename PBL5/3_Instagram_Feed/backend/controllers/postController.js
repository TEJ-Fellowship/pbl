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

    // Return immediately after PostgreSQL success
    // Kafka publishing happens asynchronously in the service
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

    // Cache miss - use hybrid approach: Redis first 100, PostgreSQL for beyond
    const feed = await feedService.getFeed(user_id, limit);

    if (feed.length === 0) {
      return res.status(200).json({
        success: true,
        feed: [],
        count: 0,
        message: "No posts in feed",
      });
    }

    // Cache the complete response for next time
    const redisKey = `feed:user:${user_id}`;
    const FEED_TTL = 7 * 24 * 60 * 60; // 7 days in seconds
    await cacheFeedResponse(redisKey, feed, FEED_TTL).catch((err) =>
      console.error("Error caching feed response:", err)
    );

    res.status(200).json({
      success: true,
      feed: feed,
      count: feed.length,
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