const mongoose = require("mongoose");

const musicSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    artist: { type: String, default: "Unknown Artist" },
    url: { type: String, required: true }, // the actual music file URL
    duration: { type: Number, required: true }, // in seconds
    genre: {
      type: String,
      enum: [
        "happy",
        "upbeat",
        "chill",
        "epic",
        "emotional",
        "acoustic",
        "electronic",
        "cinematic",
      ],
      default: "upbeat",
    },
    mood: {
      type: String,
      enum: [
        "energetic",
        "calm",
        "mysterious",
        "romantic",
        "adventurous",
        "nostalgic",
      ],
      default: "energetic",
    },
    tags: [
      {
        type: String,
      },
    ],
    thumbnailUrl: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

musicSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
  },
});

const Music = mongoose.model("Music", musicSchema);
module.exports = Music;
