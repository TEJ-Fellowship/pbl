const { User, Post, Like, Comment, Follow } = require("../models/index");
const {
  setCache,
  deleteCache,
  deleteFeedCache,
  deleteUserPostsCache,
} = require("../utils/cache");
const kafkaProducer = require("../services/kafkaProducer");
const { redisClient } = require("../config/redis");
const { Op } = require("sequelize");

// Creating the post by the user
const handlePost = async (req, res) => {
  try {
    console.time("Post Creation");
    const { user_id, content, image_urls } = req.body;
    if (!user_id) {
      return res.status(400).json({ error: "Invalid user ID" });
    }
    if (!content || content.trim() === "") {
      return res.status(400).json({ error: "Content is required" });
    }

    // Fetch user info
    console.time("⏱️ DB Query (User Only)");
    const user = await User.findByPk(user_id, {
      attributes: ["id", "username"],
    });
    console.timeEnd("⏱️ DB Query (User Only)");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Create post in database
    console.time("⏱️ Create Post in DB");
    const post = await Post.create({
      user_id,
      content,
      image_urls,
    });
    console.timeEnd("⏱️ Create Post in DB");

    // Build postData manually (no extra query needed)
    const postData = {
      ...post.toJSON(),
      author: {
        id: user.id,
        username: user.username,
      },
      likes_count: 0,
      comments_count: 0,
    };

    // ============================================
    // PURE PULL MODEL: Send to Kafka for SELECTIVE cache invalidation
    // (NOT for fan-out - worker will invalidate only active users' caches)
    // ============================================
    console.time("⏱️ Send to Kafka");
    try {
      await kafkaProducer.sendPostCreatedEvent({
        postId: post.id,
        userId: user_id,
        postData,
        timestamp: new Date().toISOString(),
      });
      console.timeEnd("⏱️ Send to Kafka");
      console.log(`📤 Post ${post.id} sent to Kafka for selective cache invalidation`);
    } catch (kafkaError) {
      console.error("❌ Kafka error:", kafkaError);
      // In pure pull model, we don't fallback to fan-out
      // Just log the error - cache invalidation will happen on next post
    }

    // ============================================
    // Cache the post itself (for individual post lookups)
    // ============================================
    console.time("⏱️ Cache Post");
    await setCache(`post:${post.id}`, postData, 900);
    console.timeEnd("⏱️ Cache Post");

    // ============================================
    // Invalidate user's own posts cache
    // ============================================
    console.time("⏱️ Delete User Posts Cache");
    await deleteUserPostsCache(user_id);
    console.timeEnd("⏱️ Delete User Posts Cache");
    console.timeEnd("Post Creation");

    return res.status(201).json({
      message: "Post created successfully",
      post: postData,
    });
  } catch (error) {
    console.error("Error creating post:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// Helper function for selective cache invalidation
// Only invalidates caches of active users who follow the post author
const invalidateActiveFollowersCache = async (postAuthorId) => {
  try {
    if (!redisClient.isOpen) {
      console.warn("⚠️ Redis not connected, skipping cache invalidation");
      return;
    }

    // Get all active users (users who viewed feed in last 5 minutes)
    const activeUserKeys = await redisClient.keys("active_users:*");

    if (activeUserKeys.length === 0) {
      console.log("📭 No active users found, skipping cache invalidation");
      return;
    }

    // Extract user IDs from keys
    const activeUserIds = activeUserKeys.map((key) =>
      parseInt(key.replace("active_users:", ""))
    );

    // Check which active users follow the post author
    const followers = await Follow.findAll({
      where: {
        following_id: postAuthorId,
        follower_id: { [Op.in]: activeUserIds },
      },
      attributes: ["follower_id"],
    });

    const activeFollowerIds = followers.map((f) => f.follower_id);

    // Only invalidate caches of active followers
    if (activeFollowerIds.length > 0) {
      const invalidatePromises = activeFollowerIds.map((id) =>
        deleteFeedCache(id)
      );
      await Promise.all(invalidatePromises);
      console.log(
        `🗑️ Invalidated ${activeFollowerIds.length} active follower caches for post author ${postAuthorId}`
      );
    } else {
      console.log(
        `📭 No active followers found for post author ${postAuthorId}`
      );
    }
  } catch (error) {
    console.error("❌ Error in selective cache invalidation:", error);
    // Don't throw - cache invalidation failure shouldn't break the request
  }
};

// Liking the post by the user
const handleLike = async (req, res) => {
  try {
    const post_id = req.params.id;
    const { user_id } = req.body;
    if (!post_id) {
      return res.status(400).json({ error: "Post ID is required" });
    }
    if (!user_id) {
      return res.status(400).json({ error: "User ID is required" });
    }
    const post = await Post.findByPk(post_id);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }
    const user = await User.findByPk(user_id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const isliked = await Like.findOne({ where: { user_id, post_id } });
    if (isliked) {
      // Unlike
      await isliked.destroy();
      await post.decrement("likes_count");

      // Invalidate post cache
      await deleteCache(`post:${post_id}`);

      // Selective cache invalidation: only invalidate active followers' caches
      await invalidateActiveFollowersCache(post.user_id);

      return res.status(200).json({ message: "Like removed" });
    }

    // Like
    const like = await Like.create({ user_id, post_id });
    await post.increment("likes_count");

    // Invalidate post cache
    await deleteCache(`post:${post_id}`);

    // Selective cache invalidation: only invalidate active followers' caches
    await invalidateActiveFollowersCache(post.user_id);

    return res.status(201).json({ message: "Liked successfully", like });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Commenting on the post by the user
const handleComment = async (req, res) => {
  try {
    const post_id = req.params.id;
    const { user_id, content } = req.body;
    if (!post_id) {
      return res.status(400).json({ error: "Post ID is required" });
    }
    if (!user_id) {
      return res.status(400).json({ error: "User ID is required" });
    }
    if (!content || content.trim() === "") {
      return res.status(400).json({ error: "Content is required" });
    }

    const post = await Post.findByPk(post_id);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }
    const user = await User.findByPk(user_id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const comment = await Comment.create({
      user_id,
      post_id,
      content,
    });

    await post.increment("comments_count");

    // Invalidate caches
    await deleteCache(`post:${post_id}`);
    await deleteUserPostsCache(post.user_id);

    // Selective cache invalidation: only invalidate active followers' caches
    await invalidateActiveFollowersCache(post.user_id);

    const commentAuthor = await Comment.findByPk(comment.id, {
      include: [
        {
          model: User,
          as: "commenter",
          attributes: ["id", "username"],
        },
      ],
    });

    return res.status(201).json({
      message: "Commented successfully",
      comment: commentAuthor,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

module.exports = {
  handlePost,
  handleLike,
  handleComment,
};