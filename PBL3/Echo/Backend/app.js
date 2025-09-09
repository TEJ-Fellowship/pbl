const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { authMiddleWare, errorHandler } = require("./utils/middleware");
const { secret_key } = require("./utils/config");
const User = require("./models/User");
const clipRoutes = require("./routes/clips");
const app = express();
app.use(express.json());
app.use(cors());
app.use("/uploads", express.static("uploads"));
app.use("/api/clips", clipRoutes);
app.post("/signup", async (req, res) => {
  try {
    const { username, password } = req.body;
    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = new User({ username, passwordHash });
    await newUser.save();
    res.status(201).json({
      username,
      passwordHash,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/signin", async (req, res) => {
  try {
    const { username, password } = req.body;

    // finding the user from the database
    const user = await User.findOne({ username });

    if (!user) {
      res.send("wrong username");
      return;
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
      res.send("wrong password! Please try again..");
      return;
    }

    const token = jwt.sign(
      { id: user._id, username: user.username },
      secret_key,
      { expiresIn: "1h" }
    );
    res.json({ message: "Login successful", token });
  } catch (error) {
    res.status(500).send("Login error because of invalid username or password");
  }
});

app.use(authMiddleWare);
app.use(errorHandler);

module.exports = app;
