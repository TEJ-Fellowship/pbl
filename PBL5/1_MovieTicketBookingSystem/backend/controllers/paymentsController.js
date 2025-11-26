/**
 * Simplified Redis-Only Payment Controller
 * Seat-only approach for load testing and scaling
 * No PostgreSQL dependencies
 */

const redis = require("../utils/redis");
const { releaseLocks } = require("../utils/redisLock");
const crypto = require("crypto");

/**
 * Process payment - Redis-only
 * POST /api/payments/process
 * Body: { "booking_id": "...", "amount": 500, "payment_method": "credit_card" }
 */
const processPayment = async (req, res, next) => {
  try {
    const { booking_id, amount, payment_method, idempotency_key } = req.body;

    // Validation
    if (!booking_id || !amount || !payment_method) {
    return res.status(400).json({
        error: "booking_id, amount, and payment_method are required",
      });
    }

    if (!redis.isReady) {
      return res.status(503).json({ error: "Redis not ready" });
  }

    // Get booking from Redis
    const bookingKey = `booking:${booking_id}`;
    const bookingData = await redis.get(bookingKey);

    if (!bookingData) {
      return res.status(404).json({ error: "Booking not found" });
    }

    const booking = JSON.parse(bookingData);

    // Check booking status
    if (booking.status === "confirmed") {
      return res.status(400).json({
        error: "Booking is already confirmed",
        booking_id: booking.id,
      });
    }

    if (booking.status !== "pending") {
      return res.status(400).json({
        error: `Cannot process payment for ${booking.status} booking`,
      });
    }

    // Check idempotency (if key provided)
    if (idempotency_key) {
      const existingPaymentKey = `payment:${idempotency_key}`;
      const existingPayment = await redis.get(existingPaymentKey);
      if (existingPayment) {
        const payment = JSON.parse(existingPayment);
        if (payment.status === "success") {
        return res.json({
            payment_id: payment.id,
            booking_id: payment.booking_id,
            amount: payment.amount,
            status: payment.status,
          message: "Payment already processed successfully",
        });
      }
      }
    }

    // Validate amount
    if (parseFloat(amount) !== parseFloat(booking.total_amount)) {
      return res.status(400).json({
        error: "Payment amount does not match booking total",
        expected: booking.total_amount,
        received: amount,
      });
    }

    // Simulate payment processing (always success for load testing)
    const paymentStatus = "success";
    const transactionId = `txn_${crypto.randomUUID()}`;

    // Create payment record in Redis
    const paymentId = crypto.randomUUID();
    const paymentData = {
      id: paymentId,
      booking_id: booking_id,
        amount: parseFloat(amount),
      payment_method: payment_method,
      status: paymentStatus,
      transaction_id: transactionId,
      idempotency_key: idempotency_key || null,
      processed_at: new Date().toISOString(),
    };

    const paymentKey = `payment:${paymentId}`;
    await redis.setEx(paymentKey, 3600, JSON.stringify(paymentData)); // 1 hour TTL

    // Store by idempotency key if provided
    if (idempotency_key) {
      await redis.setEx(
        `payment:${idempotency_key}`,
        3600,
        JSON.stringify(paymentData)
      );
    }

      // Update booking status to confirmed
    const updatedBooking = {
      ...booking,
          status: "confirmed",
      confirmed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Update booking in Redis with longer TTL (1 hour for confirmed)
    await redis.setEx(bookingKey, 3600, JSON.stringify(updatedBooking));

    // Remove from pending set, add to confirmed set
    await redis.sRem("booking:pending", booking_id);
    await redis.sAdd("booking:confirmed", booking_id);
    await redis.expire("booking:confirmed", 3600);

    // Move seats to booked (they were already removed from available when booking was created)
    const bookedSeatsKey = "booked_seats";

    // Add seats to booked set (they're already removed from available_seats)
    if (booking.seat_ids && booking.seat_ids.length > 0) {
      await redis.sAdd(bookedSeatsKey, booking.seat_ids);
    }

    // Release locks (payment confirmed)
        const lockStorageKey = `booking:${booking_id}:locks`;
        const storedLocks = await redis.get(lockStorageKey);
        if (storedLocks) {
          const locks = JSON.parse(storedLocks);
          await releaseLocks(locks);
          await redis.del(lockStorageKey);
        }

    console.log(`✅ Payment processed for booking ${booking_id}`);

    res.json({
      payment_id: paymentId,
      booking_id: booking_id,
        amount: parseFloat(amount),
      status: paymentStatus,
      payment_method: payment_method,
        transaction_id: transactionId,
      receipt: {
        booking_id: booking_id,
        seats: booking.seat_ids,
        total_amount: booking.total_amount,
        confirmed_at: updatedBooking.confirmed_at,
      },
    });
  } catch (error) {
    console.error("Payment processing error:", error);
    next(error);
  }
};

/**
 * Get payment by booking ID - Redis-only
 * GET /api/payments/booking/:bookingId
 */
const getPaymentByBooking = async (req, res, next) => {
  try {
    const { bookingId } = req.params;

    if (!redis.isReady) {
      return res.status(503).json({ error: "Redis not ready" });
    }

    // Search for payment by booking_id
    const paymentKeys = await redis.keys("payment:*");
    for (const key of paymentKeys) {
      const paymentData = await redis.get(key);
      if (paymentData) {
        const payment = JSON.parse(paymentData);
        if (payment.booking_id === bookingId) {
          return res.json(payment);
        }
      }
    }

    res.status(404).json({ error: "Payment not found" });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  processPayment,
  getPaymentByBooking,
};
