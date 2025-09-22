import express from "express";
import http from "http";
import { initSocket } from "./src/sockets.js";
import dotenv from "dotenv";

dotenv.config();

const app = express();

// Optional middleware
app.use(express.json());

// Create HTTP server
const server = http.createServer(app);

// Initialize socket
initSocket(server);

// Start listening
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
