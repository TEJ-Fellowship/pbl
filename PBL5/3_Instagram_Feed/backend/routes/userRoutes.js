import express from "express";
import {
  createUser,
  getAllUsers,
  getUserById,
  followUser,
  unfollowUser,
} from "../controllers/userController.js";

const router = express.Router();

// POST /api/users - Create a new user
router.post("/", createUser);

// GET /api/users - Get all users
router.get("/", getAllUsers);

// POST /api/users/:id/follow - Follow a user
router.post("/:id/follow", followUser);

// POST /api/users/:id/unfollow - Unfollow a user
router.post("/:id/unfollow", unfollowUser);

// GET /api/users/:id - Get user by ID (must be last to avoid route conflicts)
router.get("/:id", getUserById);

export default router;
