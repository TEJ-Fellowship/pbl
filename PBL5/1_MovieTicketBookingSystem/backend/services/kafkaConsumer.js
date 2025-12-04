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

    // OPTIMIZED: Atomic check-and-lock operation using Lua script
    // This combines availability check and lock acquisition in a single atomic operation
    // Reduces from 2 Redis round trips to 1, and ensures atomicity
    const availableSeatsKey = "available_seats";
    const lockKeys = seat_ids.map((seatId) => `seat:${seatId}`);
    const lockTTL = 300; // 5 minutes

    // Generate lock tokens
    const tokens = lockKeys.map(() => crypto.randomUUID());
    const lockRedisKeys = lockKeys.map((key) => `lock:${key}`);

    // Lua script: Atomically check availability AND acquire locks
    // Returns: [success, status, ...data]
    // success: 1 = all good, 0 = failed
    // status: "ok", "unavailable", or "locked"
    const checkAndLockScript = `
      local availableKey = KEYS[1]
      local ttl = tonumber(ARGV[1])
      local numSeats = tonumber(ARGV[2])
      
      -- Extract seat IDs and tokens from ARGV
      local seatIds = {}
      local tokens = {}
      for i = 3, 3 + numSeats - 1 do
        table.insert(seatIds, ARGV[i])
      end
      for i = 3 + numSeats, 3 + numSeats * 2 - 1 do
        table.insert(tokens, ARGV[i])
      end
      
      -- Check availability for all seats
      local unavailable = {}
      for i = 1, numSeats do
        if redis.call("SISMEMBER", availableKey, seatIds[i]) == 0 then
          table.insert(unavailable, seatIds[i])
        end
      end
      
      -- If any seat unavailable, return early
      if #unavailable > 0 then
        return {0, "unavailable", unpack(unavailable)}
      end
      
      -- Try to acquire all locks atomically
      -- Lock keys format: lock:seat:seatId (matching the lockKeys format)
      local lockKeys = {}
      for i = 1, numSeats do
        table.insert(lockKeys, "lock:seat:" .. seatIds[i])
      end
      
      local acquired = {}
      local failed = {}
      for i = 1, numSeats do
        local result = redis.call("SET", lockKeys[i], tokens[i], "NX", "EX", ttl)
        if result then
          table.insert(acquired, i)
        else
          table.insert(failed, seatIds[i])
        end
      end
      
      -- If any lock failed, release all acquired locks (rollback)
      if #failed > 0 then
        for _, idx in ipairs(acquired) do
          if redis.call("GET", lockKeys[idx]) == tokens[idx] then
            redis.call("DEL", lockKeys[idx])
          end
        end
        return {0, "locked", unpack(failed)}
      end
      
      -- All checks passed and locks acquired
      return {1, "ok", unpack(tokens)}
    `;

    const scriptArgs = [
      String(lockTTL),
      String(seat_ids.length),
      ...seat_ids,
      ...tokens,
    ];

    let checkAndLockResult;
    try {
      checkAndLockResult = await redis.eval(checkAndLockScript, {
        keys: [availableSeatsKey],
        arguments: scriptArgs,
      });
    } catch (error) {
      console.error("Error in check-and-lock script:", error);
      return {
        success: false,
        error: "Failed to check availability and acquire locks",
        request_id,
      };
    }

    // Parse result: [success, status, ...data]
    if (!checkAndLockResult || checkAndLockResult[0] !== 1) {
      const status = checkAndLockResult?.[1] || "unknown";
      const failedSeats = checkAndLockResult?.slice(2) || seat_ids;

      if (status === "unavailable") {
        return {
          success: false,
          error: "Some seats are not available",
          unavailable_seats: failedSeats,
          request_id,
        };
      } else if (status === "locked") {
        return {
          success: false,
          error: "Seats are currently being processed by another user",
          seats_busy: failedSeats.length,
          request_id,
        };
      } else {
        return {
          success: false,
          error: "Failed to acquire seats",
          request_id,
        };
      }
    }

    // All locks acquired successfully - build lock objects
    const acquiredTokens = checkAndLockResult.slice(2);
    const locks = lockKeys.map((key, i) => ({
      key,
      token: acquiredTokens[i],
    }));

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

      // OPTIMIZED: Batch ALL Redis writes into a single pipeline
      // Includes: booking data, pending set, locks, seat removal, expiry storage
      const bookingKey = `booking:${bookingId}`;
      const lockStorageKey = `booking:${bookingId}:locks`;
      const seatsKey = `booking:${bookingId}:seats`; // For expiry tracking

      const pipelineStart = Date.now();

      // Build sRem args: [key, ...members]
      const sRemArgs = [availableSeatsKey, ...seat_ids];

      // Batch all writes: booking, pending, locks, seat removal, AND expiry storage
      await batchWrite([
        { type: "setEx", args: [bookingKey, 300, JSON.stringify(bookingData)] }, // Store booking (5 min TTL)
        { type: "sAdd", args: ["booking:pending", bookingId] }, // Add to pending set
        { type: "setEx", args: [lockStorageKey, 300, JSON.stringify(locks)] }, // Store lock tokens
        { type: "sRem", args: sRemArgs }, // Remove seats from available
        { type: "setEx", args: [seatsKey, 310, JSON.stringify(seat_ids)] }, // Store seats for expiry (310s > 300s booking TTL)
      ]);

      const pipelineTime = Date.now() - pipelineStart;
      if (process.env.NODE_ENV !== "production" && pipelineTime > 50) {
        console.log(`⚡ Pipeline executed 5 commands in ${pipelineTime}ms`);
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

        // Log all batches for debugging (especially for single messages)
        if (batch.messages.length > 0) {
          const firstOffset = batch.messages[0].offset;
          console.log(
            `🔔 Consumer ${instanceId}: Processing batch of ${batchSize} message(s) (partition: ${partition}, offset: ${firstOffset})`
          );
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

            // Log all successful bookings (not just every 50th)
            if (result.success) {
              console.log(
                `✅ Consumer ${instanceId}: Booking ${
                  result.booking_id
                } processed successfully (request: ${
                  result.request_id
                }, seats: ${
                  result.seat_ids?.length ||
                  bookingRequest.seat_ids?.length ||
                  0
                }, partition: ${partition})`
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

    // Ensure topic exists with correct partition count (auto-recreates if needed)
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
