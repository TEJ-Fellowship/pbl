// global error handler for API errors
function errorHandler(err, req, res, next) {
  const status = err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  const details = err.details || null;
  return res.status(status).json({
    error: {
      message,
      details,
    },
  });
}

module.exports = errorHandler;
