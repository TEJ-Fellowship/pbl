const { ERROR_CODES, RESPONSE_MESSAGES } = require("../constants/apiResponse");

/**
 * Central error formatter. Must be registered after all routes.
 * Pass errors with: next(err) or throw from sync code.
 * For async handlers, call next(err) in catch.
 */
function errorMiddleware(err, req, res, next) {
  // If headers already sent, delegate to default Express behavior
  if (res.headersSent) {
    return next(err);
  }

  const statusCode =
    typeof err.statusCode === "number" &&
    err.statusCode >= 400 &&
    err.statusCode < 600
      ? err.statusCode
      : 500;

  const code =
    typeof err.code === "string" && err.code.length > 0
      ? err.code
      : statusCode === 500
        ? ERROR_CODES.INTERNAL_SERVER_ERROR
        : ERROR_CODES.GENERIC_ERROR;

  const message =
    statusCode === 500
      ? RESPONSE_MESSAGES.INTERNAL_SERVER_ERROR
      : err.message || RESPONSE_MESSAGES.GENERIC_ERROR;

  if (statusCode === 500) {
    console.error(err);
  }

  res.status(statusCode).json({
    success: false,
    error: { code, message },
  });
}

module.exports = { errorMiddleware };
