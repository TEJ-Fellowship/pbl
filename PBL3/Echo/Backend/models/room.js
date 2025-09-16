const mongoose = require("mongoose");
const roomSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    passwordHash: { type: String, required: true },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timeStamps: true }
);
module.exports = mongoose.model("Room", roomSchema);
