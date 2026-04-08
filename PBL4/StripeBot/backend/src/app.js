const express = require("express");
const chatRoutes = require("./routes/chat.routes");
const { errorMiddleware } = require("./middlewares/error.middleware");
const pool = require("./config/db");

// Create an Express application instance
const app = express();

//Parse incoming JSON into JavaScript object  and attaches it to req.body
app.use(express.json());

// Define routes for the chat API
app.use("/api/chat", chatRoutes);

app.get("/health", async (req, res) => {
  try {
    const r = await pool.query("SELECT NOW() AS now");
    res.json({ ok: true, db: true, time: r.rows[0].now });
  } catch (err) {
    res.status(503).json({ ok: false, db: false, error: err.message });
  }
});

// Handle errors centrally using custom middleware
app.use(errorMiddleware);

module.exports = app;
