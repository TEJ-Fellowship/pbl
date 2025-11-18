import { User, Follow } from "../models/index.js";

/**
 * Create a new user
 * POST /api/users
 */
export const createUser = async (req, res) => {
  try {
    const { username, email, bio, avatar_url } = req.body;

    // Validate required fields
    if (!username || !email) {
      return res.status(400).json({
        success: false,
        message: "Username and email are required",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      where: {
        email: email,
      },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    // Check if username is taken
    const existingUsername = await User.findOne({
      where: {
        username: username,
      },
    });

    if (existingUsername) {
      return res.status(409).json({
        success: false,
        message: "Username is already taken",
      });
    }

    // Create new user
    const newUser = await User.create({
      username,
      email,
      bio: bio || null,
      avatar_url: avatar_url || null,
      followers_count: 0,
      following_count: 0,
      is_celebrity: false,
    });

    res.status(201).json({
      newUser,
    });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({
      success: false,
      message: "Error creating user",
      error: error.message,
    });
  }
};

/**
 * Get all users
 * GET /api/users
 */
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: [
        "id",
        "username",
        "email",
        "bio",
        "avatar_url",
        "followers_count",
        "following_count",
        "is_celebrity",
      ],
      order: [["id", "ASC"]],
    });

    res.status(200).json({
      // success: true,
      // message: "Users fetched successfully",
      // count: users.length,
      // data: users,
      users,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching users",
      error: error.message,
    });
  }
};

/**
 * Get user by ID
 * GET /api/users/:id
 */
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID is a number
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const user = await User.findByPk(id, {
      attributes: [
        "id",
        "username",
        "email",
        "bio",
        "avatar_url",
        "followers_count",
        "following_count",
        "is_celebrity",
      ],
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      user,
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching user",
      error: error.message,
    });
  }
};

/**
 * Follow a user
 * POST /api/users/:id/follow
 * Body: { follower_id: <user_id> }
 */
export const followUser = async (req, res) => {
  try {
    const { id } = req.params; // User being followed (following_id)
    const { follower_id } = req.body; // User who is following

    // Validate follower_id is provided
    if (!follower_id) {
      return res.status(400).json({
        success: false,
        message: "follower_id is required in request body",
      });
    }

    // Validate IDs are numbers
    if (isNaN(id) || isNaN(follower_id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    // Prevent self-follow
    if (parseInt(id) === parseInt(follower_id)) {
      return res.status(400).json({
        success: false,
        message: "You cannot follow yourself",
      });
    }

    // Check if both users exist
    const userToFollow = await User.findByPk(id);
    const follower = await User.findByPk(follower_id);

    if (!userToFollow) {
      return res.status(404).json({
        success: false,
        message: "User to follow not found",
      });
    }

    if (!follower) {
      return res.status(404).json({
        success: false,
        message: "Follower user not found",
      });
    }

    // Check if already following
    const existingFollow = await Follow.findOne({
      where: {
        follower_id: follower_id,
        following_id: id,
      },
    });

    if (existingFollow) {
      return res.status(409).json({
        success: false,
        message: "You are already following this user",
      });
    }

    // Create follow relationship
    const follow = await Follow.create({
      follower_id: follower_id,
      following_id: id,
    });

    // Update follower counts
    await User.increment("following_count", {
      where: { id: follower_id },
    });

    await User.increment("followers_count", {
      where: { id: id },
    });

    // Reload users to get updated counts
    await follower.reload();
    await userToFollow.reload();

    // Check if user should be marked as celebrity (10K+ followers)
    if (userToFollow.followers_count >= 10000 && !userToFollow.is_celebrity) {
      await userToFollow.update({ is_celebrity: true });
    }

    res.status(201).json({
      success: true,
      message: `User ${follower.username} is now following ${userToFollow.username}`,
      data: {
        follow,
        follower: {
          id: follower.id,
          username: follower.username,
          following_count: follower.following_count,
        },
        following: {
          id: userToFollow.id,
          username: userToFollow.username,
          followers_count: userToFollow.followers_count,
        },
      },
    });
  } catch (error) {
    console.error("Error following user:", error);
    res.status(500).json({
      success: false,
      message: "Error following user",
      error: error.message,
    });
  }
};

/**
 * Unfollow a user
 * POST /api/users/:id/unfollow
 * Body: { follower_id: <user_id> }
 */
export const unfollowUser = async (req, res) => {
  try {
    const { id } = req.params; // User being unfollowed (following_id)
    const { follower_id } = req.body; // User who is unfollowing

    // Validate follower_id is provided
    if (!follower_id) {
      return res.status(400).json({
        success: false,
        message: "follower_id is required in request body",
      });
    }

    // Validate IDs are numbers
    if (isNaN(id) || isNaN(follower_id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    // Check if both users exist
    const userToUnfollow = await User.findByPk(id);
    const follower = await User.findByPk(follower_id);

    if (!userToUnfollow) {
      return res.status(404).json({
        success: false,
        message: "User to unfollow not found",
      });
    }

    if (!follower) {
      return res.status(404).json({
        success: false,
        message: "Follower user not found",
      });
    }

    // Check if follow relationship exists
    const existingFollow = await Follow.findOne({
      where: {
        follower_id: follower_id,
        following_id: id,
      },
    });

    if (!existingFollow) {
      return res.status(404).json({
        success: false,
        message: "You are not following this user",
      });
    }

    // Delete follow relationship
    await existingFollow.destroy();

    // Update follower counts (decrement, but don't go below 0)
    await User.decrement("following_count", {
      where: { id: follower_id },
    });

    await User.decrement("followers_count", {
      where: { id: id },
    });

    // Reload users to get updated counts
    await follower.reload();
    await userToUnfollow.reload();

    // Check if user should be unmarked as celebrity (< 10K followers)
    if (userToUnfollow.followers_count < 10000 && userToUnfollow.is_celebrity) {
      await userToUnfollow.update({ is_celebrity: false });
    }

    res.status(200).json({
      success: true,
      message: `User ${follower.username} has unfollowed ${userToUnfollow.username}`,
      data: {
        follower: {
          id: follower.id,
          username: follower.username,
        },
        unfollowed: {
          id: userToUnfollow.id,
          username: userToUnfollow.username,
        },
      },
    });
  } catch (error) {
    console.error("Error unfollowing user:", error);
    res.status(500).json({
      success: false,
      message: "Error unfollowing user",
      error: error.message,
    });
  }
};
