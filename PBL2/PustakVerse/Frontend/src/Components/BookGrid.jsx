// Components/Home/BookGrid.jsx
import React, { useState } from "react";
import BookCard from "./BookCard";
import BookModal from "./BookModal";

const BookGrid = ({ books, onDelete, onEdit }) => {
   const [selectedBook, setSelectedBook] = useState(null); // state for modal
  if (books.length === 0)
    return <p className="text-gray-500">No books added yet.</p>;

  return (
    <>
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
     {/* Modal */}
      {selectedBook && (
        <BookModal book={selectedBook} onClose={() => setSelectedBook(null)} />
      )}

    </>
  );
};

export default BookGrid;
