const ApiError = require("../utils/ApiError");

function validateCreateShelf(req, res, next) {
  const name = req.body?.name;
  if (!name || !String(name).trim()) {
    return next(new ApiError(400, "name is required"));
  }
  next();
}

function validateUpdateShelf(req, res, next) {
  return validateCreateShelf(req, res, next);
}

function validateAddBookBody(req, res, next) {
  if (!req.body?.bookId) {
    return next(new ApiError(400, "bookId is required"));
  }
  next();
}

module.exports = {
  validateCreateShelf,
  validateUpdateShelf,
  validateAddBookBody,
};
