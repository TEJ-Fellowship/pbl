const mongoose = require("mongoose");
const User = require("../models/User.js");
const Task = require("../models/Task.js");
const { COMPLETED } = require("../utils/constants");

const getLeaderboardData = async () => {
  try {
    // Aggregate users with their statistics
    const leaderboardData = await User.aggregate([
      {
        $lookup: {
          from: "tasks",
          localField: "_id",
          foreignField: "createdBy",
          as: "postedTasks",
        },
      },
      {
        $lookup: {
          from: "tasks",
          localField: "_id",
          foreignField: "helpers.userId",
          as: "helpedTasks",
        },
      },
      {
        $addFields: {
          completedTasksCount: {
            $size: {
              $filter: {
                input: "$postedTasks",
                cond: { $eq: ["$$this.status", COMPLETED] },
              },
            },
          },
          helpedTasksCount: {
            $size: {
              $filter: {
                input: "$helpedTasks",
                cond: { $eq: ["$$this.status", COMPLETED] },
              },
            },
          },
          totalTasksCompleted: {
            $add: [
              {
                $size: {
                  $filter: {
                    input: "$postedTasks",
                    cond: { $eq: ["$$this.status", COMPLETED] },
                  },
                },
              },
              {
                $size: {
                  $filter: {
                    input: "$helpedTasks",
                    cond: { $eq: ["$$this.status", COMPLETED] },
                  },
                },
              },
            ],
          },
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          email: 1,
          role: 1,
          karmaPoints: 1,
          totalLikes: 1,
          badges: 1,
          completedTasksCount: 1,
          helpedTasksCount: 1,
          totalTasksCompleted: 1,
          createdAt: 1,
        },
      },
      {
        $sort: { karmaPoints: -1 },
      },
    ]);

    // Add rank to each user
    const rankedData = leaderboardData.map((user, index) => ({
      ...user,
      rank: index + 1,
      avatar: user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2),
    }));

    return rankedData;
  } catch (error) {
    console.log("Error fetching leaderboard data", error);
    throw error;
  }
};

const getLeaderboardStats = async () => {
  try {
    const stats = await User.aggregate([
      {
        $group: {
          _id: null,
          totalMembers: { $sum: 1 },
          totalKarma: { $sum: "$karmaPoints" },
          totalLikes: { $sum: "$totalLikes" },
          avgKarma: { $avg: "$karmaPoints" },
        },
      },
    ]);

    // Get total completed tasks
    const totalCompletedTasks = await Task.countDocuments({
      status: COMPLETED,
    });

    return {
      totalMembers: stats[0]?.totalMembers || 0,
      totalKarma: stats[0]?.totalKarma || 0,
      totalLikes: stats[0]?.totalLikes || 0,
      totalCompletedTasks,
      avgKarma: Math.round(stats[0]?.avgKarma || 0),
    };
  } catch (error) {
    console.log("Error fetching leaderboard stats", error);
    throw error;
  }
};

module.exports = {
  getLeaderboardData,
  getLeaderboardStats,
};
