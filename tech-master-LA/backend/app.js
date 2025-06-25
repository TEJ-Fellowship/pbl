const express = require("express");
const dotenv = require("dotenv");
const userRoutes = require("./routes/userRoute.js");
const authRoutes = require("./routes/authRoute.js");
const chatRoutes = require("./routes/chatRoutes.js");
const quizRoutes = require("./routes/quizRoutes.js");
const statsRoutes = require("./routes/statsRoutes.js");
const dbConnect = require("./config/db.js");
// const bodyParser = require("body-parser");
const logger = require("./middlewares/logger.js");
const auth = require("./middlewares/auth-middleware.js");
const cors = require("cors");
const { FRONTEND_URL, FRONTEND_URL_DEV } = require("./config/keys.js");

dotenv.config(); // ✅ Load env first
dbConnect(); // ✅ Connect to DB next

const app = express();

// More flexible CORS configuration for development
const allowedOrigins = [FRONTEND_URL, FRONTEND_URL_DEV].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get("/", (req, res) => {
  res.json({
    projectName: "Project TechMaster Learning App",
    message: "Hello, how are you? This server is working",
    port: PORT,
    environment: process.env.NODE_ENV || "development",
  });
});

//global middleware
app.use(logger);

app.use("/api/auth", authRoutes);
// app.use("/api/user", auth, userRoutes);
app.use("/api/chat", auth, chatRoutes);
app.use("/api/quiz", auth, quizRoutes);
app.use("/api/stats", auth, statsRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running at port: ${PORT}...`);
});

module.exports = app;
