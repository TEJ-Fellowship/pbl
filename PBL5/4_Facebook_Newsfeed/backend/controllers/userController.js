const { User, Post, Like, Comment, Follow } = require("../models/index");
const {
  getCache,
  setCache,
  deleteCache,
  deletePattern,
  addUserPostCacheKey,
  deleteFeedCache,
} = require("../utils/cache");

// Follow/Unfollow user
const handleFollow = async (req, res) => {
  try {
    const follower_id = req.user?.id || req.body.follower_id;
    const following_id = req.params.id;

    if (!follower_id || !following_id) {
      return res
        .status(400)
        .json({ error: "Follower and following IDs are required" });
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
      await deleteFeedCache(follower_id);
      
      return res.status(200).json({ message: "Unfollowed successfully" });
    }

    // Follow
    await Follow.create({ follower_id, following_id });

    // ============================================
    // REQUIREMENT 3: Invalidate followers cache
    // ============================================
    await deleteCache(`followers:user:${following_id}`);
    await deleteCache(`following:user:${follower_id}`);
    await deleteFeedCache(follower_id);

    return res.status(201).json({ message: "Followed successfully" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Create a new user
const handleCreateUser = async (req, res) => {
  try {
    const { username } = req.body;

    if (!username || username.trim() === "") {
      return res.status(400).json({ error: "Username is required" });
    }

    // Check if username already exists
    const existingUser = await User.findOne({
      where: { username: username.trim() },
    });

    if (existingUser) {
      return res.status(409).json({ error: "Username already exists" });
    }

    // Create new user
    const user = await User.create({
      username: username.trim(),
    });

    return res.status(201).json({
      message: "User created successfully",
      user: {
        id: user.id,
        username: user.username,
        created_at: user.created_at,
      },
    });
  } catch (error) {
    // Handle Sequelize validation errors
    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({ error: error.errors[0].message });
    }
    // Handle unique constraint violation
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({ error: "Username already exists" });
    }
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
    console.log(`🔍 Checking cache for user_id: ${user_id}, page: ${page}`);
    console.time("🕒cache time");
    const cacheKey = `posts:user:${user_id}:page:${page}`;
    const cachedPosts = await getCache(cacheKey);
    console.timeEnd("🕒cache time");

    console.log(`📦 Cache result:`, cachedPosts ? "HIT ✅" : "MISS ❌");
    console.log(
      `📦 Cached data:`,
      cachedPosts ? `${cachedPosts.length} posts` : "null"
    );

    if (cachedPosts) {
      return res.status(200).json({
        posts: cachedPosts,
        page,
        limit,
        fromCache: true,
      });
    }

    console.log("❌ Cache MISS - querying database...");
    console.time("🕒Database Query");
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
    console.timeEnd("🕒Database Query");
    console.log(`📊 Found ${posts.length} posts`);

    // Format posts with counts
    console.time("🕒Map Operation");
    const postsWithCounts = posts.map((post) => ({
      ...post.toJSON(),
      like_count: post.likes_count,
      comment_count: post.comments_count,
    }));
    console.timeEnd("🕒Map Operation");

    // Cache the result
    console.log(`✅ Cache MISS - writing to cache: ${cacheKey}`);
    console.time("🕒Cache Write");
    const cacheResult = await setCache(cacheKey, postsWithCounts, 600); // 10 min TTL
    
    await addUserPostCacheKey(user_id, page, 600);
    console.timeEnd("🕒Cache Write");
    console.log(
      `💾 Cache write result:`,
      cacheResult ? "SUCCESS ✅" : "FAILED ❌"
    );

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

module.exports = {
  handleCreateUser,
  handleFollow,
  handleGetPosts,
};
