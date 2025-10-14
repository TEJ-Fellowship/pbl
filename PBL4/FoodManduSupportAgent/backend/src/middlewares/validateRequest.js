// Request validation middleware
export const validateChatRequest = (req, res, next) => {
  const { question } = req.body;

  if (!question) {
    return res.status(400).json({
      success: false,
      error: "Question is required in request body",
    });
  }

  if (typeof question !== "string") {
    return res.status(400).json({
      success: false,
      error: "Question must be a string",
    });
  }

  if (question.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: "Question cannot be empty",
    });
  }

  if (question.length > 1000) {
    return res.status(400).json({
      success: false,
      error: "Question is too long (max 1000 characters)",
    });
  }

  // Sanitize the question
  req.body.question = question.trim();

  next();
};
