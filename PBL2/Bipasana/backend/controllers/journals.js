const jwt = require("jsonwebtoken");
const express = require("express");
const journalRouter = express.Router();
const bcrypt = require("bcrypt");
const { Journal } = require("../models/journal.js");
const { User } = require("../models/user.js");

const getTokenFrom = (request) => {
  const authorization = request.get("authorization");
  if (authorization && authorization.startsWith("Bearer ")) {
    return authorization.replace("Bearer ", "");
  }
  return null;
};

journalRouter.get("/", async (req, res, next) => {
  try {
    const journals = await Journal.find({});
    res.status(200).send(journals);
  } catch (error) {
    next(error);
  }
});

journalRouter.post("/", async (req, res) => {
  try {
    const { userId, title, content, mood, images } = req.body;
    const date = new Date();
    const createdAt = date.toISOString();
    const decodedToken = jwt.verify(getTokenFrom(req), process.env.SECRET);
    if (!decodedToken.id) {
      return response.status(401).json({ error: "token invalid" });
    }

    const user = await User.findById(decodedToken.id);
    if (!user) {
      return response
        .status(400)
        .json({ error: "UserId missing or not valid" });
    }
    const journal = new Journal({
      userId,
      title,
      mood,
      content,
      images,
      createdAt,
    });
    await journal.save();
    res.status(201).json({
      message: "Journal Saved",
    });
    console.log("Journal saved ");
    await User.findByIdAndUpdate(
      userId,
      { $push: { journals: journal.id } },
      { new: true }
    );
    res.status(201).json({ message: "Journal saved and referenced in user" });
    console.log("Journal saved and user updated");
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = journalRouter;
