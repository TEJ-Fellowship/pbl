const { User, Post, Like, Comment, Follow } = require("../models/index");
const {
  getCache,
  setCache,
  appendMultipleToFeedCache,
  getLastFetchTime,
  setLastFetchTime,
} = require("../utils/cache");
const { Op } = require("sequelize");

// Get user's newsfeed with refresh/delta support
const handleGetFeed = async (req, res) => {
  try {
    const user_id = req.user?.id || req.query.user_id || req.params.id;
    const limit = parseInt(req.query.limit) || 20;
    const isRefresh = req.query.refresh === "true"; // Refresh flag
    const cursor = req.query.cursor; // NEW: cursor for pagination

    if (!user_id) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const feedKey = `feed:user:${user_id}`;

    // ============================================
    // REQUIREMENT 4: Handle refresh scenario (delta/incremental)
    // ============================================
    if (isRefresh) {
      // KEEP ALL EXISTING REFRESH LOGIC - DON'T CHANGE THIS
      const lastFetchTime = await getLastFetchTime(user_id);
      const currentTime = new Date();

      const following = await Follow.findAll({
        where: { follower_id: user_id },
        attributes: ["following_id"],
      });

      const followingIds = following.map((f) => f.following_id);

      if (followingIds.length === 0) {
        return res.status(200).json({
          posts: [],
          hasMore: false,
          isRefresh: true,        // KEEP THIS
          newPostsCount: 0,       // KEEP THIS
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
        whereClause.created_at[Op.gt] = lastFetchTime; // Posts AFTER last fetch
      } else {
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
        limit: 100,
      });

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

      if (newPostsWithCounts.length > 0) {
        await appendMultipleToFeedCache(feedKey, newPostsWithCounts, 100, 300);
      }

      await setLastFetchTime(user_id, 300);

      return res.status(200).json({
        posts: newPostsWithCounts,
        hasMore: false,
        isRefresh: true,              // KEEP THIS
        newPostsCount: newPostsWithCounts.length, // KEEP THIS
        fromCache: false,
      });
    }

    // ============================================
    // Normal feed request (with cursor pagination)
    // ============================================
    // Check cache first (only if no cursor - first page)
    if (!cursor) {
      const cachedFeed = await getCache(feedKey);
      if (cachedFeed && cachedFeed.posts) {
        const limitedPosts = cachedFeed.posts.slice(0, limit);
        const nextCursor = limitedPosts.length > 0 
          ? limitedPosts[limitedPosts.length - 1].created_at 
          : null;
        
        return res.status(200).json({
          posts: limitedPosts,
          hasMore: cachedFeed.posts.length > limit,
          nextCursor: nextCursor,  // ADD THIS
          fromCache: true,
          isRefresh: false,
        });
      }
    }

    // Cache miss or cursor pagination - build feed from database
    const following = await Follow.findAll({
      where: { follower_id: user_id },
      attributes: ["following_id"],
    });

    const followingIds = following.map((f) => f.following_id);

    if (followingIds.length === 0) {
      await setCache(feedKey, { posts: [], lastUpdated: new Date().toISOString() }, 300);
      return res.status(200).json({
        posts: [],
        hasMore: false,
        nextCursor: null,  // ADD THIS
        fromCache: false,
        isRefresh: false,
      });
    }

    // Build query with cursor support
    const whereClause = {
      user_id: { [Op.in]: followingIds },
    };

    if (cursor) {
      // Cursor pagination: get posts created BEFORE cursor timestamp
      const cursorDate = new Date(cursor);
      whereClause.created_at = { [Op.lt]: cursorDate }; // Less than cursor = older posts
    } else {
      // First page: get recent posts (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() -7);
      whereClause.created_at = { [Op.gte]: sevenDaysAgo };
    }

    const posts = await Post.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: "author",
          attributes: ["id", "username"],
        },
      ],
      order: [["created_at", "DESC"]],
      limit: limit + 1, // Fetch one extra to check if there's more
    });

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

    // Check if there are more posts
    const hasMore = postsWithCounts.length > limit;
    const postsToReturn = hasMore ? postsWithCounts.slice(0, limit) : postsWithCounts;

    // Get next cursor (timestamp of last post)
    const nextCursor = postsToReturn.length > 0 
      ? postsToReturn[postsToReturn.length - 1].created_at 
      : null;

    // Cache only first page (no cursor)
    if (!cursor) {
      await setCache(
        feedKey,
        { posts: postsWithCounts, lastUpdated: new Date().toISOString() },
        300
      );
      await setLastFetchTime(user_id, 300);
    }

    return res.status(200).json({
      posts: postsToReturn,
      hasMore: hasMore,
      nextCursor: nextCursor,  // ADD THIS
      fromCache: false,
      isRefresh: false,
    });
  } catch (error) {
    console.error("Error getting feed:", error);
    return res.status(500).json({ error: error.message });
  }
};

module.exports = {
  handleGetFeed
};