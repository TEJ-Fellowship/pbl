/* - GET endpoint to search for books */
async function searchBooks(req, res) {
  try {
    /* - Destructures the query parameters from the request 
        - Query Params:
         - q (required):string = search term (e.g. "javascript")
         - startIndex (optional):number = pagination offset (default: 0)
        */
    const { q = "book", startIndex } = req.query;

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
}

/* - GET endpoint to get a book by ID */
/* - Params:
  - id (required):string = Google Books ID (e.g. "U69Hzz2jLPUC")
*/
async function getBookById(req, res) {
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
}

module.exports = {
  searchBooks,
  getBookById,
};
