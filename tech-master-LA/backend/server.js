console.log("Server is running...");
const express = require("express");
const cors = require("cors");

// const connectDB = require('./config/db')
const quizRoutes = require("./routes/quiz");
const statsRoutes = require("./routes/stats");

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
// connectDB()

// Routes
app.use("/api/quizzes", quizRoutes);
app.use("/api/stats", statsRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
