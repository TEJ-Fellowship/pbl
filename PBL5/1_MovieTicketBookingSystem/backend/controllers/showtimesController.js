const {
  Showtime,
  Movie,
  Screen,
  Theater,
  Seat,
  BookingSeat,
} = require("../models");
const { Op } = require("sequelize");

const getAllShowtimes = async (req, res, next) => {
  try {
    const showtimes = await Showtime.findAll({
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
      order: [["show_time", "DESC"]],
    });
    res.json(showtimes);
  } catch (error) {
    next(error);
  }
};

const getShowtimesByMovie = async (req, res, next) => {
  try {
    const { movieId } = req.params;
    const showtimes = await Showtime.findAll({
      where: {
        movie_id: movieId,
        status: "active",
      },
      include: [
        {
          model: Screen,
          as: "screen",
          attributes: ["screen_number"],
          include: [
            {
              model: Theater,
              as: "theater",
              attributes: ["name", "location"],
            },
          ],
        },
      ],
      order: [["show_time", "ASC"]],
    });
    res.json(showtimes);
  } catch (error) {
    next(error);
  }
};

const getShowtimesByTheater = async (req, res, next) => {
  try {
    const { theaterId } = req.params;
    const showtimes = await Showtime.findAll({
      where: {
        status: "active",
      },
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
          where: { theater_id: theaterId },
          required: true,
        },
      ],
      order: [["show_time", "ASC"]],
    });
    res.json(showtimes);
  } catch (error) {
    next(error);
  }
};

const getShowtimeById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const showtime = await Showtime.findByPk(id, {
      include: [
        {
          model: Movie,
          as: "movie",
          attributes: ["title", "duration"],
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
    });
    if (!showtime) {
      return res.status(404).json({ error: "Showtime not found" });
    }
    res.json(showtime);
  } catch (error) {
    next(error);
  }
};

const createShowtime = async (req, res, next) => {
  try {
    const { movie_id, screen_id, show_time, price, total_seats } = req.body;

    // Validation: Check required fields
    if (!movie_id || !screen_id || !show_time || !price) {
      return res.status(400).json({
        error:
          "Missing required fields: movie_id, screen_id, show_time, and price are required",
      });
    }

    // Validation: Check if movie exists
    const movie = await Movie.findByPk(movie_id);
    if (!movie) {
      return res.status(404).json({ error: "Movie not found" });
    }

    // Validation: Check if screen exists
    const screen = await Screen.findByPk(screen_id);
    if (!screen) {
      return res.status(404).json({ error: "Screen not found" });
    }

    // Validation: Check if show_time is in the future
    const showTimeDate = new Date(show_time);
    if (showTimeDate <= new Date()) {
      return res.status(400).json({
        error: "Show time must be in the future",
      });
    }

    // Validation: Check for time conflicts (same screen, overlapping times)
    // A movie typically runs for 2-3 hours, so we'll check for conflicts within 3 hours
    const movieDuration = movie.duration || 120; // Default 2 hours if not set
    const showStart = new Date(show_time);
    const showEnd = new Date(showStart.getTime() + movieDuration * 60000); // Add duration in milliseconds

    const conflictingShowtime = await Showtime.findOne({
      where: {
        screen_id,
        status: "active",
        [Op.or]: [
          // New showtime starts during existing showtime
          {
            show_time: {
              [Op.between]: [showStart, showEnd],
            },
          },
          // Existing showtime starts during new showtime
          {
            [Op.and]: [
              { show_time: { [Op.lte]: showStart } },
              {
                show_time: {
                  [Op.gte]: new Date(showStart.getTime() - 180 * 60000), // 3 hours before
                },
              },
            ],
          },
        ],
      },
    });

    if (conflictingShowtime) {
      return res.status(409).json({
        error:
          "Time conflict: Another showtime exists for this screen at overlapping time",
        conflicting_showtime_id: conflictingShowtime.id,
      });
    }

    // Get total_seats from screen if not provided
    const seatsToUse = total_seats || screen.total_seats;

    // Validation: Price must be non-negative
    if (price < 0) {
      return res.status(400).json({ error: "Price must be non-negative" });
    }

    // Create showtime
    const showtime = await Showtime.create({
      movie_id,
      screen_id,
      show_time: showTimeDate,
      price: parseFloat(price),
      available_seats: seatsToUse,
      total_seats: seatsToUse,
      status: "active",
    });

    res.status(201).json(showtime);
  } catch (error) {
    next(error);
  }
};

const updateShowtime = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { show_time, price, status } = req.body;

    const showtime = await Showtime.findByPk(id);
    if (!showtime) {
      return res.status(404).json({ error: "Showtime not found" });
    }

    await showtime.update({
      show_time,
      price,
      status,
    });
    res.json(showtime);
  } catch (error) {
    next(error);
  }
};

const deleteShowtime = async (req, res, next) => {
  try {
    const { id } = req.params;
    const showtime = await Showtime.findByPk(id);
    if (!showtime) {
      return res.status(404).json({ error: "Showtime not found" });
    }
    await showtime.destroy();
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

const getShowtimeSeats = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get showtime with screen information
    const showtime = await Showtime.findByPk(id, {
      include: [
        {
          model: Screen,
          as: "screen",
          attributes: ["id", "screen_number", "total_seats"],
          include: [
            {
              model: Theater,
              as: "theater",
              attributes: ["id", "name", "location"],
            },
          ],
        },
        {
          model: Movie,
          as: "movie",
          attributes: ["id", "title", "duration"],
        },
      ],
    });

    if (!showtime) {
      return res.status(404).json({ error: "Showtime not found" });
    }

    // Get all seats for this screen
    const seats = await Seat.findAll({
      where: {
        screen_id: showtime.screen_id,
      },
      order: [
        ["row_number", "ASC"],
        ["column_number", "ASC"],
      ],
    });

    // Get all booked seats for this showtime
    const bookedSeats = await BookingSeat.findAll({
      where: {
        showtime_id: id,
      },
      attributes: ["seat_id"],
    });

    const bookedSeatIds = new Set(
      bookedSeats.map((bs) => bs.seat_id.toString())
    );

    // Map seats with availability status
    const seatsWithAvailability = seats.map((seat) => ({
      id: seat.id,
      seat_number: seat.seat_number,
      row_number: seat.row_number,
      column_number: seat.column_number,
      seat_type: seat.seat_type,
      is_available: !bookedSeatIds.has(seat.id.toString()),
      created_at: seat.created_at,
    }));

    // Count available vs booked
    const availableCount = seatsWithAvailability.filter(
      (s) => s.is_available
    ).length;
    const bookedCount = seatsWithAvailability.filter(
      (s) => !s.is_available
    ).length;

    res.json({
      showtime: {
        id: showtime.id,
        show_time: showtime.show_time,
        price: showtime.price,
        available_seats: showtime.available_seats,
        total_seats: showtime.total_seats,
        status: showtime.status,
      },
      movie: showtime.movie,
      screen: {
        id: showtime.screen.id,
        screen_number: showtime.screen.screen_number,
        theater: showtime.screen.theater,
      },
      seats: seatsWithAvailability,
      summary: {
        total_seats: seatsWithAvailability.length,
        available: availableCount,
        booked: bookedCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllShowtimes,
  getShowtimesByMovie,
  getShowtimesByTheater,
  getShowtimeById,
  createShowtime,
  updateShowtime,
  deleteShowtime,
  getShowtimeSeats,
};
