require("dotenv").config();
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const express = require("express");
const app = express();
app.use(express.json());

const { User } = require("./Mongo.js");
const saltRounds = 10;

app.get("/api/users", async (req, res, next) => {
  try {
    const users = await User.find({});
    res.status(200).send(users);
  } catch (error) {
    next(error);
  }
});

app.post("/api/users", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).send("Email already exists");
    }

    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const verificationToken = crypto.randomBytes(32).toString("hex");

    const user = new User({
      username,
      email,
      password: hashedPassword,
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
    }/api/verify?token=${user.verificationToken}`;

    await transporter.sendMail({
      to: user.email,
      subject: "Verify your email",
      html: `<a href="${verificationLink}">Click to Verify</a>`,
    });

    res.status(201).json({
      message: "User registered. Check your email for verification link.",
    });
    console.log("User saved & email sent!");
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/verify", async (req, res) => {
  try {
    const token = req.query.token; 
    if (!token) {
      return res.status(400).send("Token is missing");
    }

    const user = await User.findOne({ verificationToken: token });
    if (!user) {
      return res.status(400).send("Invalid token");
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    res.send("Email verified successfully! You can now login.");
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal server error");
  }
});


const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
