/**
 * Payment Intent Consumer Service
 * Processes Payment Intent creation requests from Kafka queue
 * Creates Stripe Payment Intents and updates bookings in Redis
 */

const { getConsumer, ensureTopics } = require("../utils/kafka");
const config = require("../utils/config");
const redis = require("../utils/redis");
const { createPaymentIntent, isStripeConfigured } = require("./stripeService");

/**
 * Process a single Payment Intent creation request
 * @param {Object} paymentIntentRequest - Payment Intent request from Kafka
 * @returns {Promise<Object>} - Processing result
 */
async function processPaymentIntentRequest(paymentIntentRequest) {
  const { booking_id, amount, metadata = {} } = paymentIntentRequest;

  try {
    // Validation
    if (!booking_id || !amount) {
      return {
        success: false,
        error: "booking_id and amount are required",
        booking_id,
      };
    }

    // Check if Stripe is configured
    if (!isStripeConfigured()) {
      return {
        success: false,
        error: "Stripe is not configured",
        booking_id,
      };
    }

    // Check if Redis is ready
    if (!redis.isReady) {
      return {
        success: false,
        error: "Redis not ready",
        booking_id,
      };
    }

    // Check if Payment Intent already exists for this booking (idempotency)
    const bookingKey = `booking:${booking_id}`;
    const bookingData = await redis.get(bookingKey);

    if (!bookingData) {
      return {
        success: false,
        error: "Booking not found",
        booking_id,
      };
    }

    const booking = JSON.parse(bookingData);

    // Skip if Payment Intent already exists
    if (booking.payment_intent_id) {
      console.log(
        `ℹ️  Payment Intent already exists for booking ${booking_id}: ${booking.payment_intent_id}`
      );
      return {
        success: true,
        booking_id,
        payment_intent_id: booking.payment_intent_id,
        message: "Payment Intent already created",
      };
    }

    // Create Payment Intent via Stripe
    console.log(
      `💳 Creating Payment Intent for booking ${booking_id} (amount: $${(
        amount / 100
      ).toFixed(2)})`
    );
    const paymentIntent = await createPaymentIntent(amount, {
      booking_id: booking_id,
      ...metadata,
    });
    console.log(
      `✅ Payment Intent created: ${paymentIntent.id} for booking ${booking_id}`
    );

    // Update booking with Payment Intent ID and client_secret
    const updatedBooking = {
      ...booking,
      payment_intent_id: paymentIntent.id,
      client_secret: paymentIntent.client_secret, // Store for frontend
      payment_intent_created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Store updated booking in Redis (extend TTL to 1 hour for pending bookings with Payment Intent)
    await redis.setEx(bookingKey, 3600, JSON.stringify(updatedBooking));

    // Store Payment Intent for idempotency (24 hour TTL)
    const paymentIntentKey = `payment_intent:${paymentIntent.id}`;
    await redis.setEx(
      paymentIntentKey,
      86400,
      JSON.stringify({
        booking_id: booking_id,
        amount: paymentIntent.amount,
        status: paymentIntent.status,
        client_secret: paymentIntent.client_secret,
        created_at: new Date().toISOString(),
      })
    );

    console.log(
      `✅ Payment Intent ${
        paymentIntent.id
      } created for booking ${booking_id} (amount: $${(amount / 100).toFixed(
        2
      )})`
    );

    return {
      success: true,
      booking_id,
      payment_intent_id: paymentIntent.id,
      client_secret: paymentIntent.client_secret,
      amount: paymentIntent.amount,
    };
  } catch (error) {
    console.error(
      `❌ Error processing Payment Intent request for booking ${booking_id}:`,
      error.message
    );
    return {
      success: false,
      error: error.message,
      booking_id,
    };
  }
}

/**
 * Start a single Payment Intent consumer instance
 * @param {number} instanceId - Unique instance ID
 */
async function startPaymentIntentConsumerInstance(instanceId) {
  try {
    // Check if Stripe is configured
    if (!isStripeConfigured()) {
      console.log(
        `⚠️  Payment Intent consumer ${instanceId} skipped: Stripe not configured`
      );
      return;
    }

    // Get consumer instance with separate group ID
    const consumer = await getConsumer(
      "payment-intent-processor-group",
      instanceId
    );

    // Subscribe to Payment Intent requests topic
    await consumer.subscribe({
      topic: config.KAFKA_TOPIC_PAYMENT_INTENTS,
      fromBeginning: false, // Only process new messages
    });

    console.log(
      `✅ Payment Intent consumer ${instanceId} subscribed to topic: ${config.KAFKA_TOPIC_PAYMENT_INTENTS}`
    );

    // Process messages
    await consumer.run({
      eachBatch: async ({ batch, resolveOffset, heartbeat, isRunning }) => {
        const { topic, partition } = batch;
        const batchSize = batch.messages.length;

        if (instanceId === 0 && batchSize > 0) {
          console.log(
            `🔔 Payment Intent consumer ${instanceId}: Processing batch of ${batchSize} messages (partition: ${partition})`
          );
        }

        // Process messages sequentially to respect Stripe rate limits (100 req/s)
        for (const message of batch.messages) {
          if (!isRunning()) break;

          try {
            if (!message.value) {
              resolveOffset(message.offset);
              continue;
            }

            const messageValue = message.value.toString();
            let paymentIntentRequest;

            try {
              paymentIntentRequest = JSON.parse(messageValue);
            } catch (parseError) {
              console.error(
                `❌ Payment Intent consumer ${instanceId}: Failed to parse message:`,
                parseError
              );
              resolveOffset(message.offset);
              await heartbeat();
              continue;
            }

            // Process Payment Intent creation
            const result = await processPaymentIntentRequest(
              paymentIntentRequest
            );

            // Log results (only for first consumer to reduce noise)
            if (instanceId === 0) {
              if (result.success) {
                console.log(
                  `✅ Payment Intent consumer ${instanceId}: Created Payment Intent ${result.payment_intent_id} for booking ${result.booking_id}`
                );
              } else if (
                result.error !== "Payment Intent already created" &&
                result.error !== "Booking not found"
              ) {
                console.warn(
                  `⚠️  Payment Intent consumer ${instanceId}: Failed for booking ${result.booking_id}: ${result.error}`
                );
              }
            }

            // Mark message as processed
            resolveOffset(message.offset);
            await heartbeat();

            // Small delay to respect Stripe rate limits (100 req/s = ~10ms between requests)
            // But we process in batches, so this is just a safety measure
            await new Promise((resolve) => setTimeout(resolve, 10));
          } catch (error) {
            console.error(
              `❌ Payment Intent consumer ${instanceId}: Error processing message:`,
              error.message
            );
            // Still mark as processed to avoid infinite retries
            resolveOffset(message.offset);
            await heartbeat();
          }
        }

        if (instanceId === 0 && batchSize > 0) {
          console.log(
            `✅ Payment Intent consumer ${instanceId}: Batch of ${batchSize} messages processed (partition: ${partition})`
          );
        }
      },
    });

    console.log(`✅ Payment Intent consumer ${instanceId} started and running`);
  } catch (error) {
    console.error(
      `❌ Error starting Payment Intent consumer ${instanceId}:`,
      error
    );
    throw error;
  }
}

/**
 * Start Payment Intent consumers
 * @param {number} numConsumers - Number of consumer instances (default: 2)
 */
async function startPaymentIntentConsumer(numConsumers = 2) {
  try {
    // Check if Stripe is configured
    if (!isStripeConfigured()) {
      console.log(
        "⚠️  Payment Intent consumers skipped: Stripe not configured"
      );
      return;
    }

    const numPartitions = 10; // Fewer partitions for Payment Intent topic (lower volume)

    console.log(
      `🚀 Starting ${numConsumers} Payment Intent consumer instances for ${numPartitions} partitions...`
    );

    // Ensure topic exists
    await ensureTopics([config.KAFKA_TOPIC_PAYMENT_INTENTS], numPartitions);

    // Start all consumer instances in parallel
    const consumerPromises = [];
    for (let i = 0; i < numConsumers; i++) {
      consumerPromises.push(startPaymentIntentConsumerInstance(i));
    }

    await Promise.all(consumerPromises);

    console.log(
      `✅ All ${numConsumers} Payment Intent consumers started and running`
    );
  } catch (error) {
    console.error("❌ Error starting Payment Intent consumers:", error);
    throw error;
  }
}

module.exports = {
  processPaymentIntentRequest,
  startPaymentIntentConsumer,
};
