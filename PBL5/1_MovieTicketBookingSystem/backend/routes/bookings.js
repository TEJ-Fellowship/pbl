const express = require("express");
const router = express.Router();
const bookingsController = require("../controllers/bookingsController");

// Booking routes
// Specific routes must come before parameterized routes to avoid conflicts
router.get("/", bookingsController.getAllBookings);
router.get("/user/:userId", bookingsController.getBookingsByUser);
router.post("/", bookingsController.createBooking);
router.post("/reserve", bookingsController.reserveSeats);
router.post("/confirm/:id", bookingsController.confirmBooking);
router.get("/:id", bookingsController.getBookingById);
router.put("/:id", bookingsController.updateBooking);
router.delete("/:id", bookingsController.cancelBooking);

module.exports = router;
