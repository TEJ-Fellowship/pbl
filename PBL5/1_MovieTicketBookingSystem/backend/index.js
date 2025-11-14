const express = require("express");
// const cors = require("cors");
const app = express();

const { PORT } = require("./utils/config");
const { connectToDatabase } = require("./utils/db.js");

// Middleware
// app.use(cors());
app.use(express.json());

// Routes
app.use("/api/movies", require("./routes/movies"));
app.use("/api/theaters", require("./routes/theaters"));
app.use("/api/screens", require("./routes/screens"));
app.use("/api/showtimes", require("./routes/showtimes"));
app.use("/api/bookings", require("./routes/bookings"));
app.use("/api/payments", require("./routes/payments"));
app.use("/api/users", require("./routes/users"));

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Server is running" });
});

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "Movie Ticket Booking System API",
    version: "1.0.0",
    endpoints: {
      movies: {
        base: "/api/movies",
        search: "/api/movies/search?title=&genre=&language=&release_date=",
        operations: [
          "GET /",
          "GET /:id",
          "GET /search",
          "POST /",
          "PUT /:id",
          "DELETE /:id",
        ],
      },
      theaters: {
        base: "/api/theaters",
        operations: ["GET /", "GET /:id", "POST /", "PUT /:id", "DELETE /:id"],
      },
      screens: {
        base: "/api/screens",
        byTheater: "/api/screens/theater/:theaterId",
        operations: [
          "GET /",
          "GET /theater/:theaterId",
          "GET /:id",
          "POST /",
          "PUT /:id",
          "DELETE /:id",
        ],
      },
      showtimes: {
        base: "/api/showtimes",
        byMovie: "/api/showtimes/movie/:movieId",
        byTheater: "/api/showtimes/theater/:theaterId",
        operations: [
          "GET /",
          "GET /movie/:movieId",
          "GET /theater/:theaterId",
          "GET /:id",
          "POST /",
          "PUT /:id",
          "DELETE /:id",
        ],
      },
      bookings: {
        base: "/api/bookings",
        byUser: "/api/bookings/user/:userId",
        operations: [
          "GET /",
          "GET /user/:userId",
          "GET /:id",
          "POST /",
          "POST /reserve",
          "POST /confirm/:id",
          "PUT /:id",
          "DELETE /:id",
        ],
      },
      payments: {
        base: "/api/payments",
        process: "/api/payments/process",
        byBooking: "/api/payments/booking/:bookingId",
        operations: ["POST /process", "GET /:id", "GET /booking/:bookingId"],
      },
      users: {
        base: "/api/users",
        operations: ["GET /", "GET /:id", "POST /", "PUT /:id", "DELETE /:id"],
      },
    },
  });
});

// Error handling middleware (must be last)
const errorHandler = require("./middleware/errorHandler");
const notFound = require("./middleware/notFound");

app.use(notFound);
app.use(errorHandler);

const start = async () => {
  try {
    await connectToDatabase();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.log(`Failed to start server:`, error.message);
    process.exit(1);
  }
};

start();
