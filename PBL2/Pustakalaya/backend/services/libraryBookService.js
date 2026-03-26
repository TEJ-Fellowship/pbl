const Book = require("../models/Book");
const Shelf = require("../models/Shelf");
const ApiError = require("../utils/ApiError");

async function listBooks(userId, { favorite }) {
  const filter = { user: userId };
  if (favorite === "true") filter.favorite = true;
  const books = await Book.find(filter).sort({ updatedAt: -1 }).lean();
  return { books };
}

async function createBook(userId, payload) {
  const { title, googleBookId } = payload;
  if (!title || !googleBookId) {
    throw new ApiError(400, "title and googleBookId are required");
  }

  try {
    const book = await Book.create({
      ...payload,
      title: String(title).trim(),
      googleBookId: String(googleBookId).trim(),
      user: userId,
      favorite: Boolean(payload.favorite),
    });
    return { book };
  } catch (err) {
    if (err.code === 11000) {
      throw new ApiError(409, "This book is already in your library");
    }
    throw err;
  }
}

async function getBook(userId, bookId) {
  const book = await Book.findOne({ id: bookId, user: userId }).lean();
  if (!book) throw new ApiError(404, "Book not found");
  return { book };
}

module.exports = { listBooks, createBook, getBook };
