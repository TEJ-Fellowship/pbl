import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configure dotenv with explicit path
dotenv.config({ path: join(__dirname, ".env") });

import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import passport from "passport";
import session from "express-session";
import MongoStore from "connect-mongo";
import rateLimit from "express-rate-limit";

import projectRoutes from "./routes/projects.js";
import authRoutes from "./routes/auth.js";
import "./middleware/passport.js";

const app = express();

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
});

app.use(limiter);

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());

// Session configuration
const sessionConfig = {
  secret: process.env.JWT_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
};

// Only use MongoDB session store if MongoDB is available
if (process.env.MONGODB_URI) {
  sessionConfig.store = MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
  });
}

app.use(session(sessionConfig));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Basic route for testing
app.get("/", (req, res) => {
  res.json({ message: "Project Showcase API is running" });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);

const PORT = process.env.PORT || 5000;

// Start server with or without MongoDB
if (process.env.MONGODB_URI) {
  mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => {
      console.log("Connected to MongoDB");
      app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
      });
    })
    .catch((error) => {
      console.error("MongoDB connection failed:", error.message);
      console.log(
        "Starting server without MongoDB (some features will be unavailable)"
      );
      app.listen(PORT, () => {
        console.log(`Server running on port ${PORT} (MongoDB unavailable)`);
      });
    });
} else {
  console.log("No MongoDB URI provided, starting server without database");
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} (No database)`);
  });
}
