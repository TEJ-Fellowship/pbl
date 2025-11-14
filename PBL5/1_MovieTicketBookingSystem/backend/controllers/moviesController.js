const { Movie } = require("../models");
const { Op } = require("sequelize");

const getAllMovies = async (req, res, next) => {
  try {
    const movies = await Movie.findAll({
      order: [["created_at", "DESC"]],
    });
    res.json(movies);
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

module.exports = {
  getAllMovies,
  getMovieById,
  createMovie,
  updateMovie,
  deleteMovie,
  searchMovies,
};
