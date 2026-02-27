/*
Note:
 - Global error handler (Express error middleware).
 - Must be registered last (after all routes) so any error passed to next(err)
 - from controllers or middleware is caught here.
 - Uses err.statusCode when present (e.g. ValidationError → 400, ConflictError → 409).
 - Returns JSON { error: message } and never leaks stack/details for 500.
 */
function errorHandler(err, req, res, next) {
    const status = typeof err.statusCode === "number" && err.statusCode >= 400 && err.statusCode < 600
      ? err.statusCode
      : 500;
  
    const message = status === 500 ? "Internal server error" : err.message;
  
    if (status === 500) {
      console.error(err);
    }
  
    res.status(status).json({ error: message });
  }
  
  module.exports = errorHandler;
