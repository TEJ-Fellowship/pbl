// Components/Home/BookGrid.jsx
import React from "react";
import BookCard from "./BookCard";

const BookGrid = ({ books, onDelete, onEdit }) => {
  if (books.length === 0)
    return <p className="text-gray-500">No books added yet.</p>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-6">
      {books.map((book) => (
        <BookCard
          key={book.id}
          book={book}
          onDelete={onDelete}
          onEdit={onEdit}
        />
      ))}
    </div>
  );
};

export default BookGrid;
