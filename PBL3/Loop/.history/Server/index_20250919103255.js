import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import { connectDB } from "./src/config/db.js";
import authRoutes from "./src/routes/authRoutes.js";
import roomRoutes from "./src/routes/roomRoutes.js";
import loopRoutes from "./src/routes/loopRoutes.js";
import userRoutes from "./src/routes/userRoutes.js";
import initSockets from "./src/sockets/sockets.js";

// Load environment variables (adjust path if .env is inside src)
dotenv.config({ path: "./src/.env" });  // or "./src/.env" if it's inside src

console.log("Loaded MONGO_URI:", process.env.MONGO_URI); // debug

// Connect to MongoDB
connectDB();

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/loop", loopRoutes);
app.use("/api/userRoutes", userRoutes);

const PORT = process.env.PORT || 5000;
const httpServer = http.createServer(app);

//create socket.io 
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
