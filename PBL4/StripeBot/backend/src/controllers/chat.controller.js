const { AppError } = require("../utils/AppError");
const { ERROR_CODES, RESPONSE_MESSAGES } = require("../constants/apiResponse");

const handleChatQuery = async (req, res, next) => {
  try {
    const { prompt } = req.body || {};
    const userPrompt = typeof prompt === "string" ? prompt.trim() : "";

    if (!userPrompt) {
      return next(
        new AppError(
          400,
          ERROR_CODES.INVALID_PROMPT,
          RESPONSE_MESSAGES.INVALID_PROMPT,
        ),
      );
    }

    return res.status(200).json({
      success: true,
      data: {
        //'reply' clearly indicates this is the response from the chat system; chosen to clearly show it is the output, follow chat API naming conventions, and separate from user input
        reply: "Placeholder response from /api/chat",
        userInput: userPrompt,
      },
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = { handleChatQuery };
