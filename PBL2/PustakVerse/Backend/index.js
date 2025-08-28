// index.js
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const https = require("https");
const http = require("http");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
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
// Helper function to download image from URL
// ----------------------------
const downloadImage = (url, filename) => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(path.join(uploadsDir, filename));
    const protocol = url.startsWith("https") ? https : http;

    const request = protocol.get(url, (response) => {
      // Check if the response is successful
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download image: ${response.statusCode}`));
        return;
      }

      response.pipe(file);

      file.on("finish", () => {
        file.close();
        resolve(filename);
      });

      file.on("error", (err) => {
        fs.unlink(path.join(uploadsDir, filename), () => {}); // Delete the file on error
        reject(err);
      });
    });

    request.on("error", (err) => {
      reject(err);
    });

    // Set timeout for the request
    request.setTimeout(10000, () => {
      request.abort();
      reject(new Error("Download timeout"));
    });
  });
};

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
// User Schema & Model
// ----------------------------
const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model("User", userSchema);

// ----------------------------
// Book Schema & Model (Updated to include user reference)
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
// Authentication Middleware
// ----------------------------
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Invalid or expired token" });
    }
    req.user = user;
    next();
  });
};

// ----------------------------
// Gemini AI Integration
// ----------------------------
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Gemini only if API key is available
let genAI;
let geminiEnabled = false;

if (process.env.GEMINI_API_KEY) {
  try {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    geminiEnabled = true;
    console.log("Gemini AI initialized successfully");
  } catch (error) {
    console.error("Failed to initialize Gemini AI:", error);
  }
} else {
  console.warn("GEMINI_API_KEY not found. AI features will be disabled.");
}

// Function to generate book insights
async function generateBookInsights(bookData) {
  if (!geminiEnabled) {
    throw new Error("Gemini AI is not configured. Please check your API key.");
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); // Using gemini-pro instead of gemini-2.5-flash

    const prompt = `
      Generate analytical insights about the following book. 
      Focus on key themes, the author's approach, and why someone might want to read it.
      DO NOT provide a detailed plot summary.
      
      Book: ${bookData.title} by ${bookData.author}
      ${
        bookData.description
          ? `Description: ${bookData.description}`
          : "No description available"
      }
      
      Please provide insights in this JSON format:
      {
        "keyThemes": ["theme1", "theme2", "theme3"],
        "authorsApproach": "brief description",
        "whyRead": "brief explanation",
        "readingExperience": "what to expect"
      }
    `;

    console.log("Sending prompt to Gemini for book:", bookData.title);

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log("Raw response from Gemini:", text);

    // Extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (parseError) {
        console.error("JSON parse error:", parseError);
        // Return a fallback response if parsing fails
        return {
          keyThemes: ["Literature", "Cultural themes", "Historical context"],
          authorsApproach:
            "The author employs a narrative style that explores complex themes",
          whyRead: "This book offers valuable insights into its subject matter",
          readingExperience:
            "Readers can expect an engaging and thought-provoking experience",
        };
      }
    }

    throw new Error("No JSON found in response");
  } catch (error) {
    console.error("Gemini API error details:", error);
    // Check if it's an API key error
    if (
      error.message.includes("API_KEY") ||
      error.message.includes("key") ||
      error.message.includes("quota")
    ) {
      throw new Error("Gemini API issue: " + error.message);
    }
    throw new Error("Failed to generate insights: " + error.message);
  }
}

// ----------------------------
// Auth Routes
// ----------------------------

// Signup route
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return res.status(400).json({
        error: "User with this email or username already exists",
      });
    }

    // Create new user
    const user = new User({ username, email, password });
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      message: "User created successfully",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Login route
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Protected route example (get user profile)
app.get("/api/auth/profile", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.error("Profile error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ----------------------------
// Book Routes (Protected)
// ----------------------------

// Get all books (for authenticated users)
app.get("/api/books", authenticateToken, async (req, res) => {
  try {
    const books = await Book.find({ user: req.user.userId }).sort({
      createdAt: -1,
    }); // Sort by newest first
    res.json(books);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch books" });
  }
});

// Add new book (for authenticated users)
app.post(
  "/api/books",
  authenticateToken,
  upload.single("coverImage"),
  async (req, res) => {
    try {
      // Parse genre from JSON string if it's a string, otherwise use as array
      let genre = [];
      if (req.body.genre) {
        try {
          genre =
            typeof req.body.genre === "string"
              ? JSON.parse(req.body.genre)
              : req.body.genre;
        } catch (e) {
          genre = Array.isArray(req.body.genre)
            ? req.body.genre
            : [req.body.genre];
        }
      }

      const bookData = {
        title: req.body.title,
        author: req.body.author,
        genre: genre,
        year: parseInt(req.body.year),
        description: req.body.description,
        rating: req.body.rating ? parseFloat(req.body.rating) : 0,
        favorite: req.body.favorite === "true" || req.body.favorite === true,
        source: req.body.source || "manual", // Use your existing field
        googleId: req.body.googleId || null, // Use your existing field
        user: req.user.userId, // Add user reference
      };

      // Handle cover image
      if (req.file) {
        // Manual upload
        bookData.coverImage = req.file.filename;
      } else if (req.body.coverUrl) {
        // Download from URL (for Google Books)
        try {
          const fileExtension = ".jpg"; // Default to jpg for downloaded images
          const filename = `downloaded_${Date.now()}_${Math.round(
            Math.random() * 1e9
          )}${fileExtension}`;
          await downloadImage(req.body.coverUrl, filename);
          bookData.coverImage = filename;
        } catch (downloadError) {
          console.error("Failed to download cover image:", downloadError);
          // Continue without cover image if download fails
        }
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
  }
);

// Update book (with image upload)
app.put(
  "/api/books/:id",
  authenticateToken,
  upload.single("coverImage"),
  async (req, res) => {
    try {
      const { id } = req.params;

      // Find existing book to get old image filename
      const existingBook = await Book.findOne({
        _id: id,
        user: req.user.userId,
      });
      if (!existingBook) {
        if (req.file) deleteFile(req.file.filename); // Clean up uploaded file
        return res.status(404).json({ error: "Book not found" });
      }

      // Parse genre from JSON string if it's a string, otherwise use as array
      let genre = [];
      if (req.body.genre) {
        try {
          genre =
            typeof req.body.genre === "string"
              ? JSON.parse(req.body.genre)
              : req.body.genre;
        } catch (e) {
          genre = Array.isArray(req.body.genre)
            ? req.body.genre
            : [req.body.genre];
        }
      }

      const updateData = {
        title: req.body.title,
        author: req.body.author,
        genre: genre,
        year: parseInt(req.body.year),
        description: req.body.description,
        rating: req.body.rating
          ? parseFloat(req.body.rating)
          : existingBook.rating,
        favorite: req.body.favorite === "true" || req.body.favorite === true,
      };

      // Handle image update (only for manually added books or if new file is uploaded)
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
  }
);

// Delete book (and associated image)
app.delete("/api/books/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Find book to get image filename before deletion
    const book = await Book.findOne({ _id: id, user: req.user.userId });
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

// New API Route for Book Insights
app.post("/api/summarize", authenticateToken, async (req, res) => {
  try {
    const { title, author, description } = req.body;

    console.log("Received summarize request for:", title, "by", author);

    if (!title || !author) {
      return res.status(400).json({ error: "Title and author are required" });
    }

    const insights = await generateBookInsights({
      title,
      author,
      description: description || "",
    });

    console.log("Successfully generated insights for:", title);
    res.json(insights);
  } catch (error) {
    console.error("Summarization error details:", error);
    res.status(500).json({
      error: error.message || "Failed to generate insights",
      details: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
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
