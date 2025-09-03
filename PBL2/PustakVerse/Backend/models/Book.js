const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema(
  {
    title: String,
    author: String,
    genre: [String],
    year: Number,
    description: String,
    rating: Number,
    favorite: Boolean,
    coverImage: String, // Store the filename of the uploaded image
    source: { type: String, default: "manual" }, // 'manual' or 'online'
    googleId: String, // Store Google Books ID for online books
    user: {
      // Add user reference
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true, // Add createdAt and updatedAt fields
  }
);

module.exports = mongoose.model("Book", bookSchema);
