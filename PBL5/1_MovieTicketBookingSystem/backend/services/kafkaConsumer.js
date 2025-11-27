/**
 * Kafka Consumer Service
 * Processes booking requests from Kafka queue
 */

const { getConsumer, ensureTopics } = require("../utils/kafka");
const config = require("../utils/config");
const redis = require("../utils/redis");
const { acquireLocks, releaseLocks } = require("../utils/redisLock");
const crypto = require("crypto");

/**
 * Process a single booking request
 * This is the actual booking logic that was in the controller
 * @param {Object} bookingRequest - Booking request from Kafka
 * @returns {Promise<Object>} - Booking result
 */
async function processBookingRequest(bookingRequest) {
  const { seat_ids, request_id } = bookingRequest;

  try {
    // Validation
    if (!seat_ids || !Array.isArray(seat_ids) || seat_ids.length === 0) {
      return {
        success: false,
        error: "seat_ids array is required and must not be empty",
        request_id,
      };
    }

    // Check if Redis is ready
    if (!redis.isReady) {
      return {
        success: false,
        error: "Redis not ready",
        request_id,
      };
    }

    // Check seat availability in Redis
    const availableSeatsKey = "available_seats";
    const bookedSeatsKey = "booked_seats";

    const availableSeats = await redis.sMembers(availableSeatsKey);
    const availableSeatsSet = new Set(availableSeats);

    // Check if all requested seats are available
    const unavailableSeats = seat_ids.filter(
      (seatId) => !availableSeatsSet.has(seatId)
    );

    if (unavailableSeats.length > 0) {
      return {
        success: false,
        error: "Some seats are not available",
        unavailable_seats: unavailableSeats,
        request_id,
      };
    }

    // Acquire Redis locks for all seats
    const lockKeys = seat_ids.map((seatId) => `seat:${seatId}`);
    const lockTTL = 300; // 5 minutes

    const { acquired: locks, failed: failedLocks } = await acquireLocks(
      lockKeys,
      lockTTL
    );

    if (failedLocks.length > 0) {
      return {
        success: false,
        error: "Seats are currently being processed by another user",
        seats_busy: failedLocks.length,
        request_id,
      };
    }

    try {
      // Generate booking ID
      const bookingId = crypto.randomUUID();

      // Calculate total amount
      const seatPrice = 100;
      const totalAmount = seat_ids.length * seatPrice;

      // Create booking data
      const bookingData = {
        id: bookingId,
        seat_ids: seat_ids,
        status: "pending",
        total_amount: totalAmount,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        request_id, // Store original request ID for tracking
      };

      // Store booking in Redis
      const bookingKey = `booking:${bookingId}`;
      await redis.setEx(bookingKey, 300, JSON.stringify(bookingData)); // 5 min TTL for pending

      // Add to pending bookings set
      await redis.sAdd("booking:pending", bookingId);
      await redis.expire("booking:pending", 300);

      // Store lock tokens for later release
      const lockStorageKey = `booking:${bookingId}:locks`;
      await redis.setEx(lockStorageKey, 300, JSON.stringify(locks));

      // Remove seats from available_seats
      await redis.sRem(availableSeatsKey, seat_ids);

      console.log(
        `✅ Booking ${bookingId} processed from Kafka (request: ${request_id})`
      );

      return {
        success: true,
        booking_id: bookingId,
        seat_ids: seat_ids,
        status: "pending",
        total_amount: totalAmount,
        created_at: bookingData.created_at,
        request_id,
      };
    } catch (error) {
      // Release locks on error
      await releaseLocks(locks);
      throw error;
    }
  } catch (error) {
    console.error(`❌ Error processing booking request ${request_id}:`, error);
    return {
      success: false,
      error: error.message,
      request_id,
    };
  }
}

/**
 * Start Kafka consumer to process booking requests
 * @param {Function} onMessage - Optional callback for each processed message
 */
async function startBookingConsumer(onMessage = null) {
  try {
    // Ensure topic exists
    await ensureTopics([config.KAFKA_TOPIC_BOOKINGS]);

    // Get consumer
    const consumer = await getConsumer();

    // Subscribe to booking requests topic
    await consumer.subscribe({
      topic: config.KAFKA_TOPIC_BOOKINGS,
      fromBeginning: false, // Only process new messages
    });

    console.log(`✅ Subscribed to Kafka topic: ${config.KAFKA_TOPIC_BOOKINGS}`);

    // Process messages
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const messageKey = message.key?.toString();
          const messageValue = message.value?.toString();

          console.log(
            `📨 Received booking request from Kafka: ${messageKey} (partition: ${partition}, offset: ${message.offset})`
          );

          // Parse booking request
          const bookingRequest = JSON.parse(messageValue);

          // Process booking
          const result = await processBookingRequest(bookingRequest);

          // Call optional callback
          if (onMessage) {
            await onMessage(result, {
              topic,
              partition,
              offset: message.offset,
            });
          }

          if (result.success) {
            console.log(
              `✅ Successfully processed booking: ${result.booking_id} (request: ${result.request_id})`
            );
          } else {
            console.warn(
              `⚠️ Failed to process booking request: ${result.request_id} - ${result.error}`
            );
          }
        } catch (error) {
          console.error("❌ Error processing Kafka message:", error);
          // Note: In production, you might want to send failed messages to a DLQ (Dead Letter Queue)
        }
      },
    });

    console.log("✅ Kafka booking consumer started and running");
  } catch (error) {
    console.error("❌ Error starting Kafka consumer:", error);
    throw error;
  }
}

module.exports = {
  processBookingRequest,
  startBookingConsumer,
};
