const { Screen, Theater } = require("../models");

const getAllScreens = async (req, res, next) => {
  try {
    const screens = await Screen.findAll({
      include: [
        {
          model: Theater,
          as: "theater",
          attributes: ["name"],
        },
      ],
      order: [["created_at", "DESC"]],
    });
    res.json(screens);
  } catch (error) {
    next(error);
  }
};

const getScreensByTheater = async (req, res, next) => {
  try {
    const { theaterId } = req.params;
    const screens = await Screen.findAll({
      where: { theater_id: theaterId },
      order: [["screen_number", "ASC"]],
    });
    res.json(screens);
  } catch (error) {
    next(error);
  }
};

const getScreenById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const screen = await Screen.findByPk(id, {
      include: [
        {
          model: Theater,
          as: "theater",
          attributes: ["name"],
        },
      ],
    });
    if (!screen) {
      return res.status(404).json({ error: "Screen not found" });
    }
    res.json(screen);
  } catch (error) {
    next(error);
  }
};

const createScreen = async (req, res, next) => {
  try {
    const { theater_id, screen_number, total_seats, seat_layout } = req.body;
    const screen = await Screen.create({
      theater_id,
      screen_number,
      total_seats,
      seat_layout,
    });
    res.status(201).json(screen);
  } catch (error) {
    next(error);
  }
};

const updateScreen = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { screen_number, total_seats, seat_layout } = req.body;

    const screen = await Screen.findByPk(id);
    if (!screen) {
      return res.status(404).json({ error: "Screen not found" });
    }

    await screen.update({
      screen_number,
      total_seats,
      seat_layout,
    });
    res.json(screen);
  } catch (error) {
    next(error);
  }
};

const deleteScreen = async (req, res, next) => {
  try {
    const { id } = req.params;
    const screen = await Screen.findByPk(id);
    if (!screen) {
      return res.status(404).json({ error: "Screen not found" });
    }
    await screen.destroy();
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllScreens,
  getScreensByTheater,
  getScreenById,
  createScreen,
  updateScreen,
  deleteScreen,
};
