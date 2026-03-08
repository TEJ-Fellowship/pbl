require("dotenv").config();
const express = require("express");
const session = require("express-session");
const cors = require("cors");
const path = require("path");
const mongoose = require("mongoose");
const {MongoStore} = require("connect-mongo");

const passport = require("./config/passport");
const errorHandler = require("./middleware/errorHandler");

const app = express();

app.use(cors());

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
    }),
  })
);

app.use(passport.initialize());
app.use(passport.session());
app.use(express.json());

const authRouter = require("./routes/auth");
const eventsRouter = require("./routes/events");
app.use("/auth", authRouter);
app.use("/api/events", eventsRouter);
app.use(express.static(path.join(__dirname, "public")));

app.use(errorHandler);
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  }
}

connectDB()
  .then(() => {
    app.listen(5000, () => {
      console.log("Server running on http://localhost:5000");
    });
  })
  .catch((err) => console.error(err));
