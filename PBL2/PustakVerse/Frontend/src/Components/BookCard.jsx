// Components/Home/BookCard.jsx
import React from "react";

const BookCard = ({ book }) => (
  <div className="border rounded-lg shadow p-4 bg-white dark:bg-gray-800">
    {book.cover ? (
      <img
        src={URL.createObjectURL(book.cover)}
        alt={book.title}
        className="w-full h-40 object-cover rounded"
      />
    ) : (
      <div className="w-full h-40 bg-gray-200 dark:bg-gray-700 flex items-center justify-center rounded">
        No Cover
      </div>
    )}
    <h2 className="text-lg font-semibold mt-2">{book.title}</h2>
    <p className="text-sm text-gray-600 dark:text-gray-400">{book.author}</p>
    <p className="text-sm">{book.genre.join(", ")}</p>
    <p className="text-sm">Year: {book.year}</p>
    <p className="text-sm">⭐ {book.rating}</p>
    {book.favorite && <p className="text-pink-500">❤️ Favorite</p>}
  </div>
);

export default BookCard;
