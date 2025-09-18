import express from "express";
import { protect } from "../middleware/authMiddleware.js"; // or authMiddleware.js

const router = express.Router();

// Get logged-in user's profile
router.get("/me", protect, (req, res) => {
  if (!req.user) {
    return res.status(404).json({ message: "User not found" });
  }
  res.json({
    username: req.user.username,
    email: req.user.email,
  });
});

export default router;
