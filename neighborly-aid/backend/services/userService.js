const User = require("../models/User.js");
const Task = require("../models/Task.js");
const Review = require("../models/Review.js");

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
    const user = await User.findById(userId);

    // Get completed tasks
    const completedTasks = await Task.find({
      $or: [
        { createdBy: userId, status: "completed" },
        { helpers: userId, status: "completed" },
      ],
    })
      .populate("createdBy", "name email")
      .populate("helpers", "name email")
      .sort({ completedAt: -1 });

    // Get reviews received
    const reviews = await Review.find({ reviewee: userId })
      .populate("reviewer", "name email")
      .populate("task", "title")
      .sort({ createdAt: -1 });

    // Calculate average rating
    const ratingStats = await Review.aggregate([
      { $match: { reviewee: userId } },
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
