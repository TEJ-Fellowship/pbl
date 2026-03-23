/* Imports the express library (web server framework)*/
const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const { MongoStore } = require("connect-mongo");
/*- Imports the cors library (cross-origin resource sharing)
  - (allows requests from other origins like your React frontend)
*/
const cors = require("cors");

/*- Imports environment variables from a .env file */
require("dotenv").config();
const passport = require("./config/passport");
/* - Creates the Express app instance (app)*/
const app = express();
/* - Middleware to allow cross-origin requests 
- (allows requests from other origins like React frontend)
*/
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  }),
);
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    /* - Session is saved only when something actually changes */
    resave: false,
    /* - No session is created until something is stored in it e.g user ID after login */
    saveUninitialized: false,
    /* - Stores session in MongoDB using connect-mongo */
    store: MongoStore.create({
      /* - Connecting string to MongoDB database */
      mongoUrl: process.env.MONGO_URI,
      /* - ttl (Time to live): session expire after this time */
      ttl: 7 * 24 * 60 * 60, // 7 days
      /* - Uses MongoDB's built-in TTL index to automatically delete expired sessions */
      autoRemove: "native",
    }),
    cookie: {
      /* - Secure cookie is only sent over HTTPS in production */
      secure: process.env.NODE_ENV === "production",
      /* - maxAge (Time to live): cookie expire after this time and browser will delete it */
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      /* - HttpOnly: cookie is not accessible by JavaScript 
         - cookie can only be accessed by server-side code. (Prevents XSS (cross-site scripting) attacks)
      */
      httpOnly: true,
      /* - SameSite: cookie is only sent in same-site requests e.g. clicking a link in the same domain */
      sameSite: "lax",
    },
  }),
);

app.use(passport.initialize());
app.use(passport.session());
/* - Middleware to parse JSON bodies for incoming requests */
app.use(express.json());
app.use("/api/auth", require("./routes/auth"));
app.use("/api/library", require("./routes/library"));
app.use("/api/shelves", require("./routes/shelves"));

/* - GET endpoint to search for books */
app.get("/api/books/", async (req, res) => {
  try {
    /* - Destructures the query parameters from the request 
    - Query Params:
     - q (required):string = search term (e.g. "javascript")
     - startIndex (optional):number = pagination offset (default: 0)
    */
    const { q, startIndex } = req.query;
    if (!q) {
      return res.status(400).json({ error: "Query is required" });
    }
    const index = startIndex ? startIndex : 0;
    /* - Fetches the books from the Google Books API using Node's global fetch.
    - If Node >= 18, global `fetch` is available.
    */
    const response = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${q}&startIndex=${index}&key=${process.env.GOOGLE_BOOKS_API_KEY}`,
    );
    const data = await response.json();

    if (!data.items) {
      return res.status(404).json({ message: "No books found" });
    }
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
/* - GET endpoint to get a book by ID */
/* - Params:
  - id (required):string = Google Books ID (e.g. "U69Hzz2jLPUC")
*/
app.get("/api/books/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: "Book ID is required!" });
    }
    const response = await fetch(
      `https://www.googleapis.com/books/v1/volumes/${id}?key=${process.env.GOOGLE_BOOKS_API_KEY}`,
    );
    const data = await response.json();
    if (!data) {
      return res.status(404).json({ message: "Book not found" });
    }
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 1000;

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");

    app.listen(PORT, () =>
      console.log(`Pustakalaya server is running on port ${PORT}`),
    );
  } catch (error) {
    /* - Standard error log: log the error */
    console.log("❌ MongoDB connection error: ", error.message);
    process.exit(1);
  }
}
connectDB();
