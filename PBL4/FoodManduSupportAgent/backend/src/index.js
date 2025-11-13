import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { connectDB } from "./config/db.js";
import qaRoutes from "./routes/qaRoutes.js";
import { errorHandler, notFound } from "./middlewares/errorHandler.js";
import { validateEnv } from "./utils/validateEnv.js";

// Load environment variables
dotenv.config();

// Validate required environment variables
validateEnv();

const app = express();

// Middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(
      `${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`
    );
  });
  next();
});

// Connect MongoDB
connectDB();

// Root endpoint
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to Foodmandu Support Agent API",
    version: "1.0.0",
    endpoints: {
      health: "/api/health",
      chat: "POST /api/chat",
      history: "GET /api/chat/history",
    },
  });
});

// Routes
app.use("/api", qaRoutes);

// Error handlers (must be last)
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("\n" + "=".repeat(50));
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`📝 API Docs: http://localhost:${PORT}/`);
  console.log(`❤️  Health Check: http://localhost:${PORT}/api/health`);
  console.log("=".repeat(50) + "\n");
});
