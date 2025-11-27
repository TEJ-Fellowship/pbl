import express from "express";
import {
  createPost,
  getPostById,
  getPostsByUser,
  getAllPosts,
  getUserFeed,
} from "../controllers/postController.js";

const router = express.Router();

router.post("/", createPost);
router.get("/", getAllPosts);
router.get("/feed/:user_id", getUserFeed); // Must be before /:id to avoid route conflicts
router.get("/user/:user_id", getPostsByUser);
router.get("/:id", getPostById);

export default router;
