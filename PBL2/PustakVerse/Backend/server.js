const express = require("express");
const app = express();
const cors = require("cors");

app.use(cors());
app.use(express.json());
// Temporary in-memory "database"
let books = [];

// Routes
app.get("/api/books", (req, res) => {
  res.json(books);
});

app.post("/api/books", (req, res) => {
  const newBook = req.body; // { title, author, price }
  books.push(newBook);
  res.status(201).json(newBook);
});

// app.delete("/api/books/:id", (req, res) => {
//   const { id } = req.params;
//   books = books.filter((book, index) => index !== parseInt(id));
//   res.json({ message: "Book deleted" });
// });
app.listen(3001, () => console.log("Server running on port 3001"));
