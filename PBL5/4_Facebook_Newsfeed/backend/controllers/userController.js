const { User, Post, Follow, Like, Comment } = require("../models/index");

// Follow or unfollow a user
// POST /api/users/:id/follow 
// Body: { user_id: <follower_id> }
// :id is the user to follow (following_id)
const handleFollow = async (req, res) => {
  try {
    const following_id = parseInt(req.params.id); // User to follow
    const { user_id } = req.body; // User who wants to follow (follower_id)

    if (!user_id) {
      return res.status(400).json({ error: "User ID is required in request body" });
    }

    if (!following_id || isNaN(following_id)) {
      return res.status(400).json({ error: "Valid user ID is required in route parameter" });
    }

    // Check if user is trying to follow themselves
    if (user_id === following_id) {
      return res.status(400).json({ error: "You cannot follow yourself" });
    }

    // Verify both users exist
    const follower = await User.findByPk(user_id);
    const following = await User.findByPk(following_id);

    if (!follower) {
      return res.status(404).json({ error: "Follower user not found" });
    }
    if (!following) {
      return res.status(404).json({ error: "User to follow not found" });
    }

    // Check if already following
    const existingFollow = await Follow.findOne({
      where: {
        follower_id: user_id,
        following_id: following_id
      }
    });

    if (existingFollow) {
      // Unfollow
      await existingFollow.destroy();
      return res.status(200).json({ 
        message: "Unfollowed successfully",
        is_following: false
      });
    } else {
      // Follow
      const follow = await Follow.create({
        follower_id: user_id,
        following_id: following_id
      });
      return res.status(201).json({ 
        message: "Followed successfully",
        follow: follow,
        is_following: true
      });
    }
  } catch (error) {
    console.error("Follow error:", error);
    return res.status(500).json({ error: error.message || "Internal Server Error" });
  }
};

// Get all posts by a specific user
// GET /api/users/:id/posts
// :id is the user_id whose posts we want to retrieve
const handleGetPosts = async (req, res) => {
  try {
    const user_id = parseInt(req.params.id);

    if (!user_id || isNaN(user_id)) {
      return res.status(400).json({ error: "Valid user ID is required" });
    }

    // Verify user exists
    const user = await User.findByPk(user_id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Parse pagination parameters
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;

    // Get all posts by this user
    const posts = await Post.findAll({
      where: { user_id: user_id },
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'username']
        },
        {
          model: User,
          as: 'likedBy',
          attributes: ['id'],
          through: { attributes: [] }
        },
        {
          model: Comment,
          as: 'comments',
          include: [
            {
              model: User,
              as: 'commenter',
              attributes: ['id', 'username']
            }
          ],
          limit: 10,
          order: [['created_at', 'DESC']]
        }
      ],
      order: [['created_at', 'DESC']],
      limit: limit,
      offset: offset
    });

    return res.status(200).json({
      message: "Posts retrieved successfully",
      user: {
        id: user.id,
        username: user.username
      },
      posts: posts,
      count: posts.length
    });
  } catch (error) {
    console.error("Get user posts error:", error);
    return res.status(500).json({ error: error.message || "Internal Server Error" });
  }
};

module.exports = {
    handleFollow,
    handleGetPosts
}