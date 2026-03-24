const googleBooksService = require("../services/googleBooksService");

// controller handles HTTP requests and responses
async function searchBooks(req, res) {
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
    startIndex: startIndex !== undefined ? Number(startIndex) : 0,
    apikey: process.env.GOOGLE_BOOKS_API_KEY,
  });

  return res.json(data);
}

/* - GET endpoint to get a book by ID */
/* - Params:
  - id (required):string = Google Books ID (e.g. "U69Hzz2jLPUC")
*/
async function getBookById(req, res) {
  const { id } = req.params;

  const data = await googleBooksService.getBooksByIdService({
    id,
    apikey: process.env.GOOGLE_BOOKS_API_KEY,
  });

  return res.json(data);
}

module.exports = {
  searchBooks,
  getBookById,
};
