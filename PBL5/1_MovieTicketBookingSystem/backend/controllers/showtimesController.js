const { Showtime, Movie, Screen, Theater } = require("../models");

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
    const showtime = await Showtime.create({
      movie_id,
      screen_id,
      show_time,
      price,
      available_seats: total_seats,
      total_seats,
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

module.exports = {
  getAllShowtimes,
  getShowtimesByMovie,
  getShowtimesByTheater,
  getShowtimeById,
  createShowtime,
  updateShowtime,
  deleteShowtime,
};
