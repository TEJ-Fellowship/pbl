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
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now

    const transaction = await sequelize.transaction();

    try {
      // Check if seats are available
      for (const seatId of seat_ids) {
        const existing = await SeatReservation.findOne({
          where: {
            showtime_id,
            seat_id: seatId,
            status: "reserved",
            expires_at: { [Op.gt]: new Date() },
          },
          transaction,
        });

        if (existing) {
          await transaction.rollback();
          return res
            .status(409)
            .json({ error: `Seat ${seatId} is already reserved` });
        }
      }

      // Create reservations
      const reservations = [];
      for (const seatId of seat_ids) {
        const reservation = await SeatReservation.create(
          {
            showtime_id,
            seat_id: seatId,
            user_id,
            expires_at: expiresAt,
          },
          { transaction }
        );
        reservations.push(reservation);
      }

      await transaction.commit();
      res.status(201).json({ reservations, expires_at: expiresAt });
    } catch (error) {
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

    const transaction = await sequelize.transaction();

    try {
      // Get showtime with price
      const showtime = await Showtime.findByPk(showtime_id, { transaction });
      if (!showtime) {
        await transaction.rollback();
        return res.status(404).json({ error: "Showtime not found" });
      }

      const basePrice = parseFloat(showtime.price);

      // Get seat prices
      let totalAmount = 0;
      const seatPrices = [];

      for (const seatId of seat_ids) {
        const seat = await Seat.findByPk(seatId, { transaction });
        if (!seat) {
          await transaction.rollback();
          return res.status(404).json({ error: `Seat ${seatId} not found` });
        }

        // Simple pricing: regular = base, premium = 1.5x, vip = 2x
        let seatPrice = basePrice;
        if (seat.seat_type === "premium") seatPrice = basePrice * 1.5;
        if (seat.seat_type === "vip") seatPrice = basePrice * 2;

        totalAmount += seatPrice;
        seatPrices.push({ seat_id: seatId, price: seatPrice });
      }

      // Create booking
      const booking = await Booking.create(
        {
          user_id,
          showtime_id,
          status: "pending",
          total_amount: totalAmount,
        },
        { transaction }
      );

      // Create booking_seats entries
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

      await transaction.commit();
      res.status(201).json(booking);
    } catch (error) {
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
