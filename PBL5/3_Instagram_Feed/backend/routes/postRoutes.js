import express from "express";
import {
  createPost,
  getPostById,
  getPostsByUser,
  getAllPosts,
} from "../controllers/postController.js";

const router = express.Router();

router.post("/", createPost);
router.get("/", getAllPosts);
router.get("/:id", getPostById);
router.get("/user/:user_id", getPostsByUser);

export default router;
