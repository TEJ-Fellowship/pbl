// global error handler for API errors
function errorHandler(err, req, res, next) {
  const status = err.statusCode || 500;

  const message =
    status >= 500 ? "Internal Server Error" : err.message || "Bad Request";
  const details = err.details ?? null;
  if (status >= 500) {
    console.error(err);
  }
  return res.status(status).json({
    error: {
      message,
      details,
    },
  });
}

module.exports = errorHandler;
