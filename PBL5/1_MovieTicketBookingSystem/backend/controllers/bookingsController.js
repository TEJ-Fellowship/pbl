/**
 * Simplified Redis-Only Booking Controller
 * Seat-only approach for load testing and scaling
 * No PostgreSQL dependencies
 * Supports both direct processing and Kafka queueing modes
 */

const redis = require("../utils/redis");
const { acquireLocks, releaseLocks } = require("../utils/redisLock");
const crypto = require("crypto");
const config = require("../utils/config");
const { addToBatch } = require("../services/messageBatcher");

/**
 * Create booking - Redis-only, seat-only
 * POST /api/bookings
 * Body: { "seat_ids": ["seat1", "seat2", ...] }
 *
 * Mode:
 * - 'direct': Process booking immediately (default)
 * - 'kafka': Queue booking request to Kafka for async processing
 */
const createBooking = async (req, res, next) => {
  try {
    const { seat_ids } = req.body;

    // Log request received
    console.log(`📥 Booking request received: ${seat_ids?.length || 0} seats`);

    // If Kafka mode is enabled, send to queue and wait for booking to be created
    if (config.KAFKA_MODE === "kafka") {
      const requestId = crypto.randomUUID();
      console.log(`🔄 Queueing to Kafka: request_id=${requestId}`);

      // Add to smart batcher (batches messages for efficient Kafka throughput)
      // Works for both low load (sends after 100ms) and high load (sends when batch full)
      addToBatch({
        seat_ids,
        request_id: requestId,
        metadata: {
          user_agent: req.get("user-agent"),
          ip: req.ip,
        },
      }).catch((kafkaError) => {
        // Log error but don't block response
        // In production, you'd also send this to monitoring/alerting
        console.error(`[Kafka Error] Failed to queue booking ${requestId}:`, {
          error: kafkaError.message,
          seat_ids,
          timestamp: new Date().toISOString(),
        });
      });

      // For high load, return immediately with 202 (async processing)
      // Client can poll /api/bookings/request/:requestId to check status
      // This prevents HTTP timeouts at high RPS
      console.log(`✅ Sending 202 response for request_id=${requestId}`);
      res.status(202).json({
        message: "Booking request queued for processing",
        request_id: requestId,
        note: "Booking is being processed. Use GET /api/bookings/request/:requestId to check status",
      });
      return;
    }

    // Direct processing mode (original logic)

    // Validation
    if (!seat_ids || !Array.isArray(seat_ids) || seat_ids.length === 0) {
      return res.status(400).json({
        error: "seat_ids array is required and must not be empty",
      });
    }

    // Check if Redis is ready
    if (!redis.isReady) {
      return res.status(503).json({ error: "Redis not ready" });
    }

    // Check seat availability in Redis
    const availableSeatsKey = "available_seats";
    const bookedSeatsKey = "booked_seats";

    // Get available seats from Redis SET
    const availableSeats = await redis.sMembers(availableSeatsKey);
    const availableSeatsSet = new Set(availableSeats);

    // Check if all requested seats are available
    const unavailableSeats = seat_ids.filter(
      (seatId) => !availableSeatsSet.has(seatId)
    );

    if (unavailableSeats.length > 0) {
      return res.status(409).json({
        error: "Some seats are not available",
        unavailable_seats: unavailableSeats,
      });
    }

    // Acquire Redis locks for all seats (prevent double-booking)
    const lockKeys = seat_ids.map((seatId) => `seat:${seatId}`);
    const lockTTL = 300; // 5 minutes

    const { acquired: locks, failed: failedLocks } = await acquireLocks(
      lockKeys,
      lockTTL
    );

    if (failedLocks.length > 0) {
      return res.status(409).json({
        error: "Seats are currently being processed by another user",
        seats_busy: failedLocks.length,
      });
    }

    try {
      // Generate booking ID
      const bookingId = crypto.randomUUID();

      // Calculate total amount (simple: 100 per seat)
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

      // Remove seats from available_seats (they're now reserved/pending)
      // This prevents other users from booking the same seats
      // If payment fails or booking expires, seats will be released back
      await redis.sRem(availableSeatsKey, seat_ids);

      console.log(`✅ Booking ${bookingId} created in Redis`);

      res.status(201).json({
        id: bookingId,
        seat_ids: seat_ids,
        status: "pending",
        total_amount: totalAmount,
        created_at: bookingData.created_at,
      });
    } catch (error) {
      // Release locks on error
      await releaseLocks(locks);
      throw error;
    }
  } catch (error) {
    console.error("Booking creation error:", error);
    next(error);
  }
};

/**
 * Get booking by ID - Redis-only
 * GET /api/bookings/:id
 */
const getBookingById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!redis.isReady) {
      return res.status(503).json({ error: "Redis not ready" });
    }

    const bookingKey = `booking:${id}`;
    const bookingData = await redis.get(bookingKey);

    if (!bookingData) {
      return res.status(404).json({ error: "Booking not found" });
    }

    res.json(JSON.parse(bookingData));
  } catch (error) {
    next(error);
  }
};

/**
 * Get booking by request_id - Redis-only
 * GET /api/bookings/request/:requestId
 */
const getBookingByRequestId = async (req, res, next) => {
  try {
    const { requestId } = req.params;

    if (!redis.isReady) {
      return res.status(503).json({ error: "Redis not ready" });
    }

    // First, try to find successful booking via request_id -> booking_id mapping
    const requestIdKey = `request:${requestId}`;
    const bookingId = await redis.get(requestIdKey);

    if (bookingId) {
      // Get booking by ID
      const bookingKey = `booking:${bookingId}`;
      const bookingData = await redis.get(bookingKey);

      if (bookingData) {
        const booking = JSON.parse(bookingData);
        return res.json(booking);
      }
    }

    // If not found, check for failed booking attempts
    const failedBookingKey = `booking:failed:${requestId}`;
    const failedBookingData = await redis.get(failedBookingKey);

    if (failedBookingData) {
      const failedBooking = JSON.parse(failedBookingData);
      return res.status(409).json({
        ...failedBooking,
        message: "Booking request failed",
      });
    }

    // Not found anywhere
    return res.status(404).json({
      error: "Booking not found for this request_id",
      request_id: requestId,
      note: "Booking may still be processing, or it may have failed. Try again in a few seconds.",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all bookings - Redis-only (for testing)
 * GET /api/bookings
 */
const getAllBookings = async (req, res, next) => {
  try {
    if (!redis.isReady) {
      return res.status(503).json({ error: "Redis not ready" });
    }

    // Get bookings from pending and confirmed sets (more efficient than scanning)
    const pendingBookingIds = await redis.sMembers("booking:pending");
    const confirmedBookingIds = await redis.sMembers("booking:confirmed");
    const allBookingIds = [
      ...new Set([...pendingBookingIds, ...confirmedBookingIds]),
    ];

    const bookings = [];

    if (allBookingIds.length > 0) {
      // Get all bookings in parallel using pipeline
      const pipeline = redis.multi();
      allBookingIds.forEach((bookingId) => {
        pipeline.get(`booking:${bookingId}`);
      });
      const results = await pipeline.exec();

      results.forEach((result, index) => {
        // Pipeline results format: [error, value] or just value
        let bookingData = null;
        if (Array.isArray(result)) {
          const [error, value] = result;
          if (!error && value) {
            bookingData = value;
          }
        } else if (result && typeof result === "string") {
          bookingData = result;
        }

        if (bookingData) {
          try {
            const booking = JSON.parse(bookingData);
            if (booking && booking.id) {
              bookings.push(booking);
            }
          } catch (parseError) {
            console.warn(
              `Failed to parse booking ${allBookingIds[index]}:`,
              parseError.message
            );
          }
        }
      });
    }

    // If no bookings found in sets, try scanning for orphaned bookings (fallback)
    // This can happen if sets were cleared but booking keys still exist
    if (bookings.length === 0) {
      console.log("⚠️  No bookings in sets, scanning for orphaned bookings...");
      let cursor = "0";
      const pattern = "booking:*";
      const maxIterations = 100;
      let iterations = 0;

      do {
        const result = await redis.scan(cursor, {
          MATCH: pattern,
          COUNT: 100,
        });

        cursor = String(result.cursor);
        const keys = result.keys.filter(
          (key) =>
            key !== "booking:pending" &&
            key !== "booking:confirmed" &&
            !key.includes(":locks") &&
            !key.startsWith("booking:failed:")
        );

        if (keys.length > 0) {
          const pipeline = redis.multi();
          keys.forEach((key) => pipeline.get(key));
          const scanResults = await pipeline.exec();

          scanResults.forEach((result, index) => {
            let bookingData = null;
            if (Array.isArray(result)) {
              const [error, value] = result;
              if (!error && value) {
                bookingData = value;
              }
            } else if (result && typeof result === "string") {
              bookingData = result;
            }

            if (bookingData) {
              try {
                const booking = JSON.parse(bookingData);
                if (booking && booking.id) {
                  bookings.push(booking);
                }
              } catch (parseError) {
                // Skip invalid JSON
              }
            }
          });
        }

        iterations++;
      } while (cursor !== "0" && iterations < maxIterations);

      if (bookings.length > 0) {
        console.log(`   Found ${bookings.length} orphaned bookings via scan`);
      }
    }

    res.json({ bookings, total: bookings.length });
  } catch (error) {
    console.error("Error in getAllBookings:", error);
    next(error);
  }
};

/**
 * Cancel booking - Redis-only
 * DELETE /api/bookings/:id
 */
const cancelBooking = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!redis.isReady) {
      return res.status(503).json({ error: "Redis not ready" });
    }

    const bookingKey = `booking:${id}`;
    const bookingData = await redis.get(bookingKey);

    if (!bookingData) {
      return res.status(404).json({ error: "Booking not found" });
    }

    const booking = JSON.parse(bookingData);

    // Only allow canceling pending bookings
    if (booking.status !== "pending") {
      return res.status(400).json({
        error: `Cannot cancel booking with status: ${booking.status}`,
      });
    }

    // Release locks
    const lockStorageKey = `booking:${id}:locks`;
    const storedLocks = await redis.get(lockStorageKey);
    if (storedLocks) {
      const locks = JSON.parse(storedLocks);
      await releaseLocks(locks);
      await redis.del(lockStorageKey);
    }

    // Remove from pending set
    await redis.sRem("booking:pending", id);

    // Release seats back to available (cancellation)
    const availableSeatsKey = "available_seats";
    if (booking.seat_ids && booking.seat_ids.length > 0) {
      await redis.sAdd(availableSeatsKey, booking.seat_ids);
    }

    // Delete booking
    await redis.del(bookingKey);

    console.log(`✅ Booking ${id} cancelled`);

    res.json({
      message: "Booking cancelled successfully",
      booking_id: id,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBooking,
  getBookingById,
  getBookingByRequestId,
  getAllBookings,
  cancelBooking,
};
