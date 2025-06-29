require("dotenv").config();
const express = require("express");
const connectDB = require("./config/database");
const middleware = require("./middleware/middleware");
const session = require('express-session');
const cors = require("cors");
const passport = require("./config/passport");

// Import separated routes
const userProfileRoutes = require("./controllers/userProfileRoutes");
const userAuthRoutes = require("./controllers/userAuthRoutes");
const oauthRoutes = require("./controllers/oauthRoutes");
const resumeRoutes = require("./routes/resumeRoutes");
const aiRoutes = require("./routes/aiRoutes");

const app = express();
app.use(cors());

app.use(express.json());
//middleware, used to parse URL-encoded form data that comes from HTML forms
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: true,
}))

app.use(passport.initialize());
app.use(passport.session());

app.use('/auth', oauthRoutes);


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
