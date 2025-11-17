const express = require("express");
const cors = require("cors");
const { connectToDatabase } = require("./utils/db");
const { initDatabase } = require("./utils/initDatabase");
const { redisClient } = require("./utils/redis");
const { PORT } = require("./utils/config");
const routes = require("./routes");

const app = express();

// CORS Configuration
// Must specify exact origin when using credentials (cannot use wildcard '*')
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // List of allowed origins
    const allowedOrigins = [
      'http://localhost:5173',  // Vite default dev server
      'http://localhost:5174',  // Vite alternative port
      'http://localhost:3000',   // Alternative frontend port
      process.env.FRONTEND_URL,  // From environment variable
    ].filter(Boolean); // Remove undefined values
    
    // In development, allow all localhost origins
    if (process.env.NODE_ENV === 'development') {
      if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
        return callback(null, true);
      }
    }
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Allow cookies/credentials
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Session-ID'],
  exposedHeaders: ['Content-Type'],
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging (development only)
if (process.env.NODE_ENV === "development") {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// API routes
app.use("/api", routes);

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "E-commerce Order Processing API",
    version: "1.0.0",
    endpoints: {
      products: "/api/products",
      cart: "/api/cart",
      orders: "/api/orders",
      health: "/api/health",
    },
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

const start = async () => {
  try {
    // Connect to databases
    await connectToDatabase();

    // Initialize database tables (create if they don't exist)
    await initDatabase();

    // Verify Redis connection
    await redisClient.ping();
    console.log("✅ Redis connection verified");

    // Start server
    app.listen(PORT, () => {
      console.log(`\n🚀 Server running on port ${PORT}`);
      console.log(`📡 API available at http://localhost:${PORT}/api`);
      console.log(`🏥 Health check: http://localhost:${PORT}/api/health\n`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down gracefully...");
  await redisClient.quit();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("SIGINT received, shutting down gracefully...");
  await redisClient.quit();
  process.exit(0);
});

start();
