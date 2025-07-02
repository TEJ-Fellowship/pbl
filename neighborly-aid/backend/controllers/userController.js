const userService = require("../services/userService.js");
const mongoose = require("mongoose");

const getAllUsersController = async (req, res) => {
  try {
    const result = await userService.getAllUsers();
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};

const getUserDashboardController = async (req, res) => {
  console.log("getUserDashboardController", req.params.userId);
  try {
    const userId = req.params.userId;

    // Validate if userId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        error: "Invalid user ID format",
      });
    }

    const result = await userService.getUserDashboard(userId);
    res.status(200).json(result);
  } catch (error) {
    console.error("Error in getUserDashboardController:", error);
    res.status(500).json({
      error: error.message,
    });
  }
};

const createUserController = async (req, res) => {
  const data = req.body;
  try {
    const user = await userService.createUser(data);
    res.status(201).json(user);
  } catch (error) {
    console.log("errorrrr", error);
    if (error.name === "ValidationError") {
      return res.status(400).json({ error: error.message }); // 400 for validation errors
    }
    if (error.code === 11000) {
      return res.status(409).json({ error: "Email or phone already exists" }); // 🔹 409 for duplicate entry
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  getAllUsersController,
  createUserController,
  getUserDashboardController,
};
