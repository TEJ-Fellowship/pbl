/**
 * User Context Middleware
 * Ensures user_id is available for all database queries
 * Must be used after authenticateToken middleware
 */
export const userContext = (req, res, next) => {
  try {
    // Get user_id from authenticated user (set by auth middleware)
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User context required",
        message: "Authentication required to access this resource",
      });
    }

    // Store user_id in request object for easy access
    req.userId = userId;

    next();
  } catch (error) {
    console.error("User context middleware error:", error);
    return res.status(500).json({
      success: false,
      error: "Context error",
      message: "Failed to set user context",
    });
  }
};

/**
 * Optional User Context
 * Sets userId if user is authenticated, but doesn't require it
 */
export const optionalUserContext = (req, res, next) => {
  try {
    const userId = req.user?.id;

    if (userId) {
      req.userId = userId;
    }

    next();
  } catch (error) {
    next();
  }
};

export default {
  userContext,
  optionalUserContext,
};
