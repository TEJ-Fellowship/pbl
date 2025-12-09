import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { handleSocket } from "./infrastructure/websocket/handlers/socketHandler.js";
import messageRoutes from "../src/interfaces/routes/messageRoutes.js";
import userRoutes from "../src/interfaces/routes/userRoutes.js";
import { connectToDatabase } from "./config/postgres.js";
import redis from "./config/redis.js";
import Redis from "ioredis";
import {
  REDIS_HOST,
  REDIS_PORT,
  REDIS_PASSWORD,
  REDIS_USERNAME,
} from "./config/index.js";

// Get server instance ID and port from environment
const SERVER_ID = process.env.SERVER_ID || `server-${process.pid}`;
const PORT = process.env.PORT || 3000;

// Initialize database connection
const startServer = async () => {
  try {
    const app = express();
    app.use(express.json());

    const httpServer = createServer(app);

    // Create Redis clients for Socket.IO adapter
    const pubClient = new Redis({
      host: REDIS_HOST || "localhost",
      port: REDIS_PORT || 6379,
      password: REDIS_PASSWORD,
      username: REDIS_USERNAME,
    });
    const subClient = pubClient.duplicate();

    const io = new Server(httpServer, {
      transports: ["websocket", "polling"],
      cors: { origin: "*", methods: ["GET", "POST"] },
      adapter: createAdapter(pubClient, subClient), // ✅ Critical for multi-server
    });

    // Store server ID in io instance for access in handlers
    io.serverId = SERVER_ID;

    redis.on("connect", () => {
      console.log(`[${SERVER_ID}] Connected to Redis`);
    });

    handleSocket(io, SERVER_ID);

    httpServer.listen(PORT, () => {
      console.log(`[${SERVER_ID}] Server running on port ${PORT}`);
    });

    app.use("/api/users", userRoutes);
    app.use("/api/conversation", messageRoutes);

    // Health check endpoint
    app.get("/health", (req, res) => {
      res.json({
        status: "ok",
        serverId: SERVER_ID,
        port: PORT,
        timestamp: new Date().toISOString(),
      });
    });

    // Connect to PostgreSQL database
    await connectToDatabase();
    console.log(`[${SERVER_ID}] Database initialized successfully`);

    console.log(`[${SERVER_ID}] Server started successfully`);
  } catch (error) {
    console.error(`[${SERVER_ID}] Failed to start server:`, error);
    process.exit(1);
  }
};

// Start the server
startServer();
