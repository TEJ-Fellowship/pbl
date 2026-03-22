const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    author: {
      type: String,
      trim: true,
      default: "Unknown",
    },
    genre: {
      type: String,
      trim: true,
      default: "",
    },
    year: {
      type: Number,
      default: null,
    },
    description: {
      type: String,
      default: "",
    },
    /** User rating 0–5 */
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    favorite: {
      type: Boolean,
      default: false,
    },
    coverImage: { type: String, default: "" },
    source: {
      type: String,
      default: "google",
      trim: true,
    },
    /** Google volume id or unique local id for manual entries */
    googleBookId: {
      type: String,
      required: true,
      trim: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

bookSchema.index({ user: 1, googleBookId: 1 }, { unique: true });

const Book = mongoose.model("Book", bookSchema);
module.exports = Book;
