import express from "express";
import cors from "cors";
import router from "./routes/route.js";
import connectDB from "./config/mongodb.js";
import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT || 3000;
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB (optional for development)
try {
  connectDB();
} catch (error) {
  console.log("⚠️  MongoDB connection failed, using in-memory storage");
  console.log("💡 For full functionality, ensure MongoDB is running locally");
}

// Routes
app.use("/api", router);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "Shopify Support Agent API is running" });
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});
