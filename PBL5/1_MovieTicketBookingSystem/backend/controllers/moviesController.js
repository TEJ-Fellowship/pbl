const { Movie, Showtime, Screen, Theater } = require("../models");
const { Op } = require("sequelize");
const redis = require("../utils/redis");

const getAllMovies = async (req, res, next) => {
  try {
    const { genre, language, search, limit, offset } = req.query;

    // Build cache key based on query parameters
    const cacheKey = `movies:list:${genre || "all"}:${language || "all"}:${
      search || "all"
    }:${limit || "all"}:${offset || "all"}`;

    // Try to get from cache first
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return res.json(JSON.parse(cached));
      }
    } catch (redisError) {
      // If Redis fails, continue to database query
      console.warn("Redis cache miss, querying database:", redisError.message);
    }

    // Build where clause for filtering
    const where = {};
    if (genre) {
      where.genre = genre;
    }
    if (language) {
      where.language = language;
    }
    if (search) {
      where.title = { [Op.iLike]: `%${search}%` };
    }

    // Pagination
    const queryOptions = {
      where,
      order: [["created_at", "DESC"]],
    };

    if (limit) {
      queryOptions.limit = parseInt(limit, 10);
    }
    if (offset) {
      queryOptions.offset = parseInt(offset, 10);
    }

    const movies = await Movie.findAll(queryOptions);
    const total = await Movie.count({ where });

    const response = {
      movies,
      total,
      limit: limit ? parseInt(limit, 10) : null,
      offset: offset ? parseInt(offset, 10) : null,
    };

    // Cache the result for 5 minutes (300 seconds)
    try {
      await redis.set(cacheKey, JSON.stringify(response), { EX: 300 });
    } catch (redisError) {
      // If caching fails, still return response
      console.warn("Failed to cache movies:", redisError.message);
    }

    res.json(response);
  } catch (error) {
    next(error);
  }
};

const getMovieById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const cacheKey = `movie:${id}`;

    // Try to get from cache first
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return res.json(JSON.parse(cached));
      }
    } catch (redisError) {
      console.warn("Redis cache miss, querying database:", redisError.message);
    }

    const movie = await Movie.findByPk(id);
    if (!movie) {
      return res.status(404).json({ error: "Movie not found" });
    }

    // Cache the result for 10 minutes (600 seconds)
    try {
      await redis.set(cacheKey, JSON.stringify(movie), { EX: 600 });
    } catch (redisError) {
      console.warn("Failed to cache movie:", redisError.message);
    }

    res.json(movie);
  } catch (error) {
    next(error);
  }
};

const createMovie = async (req, res, next) => {
  try {
    const {
      title,
      description,
      duration,
      genre,
      language,
      rating,
      poster_url,
      release_date,
    } = req.body;
    const movie = await Movie.create({
      title,
      description,
      duration,
      genre,
      language,
      rating,
      poster_url,
      release_date,
    });

    // Invalidate movies list cache (new movie added)
    try {
      const keys = await redis.keys("movies:list:*");
      if (keys.length > 0) {
        await redis.del(keys);
      }
    } catch (redisError) {
      console.warn("Failed to invalidate cache:", redisError.message);
    }

    res.status(201).json(movie);
  } catch (error) {
    next(error);
  }
};

const updateMovie = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      duration,
      genre,
      language,
      rating,
      poster_url,
      release_date,
    } = req.body;

    const movie = await Movie.findByPk(id);
    if (!movie) {
      return res.status(404).json({ error: "Movie not found" });
    }

    await movie.update({
      title,
      description,
      duration,
      genre,
      language,
      rating,
      poster_url,
      release_date,
    });

    // Invalidate cache for this movie and movies list
    try {
      await redis.del(`movie:${id}`);
      const keys = await redis.keys("movies:list:*");
      if (keys.length > 0) {
        await redis.del(keys);
      }
    } catch (redisError) {
      console.warn("Failed to invalidate cache:", redisError.message);
    }

    res.json(movie);
  } catch (error) {
    next(error);
  }
};

const deleteMovie = async (req, res, next) => {
  try {
    const { id } = req.params;
    const movie = await Movie.findByPk(id);
    if (!movie) {
      return res.status(404).json({ error: "Movie not found" });
    }
    await movie.destroy();

    // Invalidate cache for this movie and movies list
    try {
      await redis.del(`movie:${id}`);
      const keys = await redis.keys("movies:list:*");
      if (keys.length > 0) {
        await redis.del(keys);
      }
    } catch (redisError) {
      console.warn("Failed to invalidate cache:", redisError.message);
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

const searchMovies = async (req, res, next) => {
  try {
    const { title, genre, language, release_date } = req.query;

    const where = {};
    if (title) {
      where.title = { [Op.iLike]: `%${title}%` };
    }
    if (genre) {
      where.genre = genre;
    }
    if (language) {
      where.language = language;
    }
    if (release_date) {
      where.release_date = release_date;
    }

    const movies = await Movie.findAll({
      where,
      order: [["created_at", "DESC"]],
    });
    res.json(movies);
  } catch (error) {
    next(error);
  }
};

const getMovieShowtimes = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { date, theater_id } = req.query;

    // Build cache key based on query parameters
    const cacheKey = `movie:${id}:showtimes:${date || "all"}:${
      theater_id || "all"
    }`;

    // Try to get from cache first
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return res.json(JSON.parse(cached));
      }
    } catch (redisError) {
      console.warn("Redis cache miss, querying database:", redisError.message);
    }

    // Check if movie exists
    const movie = await Movie.findByPk(id);
    if (!movie) {
      return res.status(404).json({ error: "Movie not found" });
    }

    // Build where clause
    const where = {
      movie_id: id,
      status: "active",
      show_time: { [Op.gt]: new Date() }, // Only future showtimes
    };

    // Filter by date if provided
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      where.show_time = {
        [Op.and]: [
          { [Op.gt]: new Date() }, // Future
          { [Op.gte]: startOfDay }, // After start of day
          { [Op.lte]: endOfDay }, // Before end of day
        ],
      };
    }

    // Include relationships
    const includeOptions = [
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
    ];

    // Filter by theater if provided
    if (theater_id) {
      includeOptions[0].where = { theater_id };
      includeOptions[0].required = true;
    }

    const showtimes = await Showtime.findAll({
      where,
      include: includeOptions,
      order: [["show_time", "ASC"]],
    });

    const response = {
      movie_id: id,
      movie_title: movie.title,
      showtimes,
      total: showtimes.length,
    };

    // Cache the result for 60 seconds
    try {
      await redis.set(cacheKey, JSON.stringify(response), { EX: 60 });
    } catch (redisError) {
      console.warn("Failed to cache movie showtimes:", redisError.message);
    }

    res.json(response);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllMovies,
  getMovieById,
  createMovie,
  updateMovie,
  deleteMovie,
  searchMovies,
  getMovieShowtimes,
};
