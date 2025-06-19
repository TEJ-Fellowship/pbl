const express = require("express");
const dotenv = require("dotenv");
const userRoutes = require("./routes/userRoute.js");
const authRoutes = require("./routes/authRoute.js");
const chatRoutes = require("./routes/chatRoutes.js");
const quizRoutes = require("./routes/quizRoutes.js");
const statsRoutes = require("./routes/statsRoutes.js");
const dbConnect = require("./config/db.js");
const bodyParser = require("body-parser");
const logger = require("./middlewares/logger.js");
const auth = require("./middlewares/auth-middleware.js");
const cors = require("cors");

dotenv.config(); // ✅ Load env first
dbConnect(); // ✅ Connect to DB next

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173", // frontend URL
    credentials: true,
  })
);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.get("/", (req, res) => {
  res.json({
    projectName: "Project AI Learning App",
    message: "Hello, how are you? This server is working",
    port: PORT,
    environment: process.env.NODE_ENV || "development",
  });
});

//global middleware
app.use(logger);

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api/stats", statsRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running at port: ${PORT}...`);
});

module.exports = app;
