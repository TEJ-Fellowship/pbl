const express = require("express");
const router = express.Router();
const bookingsController = require("../controllers/bookingsController");
// DISABLED FOR NOW - will be re-enabled later
// const { rateLimiters } = require("../middleware/rateLimiter");

// Simplified routes for seat-only approach
router.get("/", bookingsController.getAllBookings);
// Apply strict rate limiting to booking creation (10 requests per minute)
// DISABLED FOR NOW - will be re-enabled later
router.post("/", bookingsController.createBooking);
router.get("/:id", bookingsController.getBookingById);
router.delete("/:id", bookingsController.cancelBooking);

module.exports = router;
