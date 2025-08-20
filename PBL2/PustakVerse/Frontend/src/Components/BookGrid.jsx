// Components/Home/BookGrid.jsx
import React, { useState } from "react";
import BookCard from "./BookCard";
import BookModal from "./BookModal";

const BookGrid = ({ books }) => {
  const [selectedBook, setSelectedBook] = useState(null); // state for modal

  if (books.length === 0)
    return <p className="text-gray-500">No books added yet.</p>;

  return (
    <>
      {/* Book Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {books.map((book, index) => (
          <div key={index} onClick={() => setSelectedBook(book)}>
            <BookCard book={book} />
          </div>
        ))}
      </div>

      {/* Modal */}
      {selectedBook && (
        <BookModal book={selectedBook} onClose={() => setSelectedBook(null)} />
      )}
    </>
  );
};

export default BookGrid;
