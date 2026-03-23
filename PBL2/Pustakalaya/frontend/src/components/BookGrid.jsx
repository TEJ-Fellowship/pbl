// src/components/BookGrid.jsx
import BookCard from "./BookCard";

const BookGrid = ({ books, onBookClick }) => {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {books.map((book) => (
        <BookCard key={book.id} book={book} onBookClick={onBookClick} />
      ))}
    </div>
  );
};

export default BookGrid;
