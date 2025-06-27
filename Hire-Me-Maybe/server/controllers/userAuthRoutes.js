const express = require("express");
const User = require("../models/user");
const { emailFormatRegex, passwordRegex } = require("../utils/regex/userRegex");
const bcrypt = require("bcryptjs");
const userAuthRouter = express.Router();

//user register
userAuthRouter.post("/register", async (req, res) => {
  try {
    const { username, email, password, firstName, lastName } = req.body;

    // Validation - Update to include new fields
    if (!username || !email || !password || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: "All fields are required: firstName, lastName, username, email, and password",
      });
    }

    // Email format validation
    const emailRegex = emailFormatRegex;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address",
      });
    }

    // Password strength validation
    if (password.length < 6) {  // Match frontend validation
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }

  
// Password strength validation - use the actual regex
if (!passwordRegex.test(password)) {
  return res.status(400).json({
    success: false,
    message: "Password must be at least 8 characters long and include uppercase, lowercase, number, and special character",
  });
}
    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username }],
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message:
          existingUser.email === email.toLowerCase()
            ? "Email already registered"
            : "Username already taken",
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user with new fields
    const user = new User({
      firstName,
      lastName,
      username,
      email: email.toLowerCase(),
      password: hashedPassword,
    });

    await user.save();

    // Return user data (without password)
    const userResponse = {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt,
    };

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: userResponse,
    });
  } catch (error) {
    console.error("Registration error:", error);

    // Handle mongoose validation errors
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(", "),
      });
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(400).json({
        success: false,
        message: `${field} already exists`,
      });
    }

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// USER LOGIN
userAuthRouter.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Successful login: send user data
    const userResponse = {
      id: user._id,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt,
    };

    res.status(200).json(userResponse);
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = userAuthRouter;
