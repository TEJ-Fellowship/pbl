//validators: its a middleware that runs before the controller and validates (checks) the request data

const ApiError = require("../utils/ApiError");

function validateSearchBooksQuery(req, res, next) {
  const { q, startIndex } = req.query;

  if (q !== undefined && typeof q !== "string") {
    return next(new ApiError(400, "q must be a string"));
  }

  //validate startIndex, if it is defined, it must be a non-negative integer
  if (startIndex !== undefined) {
    const parsed = Number(startIndex);
    if (
      String(startIndex).trim() === "" ||
      !Number.isInteger(parsed) ||
      parsed < 0
    ) {
      return next(
        new ApiError(400, "StartIndex must be a non-negative integer"),
      );
    }
  }
  return next();
}

function validateBookId(req, res, next) {
  const { id } = req.params;

  if (!id || !String(id).trim()) {
    return next(new ApiError(400, "Book ID is required"));
  }
  return next();
}
module.exports = { validateSearchBooksQuery, validateBookId };
