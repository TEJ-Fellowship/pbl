import express from "express";
import { signup, login } from "../controllers/authController.js";
const router = express.Router();

// Signup and login routes
router.post("/signup", signup);
router.post("/login", login);

// Logout route
router.post("/logout", (req, res) => {
  // If using cookies:
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: "Strict",
    secure: process.env.NODE_ENV === "production",
  });

//   req.session.destroy();

  return res.json({ message: "Logged out successfully" });
});

export default router;
