const express = require("express");
const router = express.Router();
const bookingsController = require("../controllers/bookingsController");

// Booking routes
// Specific routes must come before parameterized routes to avoid conflicts
router.get("/", bookingsController.getAllBookings);
router.get("/user/:userId", bookingsController.getBookingsByUser);
router.post("/", bookingsController.createBooking);
// router.post("/reserve", bookingsController.reserveSeats); // Removed - using /bookings for reservations
router.post("/confirm/:id", bookingsController.confirmBooking);
router.put("/:id/cancel", bookingsController.cancelBooking); // Enhanced cancellation with rules
router.get("/:id", bookingsController.getBookingById);
router.put("/:id", bookingsController.updateBooking);
router.delete("/:id", bookingsController.cancelBooking); // Keep for backward compatibility

module.exports = router;
