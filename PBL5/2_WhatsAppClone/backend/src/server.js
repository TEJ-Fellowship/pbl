import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { handleSocket } from "./infrastructure/websocket/handlers/socketHandler.js";
import messageRoutes from "../src/interfaces/routes/messageRoutes.js";

const app = express();
app.use(express.json());

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

handleSocket(io);
httpServer.listen(3000, () => console.log("Node server running...."));

app.use("/api/conversation", messageRoutes);
