import express from "express";
import dotenv from "dotenv";
import { types } from "cassandra-driver";

import {
  sequelize,
  initializeCassandra,
  cassandraClient,
  initializeRedis,
  redisClient,
} from "./config/db.js";
import { initializeSchema, KEYSPACE } from "./config/cassandra-schema.js";
import { loadLuaScripts } from "./services/redisLuaScripts.js";
import { initializeKafka, disconnectKafka } from "./config/kafka.js";
import {
  connectProducer,
  disconnectProducer,
} from "./services/kafkaProducer.js";
import {
  startFeedConsumer,
  stopFeedConsumer,
} from "./services/kafkaConsumer.js";
import { startFallbackWorker } from "./services/fallbackQueue.js";
import userRoutes from "./routes/userRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import "./models/index.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = "development";
}

dotenv.config({ quiet: true });

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);

app.get("/", (req, res) => {
  res.json({ message: "Instagram Feed API is running!" });
});

// Health check and metrics endpoint
app.get("/api/health", async (req, res) => {
  try {
    const { getMetrics, getRedisMemoryInfo } = await import(
      "./services/monitoring.js"
    );
    const metrics = getMetrics();
    const redisMemory = await getRedisMemoryInfo();

    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      metrics,
      redis: redisMemory,
    });
  } catch (error) {
    res.status(500).json({
      status: "unhealthy",
      error: error.message,
    });
  }
});

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

// Helper endpoint to view Cassandra tables
app.get("/api/cassandra/tables", async (req, res) => {
  try {
    const query = `
      SELECT table_name 
      FROM system_schema.tables 
      WHERE keyspace_name = ?
    `;
    const result = await cassandraClient.execute(query, [KEYSPACE], {
      prepare: true,
    });

    const tables = result.rows.map((row) => row.table_name);

    res.json({
      success: true,
      keyspace: KEYSPACE,
      tables,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching tables",
      error: error.message,
    });
  }
});

// Helper endpoint to view data from a specific table
app.get("/api/cassandra/tables/:tableName", async (req, res) => {
  try {
    const { tableName } = req.params;
    const limit = parseInt(req.query.limit) || 10;

    const query = `SELECT * FROM ${KEYSPACE}.${tableName} LIMIT ?`;
    const result = await cassandraClient.execute(query, [limit], {
      prepare: true,
    });

    const rows = result.rows.map((row) => {
      const obj = {};
      row.keys().forEach((key) => {
        const value = row.get(key);
        // Convert UUID to string for JSON serialization
        obj[key] = value instanceof types.Uuid ? value.toString() : value;
      });
      return obj;
    });

    res.json({
      success: true,
      keyspace: KEYSPACE,
      table: tableName,
      count: rows.length,
      data: rows,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching table data",
      error: error.message,
    });
  }
});

app.get("/api/redis/test", async (req, res) => {
  try {
    // Test SET and GET operations
    await redisClient.set("test:key", "Hello Redis!");
    const value = await redisClient.get("test:key");

    // Get Redis info
    const info = await redisClient.info("server");

    res.json({
      success: true,
      message: "Redis connection is working!",
      test: {
        key: "test:key",
        value: value,
      },
      info: info.split("\n").slice(0, 5),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Redis connection failed",
      error: error.message,
    });
  }
});

app.get("/api/kafka/test", async (req, res) => {
  try {
    const { isKafkaAvailable } = await import("./config/kafka.js");
    const { sendMessage } = await import("./services/kafkaProducer.js");
    const { TOPICS } = await import("./config/kafka.js");

    if (!isKafkaAvailable()) {
      return res.status(503).json({
        success: false,
        message: "Kafka is not available",
        error: "Kafka broker is not connected",
      });
    }

    // Send a test message
    const testMessage = {
      eventType: "TEST",
      message: "This is a test message from the API",
      timestamp: new Date().toISOString(),
    };

    const result = await sendMessage(
      TOPICS.POST_CREATED,
      testMessage,
      "test-key"
    );

    res.json({
      success: true,
      message: "Kafka connection is working!",
      test: {
        topic: TOPICS.POST_CREATED,
        result: result,
      },
      kafkaAvailable: isKafkaAvailable(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Kafka connection failed",
      error: error.message,
    });
  }
});

async function startServer() {
  try {
    // Initialize databases
    console.log("🔌 Connecting to databases...");
    await sequelize.authenticate();
    console.log("✅ Connected to PostgreSQL");
    await sequelize.sync({ alter: false });
    await initializeCassandra();
    await initializeSchema();
    await initializeRedis();
    await loadLuaScripts();

    // Start fallback queue worker for async fan-out when Kafka is unavailable
    startFallbackWorker();

    // Initialize Kafka
    console.log("🔌 Connecting to Kafka...");
    try {
      await initializeKafka();
      await connectProducer();
      await startFeedConsumer();
      console.log("✅ Kafka initialized and consumer started");
    } catch (kafkaError) {
      console.warn(
        "⚠️ Kafka initialization failed, continuing without Kafka:",
        kafkaError.message
      );
      console.warn(
        "   The application will continue to run, but Kafka features will be disabled."
      );
    }

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Unable to start server:", error);
    process.exit(1);
  }
}

// Graceful shutdown
async function gracefulShutdown(exitCode = 0) {
  console.log("🛑 Shutting down gracefully...");

  try {
    // Stop Kafka consumer
    await stopFeedConsumer();
    // Disconnect Kafka producer
    await disconnectProducer();
    // Disconnect Kafka admin
    await disconnectKafka();
    console.log("✅ Kafka connections closed");
  } catch (error) {
    console.error("❌ Error during Kafka shutdown:", error);
  }

  process.exit(exitCode);
}

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Promise Rejection:", reason);
  console.error("Promise:", promise);
  // Log the error but don't crash
  // The error should be handled by the error middleware
  // In production, you might want to send this to a logging service
  // DO NOT exit or throw - just log

  // Additional safety: log stack trace if available
  if (reason && reason.stack) {
    console.error("Stack:", reason.stack);
  }
});

// Handle uncaught exceptions
process.on("uncaughtException", async (error) => {
  console.error("❌ Uncaught Exception:", error);
  console.error("Stack:", error.stack);
  console.error("Error name:", error.name);
  console.error("Error message:", error.message);

  // ALWAYS log but NEVER exit in development
  // This prevents nodemon from restarting on every error
  if (process.env.NODE_ENV !== "production") {
    console.error(
      "⚠️ Uncaught exception in development mode - server will continue"
    );
    console.error("   Fix the error to prevent potential issues");
    // Log to monitoring service if available
    return;
  }

  // In production, only exit for truly fatal errors
  // Most errors should be handled gracefully
  if (error.name === "FatalError" || error.code === "EADDRINUSE") {
    console.error("❌ Fatal error detected, shutting down...");
    await gracefulShutdown(1);
  } else {
    console.error("⚠️ Non-fatal uncaught exception, continuing...");
  }
});

process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);

startServer();
