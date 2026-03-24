import { useState } from "react";
import useBooks from "../hooks/useBooks";
import useFavorites from "../hooks/useFavorites";
import SearchBar from "../components/SearchBar";
import BookModal from "../components/BookModal";
import BooksSection from "../components/BooksSection";

const Home = () => {
  const { books, searchTerm, setSearchTerm, isLoading, error, reload } =
    useBooks();
    const { favoriteSet, isFavorite, toggleFavorite} = useFavorites();
  const [selectedBook, setSelectedBook] = useState(null);

  const openBookModal = (book) => {
    setSelectedBook(book);
  };

  const closeBookModal = () => {
    setSelectedBook(null);
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <SearchBar value={searchTerm} onChange={setSearchTerm} />
      <h1 className="font-serif mb-6 text-2xl font-bold">Top Picks</h1>
      <BooksSection
        books={books}
        isLoading={isLoading}
        error={error}
        onRetry={reload}
        onBookClick={openBookModal}
        favoriteSet={favoriteSet}
        onToggleFavorite={toggleFavorite}
        emptyMessage={
          searchTerm
            ? `No books found for "${searchTerm}".`
            : "No books available right now."
        }
      />

      {/* modal opens only when selectedBook exists */}
      {selectedBook && (
        <BookModal book={selectedBook} onClose={closeBookModal} isFavorite={isFavorite(selectedBook.id)}
        onToggleFavorite={toggleFavorite} />
      )}
    </main>
  );
};

export default Home;
