import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./src/config/db.js";
import authRoutes from "./src/routes/authRoutes.js";
import roomRoutes from "./src/routes/roomRoutes.js";
import loopRoutes from "./src/routes/loopRoutes.js";
import drawingRoutes from "./src/routes/drawingRoutes.js";

// Load .env from src/.env
dotenv.config({ path: './src/.env' });

connectDB();
const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/loop", loopRoutes);
app.use("/api/drawings", drawingRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
