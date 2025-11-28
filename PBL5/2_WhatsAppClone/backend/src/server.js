import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { handleSocket } from "./infrastructure/websocket/handlers/socketHandler.js";
import messageRoutes from "../src/interfaces/routes/messageRoutes.js";
import { connectToDatabase } from "./config/postgres.js";

// Initialize database connection
const startServer = async () => {
  try {
    const app = express();
    app.use(express.json());
    
    const io = new Server(httpServer, {
      cors: { origin: "*", methods: ["GET", "POST"] },
    });
    
    const httpServer = createServer(app);
    handleSocket(io);
    httpServer.listen(3000, () => console.log("Node server running...."));

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
