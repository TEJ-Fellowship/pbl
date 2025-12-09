/**
 * Stripe Service
 * Centralized wrapper for Stripe API calls
 * Handles Payment Intent creation, retrieval, cancellation, and refunds
 */

const Stripe = require("stripe");
const config = require("../utils/config");

// Initialize Stripe client (only if secret key is provided)
let stripe = null;
if (config.STRIPE_SECRET_KEY) {
  stripe = new Stripe(config.STRIPE_SECRET_KEY, {
    apiVersion: config.STRIPE_API_VERSION,
  });
}

/**
 * Create a Payment Intent
 * @param {number} amount - Amount in cents (e.g., 20000 for $200.00)
 * @param {Object} metadata - Additional metadata (e.g., { booking_id: "..." })
 * @returns {Promise<Object>} Payment Intent object with client_secret
 */
async function createPaymentIntent(amount, metadata = {}) {
  if (!stripe) {
    throw new Error(
      "Stripe is not configured. Please set STRIPE_SECRET_KEY in environment variables."
    );
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: "usd",
      metadata: metadata,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: "never", // Disable redirects for backend-only testing
      },
    });

    console.log(
      `✅ Payment Intent created: ${paymentIntent.id} (status: ${
        paymentIntent.status
      }, amount: $${(paymentIntent.amount / 100).toFixed(2)})`
    );

    return {
      id: paymentIntent.id,
      client_secret: paymentIntent.client_secret,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
      metadata: paymentIntent.metadata,
    };
  } catch (error) {
    console.error(`❌ Payment Intent creation failed:`, error.message);
    throw new Error(`Stripe Payment Intent creation failed: ${error.message}`);
  }
}

/**
 * Retrieve a Payment Intent by ID
 * @param {string} paymentIntentId - Payment Intent ID (e.g., "pi_xxx")
 * @returns {Promise<Object>} Payment Intent object
 */
async function getPaymentIntent(paymentIntentId) {
  if (!stripe) {
    throw new Error(
      "Stripe is not configured. Please set STRIPE_SECRET_KEY in environment variables."
    );
  }

  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return {
      id: paymentIntent.id,
      client_secret: paymentIntent.client_secret,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
      metadata: paymentIntent.metadata,
    };
  } catch (error) {
    throw new Error(`Failed to retrieve Payment Intent: ${error.message}`);
  }
}

/**
 * Cancel a Payment Intent
 * @param {string} paymentIntentId - Payment Intent ID
 * @returns {Promise<Object>} Cancelled Payment Intent object
 */
async function cancelPaymentIntent(paymentIntentId) {
  if (!stripe) {
    throw new Error(
      "Stripe is not configured. Please set STRIPE_SECRET_KEY in environment variables."
    );
  }

  try {
    const paymentIntent = await stripe.paymentIntents.cancel(paymentIntentId);
    return {
      id: paymentIntent.id,
      status: paymentIntent.status,
    };
  } catch (error) {
    throw new Error(`Failed to cancel Payment Intent: ${error.message}`);
  }
}

/**
 * Create a refund for a Payment Intent
 * @param {string} paymentIntentId - Payment Intent ID
 * @param {number} amount - Amount to refund in cents (optional, full refund if not provided)
 * @param {string} reason - Refund reason (optional)
 * @returns {Promise<Object>} Refund object
 */
async function createRefund(paymentIntentId, amount = null, reason = null) {
  if (!stripe) {
    throw new Error(
      "Stripe is not configured. Please set STRIPE_SECRET_KEY in environment variables."
    );
  }

  try {
    // First, retrieve the Payment Intent to get the charge ID
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (!paymentIntent.latest_charge) {
      throw new Error("Payment Intent has no charge to refund");
    }

    const refundParams = {
      charge: paymentIntent.latest_charge,
    };

    if (amount) {
      refundParams.amount = amount;
    }

    if (reason) {
      refundParams.reason = reason;
    }

    const refund = await stripe.refunds.create(refundParams);

    return {
      id: refund.id,
      amount: refund.amount,
      currency: refund.currency,
      status: refund.status,
      reason: refund.reason,
    };
  } catch (error) {
    throw new Error(`Failed to create refund: ${error.message}`);
  }
}

/**
 * Confirm Payment Intent with test payment method (backend testing)
 * Uses Stripe's built-in test payment method IDs (works out of the box in test mode)
 * This triggers a real webhook from Stripe
 * @param {string} paymentIntentId - Payment Intent ID to confirm
 * @param {string} testPaymentMethodId - Optional test payment method ID (defaults to pm_card_visa)
 * @returns {Promise<Object>} Confirmed Payment Intent object
 */
async function confirmPaymentIntentWithTestCard(
  paymentIntentId,
  testPaymentMethodId = "pm_card_visa"
) {
  if (!stripe) {
    throw new Error(
      "Stripe is not configured. Please set STRIPE_SECRET_KEY in environment variables."
    );
  }

  try {
    console.log(`🔄 Confirming Payment Intent ${paymentIntentId}...`);

    // Retrieve Payment Intent first to check status and configuration
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    console.log(`📋 Payment Intent current status: ${paymentIntent.status}`);
    console.log(
      `📋 Automatic payment methods enabled: ${
        paymentIntent.automatic_payment_methods?.enabled || false
      }`
    );

    // Create a Payment Method first (this API allows test cards in test mode)
    // Then attach it to the Payment Intent and confirm
    console.log(`📝 Creating test Payment Method...`);
    const paymentMethod = await stripe.paymentMethods.create({
      type: "card",
      card: {
        number: "4242424242424242", // Test card - works in test mode
        exp_month: 12,
        exp_year: new Date().getFullYear() + 1,
        cvc: "123",
      },
    });
    console.log(`✅ Payment Method created: ${paymentMethod.id}`);

    // Attach the Payment Method to the Payment Intent
    console.log(`🔗 Attaching Payment Method to Payment Intent...`);
    await stripe.paymentMethods.attach(paymentMethod.id, {
      payment_intent: paymentIntentId,
    });
    console.log(`✅ Payment Method attached`);

    // Now confirm using the Payment Method ID (not raw card data)
    console.log(`💳 Confirming Payment Intent with Payment Method...`);
    const confirmedPaymentIntent = await stripe.paymentIntents.confirm(
      paymentIntentId,
      {
        payment_method: paymentMethod.id, // Use Payment Method ID, not raw data
      }
    );

    console.log(
      `✅ Payment Intent confirmed: ${confirmedPaymentIntent.id} (status: ${
        confirmedPaymentIntent.status
      }, amount: $${(confirmedPaymentIntent.amount / 100).toFixed(2)})`
    );
    console.log(`📨 Stripe will send webhook event: payment_intent.succeeded`);

    return {
      id: confirmedPaymentIntent.id,
      status: confirmedPaymentIntent.status,
      amount: confirmedPaymentIntent.amount,
      currency: confirmedPaymentIntent.currency,
      metadata: confirmedPaymentIntent.metadata,
    };
  } catch (error) {
    console.error(
      `❌ Failed to confirm Payment Intent ${paymentIntentId}:`,
      error.message
    );
    console.error(`Error type: ${error.type || "unknown"}`);
    console.error(`Error code: ${error.code || "unknown"}`);
    console.error(`Full error:`, error);

    // Provide more helpful error message
    let errorMessage = error.message;
    if (error.code === "payment_intent_unexpected_state") {
      errorMessage = `Payment Intent is in ${error.payment_intent?.status} state and cannot be confirmed`;
    } else if (
      error.message?.includes("socket hang up") ||
      error.code === "ECONNRESET"
    ) {
      errorMessage = `Connection to Stripe was closed. This might be due to: 1) Invalid payment method, 2) Network timeout, or 3) Stripe API issue. Try again or check your Stripe API key.`;
    }

    throw new Error(`Failed to confirm Payment Intent: ${errorMessage}`);
  }
}

/**
 * Check if Stripe is configured
 * @returns {boolean}
 */
function isStripeConfigured() {
  return !!config.STRIPE_SECRET_KEY && !!stripe;
}

module.exports = {
  createPaymentIntent,
  getPaymentIntent,
  cancelPaymentIntent,
  createRefund,
  confirmPaymentIntentWithTestCard,
  isStripeConfigured,
};
