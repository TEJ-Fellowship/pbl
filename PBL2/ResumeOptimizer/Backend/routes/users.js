// routes/users.js
import express from "express";
import { signupUser, loginUser } from "../controllers/users.js";

const router = express.Router();

// POST /api/users → Signup
router.post("/", signupUser);

// POST /api/users/login → Login
router.post("/login", loginUser);

export default router;
