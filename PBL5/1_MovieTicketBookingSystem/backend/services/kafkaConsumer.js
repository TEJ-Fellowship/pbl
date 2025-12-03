/**
 * Kafka Consumer Service
 * Processes booking requests from Kafka queue
 */

const { getConsumer, ensureTopics, recreateTopic } = require("../utils/kafka");
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
 * Start a single Kafka consumer instance
 * @param {number} instanceId - Unique instance ID
 * @param {Function} onMessage - Optional callback for each processed message
 */
async function startConsumerInstance(instanceId, onMessage = null) {
  try {
    // Get consumer instance
    const consumer = await getConsumer(config.KAFKA_GROUP_ID, instanceId);

    // Subscribe to booking requests topic
    // fromBeginning: true to process all messages (including queued ones from load tests)
    await consumer.subscribe({
      topic: config.KAFKA_TOPIC_BOOKINGS,
      fromBeginning: true, // Process ALL messages (including queued ones)
    });

    console.log(
      `✅ Consumer ${instanceId} subscribed to Kafka topic: ${config.KAFKA_TOPIC_BOOKINGS}`
    );

    // Process messages in batches for better throughput
    await consumer.run({
      eachBatch: async ({
        batch,
        resolveOffset,
        heartbeat,
        isRunning,
        isStale,
      }) => {
        const { topic, partition } = batch;
        const startTime = Date.now();
        const batchSize = batch.messages.length;

        // Reduced logging for multiple consumers
        if (instanceId === 0 && batch.messages.length > 0) {
          const firstOffset = batch.messages[0].offset;
          if (firstOffset % 100 === 0) {
            console.log(
              `🔔 Consumer ${instanceId}: Processing batch of ${batchSize} messages (partition: ${partition}, offset: ${firstOffset})`
            );
          }
        }

        // Process all messages in batch in parallel
        const processingPromises = batch.messages.map(async (message) => {
          try {
            if (!message.value) {
              return;
            }

            const messageValue = message.value.toString();

            // Parse booking request
            let bookingRequest;
            try {
              bookingRequest = JSON.parse(messageValue);
            } catch (parseError) {
              console.error(
                `❌ Consumer ${instanceId}: Failed to parse message at offset ${message.offset}:`,
                parseError
              );
              return null;
            }

            // Process booking
            const result = await processBookingRequest(bookingRequest);

            // Call optional callback
            if (onMessage) {
              await onMessage(result, {
                topic,
                partition,
                offset: message.offset,
                instanceId,
              });
            }

            // Mark message as processed
            resolveOffset(message.offset);

            // Send heartbeat to keep consumer alive
            await heartbeat();

            // Log only successful bookings or errors (reduce noise)
            if (
              result.success &&
              instanceId === 0 &&
              message.offset % 50 === 0
            ) {
              console.log(
                `✅ Consumer ${instanceId}: Booking ${result.booking_id} processed (partition: ${partition})`
              );
            } else if (
              !result.success &&
              result.error !== "Some seats are not available"
            ) {
              // Log non-availability errors (but skip "seats not available" as it's expected)
              console.warn(
                `⚠️ Consumer ${instanceId}: Failed booking ${result.request_id}: ${result.error}`
              );
            }

            return result;
          } catch (error) {
            console.error(
              `❌ Consumer ${instanceId}: Error processing message (partition: ${partition}, offset: ${message.offset}):`,
              error.message
            );
            // Still mark as processed to avoid reprocessing
            resolveOffset(message.offset);
            await heartbeat();
            return null;
          }
        });

        // Wait for all messages in batch to be processed
        await Promise.all(processingPromises);

        const processingTime = Date.now() - startTime;
        if (instanceId === 0 && batchSize > 0) {
          const firstOffset = batch.messages[0].offset;
          if (firstOffset % 100 === 0) {
            console.log(
              `✅ Consumer ${instanceId}: Batch of ${batchSize} messages processed in ${processingTime}ms (partition: ${partition})`
            );
          }
        }
      },
    });

    console.log(`✅ Consumer ${instanceId} started and running`);
  } catch (error) {
    console.error(`❌ Error starting consumer ${instanceId}:`, error);
    throw error;
  }
}

/**
 * Start multiple Kafka consumer instances for parallel processing
 * @param {Function} onMessage - Optional callback for each processed message
 */
async function startBookingConsumer(onMessage = null) {
  try {
    const numConsumers = config.KAFKA_CONSUMER_INSTANCES;
    const numPartitions = config.KAFKA_PARTITIONS;

    console.log(
      `🚀 Starting ${numConsumers} consumer instances for ${numPartitions} partitions...`
    );

    // Ensure topic exists with correct partition count
    await ensureTopics([config.KAFKA_TOPIC_BOOKINGS], numPartitions);

    // Start all consumer instances in parallel
    const consumerPromises = [];
    for (let i = 0; i < numConsumers; i++) {
      consumerPromises.push(startConsumerInstance(i, onMessage));
    }

    await Promise.all(consumerPromises);

    console.log(`✅ All ${numConsumers} Kafka consumers started and running`);
    console.log(
      `📊 Expected parallelism: ${Math.min(
        numConsumers,
        numPartitions
      )} partitions being processed simultaneously`
    );
  } catch (error) {
    console.error("❌ Error starting Kafka consumers:", error);
    throw error;
  }
}

module.exports = {
  processBookingRequest,
  startBookingConsumer,
};
