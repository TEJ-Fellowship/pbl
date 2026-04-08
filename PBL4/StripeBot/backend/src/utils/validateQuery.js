const { AppError } = require("./AppError");
const { ERROR_CODES, RESPONSE_MESSAGES } = require("../constants/apiResponse");

const DEFAULT_MAX_QUERY_LENGTH = 1000;

/**
 * Validates and normalizes user query input.
 * - Ensures string input
 * - Trims whitespace
 * - Rejects empty query
 * - Enforces max length (throws by default, optionally truncates)
 * 
 * Parameters:
 * - input: The user query string to validate
 * - options: An object with optional settings:
 *   - maxLength: The maximum length of the query (default: DEFAULT_MAX_QUERY_LENGTH)
 *  - truncate: Whether to truncate the query if it exceeds maxLength (default: false)
 */
function validateQuery(
  input,
  { maxLength = DEFAULT_MAX_QUERY_LENGTH, truncate = false } = {},
) {
  if (typeof input !== "string") {
    throw new AppError(
      400,
      ERROR_CODES.INVALID_PROMPT,
      RESPONSE_MESSAGES.INVALID_PROMPT,
    );
  }

  const query = input.trim();

  if (!query) {
    throw new AppError(
      400,
      ERROR_CODES.INVALID_PROMPT,
      RESPONSE_MESSAGES.INVALID_PROMPT,
    );
  }

  if (query.length > maxLength) {
    if (truncate) {
      return query.slice(0, maxLength);
    }

    // Keeps current error contract without requiring new error constants yet
    throw new AppError(
      400,
      ERROR_CODES.INVALID_PROMPT,
      RESPONSE_MESSAGES.QUERY_TOO_LONG,
    );
  }

  return query;
}

module.exports = { validateQuery, DEFAULT_MAX_QUERY_LENGTH };
