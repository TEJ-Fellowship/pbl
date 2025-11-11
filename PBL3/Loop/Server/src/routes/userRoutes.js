// Fixed userRoutes.js
import express from "express";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Get logged-in user's profile
router.get("/me", protect, (req, res) => {
  if (!req.user) {
    return res.status(404).json({ message: "User not found" });
  }
  
  // FIXED: Consistent user object structure
  res.json({
    id: req.user._id,        // Add id field
    _id: req.user._id,       // Keep _id field
    username: req.user.username,
    email: req.user.email,
    name: req.user.username, // Add name field for consistency
  });
});

export default router;