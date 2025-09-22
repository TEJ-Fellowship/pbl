import express from "express";
const router = express.Router();

import AuthController from "../controllers/authController.js";
import { signupValidation, loginValidation } from "../validations/auth.js";
import authenticateToken from "../middlewares/auth.js";
import UserStatsService from "../services/userStatsService.js"; //userstats imported

router.post("/signup", signupValidation, AuthController.signup);
router.post("/login", loginValidation, AuthController.login);
router.post("/refresh", AuthController.refresh);
router.post("/logout", authenticateToken, AuthController.logout);
router.get("/me", authenticateToken, AuthController.me);

router.get("/profile-stats", authenticateToken, async (req, res) => {
  try {
    const stats = await UserStatsService.getUserStats(req.user.userId);
    if (!stats) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ user: stats });
  } catch (error) {
    console.error("Profile stats error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
