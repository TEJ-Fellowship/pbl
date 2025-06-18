import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import projectRoutes from "./routes/projects.js";

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Basic route for testing
app.get("/", (req, res) => {
  res.json({ message: "Project Showcase API is running" });
});

// Project routes
app.use("/api/projects", projectRoutes);

const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Database connection failed:", error);
  });
