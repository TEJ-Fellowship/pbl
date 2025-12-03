const express = require("express");
const router = express.Router();
const paymentsController = require("../controllers/paymentsController");
const { rateLimiters } = require("../middleware/rateLimiter");

// Simplified routes for seat-only approach
// Apply very strict rate limiting to payment processing (5 requests per minute)
router.post(
  "/process",
  rateLimiters.payment,
  paymentsController.processPayment
);
router.get("/booking/:bookingId", paymentsController.getPaymentByBooking);

module.exports = router;
