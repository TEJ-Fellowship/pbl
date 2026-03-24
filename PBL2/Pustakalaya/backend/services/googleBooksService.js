// service handles the business logic for the Google Books API
async function searchBooksService({ q = "book", startIndex = 0, apikey }) {
  const response = await fetch(
    `https://www.googleapis.com/books/v1/volumes?q=${q}&startIndex=${startIndex}&key=${apikey}`,
  );
  const data = await response.json();
  if (!data.items) {
    return response.status(404).json({ message: "No books found" });
  }
  return data;
}

async function getBooksByIdService({ id, apikey }) {
  const response = await fetch(
    `https://www.googleapis.com/books/v1/volumes/${id}?key=${apikey}`,
  );
  const data = await response.json();
  if (!data) {
    return response.status(404).json({ message: "Book not found" });
  }
  return data;
}

module.exports = {
  searchBooksService,
  getBooksByIdService,
};
