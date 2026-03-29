const express = require("express");
const { requireAuth } = require("../middleware/requireAuth");
const libraryBookController = require("../controllers/libraryBookController");

const router = express.Router();
router.use(requireAuth);

router.get("/books", libraryBookController.list);
router.post("/books", libraryBookController.create);
router.get("/books/:bookId", libraryBookController.getOne);
router.patch("/books/:bookId", libraryBookController.update);
router.delete("/books/:bookId", libraryBookController.remove);

module.exports = router;
