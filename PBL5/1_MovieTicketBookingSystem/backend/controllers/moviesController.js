const { Movie, Showtime, Screen, Theater } = require("../models");
const { Op } = require("sequelize");

const getAllMovies = async (req, res, next) => {
  try {
    const { genre, language, search, limit, offset } = req.query;

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

    res.json({
      movies,
      total,
      limit: limit ? parseInt(limit, 10) : null,
      offset: offset ? parseInt(offset, 10) : null,
    });
  } catch (error) {
    next(error);
  }
};

const getMovieById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const movie = await Movie.findByPk(id);
    if (!movie) {
      return res.status(404).json({ error: "Movie not found" });
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

    res.json({
      movie_id: id,
      movie_title: movie.title,
      showtimes,
      total: showtimes.length,
    });
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
