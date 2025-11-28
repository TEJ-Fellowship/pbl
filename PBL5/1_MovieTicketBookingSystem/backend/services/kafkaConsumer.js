/**
 * Kafka Consumer Service
 * Processes booking requests from Kafka queue
 */

const { getConsumer, ensureTopics } = require("../utils/kafka");
const config = require("../utils/config");
const redis = require("../utils/redis");
const { acquireLocks, releaseLocks } = require("../utils/redisLock");
const { batchWrite } = require("../utils/redisPipeline");
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
    // OPTIMIZED: Use pipeline to check individual seats (much faster than sMembers for large sets!)
    const availableSeatsKey = "available_seats";
    const bookedSeatsKey = "booked_seats";

    // Check all seats in parallel using pipeline (fastest approach!)
    const pipeline = redis.multi();
    seat_ids.forEach((seatId) => {
      pipeline.sIsMember(availableSeatsKey, seatId);
    });
    const results = await pipeline.exec();

    // Extract unavailable seats from pipeline results
    // Redis pipeline.exec() returns: [error, result] or just the result value
    const unavailableSeats = [];
    if (results && Array.isArray(results)) {
      results.forEach((result, index) => {
        let isAvailable = false;

        // Handle different result formats
        if (Array.isArray(result) && result.length >= 2) {
          // Format: [error, value]
          const error = result[0];
          const value = result[1];
          if (error) {
            console.error(`Error checking seat ${seat_ids[index]}:`, error);
            unavailableSeats.push(seat_ids[index]);
            return;
          }
          // value is 1 if member exists, 0 if not
          isAvailable = value === 1 || value === true || value === "1";
        } else if (typeof result === "number") {
          // Format: direct value (1 = exists, 0 = doesn't exist)
          isAvailable = result === 1;
        } else if (result === true || result === "1") {
          // Format: boolean or string "1"
          isAvailable = true;
        } else {
          // Unexpected format, treat as unavailable
          console.warn(
            `Unexpected result format for seat ${seat_ids[index]}:`,
            result,
            `(type: ${typeof result})`
          );
          unavailableSeats.push(seat_ids[index]);
          return;
        }

        if (!isAvailable) {
          unavailableSeats.push(seat_ids[index]);
        }
      });
    } else {
      console.error("Pipeline results are not in expected format:", results);
      throw new Error("Failed to check seat availability");
    }

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

      // Store booking in Redis using pipeline (batch all writes together)
      const bookingKey = `booking:${bookingId}`;
      const lockStorageKey = `booking:${bookingId}:locks`;

      // Batch all Redis writes into a single pipeline (much faster!)
      // Instead of 4 separate network calls, we send all commands at once!
      const pipelineStart = Date.now();

      // Build sRem args: [key, ...members] - spread seat_ids when calling
      const sRemArgs = [availableSeatsKey, ...seat_ids];

      await batchWrite([
        { type: "setEx", args: [bookingKey, 300, JSON.stringify(bookingData)] }, // Store booking (5 min TTL)
        { type: "sAdd", args: ["booking:pending", bookingId] }, // Add to pending set
        { type: "setEx", args: [lockStorageKey, 300, JSON.stringify(locks)] }, // Store lock tokens
        { type: "sRem", args: sRemArgs }, // Remove seats from available (already spread)
      ]);
      const pipelineTime = Date.now() - pipelineStart;
      if (process.env.NODE_ENV !== "production" && pipelineTime > 50) {
        console.log(`⚡ Pipeline executed ${4} commands in ${pipelineTime}ms`);
      }

      // Always log successful bookings for now (to verify it's working)
      console.log(
        `✅ Booking ${bookingId} created successfully (request: ${request_id}, seats: ${seat_ids.length})`
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
    // fromBeginning: true to process all messages (including queued ones from load tests)
    // This ensures messages sent before consumer starts are also processed
    await consumer.subscribe({
      topic: config.KAFKA_TOPIC_BOOKINGS,
      fromBeginning: true, // Process ALL messages (including queued ones)
    });

    console.log(`✅ Subscribed to Kafka topic: ${config.KAFKA_TOPIC_BOOKINGS}`);

    // Process messages - simplified for now to verify it works
    console.log("🔄 Starting message consumption...");
    console.log(
      "⚠️  IMPORTANT: Check server logs to see if messages are being processed!"
    );

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const startTime = Date.now();
        console.log(
          `\n🔔 CONSUMER ACTIVITY: Received message at offset ${message.offset} (partition: ${partition})`
        );

        try {
          if (!message.value) {
            console.warn(
              `⚠️ Empty message at partition ${partition}, offset ${message.offset}`
            );
            return;
          }

          const messageKey = message.key?.toString() || "no-key";
          const messageValue = message.value.toString();

          console.log(
            `📨 Processing message: ${messageKey} (partition: ${partition}, offset: ${message.offset})`
          );
          console.log(
            `   Message value preview: ${messageValue.substring(0, 100)}...`
          );

          // Parse booking request
          let bookingRequest;
          try {
            bookingRequest = JSON.parse(messageValue);
          } catch (parseError) {
            console.error(
              `❌ Failed to parse message at offset ${message.offset}:`,
              parseError
            );
            console.error("Message value:", messageValue);
            return;
          }

          // Process booking
          console.log(`🔄 Processing booking request:`, {
            request_id: bookingRequest.request_id,
            seat_ids: bookingRequest.seat_ids,
            seat_count: bookingRequest.seat_ids?.length,
          });

          const result = await processBookingRequest(bookingRequest);
          const processingTime = Date.now() - startTime;

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
              `✅ Booking ${result.booking_id} processed in ${processingTime}ms (partition: ${partition}, offset: ${message.offset})`
            );
            console.log(`   Seats booked: ${result.seat_ids?.join(", ")}`);
          } else {
            console.warn(
              `⚠️ Failed booking ${result.request_id}: ${result.error} (${processingTime}ms)`
            );
            if (result.unavailable_seats) {
              console.warn(
                `   Unavailable seats: ${result.unavailable_seats.join(", ")}`
              );
            }
          }
        } catch (error) {
          const processingTime = Date.now() - startTime;
          console.error(
            `❌ Error processing message (partition: ${partition}, offset: ${message.offset}, time: ${processingTime}ms):`,
            error
          );
          console.error("Error stack:", error.stack);
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
