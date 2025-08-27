const express = require("express");
const router = express.Router();
const User = require("../models/user");

router.post("/register", async (request, response, next) => {
  try {
    const { fullName, email, password } = request.body;

    const newUser = new User({ fullName, email, password });

    await newUser.save();

    response
      .status(201)
      .json({ message: "user created successfully", user: newUser });
  } catch (error) {
    next(error);
  }
});

module.exports = router;