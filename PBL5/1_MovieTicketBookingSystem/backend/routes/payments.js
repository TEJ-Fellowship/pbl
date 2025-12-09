const express = require("express");
const router = express.Router();
const paymentsController = require("../controllers/paymentsController");
const verifyStripeWebhook = require("../middleware/stripeWebhookVerification");
const { processWebhookEvent } = require("../services/stripeWebhookHandler");

// Simplified routes for seat-only approach
router.post("/process", paymentsController.processPayment);
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
      // Only log important webhook events to reduce noise
      const eventType = req.stripeEvent.type;
      if (
        eventType === "payment_intent.succeeded" ||
        eventType === "payment_intent.payment_failed"
      ) {
        console.log(
          `🔔 Webhook: ${eventType} (event_id: ${req.stripeEvent.id})`
        );
      }
      const result = await processWebhookEvent(req.stripeEvent);

      if (result.success) {
        // Only log detailed success for important events
        if (
          eventType === "payment_intent.succeeded" ||
          eventType === "payment_intent.payment_failed"
        ) {
          console.log(
            `✅ Webhook processed: ${
              result.booking_id ? `booking ${result.booking_id}` : eventType
            }`
          );
        }
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
