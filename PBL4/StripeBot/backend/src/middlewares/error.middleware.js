/**
 * Central error formatter. Must be registered after all routes.
 * Pass errors with: next(err) or throw from sync code.
 * For async handlers, call next(err) in catch (Express 4 does not auto-catch promises).
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
        ? "INTERNAL_SERVER_ERROR"
        : "ERROR";

  const message =
    statusCode === 500
      ? "Something went wrong while processing the request"
      : err.message || "Request failed";

  if (statusCode === 500) {
    console.error(err);
  }

  res.status(statusCode).json({
    success: false,
    error: { code, message },
  });
}

module.exports = { errorMiddleware };
