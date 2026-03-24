import { useMemo, useState } from "react";
import useBooks from "../hooks/useBooks";
import useFavorites from "../hooks/useFavorites";
import BooksSection from "../components/BooksSection";
import BookModal from "../components/BookModal";

const Favorites = () => {
  const { books, isLoading, error, reload } = useBooks();
  const { favoriteSet, isFavorite, toggleFavorite } = useFavorites();
  const [selectedBook, setSelectedBook] = useState(null);

  const favoriteBooks = useMemo(
    () => books.filter((book) => favoriteSet.has(String(book.id))),
    [books, favoriteSet],
  );

  return (
    <div className="py-8">
      <h1 className="font-serif mb-6 text-2xl font-bold">My Favorites</h1>

      <BooksSection
        books={favoriteBooks}
        isLoading={isLoading}
        error={error}
        onRetry={reload}
        onBookClick={setSelectedBook}
        favoriteSet={favoriteSet}
        onToggleFavorite={toggleFavorite}
        emptyMessage="You have no favorite books yet."
      />

      {selectedBook && (
        <BookModal
          book={selectedBook}
          onClose={() => setSelectedBook(null)}
          isFavorite={isFavorite(selectedBook.id)}
          onToggleFavorite={toggleFavorite}
        />
      )}
    </div>
  );
};

export default Favorites;
