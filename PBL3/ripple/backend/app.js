import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/auth.js";
import contactRoutes from "./routes/contact.js";
import rippleRoutes from "./routes/ripple.js";

dotenv.config();

const app = express();
app.use(express.json());

app.use(cors({ 
origin: 'http://localhost:5173',
credentials: true
 }));
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api", contactRoutes);
app.use("/api/ripple", rippleRoutes);

export default app;
