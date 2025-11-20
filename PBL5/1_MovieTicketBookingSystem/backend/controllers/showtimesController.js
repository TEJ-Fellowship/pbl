const {
  Showtime,
  Movie,
  Screen,
  Theater,
  Seat,
  BookingSeat,
} = require("../models");
const { Op } = require("sequelize");
const redis = require("../utils/redis");

const getAllShowtimes = async (req, res, next) => {
  try {
    const cacheKey = "showtimes:list:all";

    // Try to get from cache first
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return res.json(JSON.parse(cached));
      }
    } catch (redisError) {
      console.warn("Redis cache miss, querying database:", redisError.message);
    }

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

    // Cache the result for 60 seconds
    try {
      await redis.set(cacheKey, JSON.stringify(showtimes), { EX: 60 });
    } catch (redisError) {
      console.warn("Failed to cache showtimes:", redisError.message);
    }

    res.json(showtimes);
  } catch (error) {
    next(error);
  }
};

const getShowtimesByMovie = async (req, res, next) => {
  try {
    const { movieId } = req.params;
    const cacheKey = `showtimes:movie:${movieId}`;

    // Try to get from cache first
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return res.json(JSON.parse(cached));
      }
    } catch (redisError) {
      console.warn("Redis cache miss, querying database:", redisError.message);
    }

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

    // Cache the result for 60 seconds
    try {
      await redis.set(cacheKey, JSON.stringify(showtimes), { EX: 60 });
    } catch (redisError) {
      console.warn("Failed to cache showtimes:", redisError.message);
    }

    res.json(showtimes);
  } catch (error) {
    next(error);
  }
};

const getShowtimesByTheater = async (req, res, next) => {
  try {
    const { theaterId } = req.params;
    const cacheKey = `showtimes:theater:${theaterId}`;

    // Try to get from cache first
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return res.json(JSON.parse(cached));
      }
    } catch (redisError) {
      console.warn("Redis cache miss, querying database:", redisError.message);
    }

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

    // Cache the result for 60 seconds
    try {
      await redis.set(cacheKey, JSON.stringify(showtimes), { EX: 60 });
    } catch (redisError) {
      console.warn("Failed to cache showtimes:", redisError.message);
    }

    res.json(showtimes);
  } catch (error) {
    next(error);
  }
};

const getShowtimeById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const cacheKey = `showtime:${id}`;

    // Try to get from cache first
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return res.json(JSON.parse(cached));
      }
    } catch (redisError) {
      console.warn("Redis cache miss, querying database:", redisError.message);
    }

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

    // Cache the result for 5 minutes (300 seconds)
    try {
      await redis.set(cacheKey, JSON.stringify(showtime), { EX: 300 });
    } catch (redisError) {
      console.warn("Failed to cache showtime:", redisError.message);
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

    // Invalidate showtime caches (new showtime added)
    try {
      // Invalidate all showtime list caches
      const keys = await redis.keys("showtimes:*");
      if (keys.length > 0) {
        await redis.del(keys);
      }
      // Also invalidate movie showtimes cache
      const movieShowtimeKeys = await redis.keys(
        `movie:${movie_id}:showtimes:*`
      );
      if (movieShowtimeKeys.length > 0) {
        await redis.del(movieShowtimeKeys);
      }
    } catch (redisError) {
      console.warn("Failed to invalidate cache:", redisError.message);
    }

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

    // Invalidate cache for this showtime and related caches
    try {
      await redis.del(`showtime:${id}`);
      await redis.del(`showtime:${id}:seats`);
      // Invalidate list caches
      const keys = await redis.keys("showtimes:*");
      if (keys.length > 0) {
        await redis.del(keys);
      }
      // Invalidate movie showtimes cache
      const movieShowtimeKeys = await redis.keys(
        `movie:${showtime.movie_id}:showtimes:*`
      );
      if (movieShowtimeKeys.length > 0) {
        await redis.del(movieShowtimeKeys);
      }
    } catch (redisError) {
      console.warn("Failed to invalidate cache:", redisError.message);
    }

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

    const movieId = showtime.movie_id;

    await showtime.destroy();

    // Invalidate cache for this showtime and related caches
    try {
      await redis.del(`showtime:${id}`);
      await redis.del(`showtime:${id}:seats`);
      // Invalidate list caches
      const keys = await redis.keys("showtimes:*");
      if (keys.length > 0) {
        await redis.del(keys);
      }
      // Invalidate movie showtimes cache
      const movieShowtimeKeys = await redis.keys(
        `movie:${movieId}:showtimes:*`
      );
      if (movieShowtimeKeys.length > 0) {
        await redis.del(movieShowtimeKeys);
      }
    } catch (redisError) {
      console.warn("Failed to invalidate cache:", redisError.message);
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

const getShowtimeSeats = async (req, res, next) => {
  try {
    const { id } = req.params;
    const cacheKey = `showtime:${id}:seats`;

    // Try to get from cache first (most critical endpoint - seat availability)
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return res.json(JSON.parse(cached));
      }
    } catch (redisError) {
      console.warn("Redis cache miss, querying database:", redisError.message);
    }

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

    const response = {
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
    };

    // Cache the result for 15 seconds (short TTL because seat availability changes frequently)
    try {
      await redis.set(cacheKey, JSON.stringify(response), { EX: 15 });
    } catch (redisError) {
      console.warn("Failed to cache seat availability:", redisError.message);
    }

    res.json(response);
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
