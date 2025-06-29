const express = require("express");
const connectDB = require("./config/database");
const middleware = require("./middleware/middleware");

// Import separated routes
const userProfileRoutes = require("./controllers/userProfileRoutes");
const userAuthRoutes = require("./controllers/userAuthRoutes");
const resumeRoutes = require("./routes/resumeRoutes");
const aiRoutes = require("./routes/aiRoutes");

const app = express();
const cors = require("cors");
app.use(cors());

app.use(express.json());
//middleware, used to parse URL-encoded form data that comes from HTML forms
app.use(express.urlencoded({ extended: true }));
//connect to database
connectDB();

app.use(middleware.requestLogger);

// User routes - separated by HTTP method
// GET routes
app.use("/api/users", userProfileRoutes);
// POST routes
app.use("/api", userAuthRoutes);
app.use("/api/resumes", resumeRoutes);
app.use("/api/ai", aiRoutes);

//Error handling
app.use(middleware.unknownEndpoint);
app.use(middleware.errorHandler);

module.exports = app;
