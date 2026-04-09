// Constants for API error codes
const ERROR_CODES = {
  INVALID_PROMPT: "INVALID_PROMPT",
  INTERNAL_SERVER_ERROR: "INTERNAL_SERVER_ERROR",
  GENERIC_ERROR: "ERROR",
  AI_TIMEOUT: "AI_TIMEOUT",
  EMPTY_AI_RESPONSE: "EMPTY_AI_RESPONSE",
  AI_GENERATION_FAILED: "AI_GENERATION_FAILED",
};

// Constants for API response messages
const RESPONSE_MESSAGES = {
  INVALID_PROMPT: "prompt is required and must be a non-empty string",
  INTERNAL_SERVER_ERROR: "Something went wrong while processing the request",
  GENERIC_ERROR: "Request failed",
  AI_TIMEOUT: "AI provider timed out",
  EMPTY_AI_RESPONSE: "AI returned an empty response",
  AI_GENERATION_FAILED: "Failed to generate AI response",
};

module.exports = {
  ERROR_CODES,
  RESPONSE_MESSAGES,
};
