const express = require("express");
const cors = require("cors");
const { connectToDatabase } = require("./utils/db");
const { initDatabase } = require("./utils/initDatabase");
const { redisClient } = require("./utils/redis");
const { PORT } = require("./utils/config");
const routes = require("./routes");
const { ensureTopicExists, disconnectProducer } = require("./utils/kafka");
const { startPaymentWorker } = require("./services/paymentWorker");
const { startPoolMonitoring } = require("./middleware/poolMonitor");

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
app.use(express.json({ limit: '10mb' })); // Limit request body size
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request timeout middleware (90 seconds - increased for high load scenarios)
app.use((req, res, next) => {
  req.setTimeout(90000, () => {
    if (!res.headersSent) {
      res.status(504).json({
        success: false,
        message: 'Request timeout',
      });
    }
  });
  next();
});

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

    // Start database connection pool monitoring
    startPoolMonitoring();
    console.log("📊 Database connection pool monitoring started");

    // Verify Redis connection (with graceful fallback)
    // ioredis handles connection automatically, just verify with ping
    try {
      // Set a timeout for ping to detect if Redis is actually responding
      const pingPromise = redisClient.ping();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Redis ping timeout - server not responding')), 5000)
      );
      
      await Promise.race([pingPromise, timeoutPromise]);
      // If ping succeeds, connection is actually working
      console.log("✅ Redis connection verified (ioredis with connection pooling)");
      console.log("✅ Redis is ready for caching operations");
    } catch (error) {
      // Ping failed - Redis is not actually connected (server stopped or unreachable)
      console.warn("⚠️  Redis ping failed - Redis is not connected.");
      console.warn(`   Error: ${error.message}`);
      console.warn("💡 To enable caching, start Docker Redis with: docker compose up -d");
      console.warn("💡 App will continue without Redis caching. Some features may be slower.");
      console.warn("💡 Cart operations will use in-memory fallback.");
    }

    // Initialize Kafka topics (non-blocking, will retry if Kafka is not ready)
    try {
      await ensureTopicExists('payments', 3);
      await ensureTopicExists('payments-dlq', 3); // Dead Letter Queue
    } catch (kafkaError) {
      console.warn("⚠️  Kafka topic initialization failed (non-fatal):", kafkaError.message);
      console.warn("💡 Make sure Kafka is running: docker compose up -d");
      console.warn("💡 Payment processing will be unavailable until Kafka is ready");
    }

    // Start payment worker (Kafka consumer) - non-blocking
    let paymentWorker = null;
    try {
      paymentWorker = await startPaymentWorker();
      console.log("✅ Payment worker started");
    } catch (workerError) {
      console.warn("⚠️  Payment worker failed to start:", workerError.message);
      console.warn("💡 Make sure Kafka is running: docker compose up -d");
      console.warn("💡 Payment processing will be unavailable until Kafka is ready");
    }

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
const gracefulShutdown = async () => {
  console.log("Shutting down gracefully...");
  try {
    await disconnectProducer();
    await redisClient.quit();
  } catch (error) {
    console.error("Error during shutdown:", error);
  }
  process.exit(0);
};

process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);

start();
