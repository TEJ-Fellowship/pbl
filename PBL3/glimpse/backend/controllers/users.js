const bcrypt = require("bcrypt");
const usersRouter = require("express").Router();
const User = require("../models/user");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const saltRounds = 10;
const Clip=require('../models/clip')

usersRouter.get("/", async (request, response, next) => {
  try {
    const users = await User.find({}).populate("clips");
    response.status(200).send(users);
  } catch (error) {
    next(error);
  }
});

usersRouter.post("/", async (request, response) => {
  try {
    const { email, password, username } = request.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return response.status(400).send("Email already exists");
    }

    const passwordHash = await bcrypt.hash(password, saltRounds);

    const verificationToken = crypto.randomBytes(32).toString("hex");

    const user = new User({
      email,
      passwordHash,
      username,
      verificationToken,
    });

    await user.save();
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const verificationLink = `http://localhost:${
      process.env.PORT || 3001
    }/api/users/verify?token=${user.verificationToken}`;

    await transporter.sendMail({
      to: user.email,
      subject: "Verify your email",
      html: `<a href="${verificationLink}">Click to Verify</a>`,
    });

    response.status(201).json({
      message: "User registered. Check your email for verification link.",
    });
    console.log("User saved & email sent!");

  } catch (err) {
    console.error(err);
    response.status(500).json({ error: err.message });
  }
});

usersRouter.get("/verify", async (request, response) => {
  try {
    const token = request.query.token; 
    if (!token) {
      return response.status(400).send("Token is missing");
    }

    const user = await User.findOne({ verificationToken: token });
    if (!user) {
      return response.status(400).send("Invalid token");
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();
    
    response.send("Email verified successfully! You can now login.");
  } catch (err) {
    console.error(err);
    response.status(500).send("Internal server error");
  }
});

module.exports = usersRouter;
