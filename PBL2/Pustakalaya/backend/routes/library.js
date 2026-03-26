const express = require("express");
const { requireAuth } = require("../middleware/requireAuth");
const libraryBookController = require("../controllers/libraryBookController");
const asyncHandler = require("../utils/asyncHandler");
const { validateCreateLibraryBook } = require("../validators/libraryValidator");

const router = express.Router();
router.use(requireAuth);

router.get("/books", asyncHandler(libraryBookController.list));
router.post(
  "/books",
  validateCreateLibraryBook,
  asyncHandler(libraryBookController.create),
);
router.get("/books/:bookId", asyncHandler(libraryBookController.getOne));
router.patch("/books/:bookId", asyncHandler(libraryBookController.update));
router.delete("/books/:bookId", asyncHandler(libraryBookController.remove));

module.exports = router;
