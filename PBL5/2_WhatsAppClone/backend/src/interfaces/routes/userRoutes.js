// User routes

import express from "express";
import { createUser, getAllUsers, getUserById } from "../controllers/userController.js";

const router = express.Router();

// POST create a new user
router.post("/", createUser);

// GET all users
router.get("/", getAllUsers);

// GET user by ID
router.get("/:userId", getUserById);

export default router;
