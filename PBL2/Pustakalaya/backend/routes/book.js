const express = require("express");
const booksController = require("../controllers/booksController");

const router = express.Router();

router.get("/", booksController.searchBooks);
router.get("/:id", booksController.getBookById);

module.exports = router;
