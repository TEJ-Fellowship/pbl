const ApiError = require("../utils/ApiError");

// service handles the business logic for the Google Books API
async function searchBooksService({ q = "book", startIndex = 0, apikey }) {
  const response = await fetch(
    `https://www.googleapis.com/books/v1/volumes?q=${q}&startIndex=${startIndex}&key=${apikey}`,
  );
  const data = await response.json();
  if (!data.items) {
    throw new ApiError(404, "No books found");
  }
  return data;
}

async function getBooksByIdService({ id, apikey }) {
  const response = await fetch(
    `https://www.googleapis.com/books/v1/volumes/${id}?key=${apikey}`,
  );
  const data = await response.json();

  if (!data || data.error) {
    throw new ApiError(404, "Book not found");
  }
  return data;
}

module.exports = {
  searchBooksService,
  getBooksByIdService,
};
