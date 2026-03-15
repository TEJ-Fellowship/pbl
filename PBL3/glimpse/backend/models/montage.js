// models/Montage.js
const mongoose = require("mongoose");

const montageSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  month: { type: Number, required: true },
  year: { type: Number, required: true },
  videoUrl: { type: String }, // output video link
  musicUrlId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Music",
  },
    thumbnailUrl: String,
  shortClipsIds: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Clip",
    },
  ],
  aiSummary: { type: String }, // Gemini summary
  createdAt: { type: Date, default: Date.now },
});

montageSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
  },
});

const Montage = mongoose.model("Montage", montageSchema);

module.exports = Montage;
