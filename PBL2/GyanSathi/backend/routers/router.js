import express from "express";
import {
  createPost,
  deletePost,
  getAllNote,
  updatePost,
} from "../controllers/controller.js";
const router = express.Router();

router.get("/", getAllNote);

router.post("/", createPost);

router.put("/:id", updatePost);

router.delete("/:id", deletePost);

export default router;
