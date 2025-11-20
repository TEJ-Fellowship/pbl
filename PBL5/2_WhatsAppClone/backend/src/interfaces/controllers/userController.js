// User controller

import { User } from "../../infrastructure/db/postgresRepository.js";

export const createUser = async (req, res) => {
  try {
    const { name, phone } = req.body;

    // Validate required fields
    if (!name || !phone) {
      return res.status(400).json({
        error: "Missing required fields",
        required: ["name", "phone"],
      });
    }

    // Create user (user_id will be auto-generated)
    const user = await User.create({
      name,
      phone,
    });

    res.status(201).json({
      message: "User created successfully",
      data: {
        user_id: user.user_id,
        name: user.name,
        phone: user.phone,
        created_at: user.created_at,
      },
    });
  } catch (error) {
    console.error("Error creating user:", error);
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({
        error: "Phone number already exists",
        details: "A user with this phone number already exists",
      });
    }
    res.status(500).json({
      error: "Failed to create user",
      details: error.message,
    });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ["user_id", "name", "phone", "created_at"],
      order: [["created_at", "DESC"]],
    });

    res.json({
      message: "Users retrieved successfully",
      data: users,
    });
  } catch (error) {
    console.error("Error getting users:", error);
    res.status(500).json({
      error: "Failed to get users",
      details: error.message,
    });
  }
};

export const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findByPk(userId, {
      attributes: ["user_id", "name", "phone", "created_at"],
    });

    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    res.json({
      message: "User retrieved successfully",
      data: user,
    });
  } catch (error) {
    console.error("Error getting user:", error);
    res.status(500).json({
      error: "Failed to get user",
      details: error.message,
    });
  }
};
