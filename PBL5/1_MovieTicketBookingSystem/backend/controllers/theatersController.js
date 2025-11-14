const { Theater } = require("../models");

const getAllTheaters = async (req, res, next) => {
  try {
    const theaters = await Theater.findAll({
      order: [["created_at", "DESC"]],
    });
    res.json(theaters);
  } catch (error) {
    next(error);
  }
};

const getTheaterById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const theater = await Theater.findByPk(id);
    if (!theater) {
      return res.status(404).json({ error: "Theater not found" });
    }
    res.json(theater);
  } catch (error) {
    next(error);
  }
};

const createTheater = async (req, res, next) => {
  try {
    const { name, location, city } = req.body;
    const theater = await Theater.create({ name, location, city });
    res.status(201).json(theater);
  } catch (error) {
    next(error);
  }
};

const updateTheater = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, location, city } = req.body;

    const theater = await Theater.findByPk(id);
    if (!theater) {
      return res.status(404).json({ error: "Theater not found" });
    }

    await theater.update({ name, location, city });
    res.json(theater);
  } catch (error) {
    next(error);
  }
};

const deleteTheater = async (req, res, next) => {
  try {
    const { id } = req.params;
    const theater = await Theater.findByPk(id);
    if (!theater) {
      return res.status(404).json({ error: "Theater not found" });
    }
    await theater.destroy();
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllTheaters,
  getTheaterById,
  createTheater,
  updateTheater,
  deleteTheater,
};
