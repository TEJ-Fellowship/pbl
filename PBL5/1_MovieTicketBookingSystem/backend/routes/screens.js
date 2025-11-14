const express = require("express");
const router = express.Router();
const screensController = require("../controllers/screensController");

// Screen routes
router.get("/", screensController.getAllScreens);
router.get("/theater/:theaterId", screensController.getScreensByTheater);
router.get("/:id", screensController.getScreenById);
router.post("/", screensController.createScreen);
router.put("/:id", screensController.updateScreen);
router.delete("/:id", screensController.deleteScreen);

module.exports = router;
