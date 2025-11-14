const express = require("express");
const router = express.Router();
const theatersController = require("../controllers/theatersController");

// Theater routes
router.get("/", theatersController.getAllTheaters);
router.get("/:id", theatersController.getTheaterById);
router.post("/", theatersController.createTheater);
router.put("/:id", theatersController.updateTheater);
router.delete("/:id", theatersController.deleteTheater);

module.exports = router;
