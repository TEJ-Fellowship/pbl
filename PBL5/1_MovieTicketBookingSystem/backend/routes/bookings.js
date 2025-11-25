const express = require("express");
const router = express.Router();
const bookingsController = require("../controllers/bookingsController");

// Simplified routes for seat-only approach
router.get("/", bookingsController.getAllBookings);
router.post("/", bookingsController.createBooking);
router.get("/:id", bookingsController.getBookingById);
router.delete("/:id", bookingsController.cancelBooking);

module.exports = router;
