import express from "express";
import {
  createPost,
  getPostById,
  getPostsByUser,
  getAllPosts,
  getUserFeed,
} from "../controllers/postController.js";
import {
  postCreateLimiter,
  feedFetchLimiter,
  apiLimiter,
} from "../middleware/rateLimiter.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const router = express.Router();

// Apply rate limiting and wrap async handlers
router.post("/", postCreateLimiter, asyncHandler(createPost));
router.get("/", apiLimiter, asyncHandler(getAllPosts));
router.get("/feed/:user_id", feedFetchLimiter, asyncHandler(getUserFeed)); // Must be before /:id to avoid route conflicts
router.get("/user/:user_id", apiLimiter, asyncHandler(getPostsByUser));
router.get("/:id", apiLimiter, asyncHandler(getPostById));

export default router;
