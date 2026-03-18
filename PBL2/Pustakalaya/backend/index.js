/* Imports the express library (web server framework)*/
const express = require("express");
/*- Imports the cors library (cross-origin resource sharing)
  - (allows requests from other origins like your React frontend)
*/
const cors = require("cors");
/*- Imports environment variables from a .env file */
require("dotenv").config();
/* - Creates the Express app instance (app)*/
const app = express();
/* - Middleware to allow cross-origin requests 
- (allows requests from other origins like React frontend)
*/
app.use(cors());
/* - Middleware to parse JSON bodies for incoming requests */
app.use(express.json());

/* - GET endpoint to search for books */
app.get("/api/books", async (req, res) => {
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

const PORT = process.env.PORT || 1000;
app.listen(PORT, () =>
  console.log(`Pustakalaya server is running on port ${PORT}`),
);
