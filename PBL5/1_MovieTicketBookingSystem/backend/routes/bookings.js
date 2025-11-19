const express = require("express");
const router = express.Router();
const bookingsController = require("../controllers/bookingsController");

// Route ordering: Specific routes BEFORE parameterized routes

// Collection routes (no parameters)
router.get("/", bookingsController.getAllBookings);
router.post("/", bookingsController.createBooking);

// Nested resource routes (specific patterns)
router.get("/user/:userId", bookingsController.getBookingsByUser);
router.post("/confirm/:id", bookingsController.confirmBooking);
router.put("/:id/cancel", bookingsController.cancelBooking);

// Resource routes (parameterized - must be last)
router.get("/:id", bookingsController.getBookingById);
router.put("/:id", bookingsController.updateBooking);
router.delete("/:id", bookingsController.cancelBooking);

module.exports = router;
