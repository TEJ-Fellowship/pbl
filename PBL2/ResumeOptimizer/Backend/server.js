import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import mongoose from "mongoose";

import usersRouter from "./routes/users.js";
import resumeRoutes from "./routes/resumeRoutes.js";

dotenv.config();

// --- MongoDB Connection ---
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/resumeoptimizer", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });

const app = express();

// --- Middleware ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Ensure uploads folder exists ---
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// --- Routes ---
app.use("/api/users", usersRouter);
app.use("/api/resumes", resumeRoutes); // all resume routes handled in router

// --- Serve uploaded files ---
app.use("/uploads", express.static(uploadsDir));

// --- Error handling for unknown routes ---
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// --- Start server ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
