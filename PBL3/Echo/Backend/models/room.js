//models/room.js

const mongoose = require("mongoose");
const messageSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  clipUrl: String,
  createdAt: { type: Date, default: Date.now() },
});
const roomSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    passwordHash: { type: String, required: true },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    messages: [messageSchema],
  },
  { timeStamps: true }
);
module.exports = mongoose.model("Room", roomSchema);
