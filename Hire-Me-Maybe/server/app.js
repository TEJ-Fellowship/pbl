const express = require("express");
const connectDB = require("./config/database");
const middleware = require("./middleware/middleware");

// Import separated routes
const userProfileRoutes = require("./controllers/userProfileRoutes");
const userAuthRoutes = require("./controllers/userAuthRoutes");

const app = express();

app.use(express.json());
//connect to database
connectDB();

app.use(middleware.requestLogger);

// User routes - separated by HTTP method
// GET routes
app.use("/api/users", userProfileRoutes);
// POST routes
app.use("/api/users", userAuthRoutes);

//Error handling
app.use(middleware.unknownEndpoint);
app.use(middleware.errorHandler);

module.exports = app;
