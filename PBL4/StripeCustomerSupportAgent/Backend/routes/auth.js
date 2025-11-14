import express from "express";
import {
  register,
  login,
  refreshAccessToken,
  getProfile,
  updateProfile,
  changePassword,
  deleteAccount,
} from "../controllers/authController.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// ============================================================================
// Public Routes (No authentication required)
// ============================================================================

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post("/register", register);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post("/login", login);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post("/refresh", refreshAccessToken);

// ============================================================================
// Protected Routes (Authentication required)
// ============================================================================

/**
 * @route   GET /api/auth/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get("/profile", authenticateToken, getProfile);

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put("/profile", authenticateToken, updateProfile);

/**
 * @route   PUT /api/auth/password
 * @desc    Change password
 * @access  Private
 */
router.put("/password", authenticateToken, changePassword);

/**
 * @route   DELETE /api/auth/account
 * @desc    Delete user account
 * @access  Private
 */
router.delete("/account", authenticateToken, deleteAccount);

// ============================================================================
// Test/Health Routes
// ============================================================================

/**
 * @route   GET /api/auth/test
 * @desc    Test auth endpoint
 * @access  Public
 */
router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Auth routes are working!",
    endpoints: {
      public: ["/register", "/login", "/refresh"],
      protected: ["/profile", "/password", "/account"],
    },
  });
});

/**
 * @route   GET /api/auth/verify
 * @desc    Verify if token is valid
 * @access  Private
 */
router.get("/verify", authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: "Token is valid",
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
    },
  });
});

export default router;
