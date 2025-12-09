const express = require("express");
const path = require("path");

const app = express();

const { PORT } = require("./utils/config");
const { connectToDatabase } = require("./utils/db.js");

// Middleware

// JSON parser for all routes EXCEPT webhook (webhook needs raw body)
// Apply JSON parser directly, but skip for webhook
const jsonParser = express.json();
app.use((req, res, next) => {
  // Skip JSON parsing for webhook endpoint (needs raw body for signature verification)
  if (req.path === "/api/payments/webhook") {
    return next();
  }
  // Use JSON parser for all other routes
  return jsonParser(req, res, next);
});

// Serve static files from frontend directory
app.use(express.static(path.join(__dirname, "../frontend")));

// Request timeout middleware (production best practice)
// Prevents requests from hanging indefinitely
// 15s timeout for Kafka mode (allows time for async processing)
const REQUEST_TIMEOUT = process.env.REQUEST_TIMEOUT
  ? parseInt(process.env.REQUEST_TIMEOUT)
  : 15000;
// Request timeout disabled for high-load Kafka processing
// Timeouts handled at application level (booking controller returns 202 immediately)
// app.use((req, res, next) => {
//   req.setTimeout(REQUEST_TIMEOUT, () => {
//     if (!res.headersSent) {
//       res.status(504).json({ error: "Request timeout" });
//     }
//   });
//   res.setTimeout(REQUEST_TIMEOUT);
//   next();
// });

// Routes
app.use("/api/movies", require("./routes/movies"));
app.use("/api/theaters", require("./routes/theaters"));
app.use("/api/screens", require("./routes/screens"));
app.use("/api/showtimes", require("./routes/showtimes"));
app.use("/api/bookings", require("./routes/bookings"));
app.use("/api/payments", require("./routes/payments"));
app.use("/api/users", require("./routes/users"));

// Health check endpoint with Redis monitoring
const { getHealthStatus, getMemoryInfo } = require("./utils/redisMonitor");
app.get("/health", async (req, res) => {
  const redisHealth = await getHealthStatus();
  res.json({
    status: "ok",
    message: "Server is running",
    redis: redisHealth,
  });
});

// Dedicated Redis monitoring endpoint
app.get("/api/redis/monitor", async (req, res) => {
  try {
    const memoryInfo = await getMemoryInfo();
    res.json({
      timestamp: new Date().toISOString(),
      memory: memoryInfo,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "Movie Ticket Booking System API",
    version: "1.0.0",
    endpoints: {
      movies: {
        base: "/api/movies",
        search: "/api/movies/search?title=&genre=&language=&release_date=",
        operations: [
          "GET /",
          "GET /:id",
          "GET /search",
          "POST /",
          "PUT /:id",
          "DELETE /:id",
        ],
      },
      theaters: {
        base: "/api/theaters",
        operations: ["GET /", "GET /:id", "POST /", "PUT /:id", "DELETE /:id"],
      },
      screens: {
        base: "/api/screens",
        byTheater: "/api/screens/theater/:theaterId",
        operations: [
          "GET /",
          "GET /theater/:theaterId",
          "GET /:id",
          "POST /",
          "PUT /:id",
          "DELETE /:id",
        ],
      },
      showtimes: {
        base: "/api/showtimes",
        byMovie: "/api/showtimes/movie/:movieId",
        byTheater: "/api/showtimes/theater/:theaterId",
        operations: [
          "GET /",
          "GET /movie/:movieId",
          "GET /theater/:theaterId",
          "GET /:id",
          "POST /",
          "PUT /:id",
          "DELETE /:id",
        ],
      },
      bookings: {
        base: "/api/bookings",
        byUser: "/api/bookings/user/:userId",
        operations: [
          "GET /",
          "GET /user/:userId",
          "GET /:id",
          "POST /",
          "POST /reserve",
          "POST /confirm/:id",
          "PUT /:id",
          "DELETE /:id",
        ],
      },
      payments: {
        base: "/api/payments",
        process: "/api/payments/process",
        byBooking: "/api/payments/booking/:bookingId",
        operations: ["POST /process", "GET /:id", "GET /booking/:bookingId"],
      },
      users: {
        base: "/api/users",
        operations: ["GET /", "GET /:id", "POST /", "PUT /:id", "DELETE /:id"],
      },
    },
  });
});

// Error handling middleware (must be last)
const errorHandler = require("./middleware/errorHandler");
const notFound = require("./middleware/notFound");

app.use(notFound);
app.use(errorHandler);

const start = async () => {
  try {
    // Database connection is optional for Redis-only approach
    try {
      await connectToDatabase();
    } catch (dbError) {
      console.log("⚠️  Database connection skipped (Redis-only mode)");
    }

    // Start Kafka consumers if Kafka mode is enabled
    const config = require("./utils/config");
    if (config.KAFKA_MODE === "kafka") {
      console.log("🔄 Starting Kafka consumers...");
      try {
        const { startBookingConsumer } = require("./services/kafkaConsumer");
        await startBookingConsumer();
        console.log(
          `✅ All ${config.KAFKA_CONSUMER_INSTANCES} Kafka consumers started successfully`
        );
      } catch (kafkaError) {
        console.error(
          "❌ Failed to start Kafka consumers:",
          kafkaError.message
        );
        console.error("Full error:", kafkaError);
        console.log("⚠️  Server will continue without Kafka consumers");
      }

      // Start Payment Intent consumers (only if Stripe is configured)
      try {
        const {
          startPaymentIntentConsumer,
        } = require("./services/paymentIntentConsumer");
        await startPaymentIntentConsumer(2); // 2 consumers for Payment Intent processing
        console.log("✅ Payment Intent consumers started successfully");
      } catch (paymentIntentError) {
        console.error(
          "⚠️  Failed to start Payment Intent consumers:",
          paymentIntentError.message
        );
        console.log(
          "⚠️  Server will continue without Payment Intent consumers"
        );
      }
    }

    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Kafka mode: ${config.KAFKA_MODE}`);
    });

    // Set server timeouts to prevent connection drops at high load
    server.timeout = 0; // Disable server timeout (let application handle it)
    server.keepAliveTimeout = 65000; // 65 seconds
    server.headersTimeout = 66000; // 66 seconds (must be > keepAliveTimeout)
  } catch (error) {
    console.log(`Failed to start server:`, error.message);
    process.exit(1);
  }
};

start();
