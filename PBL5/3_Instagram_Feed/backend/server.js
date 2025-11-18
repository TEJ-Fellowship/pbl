import express from "express";
import dotenv from "dotenv";
import sequelize from "./config/database.js";
import userRoutes from "./routes/userRoutes.js";
import "./models/index.js"; // Import models to register associations

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Routes
app.use("/api/users", userRoutes);

// Health check route
app.get("/", (req, res) => {
  res.json({ message: "Instagram Feed API is running!" });
});

// Test database connection and start server
async function startServer() {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log("✅ Database connection established successfully.");

    // Sync database (creates tables if they don't exist)
    // WARNING: In production, use migrations instead!
    await sequelize.sync({ alter: false });
    console.log("✅ Database synchronized.");

    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`);
      console.log(
        `📝 API endpoints available at http://localhost:${PORT}/api/users`
      );
    });
  } catch (error) {
    console.error("❌ Unable to start server:", error);
    process.exit(1);
  }
}

startServer();

export default app;
