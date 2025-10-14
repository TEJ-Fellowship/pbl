const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Simple routes
app.get("/", (req, res) => {
  res.json({ message: "Stripe Support API is running!" });
});

app.get("/api/tickets", (req, res) => {
  res.json({
    tickets: [
      { id: 1, title: "Payment Issue", status: "open" },
      { id: 2, title: "Refund Request", status: "pending" },
    ],
  });
});

app.post("/api/tickets", (req, res) => {
  const { title, description } = req.body;
  const newTicket = {
    id: Date.now(),
    title,
    description,
    status: "open",
    createdAt: new Date(),
  };
  res.json({ message: "Ticket created!", ticket: newTicket });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
