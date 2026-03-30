const express = require("express");
const { requireAuth } = require("../middleware/requireAuth");
const shelfController = require("../controllers/shelfController");

const router = express.Router();
router.use(requireAuth);

router.post("/", shelfController.create);
router.get("/", shelfController.list);
router.get("/:shelfId", shelfController.getOne);
router.patch("/:shelfId", shelfController.update);
router.delete("/:shelfId", shelfController.remove);
router.post("/:shelfId", shelfController.addBook);
router.delete("/:shelfId/books/:bookId", shelfController.removeBook);

module.exports = router;
