import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { handleSocket } from "./infrastructure/websocket/handlers/socketHandler.js";
import messageRoutes from "../src/interfaces/routes/messageRoutes.js";
import userRoutes from "../src/interfaces/routes/userRoutes.js";
import { connectToDatabase } from "./config/postgres.js";
import redis from './config/redis.js';

// Initialize database connection
const startServer = async () => {
  try {
    const app = express();
    app.use(express.json());

    const httpServer = createServer(app);
    const io = new Server(httpServer, {
      transports: ["websocket", "polling"],
      cors: { origin: "*", methods: ["GET", "POST"] },
    });

    redis.on('connect', () => {
      console.log('Connected to Redis');
    });
    handleSocket(io);
    httpServer.listen(3000, () => console.log("Node server running...."));

    app.use("/api/users", userRoutes);
    app.use("/api/conversation", messageRoutes);

    // Connect to PostgreSQL database
    await connectToDatabase();
    console.log("Database initialized successfully");

    // TODO: Initialize WebSocket server
    // TODO: Initialize Kafka consumers

    console.log("Server started successfully");
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

// Start the server
startServer();
