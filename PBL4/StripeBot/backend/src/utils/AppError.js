// Custom error class to standardize API error responses with statusCode and error code
class AppError extends Error {
  constructor(statusCode, code, message) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}
module.exports = { AppError };
