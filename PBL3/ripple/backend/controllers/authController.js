import AuthService from "../services/authService.js";
import { COOKIE_OPTIONS, REFRESH_COOKIE_OPTIONS } from "../utils/cookies.js";
import User from "../models/User.js"; // User model

class AuthController {
  static async signup(req, res) {
    try {
      const result = await AuthService.signup(req.body);

      res.cookie("accessToken", result.accessToken, COOKIE_OPTIONS);
      res.cookie("refreshToken", result.refreshToken, REFRESH_COOKIE_OPTIONS);

      res.status(201).json({
        message: "User created Successfully",
        user: result.user,
      });
    } catch (error) {
      console.error("Signup error:", error);
      if (error.message === "User already exits") {
        return res.status(409).json({ error: error.message });
      }
      res.status(500).json({ message: error.message });
    }
  }

  static async login(req, res) {
    try {
      const { email, password } = req.body;
      const result = await AuthService.login(email, password);

      res.cookie("accessToken", result.accessToken, COOKIE_OPTIONS);
      res.cookie("refreshToken", result.refreshToken, REFRESH_COOKIE_OPTIONS);

      res.status(200).json({
        message: "Login Successfully",
        token: result.accessToken,
        user: result.user,
      });
    } catch (error) {
      console.error("Login error:", error);
      if (
        error.message === "Invalid credentials" ||
        error.message === "Invalid password"
      ) {
        return res.status(401).json({ error: error.message });
      }
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  static async refresh(req, res) {
    try {
      const refreshToken = req.cookies.refreshToken;

      if (!refreshToken) {
        return res.status(401).json({ error: "Refresh token error" });
      }

      const accessToken = await AuthService.refreshToken(refreshToken);

      res.cookie("accessToken", accessToken, COOKIE_OPTIONS);

      res.json({ message: "Token refresh successfully" });
    } catch (error) {
      console.error("Refresh error: ", error);
      if (
        error.message === "TokenExpiredError" ||
        error.message.includes("invalid")
      ) {
        return res
          .status(403)
          .json({ error: "Invalid or expired refresh token" });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  }

  static async logout(req, res) {
    try {
      const refreshToken = req.cookies.refreshToken;
      await AuthService.logout(refreshToken);

      res.clearCookie("accessToken");
      res.clearCookie("refreshToken", { path: "/api/auth/refresh" });

      res.json({ message: "Logout successfully" });
    } catch (error) {
      console.error("Logout error: ", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  static async me(req, res) {
    res.json({ user: req.user });
  }

  // New endpoint for user profile stats
  static async getProfileStats(req, res) {
    try {
      // Fetch full user data with stats
      const user = await User.findById(req.user._id).select('-passwordHash');
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Return user with all stats
      res.json({ 
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          streak: user.streak,
          rippleStats: user.rippleStats,
          badges: user.badges,
          createdAt: user.createdAt
        }
      });
    } catch (error) {
      console.error("Profile stats error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
}

export default AuthController;