const express = require("express");
const router = express.Router();
const showtimesController = require("../controllers/showtimesController");

// Showtime routes
router.get("/", showtimesController.getAllShowtimes);
router.get("/movie/:movieId", showtimesController.getShowtimesByMovie);
router.get("/theater/:theaterId", showtimesController.getShowtimesByTheater);
router.get("/:id", showtimesController.getShowtimeById);
router.post("/", showtimesController.createShowtime);
router.put("/:id", showtimesController.updateShowtime);
router.delete("/:id", showtimesController.deleteShowtime);

module.exports = router;
