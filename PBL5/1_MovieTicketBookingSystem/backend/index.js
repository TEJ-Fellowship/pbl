const express = require("express");

const app = express();

const { PORT } = require("./utils/config");
const { connectToDatabase } = require("./utils/db.js");

// Middleware

app.use(express.json());

// Rate limiting middleware (prevents abuse)
const { rateLimiters } = require("./middleware/rateLimiter");
// Apply general rate limiting to all API routes (100 requests per minute)
app.use("/api", rateLimiters.general);

// Request timeout middleware (production best practice)
// Prevents requests from hanging indefinitely
// 5s timeout for true capacity testing (standard production value)
const REQUEST_TIMEOUT = process.env.REQUEST_TIMEOUT
  ? parseInt(process.env.REQUEST_TIMEOUT)
  : 5000;
app.use((req, res, next) => {
  req.setTimeout(REQUEST_TIMEOUT, () => {
    if (!res.headersSent) {
      res.status(504).json({ error: "Request timeout" });
    }
  });
  res.setTimeout(REQUEST_TIMEOUT);
  next();
});

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
      try {
        const { startBookingConsumer } = require("./services/kafkaConsumer");
        await startBookingConsumer();
        console.log(
          `✅ All ${config.KAFKA_CONSUMER_INSTANCES} Kafka consumers started successfully`
        );
      } catch (kafkaError) {
        console.error(
          "⚠️  Failed to start Kafka consumers:",
          kafkaError.message
        );
        console.log("⚠️  Server will continue without Kafka consumers");
      }
    }

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Kafka mode: ${config.KAFKA_MODE}`);
    });
  } catch (error) {
    console.log(`Failed to start server:`, error.message);
    process.exit(1);
  }
};

start();
