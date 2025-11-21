const { User, Post, Follow, Like, Comment } = require("../models/index");
const { Op } = require('sequelize');

const handleGetFeed = async (req, res) => {
  try {
    // Get user_id from route parameter (e.g., /api/feed/1)
    const user_id = parseInt(req.params.id);
    
    if (!user_id || isNaN(user_id)) {
      return res.status(400).json({ error: "Valid user ID is required" });
    }

    // Verify user exists
    const user = await User.findByPk(user_id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Get all users that this user is following
    // follower_id = user_id means this user is following others
    const follows = await Follow.findAll({
      where: { follower_id: user_id },
      attributes: ['following_id']
    });

    const followingIds = follows.map(follow => follow.following_id);

    // If user is not following anyone, return empty feed
    if (followingIds.length === 0) {
      return res.status(200).json({ 
        message: "No posts to show. Follow some users to see their posts!",
        posts: [],
        count: 0
      });
    }

    // Parse pagination parameters
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;

    // Get posts from users being followed, ordered by created_at (newest first)
    const posts = await Post.findAll({
      where: {
        user_id: {
          [Op.in]: followingIds
        }
      },
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
          limit: 5, // Limit comments per post for feed
          order: [['created_at', 'DESC']]
        }
      ],
      order: [['created_at', 'DESC']],
      limit: limit,
      offset: offset
    });

    return res.status(200).json({
      message: "Feed retrieved successfully",
      posts: posts,
      count: posts.length
    });
  } catch (error) {
    console.error("Feed error:", error);
    return res.status(500).json({ error: error.message || "Internal Server Error" });
  }
};

module.exports = {
  handleGetFeed
};

