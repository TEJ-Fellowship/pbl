const express = require("express");
const router = express.Router();
const User = require("../models/user");

router.post("/register", async (request, response, next) => {
  try {
    const { fullName, email, password } = request.body;

    const newUser = new User({ fullName, email, password });

    const oldUser = User.findOne({email:email});
    if(!oldUser){
      return response.send({data:"User already exist"});
    }

    await newUser.save();

    response
      .status(201)
      .json({ message: "user created successfully", user: newUser });
  } catch (error) {
    next(error);
  }
});

module.exports = router;