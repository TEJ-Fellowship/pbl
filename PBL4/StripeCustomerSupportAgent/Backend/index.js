import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Import routes
import chatRoutes from "./routes/chat.js";
import healthRoutes from "./routes/health.js";

// Import middleware
import { errorHandler } from "./middleware/errorHandler.js";
import { requestLogger } from "./middleware/requestLogger.js";
import config from "./config/config.js";

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: [
      config.FRONTEND_URL || "http://localhost:5173",
      "http://localhost:3000",
      "http://localhost:5173",
    ],
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware (must be after body parsing)
app.use(requestLogger);

// Routes
app.use("/api/health", healthRoutes);
app.use("/api/chat", chatRoutes);

// Root endpoint
app.get("/", (req, res) => {
  console.log("🏠 Root endpoint accessed");
  res.json({
    message: "Stripe Support API is running!",
    version: "1.0.0",
    endpoints: {
      health: "/api/health",
      chat: "/api/chat",
    },
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Route not found",
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
});

// Initialize and check all connections
async function initializeConnections() {
  console.log("🔧 Initializing Stripe Support API connections...");
  console.log("=".repeat(60));

  try {
    // Check environment variables
    console.log("📋 Environment Variables:");
    console.log(`   • NODE_ENV: ${process.env.NODE_ENV || "development"}`);
    console.log(`   • PORT: ${process.env.PORT || 5000}`);
    console.log(
      `   • GEMINI_API_KEY: ${
        process.env.GEMINI_API_KEY ? "✅ Set" : "❌ Missing"
      }`
    );
    console.log(
      `   • PINECONE_API_KEY: ${
        process.env.PINECONE_API_KEY ? "✅ Set" : "❌ Missing"
      }`
    );
    console.log(
      `   • PINECONE_INDEX_NAME: ${
        process.env.PINECONE_INDEX_NAME || "❌ Missing"
      }`
    );
    console.log("");

    // Test PostgreSQL connection
    console.log("🗄️ Testing PostgreSQL connection...");
    try {
      const pool = await import("./config/database.js");
      const client = await pool.default.connect();
      await client.query("SELECT 1 as test");
      client.release();
      console.log("   ✅ PostgreSQL: Connected successfully");
    } catch (error) {
      console.log(`   ❌ PostgreSQL: Connection failed - ${error.message}`);
    }

    // Test Pinecone connection
    console.log("🌲 Testing Pinecone connection...");
    try {
      const { Pinecone } = await import("@pinecone-database/pinecone");
      const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
      const index = pinecone.Index(process.env.PINECONE_INDEX_NAME);
      const stats = await index.describeIndexStats();
      console.log("   ✅ Pinecone: Connected successfully");
      console.log(`   📊 Vector count: ${stats.totalVectorCount || 0}`);
      console.log(`   📏 Dimensions: ${stats.dimension || "Unknown"}`);
    } catch (error) {
      console.log(`   ❌ Pinecone: Connection failed - ${error.message}`);
    }

    // Test Gemini connection
    console.log("🤖 Testing Gemini API connection...");
    try {
      const { GoogleGenerativeAI } = await import("@google/generative-ai");
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const result = await model.generateContent("test");
      await result.response;
      console.log("   ✅ Gemini API: Connected successfully");
    } catch (error) {
      console.log(`   ❌ Gemini API: Connection failed - ${error.message}`);
    }

    console.log("");
    console.log("🎉 Connection tests completed!");
    console.log("=".repeat(60));
  } catch (error) {
    console.error("❌ Connection initialization failed:", error);
  }
}

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 Stripe Support API running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(
    `🔗 Frontend URL: ${process.env.FRONTEND_URL || "http://localhost:5173"}`
  );
  console.log("");

  // Initialize connections after server starts
  await initializeConnections();
});

export default app;
