/**
 * Stripe Webhook Handler Service
 * Processes Stripe webhook events and updates bookings
 */

const redis = require("../utils/redis");
const { releaseLocks } = require("../utils/redisLock");

/**
 * Handle payment_intent.succeeded event
 * Updates booking status from "pending" to "confirmed"
 * @param {Object} paymentIntent - Stripe Payment Intent object
 * @returns {Promise<Object>} - Result of processing
 */
async function handlePaymentIntentSucceeded(paymentIntent) {
  const { id: paymentIntentId, metadata } = paymentIntent;
  const bookingId = metadata?.booking_id;

  if (!bookingId) {
    console.error(
      `❌ Payment Intent ${paymentIntentId} has no booking_id in metadata`
    );
    return {
      success: false,
      error: "No booking_id in Payment Intent metadata",
      payment_intent_id: paymentIntentId,
    };
  }

  try {
    // Get booking from Redis
    const bookingKey = `booking:${bookingId}`;
    const bookingData = await redis.get(bookingKey);

    if (!bookingData) {
      console.error(`❌ Booking ${bookingId} not found in Redis`);
      return {
        success: false,
        error: "Booking not found",
        booking_id: bookingId,
        payment_intent_id: paymentIntentId,
      };
    }

    const booking = JSON.parse(bookingData);

    // Check if already confirmed (idempotency)
    if (booking.status === "confirmed") {
      console.log(
        `ℹ️  Booking ${bookingId} already confirmed (idempotency check)`
      );
      return {
        success: true,
        booking_id: bookingId,
        payment_intent_id: paymentIntentId,
        message: "Booking already confirmed",
      };
    }

    // Check if payment_intent_id matches
    if (booking.payment_intent_id !== paymentIntentId) {
      console.error(
        `❌ Payment Intent ID mismatch for booking ${bookingId}. Expected: ${booking.payment_intent_id}, Got: ${paymentIntentId}`
      );
      return {
        success: false,
        error: "Payment Intent ID mismatch",
        booking_id: bookingId,
        payment_intent_id: paymentIntentId,
      };
    }

    // Update booking status to confirmed
    const updatedBooking = {
      ...booking,
      status: "confirmed",
      confirmed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Get lock tokens to release
    const lockStorageKey = `booking:${bookingId}:locks`;
    const storedLocks = await redis.get(lockStorageKey);
    let locks = [];
    if (storedLocks) {
      locks = JSON.parse(storedLocks);
    }

    // Update booking, release locks, move seats to booked, remove from pending
    const availableSeatsKey = "available_seats";
    const bookedSeatsKey = "booked_seats";

    // Use pipeline for atomic operations
    const pipeline = redis.multi();

    // Update booking (extend TTL to 1 hour for confirmed bookings)
    pipeline.setEx(bookingKey, 3600, JSON.stringify(updatedBooking));

    // Remove from pending set
    pipeline.sRem("booking:pending", bookingId);

    // Add to confirmed set
    pipeline.sAdd("booking:confirmed", bookingId);

    // Move seats to booked_seats
    if (booking.seat_ids && booking.seat_ids.length > 0) {
      booking.seat_ids.forEach((seatId) => {
        pipeline.sAdd(bookedSeatsKey, seatId);
      });
    }

    // Delete lock storage (no longer needed)
    if (storedLocks) {
      pipeline.del(lockStorageKey);
    }

    await pipeline.exec();

    // Release locks (after updating booking)
    if (locks.length > 0) {
      await releaseLocks(locks);
    }

    console.log(
      `✅ Booking ${bookingId} confirmed via Payment Intent ${paymentIntentId}`
    );

    return {
      success: true,
      booking_id: bookingId,
      payment_intent_id: paymentIntentId,
      status: "confirmed",
    };
  } catch (error) {
    console.error(
      `❌ Error processing payment_intent.succeeded for booking ${bookingId}:`,
      error.message
    );
    return {
      success: false,
      error: error.message,
      booking_id: bookingId,
      payment_intent_id: paymentIntentId,
    };
  }
}

/**
 * Handle payment_intent.payment_failed event
 * Releases seats back to available
 * @param {Object} paymentIntent - Stripe Payment Intent object
 * @returns {Promise<Object>} - Result of processing
 */
async function handlePaymentIntentFailed(paymentIntent) {
  const { id: paymentIntentId, metadata } = paymentIntent;
  const bookingId = metadata?.booking_id;

  if (!bookingId) {
    return {
      success: false,
      error: "No booking_id in Payment Intent metadata",
      payment_intent_id: paymentIntentId,
    };
  }

  try {
    const bookingKey = `booking:${bookingId}`;
    const bookingData = await redis.get(bookingKey);

    if (!bookingData) {
      return {
        success: false,
        error: "Booking not found",
        booking_id: bookingId,
      };
    }

    const booking = JSON.parse(bookingData);

    // Release locks
    const lockStorageKey = `booking:${bookingId}:locks`;
    const storedLocks = await redis.get(lockStorageKey);
    if (storedLocks) {
      const locks = JSON.parse(storedLocks);
      await releaseLocks(locks);
      await redis.del(lockStorageKey);
    }

    // Release seats back to available
    const availableSeatsKey = "available_seats";
    if (booking.seat_ids && booking.seat_ids.length > 0) {
      await redis.sAdd(availableSeatsKey, booking.seat_ids);
    }

    // Remove from pending
    await redis.sRem("booking:pending", bookingId);

    // Update booking status to failed
    const updatedBooking = {
      ...booking,
      status: "failed",
      updated_at: new Date().toISOString(),
    };
    await redis.setEx(bookingKey, 300, JSON.stringify(updatedBooking)); // 5 min TTL

    console.log(
      `⚠️  Booking ${bookingId} failed - seats released (Payment Intent: ${paymentIntentId})`
    );

    return {
      success: true,
      booking_id: bookingId,
      payment_intent_id: paymentIntentId,
      status: "failed",
    };
  } catch (error) {
    console.error(
      `❌ Error processing payment_intent.payment_failed for booking ${bookingId}:`,
      error.message
    );
    return {
      success: false,
      error: error.message,
      booking_id: bookingId,
    };
  }
}

/**
 * Process Stripe webhook event
 * Routes events to appropriate handlers
 * @param {Object} event - Stripe webhook event
 * @returns {Promise<Object>} - Result of processing
 */
async function processWebhookEvent(event) {
  const { type, data, id: eventId } = event;
  const paymentIntent = data.object;

  console.log(
    `📨 Webhook received: ${type} (event_id: ${eventId}, payment_intent: ${paymentIntent.id})`
  );

  switch (type) {
    case "payment_intent.succeeded":
      console.log(
        `✅ Processing payment_intent.succeeded for Payment Intent ${paymentIntent.id}`
      );
      return await handlePaymentIntentSucceeded(paymentIntent);

    case "payment_intent.payment_failed":
      console.log(
        `⚠️  Processing payment_intent.payment_failed for Payment Intent ${paymentIntent.id}`
      );
      return await handlePaymentIntentFailed(paymentIntent);

    default:
      console.log(`ℹ️  Unhandled webhook event type: ${type}`);
      return {
        success: true,
        message: `Event type ${type} not handled`,
        event_type: type,
      };
  }
}

module.exports = {
  processWebhookEvent,
  handlePaymentIntentSucceeded,
  handlePaymentIntentFailed,
};
