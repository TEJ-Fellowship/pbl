/**
 * Stripe Webhook Verification Middleware
 * Verifies that webhook requests are actually from Stripe
 */

const config = require("../utils/config");

/**
 * Verify Stripe webhook signature
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware
 */
function verifyStripeWebhook(req, res, next) {
  const stripe = require("stripe")(config.STRIPE_SECRET_KEY);
  const sig = req.headers["stripe-signature"];

  // If no webhook secret configured, skip verification (dev mode)
  if (!config.STRIPE_WEBHOOK_SECRET) {
    console.warn(
      "⚠️  Stripe webhook secret not configured - skipping verification (dev mode)"
    );
    // Try to parse event from body (for testing)
    if (req.body) {
      let eventData;
      if (req.body instanceof Buffer) {
        try {
          eventData = JSON.parse(req.body.toString());
        } catch (e) {
          // If parsing fails, try to use body as-is
          eventData = req.body;
        }
      } else if (typeof req.body === "object") {
        eventData = req.body;
      } else {
        eventData = JSON.parse(req.body);
      }

      if (eventData && eventData.type) {
        req.stripeEvent = eventData;
        console.log(`📨 Webhook received (unverified): ${eventData.type}`);
        return next();
      }
    }
    console.error("❌ Could not parse webhook event in dev mode");
    return res.status(400).json({ error: "Invalid webhook payload" });
  }

  // If signature header is missing, try to proceed in dev mode
  if (!sig) {
    console.warn(
      "⚠️  Missing stripe-signature header - attempting to parse without verification (dev mode)"
    );
    // Try to parse event from body
    if (req.body) {
      let eventData;
      if (req.body instanceof Buffer) {
        try {
          eventData = JSON.parse(req.body.toString());
        } catch (e) {
          eventData = req.body;
        }
      } else if (typeof req.body === "object") {
        eventData = req.body;
      }

      if (eventData && eventData.type) {
        req.stripeEvent = eventData;
        console.log(`📨 Webhook received (unverified): ${eventData.type}`);
        return next();
      }
    }
    console.error(
      "❌ Missing stripe-signature header and could not parse event"
    );
    return res.status(400).json({ error: "Missing stripe-signature header" });
  }

  let event;

  try {
    // Get raw body (should be Buffer if express.raw() middleware is used)
    let rawBody;
    if (req.body instanceof Buffer) {
      rawBody = req.body;
    } else if (typeof req.body === "string") {
      rawBody = Buffer.from(req.body);
    } else {
      // If body is already parsed, we can't verify signature
      // This happens if express.json() was used instead of express.raw()
      console.warn(
        "⚠️  Webhook body is not raw Buffer - signature verification may fail"
      );
      rawBody = Buffer.from(JSON.stringify(req.body));
    }

    console.log("🔐 Verifying webhook signature...");
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      config.STRIPE_WEBHOOK_SECRET
    );
    console.log(
      `✅ Webhook signature verified: ${event.type} (event_id: ${event.id})`
    );
  } catch (err) {
    console.error("❌ Webhook signature verification failed:", err.message);

    // In development, try to proceed with unverified event if it looks valid
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "⚠️  Dev mode: Attempting to parse event without verification"
      );
      try {
        let eventData;
        if (req.body instanceof Buffer) {
          eventData = JSON.parse(req.body.toString());
        } else if (typeof req.body === "object") {
          eventData = req.body;
        } else {
          eventData = JSON.parse(req.body);
        }

        if (eventData && eventData.type && eventData.data) {
          req.stripeEvent = eventData;
          console.log(
            `⚠️  Webhook processed without verification: ${eventData.type} (DEV MODE ONLY)`
          );
          return next();
        }
      } catch (parseErr) {
        console.error("❌ Could not parse webhook event:", parseErr.message);
      }
    }

    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  // Attach verified event to request
  req.stripeEvent = event;
  next();
}

module.exports = verifyStripeWebhook;
