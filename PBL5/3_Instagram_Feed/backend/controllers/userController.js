import { User, Follow } from "../models/index.js";
import * as userCacheService from "../services/userCacheService.js";
import {
  invalidateFeedCache,
  backfillFeedOnFollow,
  removePostsFromFeedOnUnfollow,
} from "../services/feedService.js";
import {
  publishUserFollowed,
  publishUserUnfollowed,
} from "../services/kafkaProducer.js";

/**
 * Create a new user
 * POST /api/users
 */
export const createUser = async (req, res) => {
  try {
    const { username, email, bio, avatar_url } = req.body;

    if (!username || !email) {
      return res.status(400).json({
        success: false,
        message: "Username and email are required",
      });
    }

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
    const { id } = req.params;
    const { follower_id } = req.body;

    if (!follower_id) {
      return res.status(400).json({
        success: false,
        message: "follower_id is required in request body",
      });
    }

    if (isNaN(id) || isNaN(follower_id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    if (parseInt(id) === parseInt(follower_id)) {
      return res.status(400).json({
        success: false,
        message: "You cannot follow yourself",
      });
    }

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

    const follow = await Follow.create({
      follower_id: follower_id,
      following_id: id,
    });

    // Update counts in database (can be parallel)
    await Promise.all([
      User.increment("following_count", { where: { id: follower_id } }),
      User.increment("followers_count", { where: { id: id } }),
    ]);

    // Update counts in Redis cache (can be parallel)
    await Promise.all([
      userCacheService.incrementFollowingCount(follower_id),
      userCacheService.incrementFollowersCount(id),
    ]);

    // Publish follow event to Kafka (non-blocking)
    setImmediate(async () => {
      try {
        await publishUserFollowed(follower_id, id);
      } catch (kafkaError) {
        console.error(
          "⚠️ Error publishing follow event to Kafka:",
          kafkaError.message
        );
      }
    });

    // FIX: Make backfill asynchronous (non-blocking)
    // This is the main bottleneck - don't wait for it
    setImmediate(async () => {
      try {
        await backfillFeedOnFollow(follower_id, id);
        console.log(`✅ Backfilled feed for follower ${follower_id}`);
      } catch (backfillError) {
        console.error("⚠️ Error backfilling feed on follow:", backfillError);
        await invalidateFeedCache(follower_id).catch((err) =>
          console.error("Failed to invalidate cache:", err)
        );
      }
    });

    await Promise.all([follower.reload(), userToFollow.reload()]);

    if (userToFollow.followers_count >= 10000 && !userToFollow.is_celebrity) {
      userToFollow.update({ is_celebrity: true }).catch(console.error);
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
    const { id } = req.params;
    const { follower_id } = req.body;

    if (!follower_id) {
      return res.status(400).json({
        success: false,
        message: "follower_id is required in request body",
      });
    }

    if (isNaN(id) || isNaN(follower_id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

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

    await existingFollow.destroy();

    // Update counts in parallel
    await Promise.all([
      User.decrement("following_count", { where: { id: follower_id } }),
      User.decrement("followers_count", { where: { id: id } }),
    ]);

    // Update counts in Redis cache in parallel
    await Promise.all([
      userCacheService.decrementFollowingCount(follower_id),
      userCacheService.decrementFollowersCount(id),
    ]);

    // Publish unfollow event to Kafka (non-blocking)
    setImmediate(async () => {
      try {
        await publishUserUnfollowed(follower_id, id);
        console.log(
          `📤 [KAFKA] User ${follower_id} unfollowed user ${id} event published`
        );
      } catch (kafkaError) {
        console.error(
          "⚠️ Error publishing unfollow event to Kafka:",
          kafkaError
        );
      }
    });

    // FIX: Make post removal asynchronous (non-blocking)
    // This is the main bottleneck - don't wait for it
    setImmediate(async () => {
      try {
        await removePostsFromFeedOnUnfollow(follower_id, id);
        console.log(`✅ Removed posts from feed for follower ${follower_id}`);
      } catch (removeError) {
        console.error(
          "⚠️ Error removing posts from feed on unfollow:",
          removeError
        );
        await invalidateFeedCache(follower_id).catch(console.error);
      }
    });

    await Promise.all([follower.reload(), userToUnfollow.reload()]);

    if (userToUnfollow.followers_count < 10000 && userToUnfollow.is_celebrity) {
      userToUnfollow.update({ is_celebrity: false }).catch(console.error);
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
