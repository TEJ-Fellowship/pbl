const {
  Booking,
  Payment,
  BookingSeat,
  Showtime,
  Movie,
  Screen,
  Theater,
  User,
  Seat,
} = require("../models");
const { Op, Sequelize } = require("sequelize");
const { sequelize } = require("../utils/db");
const redis = require("../utils/redis");
const { releaseLocks } = require("../utils/redisLock");

/**
 * Helper function to expire old pending bookings (older than 5 minutes)
 * This releases seats from bookings where payment was not completed
 * Adapted to work with Redis locks
 */
const expireOldPendingBookings = async (showtime_id, transaction) => {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

  // Find pending bookings older than 5 minutes
  const expiredBookings = await Booking.findAll({
    where: {
      showtime_id,
      status: "pending",
      created_at: { [Op.lt]: fiveMinutesAgo },
    },
    transaction,
  });

  if (expiredBookings.length === 0) {
    return 0;
  }

  // Get all booking seats for expired bookings
  const expiredBookingIds = expiredBookings.map((b) => b.id);
  const expiredBookingSeats = await BookingSeat.findAll({
    where: {
      booking_id: { [Op.in]: expiredBookingIds },
    },
    transaction,
  });

  // Update booking status to expired
  await Booking.update(
    { status: "expired" },
    {
      where: {
        id: { [Op.in]: expiredBookingIds },
      },
      transaction,
    }
  );

  // Note: SeatReservation cleanup removed - Redis locks handle seat reservations now

  // ============================================
  // RELEASE REDIS LOCKS: For expired bookings
  // ============================================
  for (const expiredBooking of expiredBookings) {
    try {
      const lockStorageKey = `booking:${expiredBooking.id}:locks`;
      const storedLocks = await redis.get(lockStorageKey);
      if (storedLocks) {
        const locks = JSON.parse(storedLocks);
        await releaseLocks(locks);
        await redis.del(lockStorageKey);
      }
    } catch (redisError) {
      console.warn(
        `Failed to release locks for expired booking ${expiredBooking.id}:`,
        redisError.message
      );
    }
  }

  // Restore available seats count
  const showtime = await Showtime.findByPk(showtime_id, {
    lock: transaction.LOCK.UPDATE,
    transaction,
  });

  if (showtime) {
    await showtime.update(
      {
        available_seats: showtime.available_seats + expiredBookingSeats.length,
      },
      { transaction }
    );
  }

  return expiredBookingSeats.length;
};

// Simulated payment processing
const processPayment = async (req, res, next) => {
  const { booking_id, payment_method, amount, idempotency_key } = req.body;

  if (!booking_id || !payment_method || !amount) {
    return res.status(400).json({
      error: "Missing details:- booking_id, payment_method and amount",
    });
  }

  const validPaymentMethods = ["credit_card", "debit_card", "eSewa", "Khalti"];

  if (!validPaymentMethods.includes(payment_method)) {
    return res.status(400).json({
      error: `Invalid payment method. Must be one of: ${validPaymentMethods.join(
        ", "
      )}`,
    });
  }

  // ============================================
  // TRANSACTION: Ensure atomicity
  // ============================================
  const transaction = await sequelize.transaction({
    isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.SERIALIZABLE,
  });

  try {
    // Validation: Lock and verify booking FIRST (before idempotency check)
    const booking = await Booking.findByPk(booking_id, {
      lock: transaction.LOCK.UPDATE,
      transaction,
    });

    if (!booking) {
      await transaction.rollback();
      return res.status(404).json({ error: "Booking not found" });
    }

    // Load related data after lock is acquired (avoids JOIN lock issues)
    await booking.reload({
      include: [
        {
          model: Showtime,
          as: "showtime",
          include: [
            { model: Movie, as: "movie" },
            {
              model: Screen,
              as: "screen",
              include: [{ model: Theater, as: "theater" }],
            },
          ],
        },
        { model: User, as: "user" },
      ],
      transaction,
    });

    // ============================================
    // EXPIRY CHECK: Expire old pending bookings (older than 5 minutes)
    // This releases seats from bookings where payment was not completed
    // ============================================
    await expireOldPendingBookings(booking.showtime_id, transaction);

    // Reload booking to get updated status if it was expired
    await booking.reload({ transaction });

    // ============================================
    // VALIDATION: Check booking status
    // ============================================
    if (booking.status === "confirmed") {
      await transaction.rollback();
      return res.status(400).json({
        error: "Booking is already confirmed",
        booking_id: booking.id,
        status: booking.status,
      });
    }

    if (
      booking.status === "cancelled" ||
      booking.status === "refunded" ||
      booking.status === "expired"
    ) {
      await transaction.rollback();
      return res.status(400).json({
        error: `Cannot process payment for ${booking.status} booking`,
        booking_id: booking.id,
      });
    }

    // ============================================
    // IDEMPOTENCY CHECK: Prevent duplicate payments
    // Only check if idempotency_key provided AND booking is not cancelled
    // ============================================
    if (idempotency_key) {
      const existingPayment = await Payment.findOne({
        where: { idempotency_key },
        transaction,
      });

      // Only return existing payment if it was successful
      // If refunded/failed, allow new payment attempt
      if (existingPayment && existingPayment.status === "success") {
        await transaction.rollback();
        return res.json({
          payment_id: existingPayment.id,
          booking_id: existingPayment.booking_id,
          amount: existingPayment.amount,
          status: existingPayment.status,
          payment_method: existingPayment.payment_method,
          transaction_id: existingPayment.transaction_id,
          message: "Payment already processed successfully",
          booking: booking,
        });
      }
      // If existing payment is refunded/failed, continue with new payment
    }

    // ============================================
    // CHECK: If payment already exists for this booking (successful)
    // ============================================
    const existingBookingPayment = await Payment.findOne({
      where: {
        booking_id,
        status: "success", // Only check for successful payments
      },
      transaction,
    });

    if (existingBookingPayment) {
      await transaction.rollback();
      return res.status(400).json({
        error: "Payment already processed successfully for this booking",
        payment_id: existingBookingPayment.id,
        booking_id: booking.id,
        status: booking.status,
      });
    }

    // ============================================
    // VALIDATION: Verify payment amount
    // ============================================
    if (parseFloat(amount) !== parseFloat(booking.total_amount)) {
      await transaction.rollback();
      return res.status(400).json({
        error: "Payment amount does not match booking total",
        expected: parseFloat(booking.total_amount),
        received: parseFloat(amount),
      });
    }

    // ============================================
    // CREATE PAYMENT RECORD: Before processing
    // ============================================
    const payment = await Payment.create(
      {
        booking_id,
        amount: parseFloat(amount),
        payment_method,
        status: "processing",
        idempotency_key,
        transaction_id: null,
      },
      { transaction }
    );

    // ============================================
    // SIMULATE PAYMENT PROCESSING
    // ============================================
    // In production, this would call actual payment gateway
    const paymentStatus = Math.random() > 0.1 ? "success" : "failed"; // 90% success rate
    const transactionId = `txn_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    let failureReason = null;

    if (paymentStatus === "failed") {
      const failureReasons = [
        "Insufficient funds",
        "Card declined",
        "Network error",
        "Payment gateway timeout",
        "Invalid card details",
      ];

      failureReason =
        failureReasons[Math.floor(Math.random() * failureReasons.length)];
    }

    // ============================================
    // UPDATE PAYMENT STATUS
    // ============================================
    await payment.update(
      {
        status: paymentStatus,
        transaction_id: transactionId,
        failure_reason: failureReason,
        processed_at: new Date(),
      },
      { transaction }
    );

    // ============================================
    // HANDLE PAYMENT SUCCESS
    // ============================================
    if (paymentStatus === "success") {
      // Update booking status to confirmed
      await booking.update(
        {
          status: "confirmed",
          confirmed_at: new Date(),
        },
        { transaction }
      );

      // Get booking seats
      const bookingSeats = await BookingSeat.findAll({
        where: { booking_id },
        include: [{ model: Seat, as: "seat" }],
        transaction,
      });

      // Note: SeatReservation cleanup removed - Redis locks handle seat reservations now

      await transaction.commit();

      // ============================================
      // RELEASE REDIS LOCKS: Payment confirmed, release locks
      // ============================================
      try {
        const lockStorageKey = `booking:${booking_id}:locks`;
        const storedLocks = await redis.get(lockStorageKey);
        if (storedLocks) {
          const locks = JSON.parse(storedLocks);
          await releaseLocks(locks);
          // Delete the storage key
          await redis.del(lockStorageKey);
        }
      } catch (redisError) {
        console.warn(
          "Failed to release locks on payment confirmation:",
          redisError.message
        );
      }

      // ============================================
      // INVALIDATE CACHE: Seat availability changed
      // ============================================
      try {
        await redis.del(`showtime:${booking.showtime_id}:seats`);
        await redis.del(`showtime:${booking.showtime_id}`);
      } catch (redisError) {
        console.warn("Failed to invalidate cache:", redisError.message);
      }

      // ============================================
      // GENERATE RECEIPT/TICKET
      // ============================================
      const receipt = await generateReceipt(booking.id);

      return res.json({
        payment_id: payment.id,
        booking_id,
        amount: parseFloat(amount),
        status: "success",
        payment_method,
        transaction_id: transactionId,
        message: "Payment processed successfully",
        receipt,
        booking: {
          id: booking.id,
          status: booking.status,
          confirmed_at: booking.confirmed_at,
          showtime: booking.showtime,
          user: booking.user,
        },
      });
    } else {
      // ============================================
      // HANDLE PAYMENT FAILURE
      // ============================================
      await transaction.commit();

      return res.status(402).json({
        payment_id: payment.id,
        booking_id,
        amount: parseFloat(amount),
        status: "failed",
        payment_method,
        transaction_id: transactionId,
        failure_reason: failureReason,
        message: "Payment processing failed. Please try again.",
        retry_allowed: true,
      });
    }
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

/**
 * Generate receipt/ticket for confirmed booking
 */
const generateReceipt = async (bookingId) => {
  const booking = await Booking.findByPk(bookingId, {
    include: [
      {
        model: Showtime,
        as: "showtime",
        include: [
          {
            model: Movie,
            as: "movie",
            attributes: ["id", "title", "duration", "genre"],
          },
          {
            model: Screen,
            as: "screen",
            attributes: ["screen_number"],
            include: [
              {
                model: Theater,
                as: "theater",
                attributes: ["name", "location", "city"],
              },
            ],
          },
        ],
      },
      { model: User, as: "user", attributes: ["name", "email"] },
      {
        model: BookingSeat,
        as: "bookingSeats",
        include: [
          {
            model: Seat,
            as: "seat",
            attributes: ["seat_number", "row_number", "seat_type"],
          },
        ],
      },
      {
        model: Payment,
        as: "payment",
        attributes: ["transaction_id", "payment_method", "processed_at"],
      },
    ],
  });

  if (!booking || booking.status !== "confirmed") {
    throw new Error("Cannot generate receipt for unconfirmed booking");
  }

  const receipt = {
    receipt_id: `REC-${booking.id.substring(0, 8).toUpperCase()}`,
    booking_id: booking.id,
    ticket_number: `TKT-${booking.id
      .substring(0, 8)
      .toUpperCase()}-${Date.now()}`,
    issued_at: new Date().toISOString(),
    customer: {
      name: booking.user.name,
      email: booking.user.email,
    },
    movie: {
      title: booking.showtime.movie.title,
      duration: booking.showtime.movie.duration,
      genre: booking.showtime.movie.genre,
    },
    showtime: {
      date: booking.showtime.show_time,
      theater: booking.showtime.screen.theater.name,
      location: `${booking.showtime.screen.theater.location}, ${booking.showtime.screen.theater.city}`,
      screen: `Screen ${booking.showtime.screen.screen_number}`,
    },
    seats: booking.bookingSeats.map((bs) => ({
      seat_number: bs.seat.seat_number,
      row: bs.seat.row_number,
      type: bs.seat.seat_type,
      price: parseFloat(bs.price),
    })),
    payment: {
      transaction_id: booking.payment?.transaction_id,
      payment_method: booking.payment?.payment_method,
      amount: parseFloat(booking.total_amount),
      paid_at: booking.payment?.processed_at,
    },
    total_amount: parseFloat(booking.total_amount),
    booking_status: booking.status,
    confirmed_at: booking.confirmed_at,
  };

  return receipt;
};

/**
 * Get payment by ID
 */
const getPaymentById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const payment = await Payment.findByPk(id, {
      include: [
        {
          model: Booking,
          as: "booking",
          include: [
            {
              model: Showtime,
              as: "showtime",
              include: [
                { model: Movie, as: "movie", attributes: ["title"] },
                {
                  model: Screen,
                  as: "screen",
                  include: [
                    { model: Theater, as: "theater", attributes: ["name"] },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });

    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }

    res.json(payment);
  } catch (error) {
    next(error);
  }
};

/**
 * Get payment by booking ID
 */
const getPaymentByBooking = async (req, res, next) => {
  try {
    const { bookingId } = req.params;

    const payment = await Payment.findOne({
      where: { booking_id: bookingId },
      include: [
        {
          model: Booking,
          as: "booking",
          include: [
            {
              model: Showtime,
              as: "showtime",
              include: [
                { model: Movie, as: "movie" },
                {
                  model: Screen,
                  as: "screen",
                  include: [{ model: Theater, as: "theater" }],
                },
              ],
            },
            { model: User, as: "user" },
          ],
        },
      ],
    });

    if (!payment) {
      return res
        .status(404)
        .json({ error: "Payment not found for this booking" });
    }

    // If payment is successful, include receipt
    if (payment.status === "success") {
      const receipt = await generateReceipt(bookingId);
      return res.json({
        ...payment.toJSON(),
        receipt,
      });
    }

    res.json(payment);
  } catch (error) {
    next(error);
  }
};

/**
 * Get payment refund status by booking ID
 */
const getRefundStatus = async (req, res, next) => {
  try {
    const { booking_id } = req.query;

    if (!booking_id) {
      return res
        .status(400)
        .json({ error: "booking_id query parameter is required" });
    }

    const payment = await Payment.findOne({
      where: { booking_id },
      include: [
        {
          model: Booking,
          as: "booking",
          include: [
            {
              model: Showtime,
              as: "showtime",
              include: [
                { model: Movie, as: "movie" },
                {
                  model: Screen,
                  as: "screen",
                  include: [{ model: Theater, as: "theater" }],
                },
              ],
            },
            { model: User, as: "user" },
          ],
        },
      ],
    });

    if (!payment) {
      return res
        .status(404)
        .json({ error: "Payment not found for this booking" });
    }

    res.json({
      payment_id: payment.id,
      booking_id: payment.booking_id,
      status: payment.status,
      amount: payment.amount,
      refunded: payment.status === "refunded",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  processPayment,
  getPaymentById,
  getPaymentByBooking,
  getRefundStatus,
  generateReceipt, // Export for use in booking controller
  expireOldPendingBookings, // Export for use in booking controller
};
