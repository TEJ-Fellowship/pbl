const mongoose = require("mongoose");
mongoose.set("strictQuery", false);
const config = require('../utils/config');
mongoose
  .connect(config.MONGODB_URL)
  .then(() => {
    console.log("Connected to MemoNestDB");
  })
  .catch((err) => console.error(err));

const journalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  title: String,
  content: String,
  mood: {
    type: String,
    enum: [
      "happy",
      "sad",
      "neutral",
      "excited",
      "anxious",
      "angry",
      "grateful",
      "tired",
      "bored",
      "stressed",
    ],
    default: "neutral",
  },
  images: {
    type: [String],
    default: undefined,
  },
  createdAt: {
    type: Date,
    required: true,
  },
});
journalSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
  },
});

const Journal = mongoose.model("Journal", journalSchema);

module.exports = { Journal };
