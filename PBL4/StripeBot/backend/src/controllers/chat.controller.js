const { AppError } = require("../utils/AppError");

const handleChatQuery = async (req, res, next) => {
  try {
    const { message } = req.body || {};

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_MESSAGE", //'code' is a machine-readable identifier
          message: "message is required and must be a non-empty string",
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        reply: "Placeholder response from /api/chat", //'reply' clearly indicates this is the response from the chat system; chosen to clearly show it is the output, follow chat API naming conventions, and separate from user input
        receivedMessage: message,
      },
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = { handleChatQuery };
