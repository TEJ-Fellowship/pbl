import React from "react";
import BookGrid from "./BookGrid";

const MyBooks = ({ books, setBooks }) => {
  const favoriteBooks = books.filter((b) => b.favorite);

  return (
    <div className="max-w-5xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">My Favorite Books</h1>
      {favoriteBooks.length > 0 ? (
        <BookGrid books={favoriteBooks} setBooks={setBooks} />
      ) : (
        <p className="text-gray-500">No favorite books yet.</p>
      )}
    </div>
  );
};

export default MyBooks;
