const { sequelize } = require("../utils/db");
const {
  Booking,
  BookingSeat,
  SeatReservation,
  Showtime,
  Seat,
  Movie,
  Screen,
  Theater,
  User,
  Payment,
} = require("../models");
const { Op, Sequelize } = require("sequelize");

// Helper Function for reserving part
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

  // Release seat reservations
  if (expiredBookingSeats.length > 0) {
    await SeatReservation.update(
      { status: "expired" },
      {
        where: {
          showtime_id,
          seat_id: { [Op.in]: expiredBookingSeats.map((bs) => bs.seat_id) },
          status: "reserved",
        },
        transaction,
      }
    );
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

    // VALIDATION: Required Fields
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

    // TRANSACTION: All operations must succeed or fail together
    const transaction = await sequelize.transaction({
      isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.SERIALIZABLE,
    });
    try {
      // VALIDATION: User exists
      const user = await User.findByPk(user_id, { transaction });
      if (!user) {
        await transaction.rollback();
        return res.status(404).json({ error: "User not found" });
      }

      // VALIDATION: Showtime exists and is active
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

      // VALIDATION: Showtime is in the future
      if (new Date(showtime.show_time) <= new Date()) {
        await transaction.rollback();
        return res.status(400).json({
          error: "Cannot book for past showtimes",
        });
      }

      // EXPIRY CHECK: Expire old pending bookings (older than 5 minutes)
      // This releases seats from bookings where payment was not completed
      await expireOldPendingBookings(showtime_id, transaction);

      // VALIDATION: Check seat availability
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

        // VALIDATION: Seat belongs to showtime's screen

        if (seat.screen_id !== screenId) {
          await transaction.rollback();
          return res.status(400).json({
            error: `Seat ${seatId} does not belong to this showtime's screen`,
          });
        }

        // VALIDATION: Check if seat is already booked
        // Exclude cancelled/expired bookings so seats can be rebooked
        // Also exclude pending bookings older than 5 minutes (auto-expired)

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
                status: { [Op.notIn]: ["cancelled", "expired"] },
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

        // PRICE CALCULATION: Based on seat type

        let seatPrice = basePrice;
        if (seat.seat_type === "premium") seatPrice = basePrice * 1.5;
        if (seat.seat_type === "vip") seatPrice = basePrice * 2;

        totalAmount += seatPrice;
        seatPrices.push({ seat_id: seatId, price: seatPrice });
      }

      // VALIDATION: Check if enough seats available
      if (showtime.available_seats < seat_ids.length) {
        await transaction.rollback();
        return res.status(400).json({
          error: `Not enough seats available. Requested: ${seat_ids.length}, Available: ${showtime.available_seats}`,
        });
      }

      // CREATE BOOKING: All validations passed
      const booking = await Booking.create(
        {
          user_id,
          showtime_id,
          status: "pending",
          total_amount: totalAmount,
        },
        { transaction }
      );

      // CREATE BOOKING_SEATS: Link seats to booking
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

      // COMMIT TRANSACTION: Save all changes
      await transaction.commit();

      // RETURN SUCCESS: Include booking with seats
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
      // ROLLBACK: Undo all changes on error
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    next(error);
  }
};

const confirmBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { payment_id } = req.body; // Optional: if payment already processed

    const transaction = await sequelize.transaction({
      isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.SERIALIZABLE,
    });

    try {
      // LOCK BOOKING: Prevent concurrent updates
      const booking = await Booking.findByPk(id, {
        lock: transaction.LOCK.UPDATE,
        transaction,
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
      });

      if (!booking) {
        await transaction.rollback();
        return res.status(404).json({ error: "Booking not found" });
      }

      // VALIDATION: Check booking status
      if (booking.status === "confirmed") {
        await transaction.rollback();
        // Return existing confirmed booking with receipt
        const { generateReceipt } = require("./paymentsController");
        const receipt = await generateReceipt(id);
        return res.json({
          message: "Booking already confirmed",
          booking,
          receipt,
        });
      }

      if (booking.status !== "pending") {
        await transaction.rollback();
        return res.status(400).json({
          error: `Cannot confirm booking with status: ${booking.status}`,
          current_status: booking.status,
        });
      }

      // CHECK PAYMENT: If payment_id provided, verify it
      if (payment_id) {
        const { Payment } = require("../models");
        const payment = await Payment.findOne({
          where: { id: payment_id, booking_id: id },
          transaction,
        });

        if (!payment) {
          await transaction.rollback();
          return res
            .status(404)
            .json({ error: "Payment not found for this booking" });
        }

        if (payment.status !== "success") {
          await transaction.rollback();
          return res.status(402).json({
            error: "Payment not successful",
            payment_status: payment.status,
            failure_reason: payment.failure_reason,
          });
        }
      } else {
        // If no payment_id, check if payment exists
        const { Payment } = require("../models");
        const payment = await Payment.findOne({
          where: { booking_id: id, status: "success" },
          transaction,
        });

        if (!payment) {
          await transaction.rollback();
          return res.status(402).json({
            error: "Payment required before confirmation",
            message:
              "Please process payment first using POST /api/payments/process",
          });
        }
      }

      // GET BOOKING SEATS: For reservation cleanup
      const bookingSeats = await BookingSeat.findAll({
        where: { booking_id: id },
        transaction,
      });

      // UPDATE BOOKING STATUS
      await booking.update(
        {
          status: "confirmed",
          confirmed_at: new Date(),
        },
        { transaction }
      );

      // CLEAN UP RESERVATIONS: Mark as confirmed
      await SeatReservation.update(
        { status: "confirmed" },
        {
          where: {
            showtime_id: booking.showtime_id,
            seat_id: { [Op.in]: bookingSeats.map((bs) => bs.seat_id) },
            status: "reserved",
          },
          transaction,
        }
      );

      await transaction.commit();

      // GENERATE RECEIPT/TICKET
      const { generateReceipt } = require("./paymentsController");
      const receipt = await generateReceipt(id);

      // RETURN CONFIRMED BOOKING WITH RECEIPT
      const confirmedBooking = await Booking.findByPk(id, {
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

      res.json({
        message: "Booking confirmed successfully",
        booking: confirmedBooking,
        receipt,
      });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Update booking status with proper state transitions
 */
const updateBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // ============================================
    // VALIDATION: Valid status values
    // ============================================
    const validStatuses = [
      "pending",
      "reserved",
      "confirmed",
      "cancelled",
      "expired",
    ];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        error: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    const transaction = await sequelize.transaction({
      isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.SERIALIZABLE,
    });

    try {
      // LOCK BOOKING: Prevent concurrent updates
      const booking = await Booking.findByPk(id, {
        lock: transaction.LOCK.UPDATE,
        transaction,
      });

      if (!booking) {
        await transaction.rollback();
        return res.status(404).json({ error: "Booking not found" });
      }

      // VALIDATE STATE TRANSITIONS
      const currentStatus = booking.status;
      const allowedTransitions = {
        pending: ["reserved", "confirmed", "cancelled"],
        reserved: ["confirmed", "cancelled", "expired"],
        confirmed: ["cancelled"], // Can only cancel confirmed bookings
        cancelled: [], // Terminal state
        expired: [], // Terminal state
      };

      if (!allowedTransitions[currentStatus]?.includes(status)) {
        await transaction.rollback();
        return res.status(400).json({
          error: `Invalid status transition from ${currentStatus} to ${status}`,
          current_status: currentStatus,
          requested_status: status,
          allowed_transitions: allowedTransitions[currentStatus] || [],
        });
      }

      // UPDATE STATUS
      const updateData = { status };
      if (status === "confirmed" && !booking.confirmed_at) {
        updateData.confirmed_at = new Date();
      }

      await booking.update(updateData, { transaction });

      // HANDLE CANCELLATION: Release seats
      if (status === "cancelled") {
        // Release seat reservations
        const bookingSeats = await BookingSeat.findAll({
          where: { booking_id: id },
          transaction,
        });

        await SeatReservation.update(
          { status: "expired" },
          {
            where: {
              showtime_id: booking.showtime_id,
              seat_id: { [Op.in]: bookingSeats.map((bs) => bs.seat_id) },
              status: { [Op.in]: ["reserved", "confirmed"] },
            },
            transaction,
          }
        );

        // Restore available seats count
        const showtime = await Showtime.findByPk(booking.showtime_id, {
          lock: transaction.LOCK.UPDATE,
          transaction,
        });

        if (showtime) {
          await showtime.update(
            {
              available_seats: showtime.available_seats + bookingSeats.length,
            },
            { transaction }
          );
        }
      }

      await transaction.commit();

      const updatedBooking = await Booking.findByPk(id, {
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
      });

      res.json({
        message: `Booking status updated to ${status}`,
        booking: updatedBooking,
      });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    next(error);
  }
};

const cancelBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body; // Optional cancellation reason

    const transaction = await sequelize.transaction({
      isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.SERIALIZABLE,
    });
    try {
      // LOCK BOOKING: Without includes to avoid outer join issue
      const booking = await Booking.findByPk(id, {
        lock: transaction.LOCK.UPDATE,
        transaction,
      });

      if (!booking) {
        await transaction.rollback();
        return res.status(404).json({ error: "Booking not found" });
      }

      // VALIDATION: Check if booking can be cancelled
      if (booking.status === "cancelled") {
        await transaction.rollback();
        return res.status(400).json({
          error: "Booking is already cancelled",
          booking_id: booking.id,
          current_status: booking.status,
        });
      }

      if (booking.status === "expired") {
        await transaction.rollback();
        return res.status(400).json({
          error: "Cannot cancel an expired booking",
          booking_id: booking.id,
          current_status: booking.status,
        });
      }

      // FETCH SHOWTIME: Separately to avoid outer join in lock
      const showtime = await Showtime.findByPk(booking.showtime_id, {
        transaction,
      });

      if (!showtime) {
        await transaction.rollback();
        return res.status(404).json({ error: "Showtime not found" });
      }

      // VALIDATION: Check if showtime has already started
      if (new Date(showtime.show_time) <= new Date()) {
        await transaction.rollback();
        return res.status(400).json({
          error: "Cannot cancel booking for showtime that has already started",
          showtime_date: showtime.show_time,
        });
      }

      // GET BOOKING SEATS: For seat release
      const bookingSeats = await BookingSeat.findAll({
        where: { booking_id: id },
        transaction,
      });

      // UPDATE BOOKING STATUS TO CANCELLED
      await booking.update({ status: "cancelled" }, { transaction });

      // RELEASE SEAT RESERVATIONS: Mark as expired
      if (bookingSeats.length > 0) {
        await SeatReservation.update(
          { status: "expired" },
          {
            where: {
              showtime_id: booking.showtime_id,
              seat_id: { [Op.in]: bookingSeats.map((bs) => bs.seat_id) },
              status: { [Op.in]: ["reserved", "confirmed"] },
            },
            transaction,
          }
        );
      }

      // RESTORE AVAILABLE SEATS COUNT
      const showtimeForUpdate = await Showtime.findByPk(booking.showtime_id, {
        lock: transaction.LOCK.UPDATE,
        transaction,
      });

      if (showtimeForUpdate) {
        await showtimeForUpdate.update(
          {
            available_seats:
              showtimeForUpdate.available_seats + bookingSeats.length,
          },
          { transaction }
        );
      }

      // HANDLE PAYMENT REFUND (if payment exists)
      const payment = await Payment.findOne({
        where: { booking_id: id },
        transaction,
      });

      if (payment && payment.status === "success") {
        // Update payment status to refunded
        await payment.update(
          {
            status: "refunded", // Call Refund Api later in prod
          },
          { transaction }
        );
      }

      await transaction.commit();

      // RETURN CANCELLED BOOKING DETAILS
      const cancelledBooking = await Booking.findByPk(id, {
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
          { model: User, as: "user", attributes: ["name", "email"] },
        ],
      });

      res.json({
        message: "Booking cancelled successfully",
        booking: cancelledBooking,
        seats_released: bookingSeats.length,
        refund_processed: payment?.status === "refunded",
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
