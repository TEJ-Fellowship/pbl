const Shelf = require("../models/Shelf");
const Book = require("../models/Book");
const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const mongoose = require("mongoose");

function castErrorToApi(err) {
  if (err.name === "CastError") {
    return new ApiError(400, "Invalid id");
  }
  return err;
}

async function createShelf(userId, name) {
  if (!name || !String(name).trim()) {
    throw new ApiError(400, "name is required");
  }
  //start sessoin: mongoose.startSession() creates a new session and returns it
  const session = await mongoose.startSession();
  try {
    /**withTransaction: executes the given function in a transaction
     * in this case, creating the shelf and updating the user's shelves
     *  either both should happen or neither should happen
     * If step 1 succeeds and step 2 fails, both operations should be rolled back
     */
    const shelf = await session.withTransaction(async () => {
      [shelf] = await Shelf.create(
        [{ name: String(name).trim(), user: userId, books: [] }],
        { session },
      );
    });

    await User.findByIdAndUpdate(
      userId,
      {
        $addToSet: { shelves: shelf._id },
      },
      { session },
    );

    return { shelf: shelf };
  } catch (err) {
    throw castErrorToApi(err);
  } finally {
    await session.endSession();
  }
}

async function listShelves(userId) {
  const shelves = await Shelf.find({ user: userId })
    .sort({ updatedAt: -1 })
    .select("name books createdAt updatedAt")
    .lean();

  const withCounts = shelves.map((s) => ({
    ...s,
    bookCount: Array.isArray(s.books) ? s.books.length : 0,
  }));

  return { shelves: withCounts };
}

async function getShelf(userId, shelfId) {
  try {
    const shelf = await Shelf.findOne({
      _id: shelfId,
      user: userId,
    }).populate("books");

    if (!shelf) throw new ApiError(404, "Shelf not found");
    return { shelf };
  } catch (err) {
    throw castErrorToApi(err);
  }
}

async function updateShelf(userId, shelfId, name) {
  if (!name || !String(name).trim()) {
    throw new ApiError(400, "name is required");
  }

  try {
    const shelf = await Shelf.findOneAndUpdate(
      { _id: shelfId, user: userId },
      { $set: { name: String(name).trim() } },
      /**
       * add returnDocument: "after" to return the updated shelf
       * before that new: true, n newer Mongoose versions, new is being deprecated for these methods
       * and it is not recommended to use new: true in the future
       * runValidators: true to validate the updated shelf
       */
      { returnDocument: "after", runValidators: true },
    );

    if (!shelf) throw new ApiError(404, "Shelf not found");
    return { shelf };
  } catch (err) {
    throw castErrorToApi(err);
  }
}

async function removeShelf(userId, shelfId) {
  //start sessoin: mongoose.startSession() creates a new session and returns it
  const session = await mongoose.startSession();
  try {
    /**withTransaction: executes the given function in a transaction
     * in this case, deleting the shelf and updating the user's shelves, either both should happen or neither should happen
     */
    const deletedShelf = await session.withTransaction(async () => {
      deletedShelf = await Shelf.findOneAndDelete(
        {
          _id: shelfId,
          user: userId,
        },
        { session },
      );
    });
    if (!deletedShelf) throw new ApiError(404, "Shelf not found");

    await User.findByIdAndUpdate(
      userId,
      {
        $pull: { shelves: deletedShelf._id },
      },
      { session },
    );

    return { message: "Shelf deleted", id: deletedShelf._id };
  } catch (err) {
    throw castErrorToApi(err);
  } finally {
    await session.endSession();
  }
}

/**
 * Body: { bookId } — must be a book owned by the same user.
 */
async function addBookToShelf(userId, shelfId, bookId) {
  if (!bookId) {
    throw new ApiError(400, "bookId is required");
  }

  try {
    const shelf = await Shelf.findOne({
      _id: shelfId,
      user: userId,
    });
    if (!shelf) throw new ApiError(404, "Shelf not found");

    const book = await Book.findOne({
      _id: bookId,
      user: userId,
    });
    if (!book) {
      throw new ApiError(404, "Book not found in your library");
    }

    if (shelf.books.some((id) => id.equals(book._id))) {
      throw new ApiError(409, "Book already on this shelf");
    }

    shelf.books.push(book._id);
    await shelf.save();

    const populated = await Shelf.findById(shelf._id).populate("books");
    return { shelf: populated };
  } catch (err) {
    throw castErrorToApi(err);
  }
}

async function removeBookFromShelf(userId, shelfId, bookId) {
  try {
    const shelf = await Shelf.findOne({
      _id: shelfId,
      user: userId,
    });
    if (!shelf) throw new ApiError(404, "Shelf not found");

    const before = shelf.books.length;
    shelf.books = shelf.books.filter((id) => !id.equals(bookId));
    if (shelf.books.length === before) {
      throw new ApiError(404, "Book not on this shelf");
    }
    await shelf.save();

    return { message: "Book removed from shelf", shelfId: shelf._id };
  } catch (err) {
    throw castErrorToApi(err);
  }
}

module.exports = {
  createShelf,
  listShelves,
  getShelf,
  updateShelf,
  removeShelf,
  addBookToShelf,
  removeBookFromShelf,
};
