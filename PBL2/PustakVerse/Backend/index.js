// index.js
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// ----------------------------
// MongoDB connection
// ----------------------------
const password = process.env.MONGODB_PASSWORD;
const mongoURI = `mongodb+srv://pustakverse:${password}@cluster0.dkor4to.mongodb.net/Pustakverse?retryWrites=true&w=majority&appName=Cluster0`;

// Connect to MongoDB
mongoose
  .connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// ----------------------------
// Book Schema & Model
// ----------------------------
const bookSchema = new mongoose.Schema({
  title: String,
  author: String,
  genre: [String],
  year: Number,
  description: String,
  rating: Number,
  favorite: Boolean,
});

const Book = mongoose.model("Book", bookSchema);

// ----------------------------
// Routes
// ----------------------------

// Get all books
app.get("/api/books", async (req, res) => {
  try {
    const books = await Book.find();
    res.json(books);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch books" });
  }
});

// Add new book
app.post("/api/books", async (req, res) => {
  try {
    const newBook = new Book(req.body);
    const savedBook = await newBook.save();
    res.status(201).json(savedBook);
  } catch (err) {
    console.error("Add book error:", err.message, err);
    res.status(500).json({ error: "Failed to add book" });
  }
});

// Delete book
app.delete("/api/books/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await Book.findByIdAndDelete(id);
    res.json({ message: "Book deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete book" });
  }
});

// Update book
app.put("/api/books/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updatedBook = await Book.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    res.json(updatedBook);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update book" });
  }
});

// ----------------------------
app.listen(3001, () => console.log("Server running on port 3001"));
