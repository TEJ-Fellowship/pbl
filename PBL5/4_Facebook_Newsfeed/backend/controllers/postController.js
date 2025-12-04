const { User, Post, Like, Comment, Follow } = require("../models/index");
const {
  setCache,
  deleteCache,
  deleteFeedCache,
  batchAppendToFeedCache,
  deleteUserPostsCache,
} = require("../utils/cache");
const kafkaProducer = require("../services/kafkaProducer");

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

    // ✅ OPTIMIZED: Only fetch user, NOT followers (worker will fetch them)
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
    // REQUIREMENT 1: Cache post for all followers
    // ============================================

    // ============================================
    // KAFKA INTEGRATION: Send to Kafka for async processing
    // ============================================

    // ✅ OPTIMIZED: Send to Kafka immediately (no follower fetch needed)
    console.time("⏱️ Send to Kafka");
    try {
      await kafkaProducer.sendPostCreatedEvent({
        ...postData,
      });
      console.timeEnd("⏱️ Send to Kafka");
      console.log(`📤 Post ${post.id} sent to Kafka for async fan-out`);
    } catch (kafkaError) {
      console.error(
        "❌ Kafka error, falling back to synchronous fan-out:",
        kafkaError
      );
      // Fallback to synchronous processing if Kafka fails
      console.time("⏱️ Fallback: Fetch Followers");
      const followers = await Follow.findAll({
        where: { following_id: user_id },
        attributes: ["follower_id"],
      });
      const followerIds = followers.map((f) => f.follower_id);
      console.timeEnd("⏱️ Fallback: Fetch Followers");

      // Append to Feed Cache
      console.time("⏱️ Fallback: Append to Feed Cache");
      if (followerIds.length > 0) {
        await batchAppendToFeedCache(followerIds, postData, 100, 300);
      }
      console.timeEnd("⏱️ Fallback: Append to Feed Cache");
    }

    // ============================================
    // REQUIREMENT 2: Cache the post itself
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
      await isliked.destroy();
      await post.decrement("likes_count");

      // Invalidate caches
      await deleteCache(`post:${post_id}`);

      //Get all users who follow this post's author to invalidate their feeds
      const followers = await Follow.findAll({
        where: { following_id: post.user_id },
        attributes: ["follower_id"],
      });
      const followerIds = followers.map((f) => f.follower_id);
      if (followerIds.length > 0) {
        const deletePromises = followerIds.map((fid) => deleteFeedCache(fid));
        await Promise.all(deletePromises);
      }

      return res.status(200).json({ message: "Like removed" });
    }

    const like = await Like.create({ user_id, post_id });
    await post.increment("likes_count");

    // Invalidate caches using tracking
    await deleteCache(`post:${post_id}`);
    // Get all users who follow this post's author to invalidate their feeds
    const followers = await Follow.findAll({
      where: { following_id: post.user_id },
      attributes: ["follower_id"],
    });
    const followerIds = followers.map((f) => f.follower_id);
    if (followerIds.length > 0) {
      const deletePromises = followerIds.map((fid) => deleteFeedCache(fid));
      await Promise.all(deletePromises);
    }

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

    // Get all users who follow this post's author to invalidate their feeds
    const followers = await Follow.findAll({
      where: { following_id: post.user_id },
      attributes: ["follower_id"],
    });
    const followerIds = followers.map((f) => f.follower_id);
    if (followerIds.length > 0) {
      const deletePromises = followerIds.map((fid) => deleteFeedCache(fid));
      await Promise.all(deletePromises);
    }
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
