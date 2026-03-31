const ApiError = require("../utils/ApiError");

function validateCreateLibraryBook(req, res, next) {
  const { title, googleBookId } = req.body;
  if (!title || !googleBookId) {
    return next(new ApiError(400, "title and googleBookId are required"));
  }
  next();
}

module.exports = { validateCreateLibraryBook };
