const express = require("express");
const router = express.Router();
const paymentsController = require("../controllers/paymentsController");

// Simplified routes for seat-only approach
router.post("/process", paymentsController.processPayment);
router.get("/booking/:bookingId", paymentsController.getPaymentByBooking);

module.exports = router;
