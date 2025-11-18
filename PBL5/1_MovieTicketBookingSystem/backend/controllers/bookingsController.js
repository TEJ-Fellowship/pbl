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
} = require("../models");
const { Op } = require("sequelize");

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
    const bookings = await Booking.findAll({
      where: { user_id: userId },
      include: [
        {
          model: Showtime,
          as: "showtime",
          attributes: ["show_time"],
          include: [
            {
              model: Movie,
              as: "movie",
              attributes: ["title"],
            },
            {
              model: Screen,
              as: "screen",
              attributes: ["screen_number"],
              include: [
                {
                  model: Theater,
                  as: "theater",
                  attributes: ["name"],
                },
              ],
            },
          ],
        },
      ],
      order: [["created_at", "DESC"]],
    });
    res.json(bookings);
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
          attributes: ["show_time"],
          include: [
            {
              model: Movie,
              as: "movie",
              attributes: ["title"],
            },
            {
              model: Screen,
              as: "screen",
              attributes: ["screen_number"],
              include: [
                {
                  model: Theater,
                  as: "theater",
                  attributes: ["name"],
                },
              ],
            },
          ],
        },
        {
          model: User,
          as: "user",
          attributes: ["name"],
        },
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

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    res.json(booking);
  } catch (error) {
    next(error);
  }
};

const reserveSeats = async (req, res, next) => {
  try {
    const { showtime_id, seat_ids, user_id } = req.body;

    // ============================================
    // VALIDATION: Required Fields
    // ============================================
    if (!showtime_id || !seat_ids || !user_id) {
      return res.status(400).json({
        error:
          "Missing required fields: showtime_id, seat_ids, and user_id are required",
      });
    }

    if (!Array.isArray(seat_ids) || seat_ids.length === 0) {
      return res.status(400).json({
        error: "seat_ids must be a non-empty array",
      });
    }

    // ============================================
    // CALCULATE EXPIRY: 5 minutes from now
    // ============================================
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // ============================================
    // TRANSACTION: Ensure all reservations succeed or fail together
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
            attributes: ["id"],
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
          error: `Cannot reserve seats for showtime with status: ${showtime.status}`,
        });
      }

      // ============================================
      // VALIDATION: Showtime is in the future
      // ============================================
      if (new Date(showtime.show_time) <= new Date()) {
        await transaction.rollback();
        return res.status(400).json({
          error: "Cannot reserve seats for past showtimes",
        });
      }

      const screenId = showtime.screen_id;
      const reservations = [];

      // ============================================
      // VALIDATION: Check each seat before reserving
      // ============================================
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
        // ============================================
        const existingBooking = await BookingSeat.findOne({
          where: {
            showtime_id,
            seat_id: seatId,
          },
          transaction,
        });

        if (existingBooking) {
          await transaction.rollback();
          return res.status(409).json({
            error: `Seat ${seat.seat_number} is already booked`,
          });
        }

        // ============================================
        // VALIDATION: Check if seat is already reserved (not expired)
        // ============================================
        const existingReservation = await SeatReservation.findOne({
          where: {
            showtime_id,
            seat_id: seatId,
            status: "reserved",
            expires_at: { [Op.gt]: new Date() },
          },
          transaction,
        });

        if (existingReservation) {
          // Allow same user to re-reserve (extend time)
          if (existingReservation.user_id !== user_id) {
            await transaction.rollback();
            return res.status(409).json({
              error: `Seat ${seat.seat_number} is already reserved by another user`,
            });
          }
          // Same user: update expiry time
          await existingReservation.update(
            { expires_at: expiresAt },
            { transaction }
          );
          reservations.push(existingReservation);
          continue;
        }

        // ============================================
        // CREATE RESERVATION: All validations passed
        // ============================================
        const reservation = await SeatReservation.create(
          {
            showtime_id,
            seat_id: seatId,
            user_id,
            expires_at: expiresAt,
            status: "reserved",
          },
          { transaction }
        );
        reservations.push(reservation);
      }

      // ============================================
      // COMMIT TRANSACTION: Save all reservations
      // ============================================
      await transaction.commit();

      res.status(201).json({
        message: "Seats reserved successfully",
        reservations: reservations.map((r) => ({
          id: r.id,
          seat_id: r.seat_id,
          showtime_id: r.showtime_id,
          expires_at: r.expires_at,
        })),
        expires_at: expiresAt,
        expires_in_seconds: 300, // 5 minutes
      });
    } catch (error) {
      // ============================================
      // ROLLBACK: Undo all reservations on error
      // ============================================
      await transaction.rollback();
      throw error;
    }
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
        // ============================================
        const existingBooking = await BookingSeat.findOne({
          where: {
            showtime_id,
            seat_id: seatId,
          },
          transaction,
        });

        if (existingBooking) {
          await transaction.rollback();
          return res.status(409).json({
            error: `Seat ${seat.seat_number} is already booked`,
          });
        }

        // ============================================
        // VALIDATION: Check if seat is reserved (not expired)
        // ============================================
        const activeReservation = await SeatReservation.findOne({
          where: {
            showtime_id,
            seat_id: seatId,
            status: "reserved",
            expires_at: { [Op.gt]: new Date() },
          },
          transaction,
        });

        if (activeReservation && activeReservation.user_id !== user_id) {
          await transaction.rollback();
          return res.status(409).json({
            error: `Seat ${seat.seat_number} is currently reserved by another user`,
          });
        }

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

      // Update seat reservations to confirmed
      await SeatReservation.update(
        { status: "confirmed" },
        {
          where: {
            showtime_id: booking.showtime_id,
            user_id: booking.user_id,
            status: "reserved",
          },
          transaction,
        }
      );

      await transaction.commit();
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

    const transaction = await sequelize.transaction();

    try {
      const booking = await Booking.findByPk(id, { transaction });
      if (!booking) {
        await transaction.rollback();
        return res.status(404).json({ error: "Booking not found" });
      }

      await booking.update({ status: "cancelled" }, { transaction });

      // Release seat reservations
      await SeatReservation.update(
        { status: "expired" },
        {
          where: {
            showtime_id: booking.showtime_id,
            user_id: booking.user_id,
            status: { [Op.in]: ["reserved", "confirmed"] },
          },
          transaction,
        }
      );

      await transaction.commit();
      res.status(204).send();
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
  reserveSeats,
  createBooking,
  confirmBooking,
  updateBooking,
  cancelBooking,
};
