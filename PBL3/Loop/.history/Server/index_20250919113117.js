import express from "express";
import http from "http";
import { initSocket } from "./src/sockets/sockets.js";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
initSocket(server);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
