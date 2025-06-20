const userService = require("../services/userService.js");

const getAllUsersController = async (req, res) => {
  try {
    const result = await userService.getAllUsers();
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};

const createUserController = async (req, res) => {
  const data = req.body;
  try {
    const user = await userService.createUser(data);
    res.status(201).json(user);
  } catch (error) {
    console.log("errorrrr", error);
    if (error.name === "ValidationError") {
      return res.status(400).json({ error: error.message }); // 400 for validation errors
    }
    if (error.code === 11000) {
      return res.status(409).json({ error: "Email or phone already exists" }); // 🔹 409 for duplicate entry
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = { getAllUsersController, createUserController };
