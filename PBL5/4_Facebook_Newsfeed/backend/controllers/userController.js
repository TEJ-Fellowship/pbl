const { User, Post, Like, Comment, Follow } = require("../models/index");
const {
  getCache,
  setCache,
  deleteCache,
  deletePattern,
  appendMultipleToFeedCache,
  getLastFetchTime,
  setLastFetchTime,
} = require("../utils/cache");
const { Op } = require("sequelize");

// Follow/Unfollow user
const handleFollow = async (req, res) => {
  try {
    const follower_id = req.user?.id || req.body.follower_id;
    const following_id = req.params.id;

    if (!follower_id || !following_id) {
      return res.status(400).json({ error: "Follower and following IDs are required" });
    }

    if (follower_id === following_id) {
      return res.status(400).json({ error: "Cannot follow yourself" });
    }

    const existingFollow = await Follow.findOne({
      where: { follower_id, following_id },
    });

    if (existingFollow) {
      // Unfollow
      await existingFollow.destroy();

      // ============================================
      // REQUIREMENT 3: Invalidate followers cache
      // ============================================
      await deleteCache(`followers:user:${following_id}`);
      await deleteCache(`following:user:${follower_id}`);
      await deletePattern(`feed:user:${follower_id}*`); // Invalidate feed

      return res.status(200).json({ message: "Unfollowed successfully" });
    }

    // Follow
    await Follow.create({ follower_id, following_id });

    // ============================================
    // REQUIREMENT 3: Invalidate followers cache
    // ============================================
    await deleteCache(`followers:user:${following_id}`);
    await deleteCache(`following:user:${follower_id}`);
    await deletePattern(`feed:user:${follower_id}*`); // Invalidate feed (new posts will appear)

    return res.status(201).json({ message: "Followed successfully" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Get user's posts
const handleGetPosts = async (req, res) => {
  try {
    const user_id = req.params.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    if (!user_id) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // Check cache
    const cacheKey = `posts:user:${user_id}:page:${page}`;
    const cachedPosts = await getCache(cacheKey);

    if (cachedPosts) {
      return res.status(200).json({
        posts: cachedPosts,
        page,
        limit,
        fromCache: true,
      });
    }

    // Cache miss - query database
    const posts = await Post.findAll({
      where: { user_id },
      include: [
        {
          model: User,
          as: "author",
          attributes: ["id", "username"],
        },
      ],
      order: [["created_at", "DESC"]],
      limit,
      offset,
    });

    // Format posts with counts
    const postsWithCounts = await Promise.all(
      posts.map(async (post) => {
        const likesCount = await Like.count({ where: { post_id: post.id } });
        const commentsCount = await Comment.count({ where: { post_id: post.id } });
        return {
          ...post.toJSON(),
          likes_count: likesCount,
          comments_count: commentsCount,
        };
      })
    );

    // Cache the result
    await setCache(cacheKey, postsWithCounts, 600); // 10 min TTL

    return res.status(200).json({
      posts: postsWithCounts,
      page,
      limit,
      fromCache: false,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Get user's newsfeed with refresh/delta support
const handleGetFeed = async (req, res) => {
  try {
    const user_id = req.user?.id || req.query.user_id;
    const limit = parseInt(req.query.limit) || 20;
    const isRefresh = req.query.refresh === "true"; // Refresh flag

    if (!user_id) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const feedKey = `feed:user:${user_id}`;

    // ============================================
    // REQUIREMENT 4: Handle refresh scenario (delta/incremental)
    // ============================================
    if (isRefresh) {
      // Refresh: Get only new posts since last fetch (delta computation)
      const lastFetchTime = await getLastFetchTime(user_id);
      const currentTime = new Date();

      // Get list of users this user follows
      const following = await Follow.findAll({
        where: { follower_id: user_id },
        attributes: ["following_id"],
      });

      const followingIds = following.map((f) => f.following_id);

      if (followingIds.length === 0) {
        return res.status(200).json({
          posts: [],
          hasMore: false,
          isRefresh: true,
          newPostsCount: 0,
        });
      }

      // Query only new posts since last fetch
      const whereClause = {
        user_id: { [Op.in]: followingIds },
        created_at: {
          [Op.lte]: currentTime,
        },
      };

      if (lastFetchTime) {
        whereClause.created_at[Op.gt] = lastFetchTime;
      } else {
        // If no last fetch time, get posts from last 24 hours
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);
        whereClause.created_at[Op.gte] = oneDayAgo;
      }

      const newPosts = await Post.findAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: "author",
            attributes: ["id", "username"],
          },
        ],
        order: [["created_at", "DESC"]],
        limit: 100, // Cap to prevent massive queries
      });

      // Format new posts
      const newPostsWithCounts = await Promise.all(
        newPosts.map(async (post) => {
          const likesCount = await Like.count({ where: { post_id: post.id } });
          const commentsCount = await Comment.count({ where: { post_id: post.id } });
          return {
            ...post.toJSON(),
            likes_count: likesCount,
            comments_count: commentsCount,
          };
        })
      );

      // Incrementally append new posts to existing feed cache
      if (newPostsWithCounts.length > 0) {
        await appendMultipleToFeedCache(feedKey, newPostsWithCounts, 100, 300);
      }

      // Update last fetch time
      await setLastFetchTime(user_id, 300);

      return res.status(200).json({
        posts: newPostsWithCounts,
        hasMore: false,
        isRefresh: true,
        newPostsCount: newPostsWithCounts.length,
        fromCache: false,
      });
    }

    // ============================================
    // Normal feed request (not refresh)
    // ============================================
    // Check cache first
    const cachedFeed = await getCache(feedKey);

    if (cachedFeed && cachedFeed.posts) {
      // Return cached feed (limited to requested limit)
      const limitedPosts = cachedFeed.posts.slice(0, limit);
      return res.status(200).json({
        posts: limitedPosts,
        hasMore: cachedFeed.posts.length > limit,
        fromCache: true,
        isRefresh: false,
      });
    }

    // Cache miss - build feed from database
    const following = await Follow.findAll({
      where: { follower_id: user_id },
      attributes: ["following_id"],
    });

    const followingIds = following.map((f) => f.following_id);

    if (followingIds.length === 0) {
      // No following - return empty feed
      await setCache(feedKey, { posts: [], lastUpdated: new Date().toISOString() }, 300);
      return res.status(200).json({
        posts: [],
        hasMore: false,
        fromCache: false,
        isRefresh: false,
      });
    }

    // Get posts from followed users (last 7 days for performance)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const posts = await Post.findAll({
      where: {
        user_id: { [Op.in]: followingIds },
        created_at: {
          [Op.gte]: sevenDaysAgo,
        },
      },
      include: [
        {
          model: User,
          as: "author",
          attributes: ["id", "username"],
        },
      ],
      order: [["created_at", "DESC"]],
      limit: 100, // Cache up to 100 posts
    });

    // Format posts with counts
    const postsWithCounts = await Promise.all(
      posts.map(async (post) => {
        const likesCount = await Like.count({ where: { post_id: post.id } });
        const commentsCount = await Comment.count({ where: { post_id: post.id } });
        return {
          ...post.toJSON(),
          likes_count: likesCount,
          comments_count: commentsCount,
        };
      })
    );

    // Cache the feed
    await setCache(
      feedKey,
      { posts: postsWithCounts, lastUpdated: new Date().toISOString() },
      300
    ); // 5 min TTL

    // Set last fetch time
    await setLastFetchTime(user_id, 300);

    // Return limited posts
    const limitedPosts = postsWithCounts.slice(0, limit);

    return res.status(200).json({
      posts: limitedPosts,
      hasMore: postsWithCounts.length > limit,
      fromCache: false,
      isRefresh: false,
    });
  } catch (error) {
    console.error("Error getting feed:", error);
    return res.status(500).json({ error: error.message });
  }
};

// Get followers list (with caching)
const handleGetFollowers = async (req, res) => {
  try {
    const user_id = req.params.id;

    if (!user_id) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // ============================================
    // REQUIREMENT 3: Cache followers
    // ============================================
    const cacheKey = `followers:user:${user_id}`;
    const cachedFollowers = await getCache(cacheKey);

    if (cachedFollowers) {
      return res.status(200).json({
        followers: cachedFollowers,
        fromCache: true,
      });
    }

    // Cache miss - query database
    const followers = await Follow.findAll({
      where: { following_id: user_id },
      include: [
        {
          model: User,
          as: "follower",
          attributes: ["id", "username"],
        },
      ],
      attributes: ["follower_id", "created_at"],
    });

    const followersList = followers.map((f) => ({
      id: f.follower_id,
      username: f.follower?.username,
      followed_at: f.created_at,
    }));

    // Cache followers list
    await setCache(cacheKey, followersList, 600); // 10 min TTL

    return res.status(200).json({
      followers: followersList,
      fromCache: false,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

module.exports = {
  handleFollow,
  handleGetPosts,
  handleGetFeed,
  handleGetFollowers,
};