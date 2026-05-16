const ApiError = require("../utils/ApiError");
const {
  mapSearchPayloadToDto,
  mapDetailPayloadToDto,
} = require("../mappers/googleBooks.mapper");

// service handles the business logic for the Google Books API
async function searchBooksService({ q = "book", startIndex = 0, apikey }) {
  //encodeURIComponent: encodes the query string to ensure it is a valid URL
  const response = await fetch(
    `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&startIndex=${startIndex}&maxResults=10&key=${apikey}`,
  );

  if (!response.ok) {
    throw new ApiError(502, "Google Books API error");
  }

  const data = await response.json();

  if (!data.items) {
    return { books: [] };
  }
  return mapSearchPayloadToDto(data);
}

async function getBooksByIdService({ id, apikey }) {
  const response = await fetch(
    `https://www.googleapis.com/books/v1/volumes/${encodeURIComponent(id)}?key=${apikey}`,
  );

  if (!response.ok) {
    throw new ApiError(502, "Google Books API error");
  }

  const data = await response.json();

  if (!data || data.error || !data.id) {
    throw new ApiError(404, "Book not found");
  }
  return mapDetailPayloadToDto(data);
}

module.exports = {
  searchBooksService,
  getBooksByIdService,
};
