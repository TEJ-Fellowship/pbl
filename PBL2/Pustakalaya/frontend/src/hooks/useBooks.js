import { useCallback, useEffect, useState } from "react";

export default function useBooks() {
  const [books, setBooks] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadBooks = useCallback(async (query = "") => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`http://localhost:3001/books`);
      if (!response.ok) {
        throw new Error("Failed to load books. Please try again.");
      }
      const data = await response.json();

      const q = query.trim().toLowerCase();
      const filtered = q
        ? data.filter((book) => book.title.toLowerCase().includes(q))
        : data;

      setBooks(filtered);
    } catch (error) {
      setError(error.message || "Failed to load books. Please try again.");
      setBooks([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBooks(searchTerm);
  }, [searchTerm, loadBooks]);

  const reload = useCallback(() => {
    loadBooks(searchTerm);
  }, [loadBooks, searchTerm]);

  return {
    books,
    searchTerm,
    setSearchTerm,
    isLoading,
    error,
    reload,
  };
}
