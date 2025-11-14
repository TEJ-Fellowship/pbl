const express = require("express");
const router = express.Router();
const showtimesController = require("../controllers/showtimesController");

// Showtime routes
// Specific routes must come before parameterized routes to avoid conflicts
router.get("/", showtimesController.getAllShowtimes);
router.get("/movie/:movieId", showtimesController.getShowtimesByMovie);
router.get("/theater/:theaterId", showtimesController.getShowtimesByTheater);
router.get("/:id/seats", showtimesController.getShowtimeSeats); // Must come before /:id
router.get("/:id", showtimesController.getShowtimeById);
router.post("/", showtimesController.createShowtime);
router.put("/:id", showtimesController.updateShowtime);
router.delete("/:id", showtimesController.deleteShowtime);

module.exports = router;
