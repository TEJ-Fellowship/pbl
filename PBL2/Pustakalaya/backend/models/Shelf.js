const mongoose = require("mongoose");

const shelfSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      //unique: true, ensures that each user can only have one shelf
      unique: true,
      //index: true, creates an index on the user field for faster queries
      index: true,
    },
    books: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Book",
      },
    ],
  },
  {
    timestamps: true,
  },
);

const Shelf = mongoose.model("Shelf", shelfSchema);
module.exports = Shelf;
