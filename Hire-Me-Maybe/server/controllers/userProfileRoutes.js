const express = require("express");
const User = require("../models/user");
const userProfileRouter = express.Router();

// GET all users
userProfileRouter.get("/", async (req, res) => {
  try {
    // Exclude password field
    const users = await User.find({}, { password: 0 });

    res.json({
      success: true,
      message: "Users retrieved successfully",
      count: users.length,
      data: users,
    });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// GET user by ID
userProfileRouter.get("/:id", async (req, res) => {
  try {
    // Exclude password
    const user = await User.findById(req.params.id, { password: 0 });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      message: "User retrieved successfully",
      data: user,
    });
  } catch (error) {
    console.error("Get user error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format",
      });
    }

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

module.exports = userProfileRouter;
