import BookCard from "./BookCard";

const BookGrid = ({ books, onBookClick, favoriteSet, onToggleFavorite }) => {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {books.map((book) => (
        <BookCard
          key={book.id}
          book={book}
          onBookClick={onBookClick}
          isFavorite={favoriteSet?.has(String(book.id))}
          onToggleFavorite={onToggleFavorite}
        />
      ))}
    </div>
  );
};

export default BookGrid;
