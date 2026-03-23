const Book = require("../models/Book");
const Shelf = require("../models/Shelf");

/**
 * List current user's saved books. Query: ?favorite=true
 */
async function list(req, res) {
  try {
    const filter = { user: req.user._id };
    if (req.query.favorite === "true") {
      filter.favorite = true;
    }
    const books = await Book.find(filter).sort({ updatedAt: -1 }).lean();
    res.json({ books });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * Add a book to the user's library (unique per user + googleBookId).
 */
async function create(req, res) {
  try {
    const {
      title,
      googleBookId,
      author,
      genre,
      year,
      description,
      rating,
      favorite,
      coverImage,
      source,
    } = req.body;

    if (!title || !googleBookId) {
      return res
        .status(400)
        .json({ error: "title and googleBookId are required" });
    }

    const book = await Book.create({
      title: String(title).trim(),
      googleBookId: String(googleBookId).trim(),
      user: req.user._id,
      author: author != null ? String(author).trim() : undefined,
      genre: genre != null ? String(genre).trim() : undefined,
      year: year != null ? Number(year) : undefined,
      description: description != null ? String(description) : undefined,
      rating: rating != null ? Number(rating) : undefined,
      favorite: Boolean(favorite),
      coverImage: coverImage != null ? String(coverImage) : undefined,
      source: source != null ? String(source).trim() : undefined,
    });

    res.status(201).json({ book });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        error: "This book is already in your library",
      });
    }
    res.status(500).json({ error: err.message });
  }
}

async function getOne(req, res) {
  try {
    const book = await Book.findOne({
      _id: req.params.bookId,
      user: req.user._id,
    }).lean();

    if (!book) {
      return res.status(404).json({ error: "Book not found" });
    }
    res.json({ book });
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(400).json({ error: "Invalid book id" });
    }
    res.status(500).json({ error: err.message });
  }
}

/**
 * Update fields: title, author, genre, year, description, rating, favorite, coverImage
 */
async function update(req, res) {
  try {
    const allowed = [
      "title",
      "author",
      "genre",
      "year",
      "description",
      "rating",
      "favorite",
      "coverImage",
    ];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No valid fields to update" });
    }

    if (updates.rating !== undefined) {
      const r = Number(updates.rating);
      if (Number.isNaN(r) || r < 0 || r > 5) {
        return res.status(400).json({ error: "rating must be between 0 and 5" });
      }
      updates.rating = r;
    }

    const book = await Book.findOneAndUpdate(
      { _id: req.params.bookId, user: req.user._id },
      { $set: updates },
      { new: true, runValidators: true },
    );

    if (!book) {
      return res.status(404).json({ error: "Book not found" });
    }
    res.json({ book });
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(400).json({ error: "Invalid book id" });
    }
    res.status(500).json({ error: err.message });
  }
}

/**
 * Remove from library and from all of the user's shelves.
 */
async function remove(req, res) {
  try {
    const book = await Book.findOneAndDelete({
      _id: req.params.bookId,
      user: req.user._id,
    });

    if (!book) {
      return res.status(404).json({ error: "Book not found" });
    }

    await Shelf.updateMany(
      { user: req.user._id },
      { $pull: { books: book._id } },
    );

    res.json({ message: "Book removed from library", id: book._id });
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(400).json({ error: "Invalid book id" });
    }
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  list,
  create,
  getOne,
  update,
  remove,
};
