const { validateQuery } = require("../utils/validateQuery");
const { ERROR_CODES, RESPONSE_MESSAGES } = require("../constants/apiResponse");
const { REWRITE_FALLBACK_WARN_MESSAGE } = require("../constants/aiPrompts");
const {
  generateAIResponse,
  rewriteQuery,
} = require("../services/gemini.service");

const handleChatQuery = async (req, res, next) => {
  try {
    const { prompt } = req.body || {};
    const userPrompt = validateQuery(prompt);

    let rewrittenQuery = userPrompt;
    try {
      rewrittenQuery = await rewriteQuery(userPrompt);
    } catch (error) {
      // Fallback behavior: if rewrite fails, continue with original prompt.
      console.warn(REWRITE_FALLBACK_WARN_MESSAGE, {
        message: error?.message,
        code: error?.code,
      });
    }

    /*
    TODO(#887): This PR intentionally validates rewrite flow end-to-end.
    Next PR will use rewrittenQuery for embedding/search and improve this flow.
    */
    const aiResponse = await generateAIResponse(rewrittenQuery);

    return res.status(200).json({
      success: true,
      data: {
        //'reply' clearly indicates this is the response from the chat system; chosen to clearly show it is the output, follow chat API naming conventions, and separate from user input
        reply: aiResponse,
        userInput: userPrompt,
        rewrittenQuery, // Temporary: exposed for rewrite verification during this phase.
      },
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = { handleChatQuery };
