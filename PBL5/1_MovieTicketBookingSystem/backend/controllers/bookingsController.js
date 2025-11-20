const { sequelize } = require("../utils/db");
const {
  Booking,
  BookingSeat,
  Showtime,
  Seat,
  Movie,
  Screen,
  Theater,
  User,
  Payment,
} = require("../models");
const { Op } = require("sequelize");
const redis = require("../utils/redis");
const { acquireLocks, releaseLocks } = require("../utils/redisLock");
const { expireOldPendingBookings } = require("./paymentsController");

const getAllBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.findAll({
      include: [
        {
          model: Showtime,
          as: "showtime",
          include: [
            {
              model: Movie,
              as: "movie",
              attributes: ["title"],
            },
          ],
        },
        {
          model: User,
          as: "user",
          attributes: ["name", "email"],
        },
      ],
      order: [["created_at", "DESC"]],
    });
    res.json(bookings);
  } catch (error) {
    next(error);
  }
};

const getBookingsByUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { status, startDate, endDate } = req.query;

    // Build where clause dynamically based on query params
    const whereClause = { user_id: userId };

    // Filter by status if provided
    if (status) {
      whereClause.status = status;
    }

    // Filter by date range if provided
    if (startDate || endDate) {
      whereClause.created_at = {};
      if (startDate) {
        whereClause.created_at[Op.gte] = new Date(startDate);
      }
      if (endDate) {
        whereClause.created_at[Op.lte] = new Date(endDate);
      }
    }

    const bookings = await Booking.findAll({
      where: whereClause,
      include: [
        {
          model: Showtime,
          as: "showtime",
          attributes: ["show_time", "price", "status"],
          include: [
            {
              model: Movie,
              as: "movie",
              attributes: ["id", "title", "poster_url", "duration"],
            },
            {
              model: Screen,
              as: "screen",
              attributes: ["screen_number"],
              include: [
                {
                  model: Theater,
                  as: "theater",
                  attributes: ["id", "name", "location", "city"],
                },
              ],
            },
          ],
        },
        {
          model: BookingSeat,
          as: "bookingSeats",
          attributes: ["id", "price"],
          include: [
            {
              model: Seat,
              as: "seat",
              attributes: ["seat_number", "row_number", "seat_type"],
            },
          ],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    // Format response with additional metadata
    const formattedBookings = bookings.map((booking) => ({
      id: booking.id,
      status: booking.status,
      total_amount: booking.total_amount,
      created_at: booking.created_at,
      confirmed_at: booking.confirmed_at,
      movie: booking.showtime?.movie,
      showtime: {
        id: booking.showtime?.id,
        show_time: booking.showtime?.show_time,
        price: booking.showtime?.price,
        status: booking.showtime?.status,
      },
      theater: booking.showtime?.screen?.theater,
      screen: {
        screen_number: booking.showtime?.screen?.screen_number,
      },
      seats: booking.bookingSeats?.map((bs) => ({
        seat_number: bs.seat?.seat_number,
        row_number: bs.seat?.row_number,
        seat_type: bs.seat?.seat_type,
        price: bs.price,
      })),
      seat_count: booking.bookingSeats?.length || 0,
    }));

    res.json({
      bookings: formattedBookings,
      total: formattedBookings.length,
      filters: {
        status: status || "all",
        date_range: {
          start: startDate || null,
          end: endDate || null,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

const getBookingById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findByPk(id, {
      include: [
        {
          model: Showtime,
          as: "showtime",
          attributes: [
            "id",
            "show_time",
            "price",
            "available_seats",
            "total_seats",
            "status",
          ],
          include: [
            {
              model: Movie,
              as: "movie",
              attributes: [
                "id",
                "title",
                "description",
                "duration",
                "genre",
                "language",
                "rating",
                "poster_url",
                "release_date",
              ],
            },
            {
              model: Screen,
              as: "screen",
              attributes: ["id", "screen_number", "total_seats"],
              include: [
                {
                  model: Theater,
                  as: "theater",
                  attributes: ["id", "name", "location", "city"],
                },
              ],
            },
          ],
        },
        {
          model: User,
          as: "user",
          attributes: ["id", "name", "email"],
        },
        {
          model: BookingSeat,
          as: "bookingSeats",
          attributes: ["id", "price"],
          include: [
            {
              model: Seat,
              as: "seat",
              attributes: [
                "id",
                "seat_number",
                "row_number",
                "column_number",
                "seat_type",
              ],
            },
          ],
        },
      ],
    });

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    // Format comprehensive booking details (receipt/ticket format)
    const bookingDetails = {
      booking: {
        id: booking.id,
        status: booking.status,
        total_amount: parseFloat(booking.total_amount),
        created_at: booking.created_at,
        confirmed_at: booking.confirmed_at,
        updated_at: booking.updated_at,
      },
      user: {
        id: booking.user?.id,
        name: booking.user?.name,
        email: booking.user?.email,
      },
      movie: {
        id: booking.showtime?.movie?.id,
        title: booking.showtime?.movie?.title,
        description: booking.showtime?.movie?.description,
        duration: booking.showtime?.movie?.duration,
        genre: booking.showtime?.movie?.genre,
        language: booking.showtime?.movie?.language,
        rating: booking.showtime?.movie?.rating,
        poster_url: booking.showtime?.movie?.poster_url,
        release_date: booking.showtime?.movie?.release_date,
      },
      showtime: {
        id: booking.showtime?.id,
        show_time: booking.showtime?.show_time,
        base_price: parseFloat(booking.showtime?.price || 0),
        available_seats: booking.showtime?.available_seats,
        total_seats: booking.showtime?.total_seats,
        status: booking.showtime?.status,
      },
      theater: {
        id: booking.showtime?.screen?.theater?.id,
        name: booking.showtime?.screen?.theater?.name,
        location: booking.showtime?.screen?.theater?.location,
        city: booking.showtime?.screen?.theater?.city,
      },
      screen: {
        id: booking.showtime?.screen?.id,
        screen_number: booking.showtime?.screen?.screen_number,
        total_seats: booking.showtime?.screen?.total_seats,
      },
      seats: booking.bookingSeats?.map((bs) => ({
        id: bs.seat?.id,
        seat_number: bs.seat?.seat_number,
        row_number: bs.seat?.row_number,
        column_number: bs.seat?.column_number,
        seat_type: bs.seat?.seat_type,
        price: parseFloat(bs.price),
      })),
      summary: {
        total_seats: booking.bookingSeats?.length || 0,
        total_amount: parseFloat(booking.total_amount),
        seat_types: booking.bookingSeats?.reduce((acc, bs) => {
          const type = bs.seat?.seat_type || "regular";
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        }, {}),
      },
    };

    res.json(bookingDetails);
  } catch (error) {
    next(error);
  }
};

const createBooking = async (req, res, next) => {
  try {
    const { user_id, showtime_id, seat_ids } = req.body;

    // ============================================
    // VALIDATION: Required Fields
    // ============================================
    if (!user_id || !showtime_id || !seat_ids || !Array.isArray(seat_ids)) {
      return res.status(400).json({
        error:
          "Missing required fields: user_id, showtime_id, and seat_ids (array) are required",
      });
    }

    if (seat_ids.length === 0) {
      return res.status(400).json({
        error: "At least one seat must be selected",
      });
    }

    // ============================================
    // TRANSACTION: All operations must succeed or fail together
    // ============================================
    const transaction = await sequelize.transaction();

    try {
      // ============================================
      // VALIDATION: User exists
      // ============================================
      const user = await User.findByPk(user_id, { transaction });
      if (!user) {
        await transaction.rollback();
        return res.status(404).json({ error: "User not found" });
      }

      // ============================================
      // VALIDATION: Showtime exists and is active
      // ============================================
      const showtime = await Showtime.findByPk(showtime_id, {
        include: [
          {
            model: Screen,
            as: "screen",
            attributes: ["id", "screen_number"],
          },
        ],
        transaction,
      });

      if (!showtime) {
        await transaction.rollback();
        return res.status(404).json({ error: "Showtime not found" });
      }

      if (showtime.status !== "active") {
        await transaction.rollback();
        return res.status(400).json({
          error: `Cannot book for showtime with status: ${showtime.status}`,
        });
      }

      // ============================================
      // VALIDATION: Showtime is in the future
      // ============================================
      if (new Date(showtime.show_time) <= new Date()) {
        await transaction.rollback();
        return res.status(400).json({
          error: "Cannot book for past showtimes",
        });
      }

      // ============================================
      // EXPIRY CHECK: Expire old pending bookings (older than 5 minutes)
      // This releases seats from bookings where payment was not completed
      // ============================================
      await expireOldPendingBookings(showtime_id, transaction);

      // ============================================
      // REDIS DISTRIBUTED LOCKING: Acquire locks for all seats
      // ============================================
      // Lock key format: seat:{seatId}:showtime:{showtimeId}
      const lockKeys = seat_ids.map(
        (seatId) => `seat:${seatId}:showtime:${showtime_id}`
      );
      const lockTTL = 300; // 5 minutes

      const { acquired: locks, failed: failedLocks } = await acquireLocks(
        lockKeys,
        lockTTL
      );

      // If any lock failed, another process is working on these seats
      if (failedLocks.length > 0) {
        await transaction.rollback();
        return res.status(409).json({
          error:
            "One or more seats are currently being processed by another user. Please try again.",
          seats_busy: failedLocks.length,
        });
      }

      // All locks acquired - proceed with booking
      try {
        // ============================================
        // VALIDATION: Check seat availability
        // ============================================
        const basePrice = parseFloat(showtime.price);
        let totalAmount = 0;
        const seatPrices = [];
        const screenId = showtime.screen_id;

        for (const seatId of seat_ids) {
          // Check seat exists
          const seat = await Seat.findByPk(seatId, { transaction });
          if (!seat) {
            await transaction.rollback();
            return res.status(404).json({ error: `Seat ${seatId} not found` });
          }

          // ============================================
          // VALIDATION: Seat belongs to showtime's screen
          // ============================================
          if (seat.screen_id !== screenId) {
            await transaction.rollback();
            return res.status(400).json({
              error: `Seat ${seatId} does not belong to this showtime's screen`,
            });
          }

          // ============================================
          // VALIDATION: Check if seat is already booked
          // Exclude cancelled/expired bookings so seats can be rebooked
          // Also exclude pending bookings older than 5 minutes (auto-expired)
          // ============================================
          const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
          const existingBooking = await BookingSeat.findOne({
            where: {
              showtime_id,
              seat_id: seatId,
            },
            include: [
              {
                model: Booking,
                as: "booking",
                where: {
                  status: { [Op.notIn]: ["cancelled", "refunded", "expired"] },
                  // Exclude pending bookings older than 5 minutes
                  [Op.or]: [
                    { status: { [Op.ne]: "pending" } },
                    {
                      status: "pending",
                      created_at: { [Op.gt]: fiveMinutesAgo },
                    },
                  ],
                },
                required: true,
              },
            ],
            transaction,
          });

          if (existingBooking) {
            await transaction.rollback();
            return res.status(409).json({
              error: `Seat ${seat.seat_number} is already booked`,
            });
          }

          // ============================================
          // NOTE: SeatReservation check removed - Redis lock handles concurrency
          // ============================================
          // Redis lock already prevents race conditions, so we only need to check
          // if seat is permanently booked (BookingSeat), not temporarily reserved

          // ============================================
          // PRICE CALCULATION: Based on seat type
          // ============================================
          let seatPrice = basePrice;
          if (seat.seat_type === "premium") seatPrice = basePrice * 1.5;
          if (seat.seat_type === "vip") seatPrice = basePrice * 2;

          totalAmount += seatPrice;
          seatPrices.push({ seat_id: seatId, price: seatPrice });
        }

        // ============================================
        // VALIDATION: Check if enough seats available
        // ============================================
        if (showtime.available_seats < seat_ids.length) {
          await transaction.rollback();
          return res.status(400).json({
            error: `Not enough seats available. Requested: ${seat_ids.length}, Available: ${showtime.available_seats}`,
          });
        }

        // ============================================
        // CREATE BOOKING: All validations passed
        // ============================================
        const booking = await Booking.create(
          {
            user_id,
            showtime_id,
            status: "pending",
            total_amount: totalAmount,
          },
          { transaction }
        );

        // ============================================
        // CREATE BOOKING_SEATS: Link seats to booking
        // ============================================
        for (const { seat_id, price } of seatPrices) {
          await BookingSeat.create(
            {
              booking_id: booking.id,
              seat_id,
              showtime_id,
              price,
            },
            { transaction }
          );
        }

        // ============================================
        // UPDATE SHOWTIME: Decrease available seats
        // ============================================
        await showtime.update(
          {
            available_seats: showtime.available_seats - seat_ids.length,
          },
          { transaction }
        );

        // ============================================
        // COMMIT TRANSACTION: Save all changes
        // ============================================
        await transaction.commit();

        // ============================================
        // STORE LOCKS: Keep locks until payment is confirmed or booking is cancelled
        // ============================================
        // Store lock tokens in Redis so we can release them later
        // Lock will auto-expire after 5 minutes (safety net)
        // But we'll release manually when payment confirms or booking cancels
        try {
          const lockStorageKey = `booking:${booking.id}:locks`;
          await redis.set(lockStorageKey, JSON.stringify(locks), { EX: 300 }); // 5 min TTL
        } catch (redisError) {
          console.warn("Failed to store lock tokens:", redisError.message);
          // If storage fails, release locks immediately (fallback)
          await releaseLocks(locks);
        }

        // ============================================
        // INVALIDATE CACHE: Seat availability changed
        // ============================================
        try {
          await redis.del(`showtime:${showtime_id}:seats`);
          // Also invalidate showtime details cache
          await redis.del(`showtime:${showtime_id}`);
        } catch (redisError) {
          console.warn("Failed to invalidate cache:", redisError.message);
        }

        // ============================================
        // RETURN SUCCESS: Include booking with seats
        // ============================================
        const bookingWithDetails = await Booking.findByPk(booking.id, {
          include: [
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
          ],
        });

        res.status(201).json(bookingWithDetails);
      } catch (error) {
        // ============================================
        // ROLLBACK: Undo all changes on error
        // ============================================
        await transaction.rollback();
        // Release locks on error (booking wasn't created, so release locks)
        await releaseLocks(locks);
        throw error;
      }
    } catch (error) {
      // ============================================
      // ROLLBACK: If transaction wasn't started or other error
      // ============================================
      if (transaction && !transaction.finished) {
        await transaction.rollback();
      }
      throw error;
    }
  } catch (error) {
    next(error);
  }
};

const confirmBooking = async (req, res, next) => {
  try {
    const { id } = req.params;

    const transaction = await sequelize.transaction();

    try {
      const booking = await Booking.findByPk(id, { transaction });
      if (!booking || booking.status !== "pending") {
        await transaction.rollback();
        return res
          .status(404)
          .json({ error: "Booking not found or already processed" });
      }

      await booking.update(
        {
          status: "confirmed",
          confirmed_at: new Date(),
        },
        { transaction }
      );

      await transaction.commit();

      // ============================================
      // RELEASE LOCKS: Payment confirmed, release locks
      // ============================================
      try {
        const lockStorageKey = `booking:${id}:locks`;
        const storedLocks = await redis.get(lockStorageKey);
        if (storedLocks) {
          const locks = JSON.parse(storedLocks);
          await releaseLocks(locks);
          // Delete the storage key
          await redis.del(lockStorageKey);
        }
      } catch (redisError) {
        console.warn(
          "Failed to release locks on confirmation:",
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

      res.json(booking);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    next(error);
  }
};

const updateBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: "Status is required" });
    }

    const booking = await Booking.findByPk(id);
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    await booking.update({ status });
    res.json(booking);
  } catch (error) {
    next(error);
  }
};

const cancelBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body; // Optional cancellation reason

    const transaction = await sequelize.transaction();

    try {
      const booking = await Booking.findByPk(id, {
        include: [
          {
            model: Showtime,
            as: "showtime",
            attributes: ["id", "show_time", "available_seats"],
          },
          {
            model: BookingSeat,
            as: "bookingSeats",
            attributes: ["id", "seat_id"],
          },
        ],
        transaction,
      });

      if (!booking) {
        await transaction.rollback();
        return res.status(404).json({ error: "Booking not found" });
      }

      // ============================================
      // CANCELLATION RULES: Check if cancellation is allowed
      // ============================================
      const cancellationRules = {
        // Cannot cancel already cancelled bookings
        cannotCancelStatuses: ["cancelled", "refunded", "expired"],
        // Cannot cancel if showtime is in the past
        cannotCancelIfShowtimePast: true,
        // Cancellation window: Can cancel up to 2 hours before showtime
        cancellationWindowHours: 2,
      };

      // Check if booking is already cancelled
      if (cancellationRules.cannotCancelStatuses.includes(booking.status)) {
        await transaction.rollback();
        return res.status(400).json({
          error: `Cannot cancel booking with status: ${booking.status}`,
        });
      }

      // Check if showtime is in the past
      if (cancellationRules.cannotCancelIfShowtimePast) {
        const showtimeDate = new Date(booking.showtime?.show_time);
        const now = new Date();
        if (showtimeDate <= now) {
          await transaction.rollback();
          return res.status(400).json({
            error: "Cannot cancel booking for past showtimes",
          });
        }
      }

      // Check cancellation window (2 hours before showtime)
      const showtimeDate = new Date(booking.showtime?.show_time);
      const cancellationDeadline = new Date(
        showtimeDate.getTime() -
          cancellationRules.cancellationWindowHours * 60 * 60 * 1000
      );
      const now = new Date();

      if (now > cancellationDeadline) {
        await transaction.rollback();
        return res.status(400).json({
          error: `Cancellation deadline passed. Must cancel at least ${cancellationRules.cancellationWindowHours} hours before showtime.`,
          cancellation_deadline: cancellationDeadline,
          showtime: showtimeDate,
        });
      }

      // ============================================
      // CHECK PAYMENT STATUS: Determine if refunded or just cancelled
      // ============================================
      const payment = await Payment.findOne({
        where: { booking_id: id },
        transaction,
      });

      const hadPayment = payment && payment.status === "success";

      // ============================================
      // CANCEL BOOKING: Set status based on payment
      // ============================================
      // If payment was made → status = "refunded"
      // If no payment → status = "cancelled"
      const bookingStatus = hadPayment ? "refunded" : "cancelled";

      await booking.update(
        {
          status: bookingStatus,
          // Store cancellation metadata (if you add a cancellation_reason field later)
        },
        { transaction }
      );

      // ============================================
      // RELEASE SEATS: Make seats available again
      // ============================================
      const seatCount = booking.bookingSeats?.length || 0;

      // Extract seat IDs BEFORE deleting BookingSeat records (needed for lock cleanup)
      const seatIds = booking.bookingSeats?.map((bs) => bs.seat_id) || [];

      // Delete booking seats (cascade will handle this, but explicit for clarity)
      await BookingSeat.destroy({
        where: { booking_id: id },
        transaction,
      });

      // ============================================
      // UPDATE SHOWTIME: Increase available seats
      // ============================================
      if (booking.showtime && seatCount > 0) {
        await booking.showtime.update(
          {
            available_seats: booking.showtime.available_seats + seatCount,
          },
          { transaction }
        );
      }

      // ============================================
      // HANDLE PAYMENT REFUND (if payment exists) - BEFORE COMMIT
      // ============================================
      if (hadPayment) {
        // Update payment status to refunded
        await payment.update(
          {
            status: "refunded", // Call Refund Api later in prod
          },
          { transaction }
        );
      }

      // ============================================
      // COMMIT TRANSACTION: All database changes
      // ============================================
      await transaction.commit();

      // ============================================
      // RELEASE LOCKS: Booking cancelled, release locks (after commit)
      // ============================================
      try {
        const lockStorageKey = `booking:${id}:locks`;
        const storedLocks = await redis.get(lockStorageKey);
        if (storedLocks) {
          // Release locks using stored tokens (proper way)
          const locks = JSON.parse(storedLocks);
          await releaseLocks(locks);
          // Delete the storage key
          await redis.del(lockStorageKey);
        } else {
          // Fallback: If stored locks don't exist (e.g., booking was already confirmed),
          // try to release any stale locks by reconstructing lock keys from seat IDs
          // This handles edge cases where locks might still exist even after confirmation
          if (seatIds.length > 0 && booking.showtime_id) {
            const lockKeys = seatIds.map(
              (seatId) => `seat:${seatId}:showtime:${booking.showtime_id}`
            );
            // Try to delete lock keys directly (they should be expired, but clean up just in case)
            // Note: This is safe because if locks were properly released, keys won't exist
            // If they do exist, they're stale and should be cleaned up
            for (const key of lockKeys) {
              try {
                const lockKey = `lock:${key}`;
                await redis.del(lockKey);
              } catch (err) {
                // Ignore errors - lock might not exist or already expired
              }
            }
          }
        }
      } catch (redisError) {
        console.warn(
          "Failed to release locks on cancellation:",
          redisError.message
        );
      }

      // ============================================
      // INVALIDATE CACHE: Seat availability changed
      // ============================================
      try {
        const showtimeId = booking.showtime_id;
        await redis.del(`showtime:${showtimeId}:seats`);
        // Also invalidate showtime details cache
        await redis.del(`showtime:${showtimeId}`);
      } catch (redisError) {
        console.warn("Failed to invalidate cache:", redisError.message);
      }

      // ============================================
      // VERIFY: Double-check that seats were actually released
      // ============================================
      // Verify BookingSeat records were deleted
      const remainingBookingSeats = await BookingSeat.count({
        where: { booking_id: id },
      });

      // Return cancellation details
      res.json({
        message: hadPayment
          ? "Booking refunded successfully"
          : "Booking cancelled successfully",
        booking_id: id,
        status: bookingStatus,
        cancelled_at: new Date(),
        seats_released: seatCount,
        seats_verified_deleted: remainingBookingSeats === 0,
        refund_processed: hadPayment,
        cancellation_reason: reason || null,
      });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllBookings,
  getBookingsByUser,
  getBookingById,
  createBooking,
  confirmBooking,
  updateBooking,
  cancelBooking,
};
