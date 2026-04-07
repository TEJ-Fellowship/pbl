// Constants for API error codes
const ERROR_CODES = {
  INVALID_PROMPT: "INVALID_PROMPT",
  INTERNAL_SERVER_ERROR: "INTERNAL_SERVER_ERROR",
  GENERIC_ERROR: "ERROR",
};

// Constants for API response messages
const RESPONSE_MESSAGES = {
  INVALID_PROMPT: "prompt is required and must be a non-empty string",
  INTERNAL_SERVER_ERROR: "Something went wrong while processing the request",
  GENERIC_ERROR: "Request failed",
};

module.exports = {
  ERROR_CODES,
  RESPONSE_MESSAGES,
};
