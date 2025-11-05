import jwt from "jsonwebtoken";
import config from "../config/config.js";

/**
 * Optional Authentication Middleware
 * Allows both authenticated and anonymous users to access routes
 * Sets req.userId if authenticated, or marks as anonymous
 */
export const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // No auth header - treat as anonymous
    if (!authHeader) {
      req.isAnonymous = true;
      req.userId = null;
      console.log("🔓 Anonymous user access");
      return next();
    }

    // Has auth header - try to verify token
    const token = authHeader.split(" ")[1];

    if (!token) {
      req.isAnonymous = true;
      req.userId = null;
      console.log("🔓 Anonymous user access (no token)");
      return next();
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, config.security.JWT_SECRET);
      req.userId = decoded.id;
      req.user = decoded;
      req.isAnonymous = false;
      console.log(`✅ Authenticated user: ${decoded.id}`);
      next();
    } catch (jwtError) {
      // Invalid token - treat as anonymous
      console.log("⚠️ Invalid token, treating as anonymous:", jwtError.message);
      req.isAnonymous = true;
      req.userId = null;
      next();
    }
  } catch (error) {
    console.error("❌ Optional auth error:", error);
    // On error, allow as anonymous rather than blocking
    req.isAnonymous = true;
    req.userId = null;
    next();
  }
};

/**
 * Require either authenticated or anonymous user ID
 * For routes that need a user ID (even if anonymous)
 */
export const requireUserId = (req, res, next) => {
  // Check for authenticated user ID
  if (req.userId) {
    return next();
  }

  // Check for anonymous user ID in body or query
  const anonymousUserId =
    req.body?.userId || req.query?.userId || req.params?.userId;

  if (anonymousUserId) {
    req.userId = anonymousUserId;
    req.isAnonymous = true;
    return next();
  }

  // No user ID found
  return res.status(400).json({
    success: false,
    message: "User ID required. Please login or provide an anonymous user ID.",
  });
};

export default optionalAuth;
