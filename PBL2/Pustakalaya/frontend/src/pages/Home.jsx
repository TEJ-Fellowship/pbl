import { useEffect, useState } from "react";
import BookGrid from "../components/BookGrid";
import SearchBar from "../components/SearchBar";

const Home = () => {
  const [books, setBooks] = useState([]);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const response = await fetch("http://localhost:3001/books");
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
      <BookGrid books={books} />
    </main>
  );
};

export default Home;
