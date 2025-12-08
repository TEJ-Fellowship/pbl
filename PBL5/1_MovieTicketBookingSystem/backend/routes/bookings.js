const express = require("express");
const router = express.Router();
const bookingsController = require("../controllers/bookingsController");
const { rateLimiters } = require("../middleware/rateLimiter");

// Simplified routes for seat-only approach
router.get("/", bookingsController.getAllBookings);
// Apply strict rate limiting to booking creation (10 requests per minute)
router.post("/", rateLimiters.booking, bookingsController.createBooking);
// Get booking by request_id (must be before /:id route)
router.get("/request/:requestId", bookingsController.getBookingByRequestId);
router.get("/:id", bookingsController.getBookingById);
router.delete("/:id", bookingsController.cancelBooking);

module.exports = router;
