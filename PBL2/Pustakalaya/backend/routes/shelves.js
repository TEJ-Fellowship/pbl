const express = require("express");
const { requireAuth } = require("../middleware/requireAuth");
const asyncHandler = require("../utils/asyncHandler");
const shelfController = require("../controllers/shelfController");
const {
  validateCreateShelf,
  validateUpdateShelf,
  validateAddBookBody,
} = require("../validators/shelfValidator");

const router = express.Router();
router.use(requireAuth);

router.post("/", validateCreateShelf, asyncHandler(shelfController.create));
router.get("/", asyncHandler(shelfController.list));
router.get("/:shelfId", asyncHandler(shelfController.getOne));
router.patch(
  "/:shelfId",
  validateUpdateShelf,
  asyncHandler(shelfController.update),
);
router.delete("/:shelfId", asyncHandler(shelfController.remove));
router.post(
  "/:shelfId",
  validateAddBookBody,
  asyncHandler(shelfController.addBook),
);
router.delete(
  "/:shelfId/books/:bookId",
  asyncHandler(shelfController.removeBook),
);

module.exports = router;
