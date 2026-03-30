const express = require("express");
const booksController = require("../controllers/booksController");
const asyncHandler = require("../utils/asyncHandler");
const {
  validateSearchBooksQuery,
  validateBookId,
} = require("../validators/booksValidator");

const router = express.Router();

router.get(
  "/",
  validateSearchBooksQuery,
  asyncHandler(booksController.searchBooks),
);
router.get("/:id", validateBookId, asyncHandler(booksController.getBookById));

module.exports = router;
