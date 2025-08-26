// index.js
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// ----------------------------
// File Upload Configuration
// ----------------------------

// Ensure uploads directory exists
const uploadsDir = "uploads";
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp + original extension
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

// File filter to only allow images
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only images are allowed."), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Serve static files from uploads directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ----------------------------
// MongoDB connection
// ----------------------------
const password = process.env.MONGODB_PASSWORD;
const mongoURI = `mongodb+srv://pustakverse:${password}@cluster0.dkor4to.mongodb.net/Pustakverse?retryWrites=true&w=majority&appName=Cluster0`;

// Connect to MongoDB
mongoose
  .connect(mongoURI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// ----------------------------
// Book Schema & Model (Updated with coverImage field)
// ----------------------------
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
  },
  {
    timestamps: true, // Add createdAt and updatedAt fields
  }
);

const Book = mongoose.model("Book", bookSchema);

// ----------------------------
// Helper function to delete file
// ----------------------------
const deleteFile = (filename) => {
  if (filename) {
    const filePath = path.join(__dirname, uploadsDir, filename);
    fs.unlink(filePath, (err) => {
      if (err && err.code !== "ENOENT") {
        console.error("Error deleting file:", err);
      }
    });
  }
};

// ----------------------------
// Routes
// ----------------------------

// Get all books
app.get("/api/books", async (req, res) => {
  try {
    const books = await Book.find().sort({ createdAt: -1 }); // Sort by newest first
    res.json(books);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch books" });
  }
});

// Add new book (with image upload)
app.post("/api/books", upload.single("coverImage"), async (req, res) => {
  try {
    // Parse genre from JSON string
    let genre = [];
    if (req.body.genre) {
      try {
        genre = JSON.parse(req.body.genre);
      } catch (e) {
        genre = [req.body.genre]; // Fallback if not JSON
      }
    }

    const bookData = {
      title: req.body.title,
      author: req.body.author,
      genre: genre,
      year: parseInt(req.body.year),
      description: req.body.description,
      rating: parseFloat(req.body.rating),
      favorite: req.body.favorite === "true",
    };

    // Add cover image filename if uploaded
    if (req.file) {
      bookData.coverImage = req.file.filename;
    }

    const newBook = new Book(bookData);
    const savedBook = await newBook.save();
    res.status(201).json(savedBook);
  } catch (err) {
    // Delete uploaded file if database save fails
    if (req.file) {
      deleteFile(req.file.filename);
    }
    console.error("Add book error:", err.message, err);
    res.status(500).json({ error: "Failed to add book" });
  }
});

// Update book (with image upload)
app.put("/api/books/:id", upload.single("coverImage"), async (req, res) => {
  try {
    const { id } = req.params;

    // Find existing book to get old image filename
    const existingBook = await Book.findById(id);
    if (!existingBook) {
      if (req.file) deleteFile(req.file.filename); // Clean up uploaded file
      return res.status(404).json({ error: "Book not found" });
    }

    // Parse genre from JSON string
    let genre = [];
    if (req.body.genre) {
      try {
        genre = JSON.parse(req.body.genre);
      } catch (e) {
        genre = [req.body.genre];
      }
    }

    const updateData = {
      title: req.body.title,
      author: req.body.author,
      genre: genre,
      year: parseInt(req.body.year),
      description: req.body.description,
      rating: parseFloat(req.body.rating),
      favorite: req.body.favorite === "true",
    };

    // Handle image update
    if (req.file) {
      // Delete old image if exists
      if (existingBook.coverImage) {
        deleteFile(existingBook.coverImage);
      }
      updateData.coverImage = req.file.filename;
    }

    const updatedBook = await Book.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    res.json(updatedBook);
  } catch (err) {
    // Delete uploaded file if update fails
    if (req.file) {
      deleteFile(req.file.filename);
    }
    console.error("Update book error:", err);
    res.status(500).json({ error: "Failed to update book" });
  }
});

// Delete book (and associated image)
app.delete("/api/books/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Find book to get image filename before deletion
    const book = await Book.findById(id);
    if (!book) {
      return res.status(404).json({ error: "Book not found" });
    }

    // Delete associated image file
    if (book.coverImage) {
      deleteFile(book.coverImage);
    }

    await Book.findByIdAndDelete(id);
    res.json({ message: "Book deleted" });
  } catch (err) {
    console.error("Delete book error:", err);
    res.status(500).json({ error: "Failed to delete book" });
  }
});

// Error handling middleware for multer
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res
        .status(400)
        .json({ error: "File too large. Maximum size is 5MB." });
    }
    return res.status(400).json({ error: error.message });
  }
  if (error.message.includes("Invalid file type")) {
    return res.status(400).json({ error: error.message });
  }
  next(error);
});

// ----------------------------
app.listen(3001, () => console.log("Server running on port 3001"));
