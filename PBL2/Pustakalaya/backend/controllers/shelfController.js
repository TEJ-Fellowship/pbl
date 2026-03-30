const Shelf = require("../models/Shelf");
const Book = require("../models/Book");
const User = require("../models/User");
const mongoose = require("mongoose");

async function create(req, res) {
  try {
    //start sessoin: mongoose.startSession() creates a new session and returns it
    const session = await mongoose.startSession();
    const name = req.body?.name;
    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: "name is required" });
    }

    //withTransaction: executes the given function in a transaction
    let shelf = await session.withTransaction(async () => {
      [shelf] = await Shelf.create(
        [{ name: String(name).trim(), user: req.user._id, books: [] }],
        { session },
      );
      await User.findByIdAndUpdate(
        req.user._id,
        { $addToSet: { shelves: shelf._id } },
        { session },
      );
    });

    res.status(201).json({ shelf });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    await session.endSession();
  }
}

async function list(req, res) {
  try {
    const shelves = await Shelf.find({ user: req.user._id })
      .sort({ updatedAt: -1 })
      .select("name books createdAt updatedAt")
      .lean();

    const withCounts = shelves.map((s) => ({
      ...s,
      bookCount: Array.isArray(s.books) ? s.books.length : 0,
    }));

    res.json({ shelves: withCounts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getOne(req, res) {
  try {
    const shelf = await Shelf.findOne({
      _id: req.params.shelfId,
      user: req.user._id,
    }).populate("books");

    if (!shelf) {
      return res.status(404).json({ error: "Shelf not found" });
    }
    res.json({ shelf });
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(400).json({ error: "Invalid shelf id" });
    }
    res.status(500).json({ error: err.message });
  }
}

async function update(req, res) {
  try {
    const name = req.body?.name;
    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: "name is required" });
    }

    const shelf = await Shelf.findOneAndUpdate(
      { _id: req.params.shelfId, user: req.user._id },
      { $set: { name: String(name).trim() } },
      /**
       * add returnDocument: "after" to return the updated shelf
       * before that new: true, n newer Mongoose versions, new is being deprecated for these methods
       * and it is not recommended to use new: true in the future
       * runValidators: true to validate the updated shelf
       */
      { returnDocument: "after", runValidators: true },
    );

    if (!shelf) {
      return res.status(404).json({ error: "Shelf not found" });
    }
    res.json({ shelf });
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(400).json({ error: "Invalid shelf id" });
    }
    res.status(500).json({ error: err.message });
  }
}

async function remove(req, res) {
  try {
    const shelf = await Shelf.findOneAndDelete({
      _id: req.params.shelfId,
      user: req.user._id,
    });

    if (!shelf) {
      return res.status(404).json({ error: "Shelf not found" });
    }

    await User.findByIdAndUpdate(req.user._id, {
      $pull: { shelves: shelf._id },
    });

    res.json({ message: "Shelf deleted", id: shelf._id });
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(400).json({ error: "Invalid shelf id" });
    }
    res.status(500).json({ error: err.message });
  }
}

/**
 * Body: { bookId } — must be a book owned by the same user.
 */
async function addBook(req, res) {
  try {
    const { bookId } = req.body;
    if (!bookId) {
      return res.status(400).json({ error: "bookId is required" });
    }

    const shelf = await Shelf.findOne({
      _id: req.params.shelfId,
      user: req.user._id,
    });
    if (!shelf) {
      return res.status(404).json({ error: "Shelf not found" });
    }

    const book = await Book.findOne({
      _id: bookId,
      user: req.user._id,
    });
    if (!book) {
      return res.status(404).json({ error: "Book not found in your library" });
    }

    const populated = await Shelf.findOneAndUpdate(
      { _id: req.params.shelfId, user: req.user._id },
      { $addToSet: { books: book._id } },
      { new: true, runValidators: true },
    ).populate("books");
    if (!populated) {
      return res.status(409).json({ error: "Book already on this shelf" });
    }

    res.json({ shelf: populated });
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(400).json({ error: "Invalid id" });
    }
    res.status(500).json({ error: err.message });
  }
}

async function removeBook(req, res) {
  try {
    const shelf = await Shelf.findOne({
      _id: req.params.shelfId,
      user: req.user._id,
    });
    if (!shelf) {
      return res.status(404).json({ error: "Shelf not found" });
    }

    const before = shelf.books.length;
    shelf.books = shelf.books.filter((id) => !id.equals(req.params.bookId));
    if (shelf.books.length === before) {
      return res.status(404).json({ error: "Book not on this shelf" });
    }
    await shelf.save();

    res.json({ message: "Book removed from shelf", shelfId: shelf._id });
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(400).json({ error: "Invalid id" });
    }
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  create,
  list,
  getOne,
  update,
  remove,
  addBook,
  removeBook,
};
