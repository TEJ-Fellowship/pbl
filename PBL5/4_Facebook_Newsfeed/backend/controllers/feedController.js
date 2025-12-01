const { User, Post, Follow } = require("../models/index");
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
          isRefresh: true, // KEEP THIS
          newPostsCount: 0, // KEEP THIS
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

      console.time('⏱️ Database Query Time (Refresh)')
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
      console.timeEnd('⏱️ Database Query Time (Refresh)')
      console.log(`📊 Found ${newPosts.length} new posts`);

      // Use likes_count and comments_count directly from Post model (already maintained)
      // This eliminates N+1 queries - no need to count likes/comments separately
      const newPostsWithCounts = newPosts.map((post) => ({
        ...post.toJSON(),
        likes_count: post.likes_count || 0,
        comments_count: post.comments_count || 0,
      }));

      if (newPostsWithCounts.length > 0) {
        console.time('⏱️ Cache Write Time (Refresh)')
        await appendMultipleToFeedCache(feedKey, newPostsWithCounts, 100, 300);
        console.timeEnd('⏱️ Cache Write Time (Refresh)')
      }

      console.time('⏱️ Last Fetch Time Set (Last Fetch)')
      await setLastFetchTime(user_id, 300);
      console.timeEnd('⏱️ Last Fetch Time Set (Last Fetch)')
      return res.status(200).json({
        posts: newPostsWithCounts,
        hasMore: false,
        isRefresh: true, // KEEP THIS
        newPostsCount: newPostsWithCounts.length, // KEEP THIS
        fromCache: false,
      });
    }

    // ============================================
    // Normal feed request (with cursor pagination)
    // ============================================
    // Check cache first (only if no cursor - first page)
    if (!cursor) {
      console.time('⏱️ Cache Read Time')
      const cachedFeed = await getCache(feedKey);
      console.timeEnd('⏳ Cache Read Time')
      console.log(`📦 Cache result:`, cachedFeed ? 'HIT ✅' : 'MISS ❌')

      if (cachedFeed && cachedFeed.posts) {
        const limitedPosts = cachedFeed.posts.slice(0, limit);
        const nextCursor =
          limitedPosts.length > 0
            ? limitedPosts[limitedPosts.length - 1].created_at
            : null;

        return res.status(200).json({
          posts: limitedPosts,
          hasMore: cachedFeed.posts.length > limit,
          nextCursor: nextCursor, // ADD THIS
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
      console.time('⏱️ Cache Write Time (Empty Feed)')
      await setCache(
        feedKey,
        { posts: [], lastUpdated: new Date().toISOString() },
        300
      );
      console.timeEnd('⏱️ Cache Write Time (Empty Feed)')
      return res.status(200).json({
        posts: [],
        hasMore: false,
        nextCursor: null, // ADD THIS
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
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      whereClause.created_at = { [Op.gte]: sevenDaysAgo };
    }

    console.time('⏱️ Database Query Time (Normal Feed)')
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
    console.timeEnd('⏱️ Database Query Time (Normal Feed)')
    console.log(`📊 Found ${posts.length} posts`);

    // Use likes_count and comments_count directly from Post model (already maintained)
    // This eliminates N+1 queries - no need to count likes/comments separately
    const postsWithCounts = posts.map((post) => ({
      ...post.toJSON(),
      likes_count: post.likes_count || 0,
      comments_count: post.comments_count || 0,
    }));

    // Check if there are more posts
    const hasMore = postsWithCounts.length > limit;
    const postsToReturn = hasMore
      ? postsWithCounts.slice(0, limit)
      : postsWithCounts;

    // Get next cursor (timestamp of last post)
    const nextCursor =
      postsToReturn.length > 0
        ? postsToReturn[postsToReturn.length - 1].created_at
        : null;

    // Cache only first page (no cursor)
    if (!cursor) {
      console.time('⏱️ Cache Write Time')
      await setCache(
        feedKey,
        { posts: postsWithCounts, lastUpdated: new Date().toISOString() },
        300
      );
      console.timeEnd('⏱️ Cache Write Time')

      console.time('⏱️ Cache Write Time (Last Fetch)')
      await setLastFetchTime(user_id, 300);
      console.timeEnd('⏱️ Cache Write Time (Last Fetch)')
    }

    return res.status(200).json({
      posts: postsToReturn,
      hasMore: hasMore,
      nextCursor: nextCursor, // ADD THIS
      fromCache: false,
      isRefresh: false,
    });
  } catch (error) {
    console.error("Error getting feed:", error);
    return res.status(500).json({ error: error.message });
  }
};

module.exports = {
  handleGetFeed,
};
