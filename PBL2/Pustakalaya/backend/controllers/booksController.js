const googleBooksService = require("../services/googleBooksService");

// controller handles HTTP requests and responses
async function searchBooks(req, res) {
  try {
    /* - Destructures the query parameters from the request 
        - Query Params:
         - q (required):string = search term (e.g. "javascript")
         - startIndex (optional):number = pagination offset (default: 0)
        */
    const { q = "book", startIndex } = req.query;

    /* - Fetches the books from the Google Books API using Node's global fetch.
        - If Node >= 18, global `fetch` is available.
        */
    const data = await googleBooksService.searchBooksService({
      q,
      startIndex,
      apikey: process.env.GOOGLE_BOOKS_API_KEY,
    });

    return res.json(data);
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
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

    const data = await googleBooksService.getBooksByIdService({
      id,
      apikey: process.env.GOOGLE_BOOKS_API_KEY,
    });

    return res.json(data);
  } catch (error) {
    return res.status(err.statu || 500).json({ error: error.message });
  }
}

module.exports = {
  searchBooks,
  getBookById,
};
