const express = require("express");
const router = express.Router();
const bookingsController = require("../controllers/bookingsController");

// Simplified routes for seat-only approach
router.get("/", bookingsController.getAllBookings);
router.post("/", bookingsController.createBooking);
// Get booking by request_id (must be before /:id route)
router.get("/request/:requestId", bookingsController.getBookingByRequestId);
router.get("/:id", bookingsController.getBookingById);
router.delete("/:id", bookingsController.cancelBooking);

module.exports = router;
