const mongoose = require("mongoose");
const User = require("../models/User.js");
const Task = require("../models/Task.js");
const Review = require("../models/Review.js");
const { COMPLETED } = require("../utils/constants");

const getAllUsers = async () => {
  try {
    console.log("UserService: getAllUsers");
    const userList = await User.find({});
    console.log("userList", userList);
    return userList;
  } catch (error) {
    console.log("Error fetching users", error);
    throw error;
  }
};

const createUser = async (data) => {
  try {
    const user = await User.create(data);
    return user;
  } catch (error) {
    console.log("Error creating user", error);
    throw error;
  }
};

const getUserDashboard = async (userId) => {
  try {
    console.log(
      "getUserDashboard called with userId:",
      userId,
      "type:",
      typeof userId
    );

    // Validate userId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error("Invalid user ID format");
    }

    const user = await User.findById(new mongoose.Types.ObjectId(userId));
    console.log("user in service", user);

    if (!user) {
      throw new Error("User not found");
    }

    // Ensure availableKarmaPoints exists (for backward compatibility)
    if (
      user.availableKarmaPoints === undefined ||
      user.availableKarmaPoints === null
    ) {
      user.availableKarmaPoints = user.karmaPoints || 1000;
      await user.save();
    }

    // Get completed tasks with category populated
    const completedTasks = await Task.find({
      $or: [
        { createdBy: new mongoose.Types.ObjectId(userId), status: COMPLETED },
        {
          "helpers.userId": new mongoose.Types.ObjectId(userId),
          status: COMPLETED,
        },
      ],
    })
      .populate("createdBy", "name email")
      .populate("category", "displayName icon color")
      .populate({
        path: "helpers.userId",
        select: "name email",
      })
      .sort({ completedAt: -1 });

    // Get reviews received
    const reviews = await Review.find({
      reviewee: new mongoose.Types.ObjectId(userId),
    })
      .populate("reviewer", "name email")
      .populate("task", "title")
      .sort({ createdAt: -1 });

    // Calculate average rating
    const ratingStats = await Review.aggregate([
      { $match: { reviewee: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
        },
      },
    ]);

    const dashboardData = {
      ...user.toObject(),
      completedTasks,
      reviews,
      averageRating: ratingStats[0]?.averageRating || 0,
      totalReviews: ratingStats[0]?.totalReviews || 0,
    };

    return dashboardData;
  } catch (error) {
    console.log("Error fetching user dashboard", error);
    throw error;
  }
};

module.exports = {
  getAllUsers,
  createUser,
  getUserDashboard,
};
