const { AppError } = require("../utils/AppError");
const { ERROR_CODES, RESPONSE_MESSAGES } = require("../constants/apiResponse");
const {
  generateAIResponse,
  rewriteQuery,
} = require("../services/gemini.service");

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

    const rewrittenQuery = await rewriteQuery(userPrompt);

    /*
    TODO: This PR intentionally validates rewrite flow end-to-end.
    Next PR will use rewrittenQuery for embedding/search and improve this flow.
    */
    const aiResponse = await generateAIResponse(rewrittenQuery);

    return res.status(200).json({
      success: true,
      data: {
        //'reply' clearly indicates this is the response from the chat system; chosen to clearly show it is the output, follow chat API naming conventions, and separate from user input
        reply: aiResponse,
        userInput: userPrompt,
        rewrittenQuery, //// Temporary: exposed for rewrite verification during this phase.
      },
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = { handleChatQuery };
