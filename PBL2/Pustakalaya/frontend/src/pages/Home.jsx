import { useEffect, useState } from "react";
import API_URL from "../config/api";
import BookGrid from "../components/BookGrid";
import SearchBar from "../components/SearchBar";
import BookModal from "../components/BookModal";

const Home = () => {
  const { books, searchTerm, setSearchTerm, isLoading, error, reload } = useBooks();
  const [books, setBooks] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);

  const openBookModal = (book) => {
    setSelectedBook(book);
  };

  const closeBookModal = () => {
    setSelectedBook(null);
  };

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const response = await fetch(`${API_URL}/books`);
        const data = await response.json();
        setBooks(data);
      } catch (error) {
        console.error("Failed to fetch books:", error);
      }
    };

    fetchBooks();
  }, []);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <SearchBar />
      <h1 className="font-serif mb-6 text-2xl font-bold">Top Picks</h1>
      <BookGrid books={books} onBookClick={openBookModal} />
      
      {/* modal opens only when selectedBook exists */}
      {selectedBook && (
        <BookModal book={selectedBook} onClose={closeBookModal} />
      )}
    </main>
  );
};

export default Home;
