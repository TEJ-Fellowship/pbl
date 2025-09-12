import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/auth.js";

dotenv.config();

const app = express();

app.use(cors({ 
origin: 'http://localhost:5173',
credentials: true
 }));
app.use(cookieParser());
app.use(express.json());

app.use("/api/auth", authRoutes);

export default app;
