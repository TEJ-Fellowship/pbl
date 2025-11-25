import jwt from "jsonwebtoken";
import config from "../config/config.js";

/**
 * Authentication Middleware
 * Verifies JWT token and adds user info to request
 */
export const authenticateToken = (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
        message: "No token provided",
      });
    }

    // Verify token
    jwt.verify(token, config.JWT_SECRET, (err, user) => {
      if (err) {
        if (err.name === "TokenExpiredError") {
          return res.status(401).json({
            success: false,
            error: "Token expired",
            message: "Please login again",
          });
        }

        return res.status(403).json({
          success: false,
          error: "Invalid token",
          message: "Authentication failed",
        });
      }

      // Add user info to request
      req.user = user;
      next();
    });
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(500).json({
      success: false,
      error: "Authentication error",
      message: "Internal server error",
    });
  }
};

/**
 * Optional Authentication Middleware
 * Adds user info if token is present, but doesn't require it
 */
export const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return next();
    }

    jwt.verify(token, config.JWT_SECRET, (err, user) => {
      if (!err) {
        req.user = user;
      }
      next();
    });
  } catch (error) {
    next();
  }
};

/**
 * Generate JWT Token
 */
export const generateToken = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    name: user.name,
  };

  return jwt.sign(payload, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRATION || "7d",
  });
};

/**
 * Generate Refresh Token (longer expiration)
 */
export const generateRefreshToken = (user) => {
  const payload = {
    id: user.id,
    type: "refresh",
  };

  return jwt.sign(payload, config.JWT_SECRET, {
    expiresIn: "30d",
  });
};

/**
 * Verify Refresh Token
 */
export const verifyRefreshToken = (token) => {
  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);

    if (decoded.type !== "refresh") {
      throw new Error("Invalid token type");
    }

    return decoded;
  } catch (error) {
    throw error;
  }
};

export default {
  authenticateToken,
  optionalAuth,
  generateToken,
  generateRefreshToken,
  verifyRefreshToken,
};
