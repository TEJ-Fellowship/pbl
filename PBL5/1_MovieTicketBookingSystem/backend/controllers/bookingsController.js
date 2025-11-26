/**
 * Simplified Redis-Only Booking Controller
 * Seat-only approach for load testing and scaling
 * No PostgreSQL dependencies
 */

const redis = require("../utils/redis");
const { acquireLocks, releaseLocks } = require("../utils/redisLock");
const crypto = require("crypto");

/**
 * Create booking - Redis-only, seat-only
 * POST /api/bookings
 * Body: { "seat_ids": ["seat1", "seat2", ...] }
 */
const createBooking = async (req, res, next) => {
  try {
    const { seat_ids } = req.body;

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
 * Get all bookings - Redis-only (for testing)
 * GET /api/bookings
 */
const getAllBookings = async (req, res, next) => {
  try {
    if (!redis.isReady) {
      return res.status(503).json({ error: "Redis not ready" });
    }

    // Get all booking keys
    const bookingKeys = await redis.keys("booking:*");
    const bookingIds = bookingKeys
      .filter((key) => {
        // Exclude SET keys (booking:pending, booking:confirmed) and lock storage keys
        return (
          key !== "booking:pending" &&
          key !== "booking:confirmed" &&
          !key.includes(":locks")
        );
      })
      .map((key) => key.replace("booking:", ""));

    // Get all bookings
    const bookings = [];
    for (const id of bookingIds) {
      const bookingData = await redis.get(`booking:${id}`);
      if (bookingData) {
        bookings.push(JSON.parse(bookingData));
      }
    }

    res.json({ bookings, total: bookings.length });
  } catch (error) {
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
  getAllBookings,
  cancelBooking,
};
