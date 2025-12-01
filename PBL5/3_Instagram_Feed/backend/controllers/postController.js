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

    // Create post using service
    const post = await postService.createPost({
      user_id,
      caption,
      image_url,
      created_at,
    });

    // Fan-out to followers' feeds
    try {
      const followersCount = await feedService.fanOutToFollowers(
        post.user_id,
        post.id,
        post.created_at
      );
      console.log(
        `✅ Post ${post.id} added to ${followersCount} followers' feeds`
      );
    } catch (fanOutError) {
      // Log error but don't fail the post creation
      console.error(
        "⚠️ Error during fan-out (post still created):",
        fanOutError
      );
    }

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

    // OPTIMIZATION: Try cached complete response first (fastest path - single GET + parse)
    const cachedResponse = await feedService.getFeedResponseFromCache(
      user_id,
      limit
    );
    if (cachedResponse) {
      return res.status(200).json({
        success: true,
        feed: cachedResponse,
        count: cachedResponse.length,
      });
    }

    // Fallback to LUA script method
    const { feedItems, postsMap } = await feedService.getFeedWithPostsFromRedis(
      user_id,
      limit
    );

    let sortedPosts = [];
    const redisKey = `feed:user:${user_id}`;
    const FEED_TTL = 7 * 24 * 60 * 60; // 7 days in seconds

    if (feedItems.length > 0 && postsMap.size === feedItems.length) {
      // All posts cached - use optimized result
      sortedPosts = feedItems
        .map((item) => postsMap.get(item.post_id))
        .filter((post) => post !== undefined);

      // Cache the complete response for next time (fastest path)
      await cacheFeedResponse(redisKey, sortedPosts, FEED_TTL);
    } else if (feedItems.length > 0) {
      // Feed cached but some posts missing - fetch missing posts
      const postIds = feedItems.map((item) => item.post_id);
      const posts = await postService.getPostsByIds(postIds);

      // Merge with cached posts
      const allPostsMap = new Map(posts.map((post) => [post.id, post]));
      postsMap.forEach((post, id) => allPostsMap.set(id, post));

      sortedPosts = feedItems
        .map((item) => allPostsMap.get(item.post_id))
        .filter((post) => post !== undefined);

      // Cache the complete response for next time
      await cacheFeedResponse(redisKey, sortedPosts, FEED_TTL);
    } else {
      // Cache miss - fallback to old method
      const fallbackFeedItems = await feedService.getFeed(user_id, limit);

      if (fallbackFeedItems.length === 0) {
        return res.status(200).json({
          success: true,
          feed: [],
          count: 0,
          message: "No posts in feed",
        });
      }

      const postIds = fallbackFeedItems.map((item) => item.post_id);
      const posts = await postService.getPostsByIds(postIds);

      const fallbackPostsMap = new Map(posts.map((post) => [post.id, post]));
      sortedPosts = fallbackFeedItems
        .map((item) => fallbackPostsMap.get(item.post_id))
        .filter((post) => post !== undefined);

      // Cache the complete response for next time
      await cacheFeedResponse(redisKey, sortedPosts, FEED_TTL);
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
