// routes/userRoutes.js
import express from "express";
import { signupUser, loginUser } from "../controllers/users.js";

const router = express.Router();

// @route POST /api/users/signup
router.post("/signup", signupUser);

// @route POST /api/users/login
router.post("/login", loginUser);

export default router;
