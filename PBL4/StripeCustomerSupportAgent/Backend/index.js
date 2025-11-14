import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Import routes
import authRoutes from "./routes/auth.js";
import chatRoutes from "./routes/chat.js";
import healthRoutes from "./routes/health.js";
import integratedChatRoutes from "./routes/integratedChat.js";

// Import middleware
import { errorHandler } from "./middleware/errorHandler.js";
import { requestLogger } from "./middleware/requestLogger.js";
import config from "./config/config.js";
import setupAllSchemas from "./utils/setup_all_schemas.js";
import AutoDataSetup from "./utils/autoDataSetup.js";

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
// CORS configuration
// In production with same domain, CORS is less critical but kept for development
app.use(
  cors({
    origin: [
      config.FRONTEND_URL || "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:5173",
    ],
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware (must be after body parsing)
// Note: This application does not create any response.json files
app.use(requestLogger);

// API Routes (must come before static file serving)
app.use("/api/auth", authRoutes);
app.use("/api/health", healthRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/integrated-chat", integratedChatRoutes);

// Serve static files from dist folder (CSS, JS, images, etc.)
// This serves assets like /assets/index.js, /vite.svg, etc.
app.use(express.static(join(__dirname, "dist")));

// Serve index.html for all non-API routes (SPA routing)
// This handles client-side routing for React Router
app.get("*", (req, res, next) => {
  // Skip API routes - let them fall through to error handler if not found
  if (req.path.startsWith("/api")) {
    return next();
  }
  // Serve index.html for all other routes (SPA fallback)
  res.sendFile(join(__dirname, "dist", "index.html"));
});

// Error handling middleware (must be last)
app.use(errorHandler);

// 404 handler for API routes only
app.use("/api/*", (req, res) => {
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

    // Test PostgreSQL connection and auto-setup if needed
    console.log("🗄️ Testing PostgreSQL connection...");
    try {
      const pool = await import("./config/database.js");
      const client = await pool.default.connect();

      // Check if tables exist
      const tableCheck = await client.query(`
        SELECT COUNT(*) as count 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN (
          'raw_documents', 
          'document_chunks', 
          'conversation_sessions',
          'conversation_messages',
          'conversation_qa_pairs',
          'conversation_summaries',
          'memory_retrieval_cache'
        )
      `);

      client.release();

      const tableCount = parseInt(tableCheck.rows[0].count);

      if (tableCount < 7) {
        console.log(
          `   ⚠️  Only ${tableCount}/7 tables found. Setting up database schema...`
        );
        try {
          await setupAllSchemas();
          console.log("   ✅ Database schema setup completed!");
        } catch (setupError) {
          console.error("   ❌ Database setup failed:", setupError.message);
          // Don't exit - let the app continue, tables might partially exist
        }
      } else {
        console.log("   ✅ PostgreSQL: All tables exist");
      }

      // Test connection
      const testClient = await pool.default.connect();
      await testClient.query("SELECT 1 as test");
      testClient.release();
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
    try {
      const { GoogleGenerativeAI } = await import("@google/generative-ai");
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY_2);
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash-lite",
      });
      const result = await model.generateContent("test");
      await result.response;
      console.log("   ✅ Gemini API 2: Connected successfully");
    } catch (error) {
      console.log(`   ❌ Gemini API 2: Connection failed - ${error.message}`);
    }
    try {
      const { GoogleGenerativeAI } = await import("@google/generative-ai");
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY_3);
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash-lite",
      });
      const result = await model.generateContent("test");
      await result.response;
      console.log("   ✅ Gemini API 3: Connected successfully");
    } catch (error) {
      console.log(`   ❌ Gemini API 3: Connection failed - ${error.message}`);
    }

    console.log("");
    console.log("🎉 Connection tests completed!");
    console.log("=".repeat(60));

    // Auto-setup data (scraping and ingestion) in background
    if (
      process.env.NODE_ENV === "production" ||
      process.env.AUTO_DATA_SETUP !== "false"
    ) {
      const autoDataSetup = new AutoDataSetup();
      // Run in background (don't await)
      autoDataSetup.runAutoSetup().catch((error) => {
        console.error("⚠️  Auto data setup failed:", error.message);
      });
    }
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
