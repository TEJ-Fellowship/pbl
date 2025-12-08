const express = require("express");
const router = express.Router();
const paymentsController = require("../controllers/paymentsController");
const { rateLimiters } = require("../middleware/rateLimiter");
const verifyStripeWebhook = require("../middleware/stripeWebhookVerification");
const { processWebhookEvent } = require("../services/stripeWebhookHandler");

// Simplified routes for seat-only approach
// Apply very strict rate limiting to payment processing (5 requests per minute)
router.post(
  "/process",
  rateLimiters.payment,
  paymentsController.processPayment
);
router.get("/booking/:bookingId", paymentsController.getPaymentByBooking);

// Get Stripe publishable key for frontend
router.get("/config", paymentsController.getStripeConfig);

// Confirm Payment Intent with test card (backend testing)
// This triggers a real webhook from Stripe
router.post(
  "/confirm/:paymentIntentId",
  paymentsController.confirmPaymentIntent
);

// Stripe webhook endpoint (must use raw body, not JSON)
// This route needs to be registered with express.raw() middleware in index.js
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  verifyStripeWebhook,
  async (req, res) => {
    try {
      console.log(
        `🔔 Webhook endpoint hit: ${req.stripeEvent.type} (event_id: ${req.stripeEvent.id})`
      );
      const result = await processWebhookEvent(req.stripeEvent);

      if (result.success) {
        console.log(`✅ Webhook processed successfully:`, result);
        res.json({ received: true, result });
      } else {
        console.error(`❌ Webhook processing failed:`, result.error);
        res.status(400).json({ received: false, error: result.error });
      }
    } catch (error) {
      console.error("❌ Webhook processing error:", error);
      res.status(500).json({ error: "Webhook processing failed" });
    }
  }
);

module.exports = router;
