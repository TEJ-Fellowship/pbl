import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import useBooks from "../hooks/useBooks";
import { useAuth } from "../context/AuthContext";
import { setPendingBorrow } from "../utils/pendingBorrowStorage";
import { useFavoritesContext } from "../context/FavoritesContext";
import SearchBar from "../components/SearchBar";
import BookModal from "../components/BookModal";
import BooksSection from "../components/BooksSection";

import { addShelfItem } from "../utils/shelfStorage";
import { formatBookForDisplay } from "../utils/shelfItem";

const Home = () => {
  const { books, searchTerm, setSearchTerm, isLoading, error, reload } =
    useBooks();
  const { favoriteSet, toggleFavorite } = useFavoritesContext();
  const [selectedBook, setSelectedBook] = useState(null);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  const openBookModal = (book) => {
    setSelectedBook(book);
  };

  const closeBookModal = () => {
    setSelectedBook(null);
  };

  const handleBorrow = (book) => {
    if (!book?.id) return;
    const formattedBook = formatBookForDisplay(book);
    if (!isAuthenticated) {
      setPendingBorrow(book);
      navigate("/auth", { state: { from: location.pathname } });
      closeBookModal();
      return;
    }
    addShelfItem(formattedBook);
    navigate("/my-shelf");
    closeBookModal();
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
        <BookModal
          book={selectedBook}
          onClose={closeBookModal}
          onBorrow={handleBorrow}
        />
      )}
    </main>
  );
};

export default Home;
