const express = require("express");
const router = express.Router();
const paymentsController = require("../controllers/paymentsController");

// Payment routes
// Specific routes must come before parameterized routes to avoid conflicts
router.post("/process", paymentsController.processPayment);
router.get("/booking/:bookingId", paymentsController.getPaymentByBooking);
router.get("/:id", paymentsController.getPaymentById);

module.exports = router;
