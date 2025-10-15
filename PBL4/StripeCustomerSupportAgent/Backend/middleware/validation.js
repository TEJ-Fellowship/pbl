/**
 * Validation middleware for chat requests
 */
export const validateChatRequest = (req, res, next) => {
  try {
    const { message, sessionId, userId } = req.body;

    // Validate required fields
    if (
      !message ||
      typeof message !== "string" ||
      message.trim().length === 0
    ) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        message: "Message is required and must be a non-empty string",
      });
    }

    // Validate message length
    if (message.length > 2000) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        message: "Message must be less than 2000 characters",
      });
    }

    // Validate sessionId format if provided
    if (sessionId && typeof sessionId !== "string") {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        message: "SessionId must be a string",
      });
    }

    // Validate userId format if provided
    if (userId && typeof userId !== "string") {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        message: "UserId must be a string",
      });
    }

    // Sanitize input
    req.body.message = message.trim();
    req.body.sessionId = sessionId?.trim();
    req.body.userId = userId?.trim() || "anonymous";

    next();
  } catch (error) {
    res.status(400).json({
      success: false,
      error: "Validation failed",
      message: error.message,
    });
  }
};

/**
 * Validate session ID parameter
 */
export const validateSessionId = (req, res, next) => {
  try {
    const { sessionId } = req.params;

    if (
      !sessionId ||
      typeof sessionId !== "string" ||
      sessionId.trim().length === 0
    ) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        message: "Valid sessionId is required",
      });
    }

    req.params.sessionId = sessionId.trim();
    next();
  } catch (error) {
    res.status(400).json({
      success: false,
      error: "Validation failed",
      message: error.message,
    });
  }
};

/**
 * Validate query parameters for pagination
 */
export const validatePagination = (req, res, next) => {
  try {
    const { limit, offset } = req.query;

    // Validate limit
    if (
      limit &&
      (isNaN(limit) || parseInt(limit) < 1 || parseInt(limit) > 100)
    ) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        message: "Limit must be a number between 1 and 100",
      });
    }

    // Validate offset
    if (offset && (isNaN(offset) || parseInt(offset) < 0)) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        message: "Offset must be a non-negative number",
      });
    }

    // Set defaults
    req.query.limit = limit ? parseInt(limit) : 50;
    req.query.offset = offset ? parseInt(offset) : 0;

    next();
  } catch (error) {
    res.status(400).json({
      success: false,
      error: "Validation failed",
      message: error.message,
    });
  }
};
