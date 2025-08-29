const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const router = express.Router();
const User = require("../models/user");

const generateToken = (userId, email) => {
  return jwt.sign({ userId, email }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
};

router.post("/register", async (request, response, next) => {
  try {
    const { fullName, email, password } = request.body;
     console.log("Registration attempt for:", email);
    console.log("Plain text password received:", password); // Debug log

    const oldUser = await User.findOne({ email: email });

    if (oldUser) {
      return response.status(400).send({ error: "User already exist" });
    }

    const newUser = new User({ fullName, email, password });
    console.log("Before save - password:", newUser.password); // Debug log

    await newUser.save();
    console.log("After save - user created with ID:", newUser.id); // Debug log

    const token = generateToken(newUser.id, newUser.email);

    response.status(201).json({
      message: "user created successfully",
      token: token,
      user: {
        id: newUser.id,
        fullName: newUser.fullName,
        email: newUser.email,
      },
    });
  } catch (error) {
    console.log("Registration error:", error); // Debug log
    next(error);
  }
});

router.post("/login", async (request, response, next) => {
  try {
    const { email, password } = request.body;
    console.log("Login attempt for:", email); // Debug log
    console.log("Plain text password from request:", password);

    const loginUser = await User.findOne({ email: email });

    if (!loginUser) {
     return response.status(400).send({ error: "Invalid credentials from email check" });
    }
    console.log("User found, comparing passwords..."); // Debug log
    console.log("Password from database:", loginUser.password); // 🔍 ADD THIS LINE
    console.log("Database password starts with $2a$ (hashed)?", loginUser.password.startsWith('$2b$')); // 🔍 ADD THIS LINE

    const isPasswordValid = await bcrypt.compare(password, loginUser.password);
    console.log("Password comparison result:", isPasswordValid);

    if (!isPasswordValid) {
      return response.status(400).json({ error: "Invalid credentials from password check" });
    }

    console.log("Password valid:", isPasswordValid); // Debug log

    const token = generateToken(loginUser.id, loginUser.email);
    response.json({
      message: "Login Successful",
      token: token,
      user:{
        id:loginUser.id,
        fullName:loginUser.fullName,
        email:loginUser.email
      }
    });
  } catch (error) {
    console.log("Login error:", error); // Debug log

    next(error);
  }
});

module.exports = router;
